export interface User {
  id: string;
  username: string;
  fullName: string;
  role: 'admin' | 'user' | string;
  lastLogin?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
}

export interface ConfigState {
  scriptUrl: string;
  useMockFallback: boolean;
}
