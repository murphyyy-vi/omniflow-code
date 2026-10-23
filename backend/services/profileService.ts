import { createAIService } from './aiService';
import {
  DIMENSION_KEYS,
  QUESTIONS,
  normalizeAnswer,
  type Answers,
  type DimensionKey,
} from '../../shared/questionnaire';
import type { AnomalyFlag, ProfileVersion, RadarData } from '../../shared/types/dorm';

const MIN_SECONDS = 180;
const LIE_GAP_MINUTES = 120;
const AI_TIMEOUT_MS = 10000;

export const DEFAULT_PRIORITY: DimensionKey[] = ['routine', 'hygiene', 'study'];

export const sanitizeAnswers = (raw: Record<string, unknown>): Answers => {
  const out: Answers = {};
  for (const q of QUESTIONS) {
    const value = normalizeAnswer(q, raw[q.id]);
    if (value !== undefined) out[q.id] = value;
  }
  return out;
};

const toMinutes = (t: string): number => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

/** Minutes on a continuous evening-to-morning scale (01:00 is later than 23:00). */
const nightMinutes = (t: string): number => {
  const m = toMinutes(t);
  return m < 12 * 60 ? m + 1440 : m;
};

const clamp = (n: number): number => Math.max(0, Math.min(100, Math.round(n)));
const num = (a: Answers, id: string, fallback = 5): number =>
  typeof a[id] === 'number' ? (a[id] as number) : fallback;
const str = (a: Answers, id: string): string => (typeof a[id] === 'string' ? (a[id] as string) : '');
const pick = (value: string, table: Record<string, number>, fallback = 50): number => table[value] ?? fallback;

export const detectAnomalies = (answers: Answers, seconds: number): AnomalyFlag[] => {
  const flags: AnomalyFlag[] = [];
  const bed = str(answers, 'r_bed');
  const after = str(answers, 'r_sleep_after');
  if (bed && after) {
    const gap = Math.abs(nightMinutes(bed) - nightMinutes(after));
    if (gap > LIE_GAP_MINUTES) {
      flags.push({
        type: 'lie_detector',
        message: `就寝时间与实际入睡时间相差 ${(gap / 60).toFixed(1)} 小时`,
      });
    }
  }
  const dummies = QUESTIONS.filter((q) => q.dummy);
  if (dummies.length > 0 && dummies.every((q) => answers[q.id] === 'strong_no')) {
    flags.push({ type: 'dummy', message: '防呆题全部选择了极端否定答案' });
  }
  if (seconds < MIN_SECONDS) {
    flags.push({ type: 'too_fast', message: `问卷完成用时仅 ${seconds} 秒，低于 3 分钟` });
  }
  return flags;
};

export const buildRadar = (a: Answers): RadarData => {
  const bedEarly = 100 - ((nightMinutes(str(a, 'r_bed') || '23:30') - 1260) / 300) * 100;
  const wakeEarly = 100 - ((toMinutes(str(a, 'r_wake') || '07:30') - 330) / 300) * 100;
  const alarmPenalty = pick(str(a, 'r_alarm'), { single: 0, multi: 5, loud: 10 }, 0);
  const routine = clamp(Math.max(0, bedEarly) * 0.6 + Math.max(0, wakeEarly) * 0.4 - alarmPenalty);

  const hygiene = clamp(
    num(a, 'h_tidy') * 10 * 0.4 +
      num(a, 'h_strict') * 10 * 0.3 +
      pick(str(a, 'h_clean'), { daily: 100, weekly: 65, rarely: 30 }) * 0.3,
  );

  const study = clamp(
    num(a, 's_noise') * 10 * 0.45 +
      pick(str(a, 's_silence'), { yes: 100, no: 25 }) * 0.35 +
      pick(str(a, 's_keyboard'), { yes: 20, no: 90 }) * 0.2,
  );

  const social = clamp(
    num(a, 'so_intro') * 10 * 0.5 +
      pick(str(a, 'so_friends'), { never: 20, sometimes: 55, often: 90 }) * 0.25 +
      num(a, 'so_accept') * 10 * 0.25,
  );

  const environment = clamp(
    num(a, 'e_smell') * 10 * 0.5 +
      pick(str(a, 'e_window'), { always: 80, sometimes: 50, never: 25 }) * 0.25 +
      pick(str(a, 'e_temp'), { cool: 35, mid: 50, warm: 70 }) * 0.25,
  );

  const health = Array.isArray(a.sp_health) ? (a.sp_health as string[]) : [];
  const special = clamp(
    30 +
      pick(str(a, 'sp_smoke'), { refuse: 25, smoker: 10, accept: 0 }, 0) +
      pick(str(a, 'sp_pet'), { refuse: 20, have: 10, accept: 0 }, 0) +
      (health.some((h) => h !== 'none') ? 15 : 0),
  );

  return { routine, hygiene, study, social, environment, special };
};

export const buildRuleProfile = (a: Answers): ProfileVersion => {
  const radar = buildRadar(a);
  const tags: string[] = [];
  if (radar.routine >= 70) tags.push('早睡早起');
  if (radar.routine <= 35) tags.push('夜猫子');
  if (radar.hygiene >= 75) tags.push('轻度洁癖');
  if (radar.hygiene <= 40) tags.push('随性整洁');
  if (radar.study >= 70 || num(a, 's_noise') >= 8) tags.push('安静学习');
  if (num(a, 's_noise') >= 8) tags.push('怕吵');
  if (radar.social <= 40) tags.push('社恐但友善');
  if (radar.social >= 70) tags.push('外向开朗');
  if (str(a, 'e_window') === 'always') tags.push('喜欢开窗');
  const unique = Array.from(new Set(tags)).slice(0, 5);
  while (unique.length < 3) unique.push(unique.includes('随和好相处') ? '友善' : '随和好相处');
  const routineText = radar.routine >= 60 ? '作息规律' : radar.routine <= 35 ? '习惯晚睡' : '作息适中';
  const hygieneText = radar.hygiene >= 70 ? '爱整洁' : radar.hygiene <= 40 ? '不拘小节' : '整洁适度';
  const socialText = radar.social >= 60 ? '性格外向' : radar.social <= 40 ? '性格内敛' : '性格温和';
  return {
    radar,
    tags: unique.slice(0, 5),
    summary: `${routineText}、${hygieneText}，${socialText}，相处友善。`,
  };
};

const answerText = (q: (typeof QUESTIONS)[number], value: Answers[string]): string => {
  if (q.type === 'scale') return `${value}/10`;
  if (q.type === 'time') return String(value);
  const labels = new Map((q.options ?? []).map((o) => [o.value, o.label]));
  return Array.isArray(value)
    ? value.map((v) => labels.get(v) ?? v).join('、')
    : (labels.get(String(value)) ?? String(value));
};

const parseAiProfile = (text: string): ProfileVersion | null => {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as { radar?: Record<string, unknown>; tags?: unknown; summary?: unknown };
    const radar = {} as RadarData;
    for (const key of DIMENSION_KEYS) {
      const v = parsed.radar?.[key];
      if (typeof v !== 'number' || Number.isNaN(v)) return null;
      radar[key] = clamp(v);
    }
    if (!Array.isArray(parsed.tags) || typeof parsed.summary !== 'string') return null;
    const tags = Array.from(
      new Set(parsed.tags.filter((t): t is string => typeof t === 'string').map((t) => t.trim())),
    )
      .filter((t) => t.length > 0 && t.length <= 10)
      .slice(0, 5);
    if (tags.length < 3) return null;
    return { radar, tags, summary: parsed.summary.trim().slice(0, 50) };
  } catch {
    return null;
  }
};

const callAi = async (answers: Answers, appLink: string): Promise<ProfileVersion | null> => {
  const lines = QUESTIONS.filter((q) => answers[q.id] !== undefined && !q.dummy).map(
    (q) => `- [${q.dimension}] ${q.title}：${answerText(q, answers[q.id])}`,
  );
  const system = '你是高校宿舍室友匹配的画像分析助手。根据学生问卷答案生成画像，只输出 JSON，不要任何解释。';
  const prompt = [
    '问卷答案：',
    ...lines,
    '',
    '请输出 JSON：{"radar":{"routine":0-100,"hygiene":0-100,"study":0-100,"social":0-100,"environment":0-100,"special":0-100},"tags":["3到5个标签，每个不超过10个字"],"summary":"50字以内的画像简介"}。',
    'radar 含义：routine=早睡早起程度，hygiene=爱整洁程度，study=需要安静学习的程度，social=外向与社交程度，environment=对环境的敏感程度，special=特殊需求的严格程度。',
  ].join('\n');
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeout = new Promise<null>((resolve) => {
      timer = setTimeout(() => resolve(null), AI_TIMEOUT_MS);
    });
    const reply = await Promise.race([createAIService().chat(prompt, system, appLink), timeout]);
    return reply ? parseAiProfile(reply) : null;
  } catch (error) {
    console.error('AI profile generation failed, using rule template:', error);
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
};

export const generateProfile = async (
  answers: Answers,
  appLink: string,
): Promise<{ version: ProfileVersion; source: 'ai' | 'rule' }> => {
  if (process.env.OMNIFLOW_API_KEY) {
    const aiVersion = await callAi(answers, appLink);
    if (aiVersion) return { version: aiVersion, source: 'ai' };
  }
  return { version: buildRuleProfile(answers), source: 'rule' };
};
