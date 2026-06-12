  import { LoginCredentials, UserSession } from '../types/auth.types';

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const isValidEmail = (email: string) => /[^\s@]+@[^\s@]+\.[^\s@]+/.test(email.trim());

  const MOCK_RESET_CODE = '123456';

  export const authService = {
    login: async (credentials: LoginCredentials): Promise<UserSession> => {
      await delay(1000);

      if (credentials.email === 'yersonstivencuellarrubiano@gmail.com' && credentials.password === '123456') {
        return {
          id: '1',
          email: credentials.email,
          token: 'fake-jwt-token-123456'
        };
      }

      throw new Error('Credenciales incorrectas');
    },

    requestPasswordReset: async (email: string): Promise<void> => {
      await delay(1000);

      if (!isValidEmail(email)) {
        throw new Error('Ingresa un correo electrónico válido');
      }
    },

    verifyPasswordResetCode: async (email: string, code: string): Promise<void> => {
      await delay(1000);

      if (!isValidEmail(email)) {
        throw new Error('Ingresa un correo electrónico válido');
      }

      if (code.trim() !== MOCK_RESET_CODE) {
        throw new Error('El código ingresado no es válido');
      }
    },

    resetPassword: async (email: string, code: string, newPassword: string): Promise<void> => {
      await delay(1000);

      if (!isValidEmail(email)) {
        throw new Error('Ingresa un correo electrónico válido');
      }

      if (code.trim() !== MOCK_RESET_CODE) {
        throw new Error('El código ingresado no es válido');
      }

      if (newPassword.trim().length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }
    }
  };