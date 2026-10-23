import { useState } from 'react';
import { Save, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import PriorityDimensionsCard from '@/components/custom/PriorityDimensionsCard';
import ProfileRadarCard from '@/components/custom/ProfileRadarCard';
import ProfileTagsCard from '@/components/custom/ProfileTagsCard';
import { Button } from '@/components/ui/button';
import { apiService } from '@/lib/api';
import { MAX_PRIORITY, type DimensionKey, type RadarData } from '@/types/profile';
import type { ProfileDto } from '@shared/types/dorm';

interface ProfilePageProps {
  profile: ProfileDto;
  onSaved: (profile: ProfileDto) => void;
  onGoMatch?: () => void;
}

const ProfilePage = ({ profile, onSaved, onGoMatch }: ProfilePageProps) => {
  const [radar, setRadar] = useState<RadarData>(profile.studentVersion.radar);
  const [tags, setTags] = useState<string[]>(profile.studentVersion.tags);
  const [priority, setPriority] = useState<DimensionKey[]>(profile.priorityDimensions);
  const [saving, setSaving] = useState(false);

  const handleRadarChange = (key: DimensionKey, value: number) =>
    setRadar((r) => ({ ...r, [key]: value }));

  const handleReset = () => {
    setRadar(profile.aiVersion.radar);
    setTags(profile.aiVersion.tags);
    toast.success('已还原为 AI 原始版本');
  };

  const handleSave = async () => {
    if (priority.length !== MAX_PRIORITY) {
      toast.error(`请选择 ${MAX_PRIORITY} 个最看重的维度`);
      return;
    }
    if (tags.length === 0) {
      toast.error('至少保留一个标签');
      return;
    }
    setSaving(true);
    try {
      const saved = await apiService.saveProfile({ radar, tags, priorityDimensions: priority });
      onSaved(saved);
      toast.success('画像已保存');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
      <section className="rounded-3xl bg-white border border-border p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1 px-3 py-1 mb-4 text-xs font-bold tracking-widest text-primary uppercase bg-blue-50 rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
              {profile.source === 'ai' ? 'AI 画像确认' : '模板画像确认'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">确认你的室友画像</h1>
            <p className="text-muted-foreground leading-relaxed">{profile.studentVersion.summary}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              画像默认对外隐藏，仅在匹配确认后向对方展示公开标签。你的修改不会覆盖 AI 原始版本。
            </p>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <Button onClick={handleSave} disabled={saving} className="rounded-full px-5 min-h-[44px]">
              <Save className="w-4 h-4 mr-1" />
              {saving ? '保存中…' : '保存画像'}
            </Button>
            {onGoMatch && (
              <Button variant="outline" onClick={onGoMatch} className="rounded-full px-5 min-h-[44px]">
                查看室友匹配
              </Button>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <ProfileRadarCard
          aiRadar={profile.aiVersion.radar}
          radar={radar}
          onChange={handleRadarChange}
          onReset={handleReset}
        />
        <div className="space-y-6">
          <ProfileTagsCard tags={tags} onChange={setTags} />
          <PriorityDimensionsCard selected={priority} radar={radar} onChange={setPriority} />
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
