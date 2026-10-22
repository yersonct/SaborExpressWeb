import axios from "axios";
import { http } from "@/config/api";
import type { LoginCredentials, UserSession } from "../types/auth.types";

interface LoginApiResponse {
  userId: number;
  roles: string[];
  identifier: string;
  employeeId?: number | null;
}

interface VerifyResetCodeResponse {
  resetToken: string;
}

export class RateLimitError extends Error {
  retryAfterSeconds: number;

  constructor(message: string, retryAfterSeconds: number) {
    super(message);
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

const isValidEmail = (identifier: string) =>
  /[^\s@]+@[^\s@]+\.[^\s@]+/.test(identifier.trim());

export const authService = {
  // ✅ CONECTADO: POST /api/Auth/login
  login: async (credentials: LoginCredentials): Promise<UserSession> => {
    const { data } = await http.post<LoginApiResponse>("/Auth/login", {
      identifier: credentials.email,
      password: credentials.password,
    });

    return {
      userId: data.userId,
      identifier: data.identifier,
      roles: data.roles,
      employeeId: data.employeeId ?? null,
    };
  },

  getCurrentSession: async (): Promise<UserSession> => {
    // Usa el cliente compartido para renovar la cookie de acceso si expiró.
    const { data } = await http.get<LoginApiResponse>("/Auth/session", {
      timeout: 8000,
    });
    return {
      userId: data.userId,
      identifier: data.identifier,
      roles: data.roles,
      employeeId: data.employeeId ?? null,
    };
  },

  logout: async (): Promise<void> => {
    try {
      await axios.post(
        `${http.defaults.baseURL}/Auth/logout`,
        {},
        {
          withCredentials: true,
          headers: { "X-Client-App": "admin-web" },
          timeout: 5000,
        },
      );
    } catch {
      // La sesión local se cierra aunque el servidor no responda.
    }
  },

  changePassword: async (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<void> => {
    await http.post("/Auth/change-password", {
      currentPassword,
      newPassword,
      confirmPassword,
    });
  },

  // ✅ CONECTADO: POST /api/Auth/forgot-password
  // Body: { identifier }
  // ✅ CONECTADO: POST /api/Auth/forgot-password
  // Body: { identifier }
  requestPasswordReset: async (identifier: string): Promise<void> => {
    if (!isValidEmail(identifier)) {
      throw new Error("Ingresa un correo electrónico válido");
    }

    try {
      await http.post("/Auth/forgot-password", {
        identifier: identifier.trim(),
      });
    } catch (err: unknown) {
      const response = axios.isAxiosError<{
        retryAfterSeconds?: number;
        message?: string;
      }>(err)
        ? err.response
        : undefined;
      if (response?.status === 429) {
        const retryAfterSeconds = response.data?.retryAfterSeconds ?? 0;
        throw new RateLimitError(
          response.data?.message ?? "Demasiados intentos. Intenta más tarde.",
          retryAfterSeconds,
        );
      }
      throw err;
    }
  },

  // ✅ CONECTADO: POST /api/Auth/verify-reset-code
  // Body: { identifier, code } → devuelve { resetToken }
  verifyPasswordResetCode: async (
    identifier: string,
    code: string,
  ): Promise<string> => {
    if (!isValidEmail(identifier)) {
      throw new Error("Ingresa un correo electrónico válido");
    }
    if (!code.trim()) {
      throw new Error("Ingresa el código");
    }

    const { data } = await http.post<VerifyResetCodeResponse>(
      "/Auth/verify-reset-code",
      {
        identifier: identifier.trim(),
        code: code.trim(),
      },
    );

    return data.resetToken;
  },

  // ✅ CONECTADO: POST /api/Auth/reset-password
  // Body: { resetToken, newPassword, confirmPassword }
  resetPassword: async (
    resetToken: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<void> => {
    if (newPassword.trim().length < 6) {
      throw new Error("La contraseña debe tener al menos 6 caracteres");
    }
    if (newPassword.trim() !== confirmPassword.trim()) {
      throw new Error("Las contraseñas no coinciden");
    }

    await http.post("/Auth/reset-password", {
      resetToken,
      newPassword: newPassword.trim(),
      confirmPassword: confirmPassword.trim(),
    });
  },
};
