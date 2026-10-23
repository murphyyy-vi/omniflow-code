import { useState, useEffect } from 'react';
import { Home, LogOut } from 'lucide-react';
import OmniflowBadge from '@/components/custom/OmniflowBadge';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { DEMO_MODE } from '@/config/constants';
import { apiService, tokenStore } from '@/lib/api';
import AuthView from '@/pages/AuthView';
import MatchPage from '@/pages/MatchPage';
import QuestionnaireView from '@/pages/QuestionnaireView';
import ProfilePage from '@/pages/ProfilePage';
import type { AuthResponse, ProfileDto, UserDto } from '@shared/types/dorm';

type View = 'loading' | 'auth' | 'questionnaire' | 'profile' | 'match';

interface NavTab {
  id: 'profile' | 'match' | 'auth';
  label: string;
  active: boolean;
}

const Index = () => {
  const [view, setView] = useState<View>(() => {
    if (tokenStore.get()) return 'loading';
    return DEMO_MODE ? 'match' : 'auth';
  });
  const [user, setUser] = useState<UserDto | null>(null);
  const [profile, setProfile] = useState<ProfileDto | null>(null);

  const openProfile = async () => {
    try {
      setProfile(await apiService.getProfile());
      setView('profile');
    } catch {
      setView('questionnaire');
    }
  };

  useEffect(() => {
    if (!tokenStore.get()) return;
    let cancelled = false;
    const restore = async () => {
      try {
        const me = await apiService.me();
        if (cancelled) return;
        setUser(me.user);
        if (me.stage === 'profile') {
          const dto = await apiService.getProfile();
          if (cancelled) return;
          setProfile(dto);
          setView(DEMO_MODE ? 'match' : 'profile');
        } else {
          setView('questionnaire');
        }
      } catch {
        if (cancelled) return;
        tokenStore.clear();
        setView(DEMO_MODE ? 'match' : 'auth');
      }
    };
    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAuthed = async (res: AuthResponse) => {
    tokenStore.set(res.token);
    setUser(res.user);
    if (res.stage === 'profile') {
      await openProfile();
    } else {
      setView('questionnaire');
    }
  };

  const handleLogout = () => {
    tokenStore.clear();
    setUser(null);
    setProfile(null);
    setView(DEMO_MODE ? 'match' : 'auth');
  };

  const handleSubmitted = (dto: ProfileDto) => {
    setProfile(dto);
    setView('profile');
  };

  const handleTab = (id: NavTab['id']) => {
    if (id === 'match') setView('match');
    else if (id === 'auth') setView('auth');
    else if (profile) setView('profile');
    else void openProfile();
  };

  const tabs: NavTab[] = user
    ? [
        { id: 'profile', label: '我的画像', active: view === 'profile' || view === 'questionnaire' },
        { id: 'match', label: '室友匹配', active: view === 'match' },
      ]
    : DEMO_MODE
      ? [
          { id: 'match', label: '匹配演示', active: view === 'match' },
          { id: 'auth', label: '登录 / 注册', active: view === 'auth' },
        ]
      : [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <Home className="w-5 h-5 text-white" />
            </span>
            <span className="text-lg font-bold tracking-tight text-foreground truncate">宿舍和谐助手</span>
          </div>
          {user && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user.name} · {user.campus === 'pukou' ? '浦口校区' : '莫愁校区'}
              </span>
              <Button variant="outline" size="sm" className="rounded-full min-h-[44px] sm:min-h-9" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-1" />
                退出
              </Button>
            </div>
          )}
        </div>
        {tabs.length > 0 && view !== 'loading' && (
          <nav className="max-w-5xl mx-auto px-4 sm:px-6 flex gap-2 pb-2" aria-label="主导航">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleTab(t.id)}
                aria-current={t.active ? 'page' : undefined}
                className={`px-4 min-h-[44px] sm:min-h-9 rounded-full text-sm font-medium cursor-pointer transition ${
                  t.active
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        )}
      </header>

      <main className="flex-1 w-full">
        {view === 'loading' && (
          <div className="flex items-center justify-center py-32 text-muted-foreground">正在加载你的进度…</div>
        )}
        {view === 'auth' && <AuthView onAuthed={handleAuthed} />}
        {view === 'questionnaire' && <QuestionnaireView onSubmitted={handleSubmitted} />}
        {view === 'profile' && profile && (
          <ProfilePage key={profile.updatedAt} profile={profile} onSaved={setProfile} onGoMatch={() => setView('match')} />
        )}
        {view === 'match' && <MatchPage />}
      </main>

      <OmniflowBadge />
      <Toaster />
    </div>
  );
};

export default Index;
