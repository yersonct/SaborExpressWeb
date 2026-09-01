// Debe reflejar exactamente LoginDto del backend (Identifier, Password).
export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface AuthenticatedUser {
  id: number;
  email: string;
  name: string;
  roles: string[];
}

// Debe reflejar exactamente lo que devuelve AuthMapper.ToAuthResponse en el backend.
export interface LoginResponse {
  token: string;
  user: AuthenticatedUser;
}
