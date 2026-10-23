import type { DimensionKey } from '@shared/questionnaire';
import type { RadarData } from '@shared/types/dorm';

export type { DimensionKey, RadarData };

export interface DimensionMeta {
  key: DimensionKey;
  label: string;
  hint: string;
}

export const DIMENSIONS: DimensionMeta[] = [
  { key: 'routine', label: '作息', hint: '就寝、起床与午休节奏' },
  { key: 'hygiene', label: '卫生', hint: '整洁度与清洁频率' },
  { key: 'study', label: '学习', hint: '学习时间与噪音敏感度' },
  { key: 'social', label: '社交', hint: '性格倾向与带人回寝' },
  { key: 'environment', label: '环境', hint: '空调、开窗与气味偏好' },
  { key: 'special', label: '特殊需求', hint: '烟味、宠物与健康说明' },
];

export const PRESET_TAGS = [
  '早睡早起',
  '夜猫子',
  '轻度洁癖',
  '随性整洁',
  '安静学习',
  '社恐但友善',
  '外向开朗',
  '怕吵',
  '爱运动',
  '喜欢开窗',
  '怕冷',
  '游戏爱好者',
];

export const MAX_TAGS = 8;
export const MAX_TAG_LENGTH = 10;
export const MAX_PRIORITY = 3;
export const MAX_RADAR_DELTA = 20;
