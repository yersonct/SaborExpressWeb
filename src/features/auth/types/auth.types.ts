export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UserSession {
  identifier: string;
  roles: string[];
  token: string;
}


 export interface ForgotPasswordFlowProps {
  onNotify: (msg: string, type: "success" | "error") => void;
  onSuccess: (msg: string) => void;
}