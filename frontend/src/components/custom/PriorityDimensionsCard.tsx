import { Check } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { DIMENSIONS, MAX_PRIORITY, type DimensionKey, type RadarData } from '@/types/profile';

interface PriorityDimensionsCardProps {
  selected: DimensionKey[];
  radar: RadarData;
  onChange: (next: DimensionKey[]) => void;
}

const PriorityDimensionsCard = ({ selected, radar, onChange }: PriorityDimensionsCardProps) => {
  const toggle = (key: DimensionKey) => {
    if (selected.includes(key)) {
      onChange(selected.filter((k) => k !== key));
      return;
    }
    if (selected.length >= MAX_PRIORITY) {
      toast.error(`最多选择 ${MAX_PRIORITY} 个最看重的维度，请先取消一个`);
      return;
    }
    onChange([...selected, key]);
  };

  return (
    <Card className="rounded-2xl border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">最看重的 3 个维度</CardTitle>
        <CardDescription>
          已选 {selected.length}/{MAX_PRIORITY}，匹配时这些维度将获得额外权重加成
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DIMENSIONS.map((d) => {
            const rank = selected.indexOf(d.key);
            const active = rank >= 0;
            return (
              <button
                key={d.key}
                type="button"
                onClick={() => toggle(d.key)}
                aria-pressed={active}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border p-4 text-left transition-all cursor-pointer min-h-14',
                  active
                    ? 'border-primary bg-blue-50 shadow-sm'
                    : 'border-border bg-white hover:border-secondary'
                )}
              >
                <span
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
                    active ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {active ? <Check className="w-4 h-4" /> : d.label.slice(0, 1)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-foreground">{d.label}</span>
                  <span className="block text-xs text-muted-foreground truncate">{d.hint}</span>
                </span>
                <span className="text-sm tabular-nums text-muted-foreground">{radar[d.key]}</span>
              </button>
            );
          })}
        </div>
        {selected.length < MAX_PRIORITY && (
          <p className="mt-4 text-sm text-amber-600">还需选择 {MAX_PRIORITY - selected.length} 个维度才能保存</p>
        )}
      </CardContent>
    </Card>
  );
};

export default PriorityDimensionsCard;
