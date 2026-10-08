export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UserSession {
  userId: number;
  identifier: string;
  roles: string[];
  token: string;
  refreshToken: string;
}


 export interface ForgotPasswordFlowProps {
  onNotify: (msg: string, type: "success" | "error") => void;
  onSuccess: (msg: string) => void;
}