import { API_BASE_URL } from '@/config/constants';
import type { Answers } from '@shared/questionnaire';
import type { ApiEnvelope } from '@shared/types/api';
import type { MatchResultsResponse } from '@shared/types/match';
import type {
  AuthResponse,
  DraftResponse,
  LoginRequest,
  MeResponse,
  ProfileDto,
  RegisterRequest,
  SaveProfileRequest,
} from '@shared/types/dorm';

const TOKEN_KEY = 'dorm-harmony-token';

export const tokenStore = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

const request = async <T>(path: string, method = 'GET', body?: unknown): Promise<T> => {
  const token = tokenStore.get();
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/api${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('网络连接失败，请检查网络后重试', 0, 'NETWORK');
  }
  let json: ApiEnvelope<T> | null = null;
  try {
    json = (await res.json()) as ApiEnvelope<T>;
  } catch {
    json = null;
  }
  if (!res.ok || !json || !json.success) {
    throw new ApiError(json?.error?.message || '请求失败，请稍后重试', res.status, json?.error?.code);
  }
  return json.data as T;
};

export const apiService = {
  register: (data: RegisterRequest) => request<AuthResponse>('/auth/register', 'POST', data),
  login: (data: LoginRequest) => request<AuthResponse>('/auth/login', 'POST', data),
  me: () => request<MeResponse>('/auth/me'),
  getDraft: () => request<DraftResponse>('/questionnaire/draft'),
  saveDraft: (answers: Answers) => request<DraftResponse>('/questionnaire/draft', 'POST', { answers }),
  submitQuestionnaire: (answers: Answers) => request<ProfileDto>('/questionnaire/submit', 'POST', { answers }),
  getProfile: () => request<ProfileDto>('/profile/me'),
  saveProfile: (data: SaveProfileRequest) => request<ProfileDto>('/profile/me', 'PUT', data),
  getMatchResults: () => request<MatchResultsResponse>('/match/results'),
};
