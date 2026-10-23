export type DimensionKey = 'routine' | 'hygiene' | 'study' | 'social' | 'environment' | 'special';

export const DIMENSION_KEYS: DimensionKey[] = ['routine', 'hygiene', 'study', 'social', 'environment', 'special'];

export type QuestionType = 'single' | 'multi' | 'scale' | 'time';
export type AnswerValue = string | number | string[];
export type Answers = Record<string, AnswerValue>;

export interface QuestionOption {
  value: string;
  label: string;
}

export interface Question {
  id: string;
  dimension: DimensionKey;
  /** Page the question is shown on (defaults to its dimension). */
  page?: DimensionKey;
  type: QuestionType;
  title: string;
  options?: QuestionOption[];
  minLabel?: string;
  maxLabel?: string;
  lieDetector?: boolean;
  pairWith?: string;
  dummy?: boolean;
}

const yesNo: QuestionOption[] = [
  { value: 'yes', label: '是' },
  { value: 'no', label: '否' },
];

const importance: QuestionOption[] = [
  { value: 'strong_yes', label: '非常需要' },
  { value: 'yes', label: '需要' },
  { value: 'no', label: '不太需要' },
  { value: 'strong_no', label: '完全不需要' },
];

export const QUESTIONS: Question[] = [
  { id: 'r_bed', dimension: 'routine', type: 'time', title: '你通常几点上床就寝？' },
  { id: 'r_wake', dimension: 'routine', type: 'time', title: '你通常几点起床？' },
  {
    id: 'r_nap',
    dimension: 'routine',
    type: 'single',
    title: '你的午休习惯是？',
    options: [
      { value: 'none', label: '基本不午休' },
      { value: 'short', label: '小憩 30 分钟内' },
      { value: 'long', label: '需要睡 1 小时以上' },
    ],
  },
  {
    id: 'r_snore',
    dimension: 'routine',
    type: 'single',
    title: '打呼噜自评',
    options: [
      { value: 'no', label: '不打呼噜' },
      { value: 'light', label: '偶尔、声音很轻' },
      { value: 'loud', label: '经常、声音较大' },
    ],
  },
  {
    id: 'r_alarm',
    dimension: 'routine',
    type: 'single',
    title: '闹钟使用习惯',
    options: [
      { value: 'single', label: '只设一个，一次起床' },
      { value: 'multi', label: '会设多个闹钟' },
      { value: 'loud', label: '多个闹钟且声音较大' },
    ],
  },
  { id: 'h_tidy', dimension: 'hygiene', type: 'scale', title: '你的个人物品整洁程度', minLabel: '比较随意', maxLabel: '非常整洁' },
  {
    id: 'h_clean',
    dimension: 'hygiene',
    type: 'single',
    title: '你打扫公共区域的频率',
    options: [
      { value: 'daily', label: '几乎每天' },
      { value: 'weekly', label: '每周几次' },
      { value: 'rarely', label: '偶尔或轮到才做' },
    ],
  },
  { id: 'h_strict', dimension: 'hygiene', type: 'scale', title: '你对室友卫生的要求有多严格？', minLabel: '很宽容', maxLabel: '非常严格' },
  { id: 'd_tidy', dimension: 'hygiene', type: 'single', dummy: true, title: '你认为宿舍需要保持基本整洁吗？', options: importance },
  { id: 's_light', dimension: 'study', type: 'time', title: '你晚上通常学习到几点（需要开灯）？' },
  { id: 's_noise', dimension: 'study', type: 'scale', title: '你对噪音的敏感程度', minLabel: '不太在意', maxLabel: '极度敏感' },
  { id: 's_keyboard', dimension: 'study', type: 'single', title: '你会在宿舍使用机械键盘吗？', options: yesNo },
  { id: 's_silence', dimension: 'study', type: 'single', title: '学习时是否需要绝对安静？', options: yesNo },
  {
    id: 'r_sleep_after',
    dimension: 'routine',
    page: 'study',
    type: 'time',
    lieDetector: true,
    pairWith: 'r_bed',
    title: '你通常要到几点之后才能真正入睡？',
  },
  { id: 'so_intro', dimension: 'social', type: 'scale', title: '你的性格倾向', minLabel: '偏内向', maxLabel: '偏外向' },
  {
    id: 'so_friends',
    dimension: 'social',
    type: 'single',
    title: '你带朋友回宿舍的频率',
    options: [
      { value: 'never', label: '几乎不会' },
      { value: 'sometimes', label: '偶尔' },
      { value: 'often', label: '经常' },
    ],
  },
  { id: 'so_accept', dimension: 'social', type: 'scale', title: '你对室友带人回寝的接受度', minLabel: '很难接受', maxLabel: '完全无所谓' },
  { id: 'd_respect', dimension: 'social', type: 'single', dummy: true, title: '你认为应该尊重室友的休息时间吗？', options: importance },
  {
    id: 'e_temp',
    dimension: 'environment',
    type: 'single',
    title: '空调温度偏好',
    options: [
      { value: 'cool', label: '偏凉（24℃ 以下）' },
      { value: 'mid', label: '适中（25-26℃）' },
      { value: 'warm', label: '偏暖（27℃ 以上）' },
    ],
  },
  {
    id: 'e_window',
    dimension: 'environment',
    type: 'single',
    title: '你的开窗习惯',
    options: [
      { value: 'always', label: '喜欢经常开窗通风' },
      { value: 'sometimes', label: '偶尔开窗' },
      { value: 'never', label: '尽量保持关窗' },
    ],
  },
  { id: 'e_smell', dimension: 'environment', type: 'scale', title: '你对气味的敏感程度', minLabel: '不敏感', maxLabel: '非常敏感' },
  {
    id: 'sp_smoke',
    dimension: 'special',
    type: 'single',
    title: '吸烟相关',
    options: [
      { value: 'smoker', label: '我吸烟' },
      { value: 'accept', label: '我不吸烟，但可以接受室友吸烟' },
      { value: 'refuse', label: '我不吸烟，不接受室友吸烟' },
    ],
  },
  {
    id: 'sp_pet',
    dimension: 'special',
    type: 'single',
    title: '宠物相关',
    options: [
      { value: 'have', label: '我养宠物' },
      { value: 'accept', label: '我不养，但可以接受室友养宠物' },
      { value: 'refuse', label: '我不养，不接受室友养宠物' },
    ],
  },
  {
    id: 'sp_health',
    dimension: 'special',
    type: 'multi',
    title: '是否有需要室友知晓的健康状况？（可多选，仅用于匹配，不会明文展示）',
    options: [
      { value: 'none', label: '没有' },
      { value: 'allergy', label: '过敏体质' },
      { value: 'light_sleep', label: '睡眠较浅' },
      { value: 'other', label: '其他' },
    ],
  },
];

export const pageOf = (q: Question): DimensionKey => q.page ?? q.dimension;

export const questionsForPage = (page: DimensionKey): Question[] => QUESTIONS.filter((q) => pageOf(q) === page);

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Returns a clean answer value, or undefined when the raw value is missing/invalid. */
export const normalizeAnswer = (q: Question, raw: unknown): AnswerValue | undefined => {
  const values = (q.options ?? []).map((o) => o.value);
  switch (q.type) {
    case 'single':
      return typeof raw === 'string' && values.includes(raw) ? raw : undefined;
    case 'multi': {
      if (!Array.isArray(raw)) return undefined;
      const picked = Array.from(new Set(raw.filter((v): v is string => typeof v === 'string' && values.includes(v))));
      return picked.length > 0 ? picked : undefined;
    }
    case 'scale':
      return typeof raw === 'number' && Number.isInteger(raw) && raw >= 1 && raw <= 10 ? raw : undefined;
    case 'time':
      return typeof raw === 'string' && TIME_PATTERN.test(raw) ? raw : undefined;
    default:
      return undefined;
  }
};
