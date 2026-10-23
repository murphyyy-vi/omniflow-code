import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { AlertTriangle, CheckCircle2, Clock, Copy, Info, Shuffle, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DEMO_MODE } from '@/config/constants';
import { MAX_ICEBREAKER_REFRESH, getTier } from '@/config/match';
import { DIMENSIONS } from '@/types/profile';
import type { MatchCandidate, MatchDimensionScores } from '@shared/types/match';

export type ConfirmStatus = 'waiting' | 'confirmed';

const SUB_SCORES: { key: keyof MatchDimensionScores; label: string }[] = [
  { key: 'routine', label: '作息' },
  { key: 'hygiene', label: '卫生' },
  { key: 'social', label: '社交' },
  { key: 'environment', label: '环境' },
  { key: 'study', label: '学习' },
];

interface MatchDetailSheetProps {
  candidate: MatchCandidate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  confirmStatus: ConfirmStatus | undefined;
  topics: string[];
  refreshUsed: number;
  rematchLeft: number;
  onConfirm: () => void;
  onSkip: () => void;
  onSimulateConfirm: () => void;
  onRefreshTopics: () => void;
  onCopy: (text: string) => void;
}

const MatchDetailSheet = ({
  candidate,
  open,
  onOpenChange,
  confirmStatus,
  topics,
  refreshUsed,
  rematchLeft,
  onConfirm,
  onSkip,
  onSimulateConfirm,
  onRefreshTopics,
  onCopy,
}: MatchDetailSheetProps) => {
  const tier = candidate ? getTier(candidate) : null;
  const chartData = candidate
    ? DIMENSIONS.map((d) => ({
        dimension: d.label,
        me: candidate.radar.me[d.key],
        other: candidate.radar.candidate[d.key],
      }))
    : [];
  const refreshLeft = MAX_ICEBREAKER_REFRESH - refreshUsed;

  return (
    <Sheet open={open && candidate !== null} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto w-full max-w-[480px] max-h-[92vh] overflow-y-auto rounded-t-3xl p-0 bg-white"
      >
        {candidate && tier && (
          <div className="p-5 space-y-5">
            <SheetHeader className="text-left space-y-1">
              <SheetTitle className="text-xl font-bold">{candidate.displayName}</SheetTitle>
              <SheetDescription>
                {candidate.major} · {candidate.campus === 'pukou' ? '浦口校区' : '莫愁校区'}
              </SheetDescription>
            </SheetHeader>

            <div className={`rounded-2xl border p-4 flex items-center gap-4 ${tier.soft}`}>
              <div className={`text-5xl font-extrabold tabular-nums leading-none ${tier.text}`}>
                {candidate.compatibilityScore}
                <span className="text-2xl">%</span>
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-bold ${tier.text}`}>{tier.label}</p>
                <p className="text-sm text-foreground leading-snug">{candidate.summaryText}</p>
              </div>
            </div>

            {candidate.conflicts.length > 0 && (
              <ul className="space-y-2" aria-label="冲突预警">
                {candidate.conflicts.map((c) => (
                  <li
                    key={c.reason}
                    className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${
                      c.level === 'danger'
                        ? 'bg-red-50 border-red-200 text-red-800'
                        : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span className="leading-snug">
                      <strong>{c.level === 'danger' ? '红色预警：' : '黄色提示：'}</strong>
                      {c.reason}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <section className="space-y-2">
              <h3 className="text-base font-bold text-foreground">我 vs 对方</h3>
              <div
                className="h-64 w-full"
                role="img"
                aria-label={`对比雷达图：${DIMENSIONS.map(
                  (d) => `${d.label} 我 ${candidate.radar.me[d.key]} 对方 ${candidate.radar.candidate[d.key]}`,
                ).join('；')}`}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={chartData} outerRadius="70%">
                    <PolarGrid stroke="#E2E8F0" />
                    <PolarAngleAxis dataKey="dimension" tick={{ fill: '#475569', fontSize: 12 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="我" dataKey="me" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.25} />
                    <Radar name="对方" dataKey="other" stroke="#F97316" fill="#F97316" fillOpacity={0.25} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-foreground">分项得分</h3>
              {SUB_SCORES.map((s) => (
                <div key={s.key} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground">{s.label}</span>
                    <span className="font-semibold tabular-nums">{candidate.dimensionScores[s.key]}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${tier.bar}`}
                      style={{ width: `${candidate.dimensionScores[s.key]}%` }}
                    />
                  </div>
                </div>
              ))}
            </section>

            <p className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              出于隐私保护，吸烟、宠物与健康等特殊需求不会明文展示，仅体现在预警提示中。
            </p>

            {confirmStatus === undefined && (
              <div className="space-y-2">
                <Button className="w-full min-h-[48px] rounded-full text-base" onClick={onConfirm}>
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  确认匹配
                </Button>
                <Button
                  variant="outline"
                  className="w-full min-h-[48px] rounded-full"
                  onClick={onSkip}
                  disabled={rematchLeft <= 0}
                >
                  <Shuffle className="w-4 h-4 mr-1" />
                  换一个（剩余 {rematchLeft} 次）
                </Button>
                {rematchLeft <= 0 && (
                  <p className="text-xs text-center text-muted-foreground">重新匹配次数已用尽，请联系辅导员</p>
                )}
              </div>
            )}

            {confirmStatus === 'waiting' && (
              <div className="rounded-2xl border border-border bg-slate-50 p-4 space-y-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Clock className="w-4 h-4" />
                  等待对方确认
                </p>
                <p className="text-sm text-muted-foreground">你已确认匹配，对方确认后将解锁破冰话题与聊天。</p>
                {DEMO_MODE && (
                  <Button className="w-full min-h-[44px] rounded-full" onClick={onSimulateConfirm}>
                    模拟对方已确认
                  </Button>
                )}
              </div>
            )}

            {confirmStatus === 'confirmed' && (
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="flex items-center gap-1.5 text-base font-bold text-foreground">
                    <Sparkles className="w-4 h-4 text-primary" />
                    AI 破冰开场白
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full min-h-[44px] sm:min-h-9"
                    onClick={onRefreshTopics}
                    disabled={refreshLeft <= 0}
                  >
                    <Shuffle className="w-3.5 h-3.5 mr-1" />
                    换一批（剩余 {refreshLeft} 次）
                  </Button>
                </div>
                <p className="text-sm font-medium text-emerald-700">双方已确认匹配，试试这样开口：</p>
                <ul className="space-y-2">
                  {topics.map((t) => (
                    <li key={t} className="flex items-start gap-3 rounded-2xl border border-border bg-white p-3 shadow-sm">
                      <p className="flex-1 text-sm leading-relaxed text-foreground">{t}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full min-h-[44px] min-w-[44px] shrink-0"
                        onClick={() => onCopy(t)}
                        aria-label={`复制：${t}`}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <Button
              variant="ghost"
              className="w-full min-h-[44px] rounded-full text-muted-foreground"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-4 h-4 mr-1" />
              返回列表
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default MatchDetailSheet;
