"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { authService, RateLimitError } from "../services/auth.service";

export function useForgotPassword(onSuccess: (msg: string) => void) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

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
    setNewPasswordError("");
    setError("");
  };

  const setConfirmPassword = (value: string) => {
    setConfirmPasswordState(value);
    setConfirmPasswordError("");
    setError("");
  };

const handleSendCode = async () => {
  const normalizedEmail = email.trim();
  if (!normalizedEmail) {
    setError(t("forgot.email_required"));
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    setError(t("forgot.email_invalid"));
    return;
  }

  setError("");
  setLoading(true);

  try {
    await authService.requestPasswordReset(normalizedEmail);
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
    const normalizedCode = code.trim();
    if (!normalizedCode) {
      setError(t("forgot.code_required"));
      return;
    }
    if (!/^\d{6}$/.test(normalizedCode)) {
      setError(t("forgot.code_invalid"));
      return;
    }

    setError("");
    setLoading(true);

    try {
      const token = await authService.verifyPasswordResetCode(email.trim(), normalizedCode);
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
    setError("");
    setNewPasswordError("");
    setConfirmPasswordError("");
    if (!newPassword) {
      setNewPasswordError(t("forgot.password_required"));
      return;
    }
    if (newPassword.length < 8) {
      setNewPasswordError(t("forgot.password_min"));
      return;
    }
    if (!confirmPassword) {
      setConfirmPasswordError(t("forgot.confirm_required"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setConfirmPasswordError(t("forgot.password_mismatch"));
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
    newPasswordError,
    confirmPasswordError,
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
