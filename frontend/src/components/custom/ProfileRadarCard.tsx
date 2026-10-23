import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import {
  DIMENSIONS,
  MAX_RADAR_DELTA,
  type DimensionKey,
  type RadarData,
} from '@/types/profile';

interface ProfileRadarCardProps {
  aiRadar: RadarData;
  radar: RadarData;
  onChange: (key: DimensionKey, value: number) => void;
  onReset: () => void;
}

const ProfileRadarCard = ({ aiRadar, radar, onChange, onReset }: ProfileRadarCardProps) => {
  const chartData = DIMENSIONS.map((d) => ({
    dimension: d.label,
    ai: aiRadar[d.key],
    mine: radar[d.key],
  }));

  return (
    <Card className="rounded-2xl border-border shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1.5">
          <CardTitle className="text-lg">习惯雷达图</CardTitle>
          <CardDescription>每个维度可在 AI 原始分值 ±{MAX_RADAR_DELTA} 分内调整</CardDescription>
        </div>
        <Button variant="outline" size="sm" className="rounded-full shrink-0" onClick={onReset}>
          <RotateCcw className="w-4 h-4 mr-1" />
          还原
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData} outerRadius="72%">
              <PolarGrid stroke="#E2E8F0" />
              <PolarAngleAxis dataKey="dimension" tick={{ fill: '#64748B', fontSize: 13 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                name="AI 原始版"
                dataKey="ai"
                stroke="#94A3B8"
                strokeDasharray="4 4"
                fill="#94A3B8"
                fillOpacity={0.1}
              />
              <Radar
                name="我的版本"
                dataKey="mine"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.3}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-5">
          {DIMENSIONS.map((d) => {
            const base = aiRadar[d.key];
            const min = Math.max(0, base - MAX_RADAR_DELTA);
            const max = Math.min(100, base + MAX_RADAR_DELTA);
            const diff = radar[d.key] - base;
            return (
              <div key={d.key} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium text-foreground">{d.label}</span>
                    <span className="ml-2 text-xs text-muted-foreground hidden sm:inline">{d.hint}</span>
                  </div>
                  <div className="tabular-nums text-muted-foreground">
                    <span className="font-semibold text-primary">{radar[d.key]}</span>
                    {diff !== 0 && (
                      <span className={diff > 0 ? 'ml-1 text-xs text-emerald-600' : 'ml-1 text-xs text-amber-600'}>
                        ({diff > 0 ? '+' : ''}
                        {diff})
                      </span>
                    )}
                  </div>
                </div>
                <Slider
                  value={[radar[d.key]]}
                  min={min}
                  max={max}
                  step={1}
                  onValueChange={(v) => onChange(d.key, v[0])}
                  aria-label={`${d.label}分值`}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileRadarCard;
