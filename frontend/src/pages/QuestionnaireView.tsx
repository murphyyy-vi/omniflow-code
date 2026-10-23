import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Loader2, Save, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { apiService } from '@/lib/api';
import { cn } from '@/lib/utils';
import { DIMENSIONS } from '@/types/profile';
import {
  DIMENSION_KEYS,
  QUESTIONS,
  questionsForPage,
  type AnswerValue,
  type Answers,
  type Question,
} from '@shared/questionnaire';
import type { ProfileDto } from '@shared/types/dorm';

interface QuestionnaireViewProps {
  onSubmitted: (profile: ProfileDto) => void;
}

const isAnswered = (q: Question, answers: Answers): boolean => {
  const v = answers[q.id];
  if (v === undefined) return false;
  return Array.isArray(v) ? v.length > 0 : true;
};

interface QuestionFieldProps {
  question: Question;
  index: number;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
}

const choiceClass = (active: boolean) =>
  cn(
    'rounded-xl border px-4 py-3 text-left text-sm transition-all cursor-pointer min-h-[44px]',
    active ? 'border-primary bg-blue-50 text-primary font-medium shadow-sm' : 'border-border bg-white hover:border-primary/50',
  );

const QuestionField = ({ question, index, value, onChange }: QuestionFieldProps) => {
  const toggleMulti = (optionValue: string) => {
    const current = Array.isArray(value) ? value : [];
    if (optionValue === 'none') {
      onChange(current.includes('none') ? [] : ['none']);
      return;
    }
    const without = current.filter((v) => v !== 'none');
    onChange(without.includes(optionValue) ? without.filter((v) => v !== optionValue) : [...without, optionValue]);
  };

  return (
    <div className="space-y-3">
      <p className="font-medium text-foreground leading-snug">
        <span className="text-primary mr-2">{index + 1}.</span>
        {question.title}
      </p>

      {question.type === 'single' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {question.options?.map((o) => (
            <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)} className={choiceClass(value === o.value)}>
              {o.label}
            </button>
          ))}
        </div>
      )}

      {question.type === 'multi' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {question.options?.map((o) => {
            const active = Array.isArray(value) && value.includes(o.value);
            return (
              <button key={o.value} type="button" aria-pressed={active} onClick={() => toggleMulti(o.value)} className={choiceClass(active)}>
                {o.label}
              </button>
            );
          })}
        </div>
      )}

      {question.type === 'scale' && (
        <div className="space-y-2">
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={value === n}
                onClick={() => onChange(n)}
                className={cn(
                  'h-11 rounded-xl border text-sm font-semibold tabular-nums transition-all cursor-pointer',
                  value === n ? 'border-primary bg-primary text-primary-foreground shadow-sm' : 'border-border bg-white hover:border-primary/50',
                )}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1 · {question.minLabel}</span>
            <span>{question.maxLabel} · 10</span>
          </div>
        </div>
      )}

      {question.type === 'time' && (
        <Input
          type="time"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          className="h-11 rounded-xl w-full sm:w-48"
        />
      )}
    </div>
  );
};

const QuestionnaireView = ({ onSubmitted }: QuestionnaireViewProps) => {
  const [answers, setAnswers] = useState<Answers>({});
  const [pageIndex, setPageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const draft = await apiService.getDraft();
        if (cancelled) return;
        setAnswers(draft.answers);
        const firstOpen = DIMENSION_KEYS.findIndex((k) =>
          questionsForPage(k).some((q) => !isAnswered(q, draft.answers)),
        );
        setPageIndex(firstOpen < 0 ? DIMENSION_KEYS.length - 1 : firstOpen);
        if (Object.keys(draft.answers).length > 0) toast.info('已恢复你上次保存的草稿');
      } catch (error) {
        if (!cancelled) toast.error(error instanceof Error ? error.message : '草稿加载失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const pageKey = DIMENSION_KEYS[pageIndex];
  const pageQuestions = questionsForPage(pageKey);
  const meta = DIMENSIONS.find((d) => d.key === pageKey);
  const isLast = pageIndex === DIMENSION_KEYS.length - 1;
  const answeredTotal = QUESTIONS.filter((q) => isAnswered(q, answers)).length;
  const pageComplete = pageQuestions.every((q) => isAnswered(q, answers));

  const setAnswer = (id: string, value: AnswerValue) => setAnswers((prev) => ({ ...prev, [id]: value }));

  const persist = async (silent: boolean): Promise<boolean> => {
    setSaving(true);
    try {
      await apiService.saveDraft(answers);
      if (!silent) toast.success('草稿已保存，可随时退出后继续');
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '草稿保存失败');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const goTo = async (next: number) => {
    await persist(true);
    setPageIndex(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNext = () => {
    if (!pageComplete) {
      toast.error('请先回答本页所有问题');
      return;
    }
    void goTo(pageIndex + 1);
  };

  const handleSubmit = async () => {
    if (!pageComplete) {
      toast.error('请先回答本页所有问题');
      return;
    }
    const firstIncomplete = DIMENSION_KEYS.findIndex((k) => questionsForPage(k).some((q) => !isAnswered(q, answers)));
    if (firstIncomplete >= 0) {
      toast.error('还有未完成的题目，已为你跳转');
      setPageIndex(firstIncomplete);
      return;
    }
    setSubmitting(true);
    try {
      const profile = await apiService.submitQuestionnaire(answers);
      toast.success('问卷提交成功，画像已生成');
      onSubmitted(profile);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '提交失败，请重试');
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-32 text-muted-foreground">正在加载问卷…</div>;
  }

  if (submitting) {
    return (
      <div className="max-w-md mx-auto px-6 py-28 text-center space-y-4">
        <Loader2 className="w-10 h-10 mx-auto text-primary animate-spin" />
        <h2 className="text-xl font-bold text-foreground">AI 正在为你生成画像…</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">通常需要几秒钟，若 AI 暂时不可用，将自动使用规则模板生成。</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      <section className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="inline-flex items-center gap-1 font-semibold text-primary">
            <Sparkles className="w-4 h-4" />
            生活习惯问卷
          </span>
          <span className="text-muted-foreground tabular-nums">
            已答 {answeredTotal}/{QUESTIONS.length} 题
          </span>
        </div>
        <Progress value={(answeredTotal / QUESTIONS.length) * 100} className="h-2" />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {DIMENSIONS.map((d, i) => {
            const done = questionsForPage(d.key).every((q) => isAnswered(q, answers));
            return (
              <button
                key={d.key}
                type="button"
                aria-current={i === pageIndex ? 'page' : undefined}
                onClick={() => void goTo(i)}
                className={cn(
                  'whitespace-nowrap rounded-full px-4 min-h-[36px] text-sm border transition-colors cursor-pointer',
                  i === pageIndex
                    ? 'bg-primary text-primary-foreground border-primary'
                    : done
                      ? 'bg-blue-50 text-primary border-blue-100'
                      : 'bg-white text-muted-foreground border-border',
                )}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      </section>

      <Card className="rounded-3xl border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">
            {pageIndex + 1}/{DIMENSION_KEYS.length} · {meta?.label}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{meta?.hint}</p>
        </CardHeader>
        <CardContent className="space-y-8">
          {pageQuestions.map((q, i) => (
            <QuestionField key={q.id} question={q} index={i} value={answers[q.id]} onChange={(v) => setAnswer(q.id, v)} />
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 sm:flex-none min-h-[44px] rounded-full cursor-pointer" disabled={pageIndex === 0 || saving} onClick={() => void goTo(pageIndex - 1)}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            上一页
          </Button>
          <Button variant="outline" className="flex-1 sm:flex-none min-h-[44px] rounded-full cursor-pointer" disabled={saving} onClick={() => void persist(false)}>
            {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
            保存草稿
          </Button>
        </div>
        {isLast ? (
          <Button className="min-h-[44px] rounded-full px-6 cursor-pointer" onClick={() => void handleSubmit()}>
            提交并生成画像
            <Sparkles className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button className="min-h-[44px] rounded-full px-6 cursor-pointer" disabled={saving} onClick={handleNext}>
            下一页
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default QuestionnaireView;
