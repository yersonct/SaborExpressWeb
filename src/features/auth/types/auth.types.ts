export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UserSession {
  userId: number;
  identifier: string;
  roles: string[];
  employeeId: number | null;
}


 export interface ForgotPasswordFlowProps {
  onSuccess: (msg: string) => void;
}
