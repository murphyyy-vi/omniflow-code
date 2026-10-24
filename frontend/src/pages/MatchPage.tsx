import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronRight, Clock, RefreshCw, RotateCcw, Users } from 'lucide-react';
import { toast } from 'sonner';
import MatchDetailSheet, { type ConfirmStatus } from '@/components/custom/MatchDetailSheet';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DEMO_MODE } from '@/config/constants';
import {
  DEMO_CANDIDATES,
  MAX_ICEBREAKER_REFRESH,
  MAX_REMATCH,
  buildTemplateIcebreakers,
  getTier,
  sortCandidates,
  type ScoreTier,
} from '@/config/match';
import { apiService } from '@/lib/api';
import type { MatchCandidate } from '@shared/types/match';

type LoadStatus = 'loading' | 'ready' | 'error';

const RING_SIZE = 60;
const RING_STROKE = 6;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

interface ScoreRingProps {
  score: number;
  tier: ScoreTier;
}

const ScoreRing = ({ score, tier }: ScoreRingProps) => (
  <div className="relative shrink-0" style={{ width: RING_SIZE, height: RING_SIZE }}>
    <svg width={RING_SIZE} height={RING_SIZE} className="-rotate-90" aria-hidden="true">
      <circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RING_RADIUS}
        fill="none"
        strokeWidth={RING_STROKE}
        className="stroke-slate-100"
      />
      <circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RING_RADIUS}
        fill="none"
        strokeWidth={RING_STROKE}
        strokeLinecap="round"
        strokeDasharray={RING_LENGTH}
        strokeDashoffset={RING_LENGTH * (1 - score / 100)}
        className={tier.stroke}
      />
    </svg>
    <span className={`absolute inset-0 flex items-center justify-center text-base font-bold tabular-nums ${tier.text}`}>
      {score}%
    </span>
  </div>
);

interface CandidateCardProps {
  candidate: MatchCandidate;
  rank: number;
  confirmStatus: ConfirmStatus | undefined;
  onOpen: () => void;
}

const CandidateCard = ({ candidate, rank, confirmStatus, onOpen }: CandidateCardProps) => {
  const tier = getTier(candidate);
  const topConflict =
    candidate.conflicts.find((c) => c.level === 'danger') ?? candidate.conflicts[0] ?? null;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full min-h-[120px] flex flex-col gap-3 text-left rounded-2xl bg-white border border-border p-4 shadow-sm transition hover:shadow-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`第 ${rank} 名 ${candidate.displayName}，兼容度 ${candidate.compatibilityScore}%，${tier.label}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-blue-50 text-primary font-bold text-lg flex items-center justify-center shrink-0">
          {candidate.displayName.slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-foreground">{candidate.displayName}</span>
            <span className="text-xs text-muted-foreground">第 {rank} 名</span>
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {candidate.major} · {candidate.campus === 'pukou' ? '浦口校区' : '莫愁校区'}
          </p>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <ScoreRing score={candidate.compatibilityScore} tier={tier} />
          <span className={`text-[11px] font-semibold ${tier.text}`}>{tier.label}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {candidate.publicTags.slice(0, 3).map((tag) => (
          <span key={tag} className="px-2.5 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700">
            {tag}
          </span>
        ))}
      </div>

      {topConflict && (
        <div
          className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-xs leading-snug ${
            topConflict.level === 'danger'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>
            <strong>{topConflict.level === 'danger' ? '红色预警：' : '黄色提示：'}</strong>
            {topConflict.reason}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between text-xs">
        {confirmStatus === 'waiting' && (
          <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
            <Clock className="w-3.5 h-3.5" />
            等待对方确认
          </span>
        )}
        {confirmStatus === 'confirmed' && (
          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            已确认匹配
          </span>
        )}
        {confirmStatus === undefined && <span className="text-muted-foreground">{candidate.summaryText}</span>}
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </div>
    </button>
  );
};

const MatchPage = () => {
  const [status, setStatus] = useState<LoadStatus>(DEMO_MODE ? 'ready' : 'loading');
  const [candidates, setCandidates] = useState<MatchCandidate[]>(() =>
    DEMO_MODE ? sortCandidates(DEMO_CANDIDATES) : [],
  );
  const [rematchLeft, setRematchLeft] = useState(MAX_REMATCH);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmMap, setConfirmMap] = useState<Record<string, ConfirmStatus>>({});
  const [refreshCounts, setRefreshCounts] = useState<Record<string, number>>({});

  const selected = candidates.find((c) => c.candidateId === selectedId) ?? null;
  const selectedRefreshUsed = selected ? (refreshCounts[selected.candidateId] ?? 0) : 0;
  const selectedTopics = selected
    ? selectedRefreshUsed === 0
      ? selected.icebreakers
      : buildTemplateIcebreakers(selected, selectedRefreshUsed)
    : [];

  const loadFromApi = useCallback(async () => {
    try {
      const res = await apiService.getMatchResults();
      setCandidates(sortCandidates(res.candidates));
      setRematchLeft(res.rematchRemaining);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (DEMO_MODE) return;
    loadFromApi();
  }, [loadFromApi]);

  const handleRetry = () => {
    setStatus('loading');
    void loadFromApi();
  };

  const handleDemoReset = () => {
    setCandidates(sortCandidates(DEMO_CANDIDATES));
    setRematchLeft(MAX_REMATCH);
    setConfirmMap({});
    setRefreshCounts({});
    setSelectedId(null);
    toast.success('演示数据已重置');
  };

  const handleRefresh = () => {
    if (DEMO_MODE) {
      handleDemoReset();
    } else {
      handleRetry();
    }
  };

  const handleConfirm = (c: MatchCandidate) => {
    setConfirmMap((m) => ({ ...m, [c.candidateId]: 'waiting' }));
    toast.success('已确认匹配', { description: '等待对方确认' });
  };

  const handleSimulateConfirm = (c: MatchCandidate) => {
    setConfirmMap((m) => ({ ...m, [c.candidateId]: 'confirmed' }));
    toast.success('对方已确认', { description: '已为你生成 3 条破冰开场白' });
  };

  const handleSkip = (c: MatchCandidate) => {
    if (rematchLeft <= 0) {
      toast.error('重新匹配次数已用尽，请联系辅导员');
      return;
    }
    setCandidates((list) => list.filter((x) => x.candidateId !== c.candidateId));
    setRematchLeft((n) => n - 1);
    setSelectedId(null);
    toast.info('已换一个', { description: `剩余重新匹配次数 ${rematchLeft - 1}` });
  };

  const handleRefreshTopics = (c: MatchCandidate) => {
    const used = refreshCounts[c.candidateId] ?? 0;
    if (used >= MAX_ICEBREAKER_REFRESH) {
      toast.error('该匹配的换一批次数已用尽');
      return;
    }
    setRefreshCounts((m) => ({ ...m, [c.candidateId]: used + 1 }));
    toast.info('已换一批破冰话题');
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('已复制', { description: text });
    } catch {
      toast.error('复制失败，请手动选择文字复制');
    }
  };

  return (
    <div className="w-full max-w-[480px] mx-auto px-4 py-6 space-y-5">
      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-2xl font-bold text-foreground">为你匹配到的神仙室友</h1>
          {DEMO_MODE && (
            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-900 border border-amber-300 whitespace-nowrap">
              演示数据
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          根据你们的作息，卫生习惯精准计算，点击卡片查看详情
        </p>
        <div className="flex items-center justify-between gap-2 rounded-xl bg-white border border-border px-3 py-2">
          <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
            <Users className="w-4 h-4 text-primary" />
            剩余重新匹配次数：<strong className="tabular-nums">{rematchLeft}</strong> / {MAX_REMATCH}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full min-h-[44px] sm:min-h-9"
            onClick={handleRefresh}
          >
            {DEMO_MODE ? <RotateCcw className="w-3.5 h-3.5 mr-1" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
            {DEMO_MODE ? '重置演示' : '刷新'}
          </Button>
        </div>
      </section>

      {status === 'loading' && (
        <div className="space-y-3" aria-busy="true" aria-label="正在加载候选人">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[150px] w-full rounded-2xl" />
          ))}
        </div>
      )}

      {status === 'error' && (
        <div className="rounded-2xl bg-white border border-border p-6 text-center space-y-3">
          <p className="text-sm text-foreground">加载匹配结果失败，请检查网络后重试</p>
          <Button className="rounded-full min-h-[44px]" onClick={handleRetry}>
            <RefreshCw className="w-4 h-4 mr-1" />
            重试
          </Button>
        </div>
      )}

      {status === 'ready' && candidates.length === 0 && (
        <div className="rounded-2xl bg-white border border-border p-8 text-center space-y-3">
          <p className="text-sm text-foreground">暂无符合条件的室友，请稍后再来</p>
          {DEMO_MODE && (
            <Button variant="outline" className="rounded-full min-h-[44px]" onClick={handleDemoReset}>
              <RotateCcw className="w-4 h-4 mr-1" />
              重置演示数据
            </Button>
          )}
        </div>
      )}

      {status === 'ready' && candidates.length > 0 && (
        <ul className="space-y-3">
          {candidates.map((c, index) => (
            <li key={c.candidateId}>
              <CandidateCard
                candidate={c}
                rank={index + 1}
                confirmStatus={confirmMap[c.candidateId]}
                onOpen={() => setSelectedId(c.candidateId)}
              />
            </li>
          ))}
        </ul>
      )}

      <MatchDetailSheet
        candidate={selected}
        open={selectedId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
        confirmStatus={selected ? confirmMap[selected.candidateId] : undefined}
        topics={selectedTopics}
        refreshUsed={selectedRefreshUsed}
        rematchLeft={rematchLeft}
        onConfirm={() => selected && handleConfirm(selected)}
        onSkip={() => selected && handleSkip(selected)}
        onSimulateConfirm={() => selected && handleSimulateConfirm(selected)}
        onRefreshTopics={() => selected && handleRefreshTopics(selected)}
        onCopy={handleCopy}
      />
    </div>
  );
};

export default MatchPage;
