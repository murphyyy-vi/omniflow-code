import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MAX_TAGS, MAX_TAG_LENGTH, PRESET_TAGS } from '@/types/profile';

interface ProfileTagsCardProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

const ProfileTagsCard = ({ tags, onChange }: ProfileTagsCardProps) => {
  const [draft, setDraft] = useState('');
  const full = tags.length >= MAX_TAGS;

  const addTag = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    if (text.length > MAX_TAG_LENGTH) {
      toast.error(`标签最多 ${MAX_TAG_LENGTH} 个字`);
      return;
    }
    if (tags.includes(text)) {
      toast.error('该标签已存在');
      return;
    }
    if (full) {
      toast.error(`最多添加 ${MAX_TAGS} 个标签`);
      return;
    }
    onChange([...tags, text]);
    setDraft('');
  };

  const removeTag = (tag: string) => onChange(tags.filter((t) => t !== tag));
  const presets = PRESET_TAGS.filter((t) => !tags.includes(t));

  return (
    <Card className="rounded-2xl border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">性格与习惯标签</CardTitle>
        <CardDescription>
          已选 {tags.length}/{MAX_TAGS} 个，可删除不准确的标签或自行添加
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {tags.length === 0 ? (
          <p className="text-sm text-muted-foreground rounded-xl bg-muted/50 px-4 py-6 text-center">
            还没有标签，从下方标签库选择或自己输入吧
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="rounded-full pl-3 pr-1 py-1 text-sm gap-1 bg-blue-50 text-primary hover:bg-blue-50"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  aria-label={`删除标签 ${tag}`}
                  className="w-6 h-6 rounded-full inline-flex items-center justify-center hover:bg-blue-100 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            addTag(draft);
          }}
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`自定义标签（≤${MAX_TAG_LENGTH}字）`}
            maxLength={MAX_TAG_LENGTH + 5}
            className="rounded-xl"
            disabled={full}
          />
          <Button type="submit" className="rounded-xl shrink-0" disabled={full || !draft.trim()}>
            <Plus className="w-4 h-4 mr-1" />
            添加
          </Button>
        </form>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">预设标签库</p>
          <div className="flex flex-wrap gap-2">
            {presets.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(tag)}
                disabled={full}
                className="px-3 py-1.5 rounded-full border border-border text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                + {tag}
              </button>
            ))}
            {presets.length === 0 && <span className="text-sm text-muted-foreground">预设标签已全部选用</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileTagsCard;
