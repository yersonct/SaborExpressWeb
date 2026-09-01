"use client";

import { useState } from "react";
import { authService, RateLimitError } from "../services/auth.service";

export function useForgotPassword(onSuccess: (msg: string) => void) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [email, setEmailState] = useState("");
  const [code, setCodeState] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPasswordState] = useState("");
  const [confirmPassword, setConfirmPasswordState] = useState("");

  const setEmail = (value: string) => {
    setEmailState(value);
    setError("");
  };

  const setCode = (value: string) => {
    setCodeState(value);
    setError("");
  };

  const setNewPassword = (value: string) => {
    setNewPasswordState(value);
    setError("");
  };

  const setConfirmPassword = (value: string) => {
    setConfirmPasswordState(value);
    setError("");
  };

const handleSendCode = async () => {
  if (!email) {
    setError("Ingresa un correo electrónico");
    return;
  }

  setError("");
  setLoading(true);

  try {
    await authService.requestPasswordReset(email);
    setStep(2);
  } catch (requestError) {
    if (requestError instanceof RateLimitError) {
      setError(requestError.message);
    } else {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo enviar el código",
      );
    }
  } finally {
    setLoading(false);
  }
};

  const handleVerifyCode = async () => {
    if (!code) {
      setError("Ingresa el código");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const token = await authService.verifyPasswordResetCode(email, code);
      setResetToken(token);
      setStep(3);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Código incorrecto. Por favor, intenta de nuevo.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError("Completa ambos campos de contraseña");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await authService.resetPassword(resetToken, newPassword, confirmPassword);
      onSuccess("Contraseña actualizada con éxito");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo actualizar la contraseña",
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    step,
    loading,
    error,
    email,
    setEmail,
    code,
    setCode,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    handleSendCode,
    handleVerifyCode,
    handleResetPassword,
  };
}
