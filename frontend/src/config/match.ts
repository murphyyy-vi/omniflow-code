import type { MatchCandidate } from '@shared/types/match';

export const MAX_REMATCH = 3;
export const MAX_ICEBREAKER_REFRESH = 3;
export const MAX_CANDIDATES = 5;

export interface ScoreTier {
  key: 'high' | 'good' | 'watch' | 'danger';
  label: string;
  text: string;
  soft: string;
  stroke: string;
  bar: string;
}

const TIERS: Record<ScoreTier['key'], ScoreTier> = {
  high: {
    key: 'high',
    label: '高兼容',
    text: 'text-emerald-700',
    soft: 'bg-emerald-50 border-emerald-200',
    stroke: 'stroke-emerald-600',
    bar: 'bg-emerald-600',
  },
  good: {
    key: 'good',
    label: '较兼容',
    text: 'text-sky-700',
    soft: 'bg-sky-50 border-sky-200',
    stroke: 'stroke-sky-600',
    bar: 'bg-sky-600',
  },
  watch: {
    key: 'watch',
    label: '需留意',
    text: 'text-amber-700',
    soft: 'bg-amber-50 border-amber-200',
    stroke: 'stroke-amber-600',
    bar: 'bg-amber-600',
  },
  danger: {
    key: 'danger',
    label: '红色预警',
    text: 'text-red-700',
    soft: 'bg-red-50 border-red-200',
    stroke: 'stroke-red-600',
    bar: 'bg-red-600',
  },
};

/** Score colour tier; a danger conflict always overrides the score-based colour. */
export const getTier = (candidate: MatchCandidate): ScoreTier => {
  if (candidate.conflicts.some((c) => c.level === 'danger')) return TIERS.danger;
  const score = candidate.compatibilityScore;
  if (score >= 85) return TIERS.high;
  if (score >= 70) return TIERS.good;
  return TIERS.watch;
};

export const sortCandidates = (list: MatchCandidate[]): MatchCandidate[] =>
  [...list].sort((a, b) => b.compatibilityScore - a.compatibilityScore).slice(0, MAX_CANDIDATES);

const TEMPLATES = [
  '听说你是「{tag}」型，平时有什么小习惯吗？',
  '我们作息可以先聊聊，你一般几点休息呀？',
  '你带了哪些宿舍好物？我们可以一起规划一下～',
  '宿舍公共区域的清洁，你喜欢怎么分工？',
  '周末你一般怎么安排？有没有想一起尝试的事？',
  '你对空调和开窗有什么偏好？我们提前商量下吧',
  '同专业的你，有没有推荐的选课或学习资源？',
  '我平时也关注「{tag}」，你有什么经验可以分享？',
  '开学第一周，你最期待做的一件事是什么？',
];

/** Template-based icebreakers used for the "refresh batch" action in demo mode. */
export const buildTemplateIcebreakers = (candidate: MatchCandidate, batch: number): string[] => {
  const tag = candidate.publicTags[batch % Math.max(candidate.publicTags.length, 1)] ?? '小习惯';
  return [0, 1, 2].map((i) => TEMPLATES[(batch * 3 + i) % TEMPLATES.length].replace('{tag}', tag));
};

const ME_RADAR = { routine: 85, hygiene: 75, study: 70, social: 55, environment: 60, special: 50 };

export const DEMO_CANDIDATES: MatchCandidate[] = [
  {
    candidateId: 'demo-1',
    displayName: '林子墨',
    major: '计算机科学与技术',
    campus: 'pukou',
    publicTags: ['早睡早起', '轻度洁癖', '安静学习'],
    compatibilityScore: 92,
    dimensionScores: { routine: 94, hygiene: 92, social: 88, environment: 90, study: 93 },
    radar: {
      me: ME_RADAR,
      candidate: { routine: 88, hygiene: 80, study: 78, social: 52, environment: 62, special: 55 },
    },
    conflicts: [],
    summaryText: '作息高度重合，卫生标准接近',
    icebreakers: [
      '你也是早睡早起型吧？我们可以约好熄灯时间～',
      '听说你喜欢安静学习，宿舍里你常去哪学习？',
      '我也喜欢整洁，宿舍收纳你有什么好点子？',
    ],
  },
  {
    candidateId: 'demo-2',
    displayName: '周一帆',
    major: '计算机科学与技术',
    campus: 'pukou',
    publicTags: ['规律作息', '外向友善', '爱运动'],
    compatibilityScore: 87,
    dimensionScores: { routine: 90, hygiene: 84, social: 85, environment: 86, study: 84 },
    radar: {
      me: ME_RADAR,
      candidate: { routine: 82, hygiene: 70, study: 66, social: 78, environment: 58, special: 48 },
    },
    conflicts: [],
    summaryText: '作息规律且社交风格互补，相处轻松',
    icebreakers: [
      '看你标签有爱运动，你平时最常做什么运动？',
      '我们作息很像，早晨要不要一起去操场跑步？',
      '你比我外向，开学后能带我多认识些朋友吗？',
    ],
  },
  {
    candidateId: 'demo-3',
    displayName: '陈思远',
    major: '计算机科学与技术',
    campus: 'pukou',
    publicTags: ['夜猫子', '机械键盘', '内向'],
    compatibilityScore: 81,
    dimensionScores: { routine: 80, hygiene: 85, social: 82, environment: 84, study: 70 },
    radar: {
      me: ME_RADAR,
      candidate: { routine: 55, hygiene: 72, study: 40, social: 35, environment: 64, special: 52 },
    },
    conflicts: [{ level: 'warning', reason: '学习习惯存在噪音差异' }],
    summaryText: '卫生与作息接近，学习时的声响需提前沟通',
    icebreakers: [
      '我听说你用机械键盘，是什么轴体的呀？',
      '你晚上学习到几点？我们可以约定安静时段',
      '你是夜猫子，宿舍灯光怎么安排比较合适？',
    ],
  },
  {
    candidateId: 'demo-4',
    displayName: '王浩然',
    major: '计算机科学与技术',
    campus: 'pukou',
    publicTags: ['午休党', '怕冷', '爱整洁'],
    compatibilityScore: 74,
    dimensionScores: { routine: 80, hygiene: 76, social: 70, environment: 58, study: 72 },
    radar: {
      me: ME_RADAR,
      candidate: { routine: 80, hygiene: 82, study: 60, social: 58, environment: 38, special: 45 },
    },
    conflicts: [{ level: 'warning', reason: '开窗与空调偏好不同' }],
    summaryText: '作息与卫生合拍，空调与开窗需要商量',
    icebreakers: [
      '听说你怕冷，空调你一般喜欢调到几度呢？',
      '你也爱午休吗？我们约个午休安静时间吧',
      '你说爱整洁，宿舍卫生值日我们怎么排？',
    ],
  },
  {
    candidateId: 'demo-5',
    displayName: '赵屹',
    major: '计算机科学与技术',
    campus: 'pukou',
    publicTags: ['深夜开黑', '社交活跃', '不爱早起'],
    compatibilityScore: 63,
    dimensionScores: { routine: 52, hygiene: 70, social: 72, environment: 70, study: 66 },
    radar: {
      me: ME_RADAR,
      candidate: { routine: 20, hygiene: 60, study: 35, social: 90, environment: 55, special: 50 },
    },
    conflicts: [{ level: 'danger', reason: '就寝时间晚于凌晨1点，与你的噪音敏感度冲突' }],
    summaryText: '社交契合但作息差异大，建议先沟通熄灯时间',
    icebreakers: [
      '你喜欢深夜开黑，我们能约定个熄灯时间吗？',
      '你社交活跃，周末有什么活动可以带上我？',
      '早上我起得早，闹钟声音我们怎么协调？',
    ],
  },
];
