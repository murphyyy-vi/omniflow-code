import { useState } from 'react';
import { Loader2, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiService } from '@/lib/api';
import type { AuthResponse, Campus, Gender } from '@shared/types/dorm';

interface AuthViewProps {
  onAuthed: (res: AuthResponse) => void | Promise<void>;
}

const FEATURES = [
  { icon: Sparkles, title: 'AI 画像', text: '6 大维度问卷生成雷达图与标签' },
  { icon: Users, title: '习惯匹配', text: '入学前了解未来室友的作息与卫生习惯' },
  { icon: ShieldCheck, title: '隐私优先', text: '画像默认隐藏，由你决定公开哪些' },
];

const AuthView = ({ onAuthed }: AuthViewProps) => {
  const [tab, setTab] = useState<string>('login');
  const [loading, setLoading] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<string>('');
  const [major, setMajor] = useState('');
  const [campus, setCampus] = useState<string>('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId.trim() || !name.trim()) {
      toast.error('请输入学号和姓名');
      return;
    }
    setLoading(true);
    try {
      const res = await apiService.login({ studentId: studentId.trim(), name: name.trim() });
      toast.success(`欢迎回来，${res.user.name}`);
      await onAuthed(res);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId.trim() || !name.trim() || !gender || !major.trim() || !campus) {
      toast.error('请完整填写所有基本信息');
      return;
    }
    setLoading(true);
    try {
      const res = await apiService.register({
        studentId: studentId.trim(),
        name: name.trim(),
        gender: gender as Gender,
        major: major.trim(),
        campus: campus as Campus,
      });
      toast.success('注册成功，开始填写问卷吧');
      await onAuthed(res);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-14 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
      <section className="space-y-6">
        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold tracking-widest text-primary uppercase bg-blue-50 rounded-full">
          <Sparkles className="w-3.5 h-3.5" />
          大一新生专属
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold leading-tight text-foreground">
          入学前，先找到你的<span className="text-primary">合拍室友</span>
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          完成一份约 5 分钟的生活习惯问卷，AI 为你生成专属画像，让宿舍分配不再靠抽签。
        </p>
        <ul className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
          {FEATURES.map((f) => (
            <li key={f.title} className="flex items-start gap-3 rounded-2xl bg-white border border-border p-4 shadow-sm">
              <span className="w-10 h-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center shrink-0">
                <f.icon className="w-5 h-5" />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-foreground">{f.title}</span>
                <span className="block text-sm text-muted-foreground leading-relaxed">{f.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <Card className="rounded-3xl border-border shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">学号登录</CardTitle>
          <CardDescription>首次使用请先注册，已注册同学直接登录继续之前的进度</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid grid-cols-2 w-full mb-6 h-11">
              <TabsTrigger value="login" className="cursor-pointer">登录</TabsTrigger>
              <TabsTrigger value="register" className="cursor-pointer">注册</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-id">学号</Label>
                  <Input id="login-id" inputMode="numeric" value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="例如 2026010001" className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-name">姓名</Label>
                  <Input id="login-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="真实姓名" className="h-11 rounded-xl" />
                </div>
                <Button type="submit" disabled={loading} className="w-full min-h-[44px] rounded-xl cursor-pointer">
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  登录
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-id">学号</Label>
                    <Input id="reg-id" inputMode="numeric" value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="6-12 位数字" className="h-11 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">姓名</Label>
                    <Input id="reg-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="真实姓名" className="h-11 rounded-xl" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>性别</Label>
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger className="h-11 rounded-xl w-full">
                        <SelectValue placeholder="请选择" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">男</SelectItem>
                        <SelectItem value="female">女</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>校区</Label>
                    <Select value={campus} onValueChange={setCampus}>
                      <SelectTrigger className="h-11 rounded-xl w-full">
                        <SelectValue placeholder="请选择" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pukou">浦口校区</SelectItem>
                        <SelectItem value="mochou">莫愁校区</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-major">专业</Label>
                  <Input id="reg-major" value={major} onChange={(e) => setMajor(e.target.value)} placeholder="例如 计算机科学与技术" className="h-11 rounded-xl" />
                </div>
                <Button type="submit" disabled={loading} className="w-full min-h-[44px] rounded-xl cursor-pointer">
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  注册并开始问卷
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthView;
