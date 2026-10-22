"use client";

import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { translateCopy } from "@/config/copy-translations";
import { useForgotPassword } from "../hooks/use-forgot-password";
import { ForgotPasswordFlowProps } from "../types/auth.types";
interface Step1EmailProps {
  email: string;
  setEmail: (value: string) => void;
  onNext: () => Promise<void>;
  loading: boolean;
  error: string;
}

interface Step2CodeProps {
  code: string;
  setCode: (value: string) => void;
  onNext: () => Promise<void>;
  loading: boolean;
  error: string;
}

interface Step3ResetProps {
  newPassword: string;
  newPasswordError: string;
  setNewPassword: (value: string) => void;
  confirmPassword: string;
  confirmPasswordError: string;
  setConfirmPassword: (value: string) => void;
  onNext: () => Promise<void>;
  loading: boolean;
  error: string;
}

const StepProgress = ({ currentStep }: { currentStep: number }) => {
  const { t } = useTranslation();

  return (
    <div
      className="flex justify-center items-center gap-2 mb-8 animate-in fade-in duration-700"
      role="progressbar"
      aria-label={t("forgot.progress", { current: currentStep, total: 3 })}
      aria-valuemin={1}
      aria-valuemax={3}
      aria-valuenow={currentStep}
      aria-valuetext={t("forgot.progress", { current: currentStep, total: 3 })}
    >
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex items-center gap-2">
          <div
            className={`h-3 w-3 rounded-full transition-all duration-500 ${
              step === currentStep
                ? "bg-[#EA1D2C] scale-125 ring-2 ring-[#FDA4AF] shadow-[0_0_12px_rgba(234,29,44,0.6)]"
                : step < currentStep
                  ? "bg-[#10B981] border-2 border-[#A7F3D0]"
                  : "bg-[#CBD5E1] border-2 border-[#475569]"
            }`}
            aria-hidden="true"
          />
          {step < 3 && (
            <div
              className={`h-1 w-8 rounded-full transition-all duration-500 ${
                step < currentStep ? "bg-[#10B981]" : "bg-[#94A3B8]"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
};

const Step1Email = ({
  email,
  setEmail,
  onNext,
  loading,
  error,
}: Step1EmailProps) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-5 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-extrabold text-[#111827] tracking-tight">
          {t("forgot.step1_title")}
        </h2>
        <p className="text-sm text-gray-500 mt-3">
          {translateCopy("Solo las cuentas de Gerente y Administrador pueden recuperar su contraseña desde aquí.")}
        </p>
      </div>

      <div className="relative group">
        <Input
          label={t("login.email")}
          type="email"
          autoComplete="email"
          maxLength={254}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error}
          className="border-[#E5E7EB] bg-white h-14 text-lg focus:ring-[#EA1D2C] focus:border-[#EA1D2C] transition-all duration-300 group-hover:shadow-md"
          required
        />
      </div>

      <div className="flex flex-col gap-3 mt-8">
        <Button
          onClick={onNext}
          isLoading={loading}
          className="bg-[#EA1D2C] hover:bg-[#d11a28] text-white font-bold h-14 text-[1rem] rounded-2xl w-full transition-all duration-300 shadow-[0_8px_20px_-6px_rgba(234,29,44,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(234,29,44,0.7)] hover:-translate-y-1 active:scale-[0.98]"
        >
          {t("forgot.send_code")}
        </Button>
      </div>
    </div>
  );
};

const Step2Code = ({
  code,
  setCode,
  onNext,
  loading,
  error,
}: Step2CodeProps) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-5 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-extrabold text-[#111827] tracking-tight">
          {t("forgot.step2_title")}
        </h2>
        <p className="text-sm text-gray-500 mt-3">
          {t("forgot.step2_desc")}
        </p>
      </div>

      <div className="relative group">
        <Input
          label={t("forgot.code")}
          type="text"
          maxLength={6}
          inputMode="numeric"
          pattern="[0-9]{6}"
          autoComplete="one-time-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          error={error}
          className="border-[#E5E7EB] bg-white h-14 text-center font-mono text-2xl tracking-[0.5em] focus:ring-[#EA1D2C] focus:border-[#EA1D2C] transition-all duration-300 group-hover:shadow-md uppercase"
          required
        />
      </div>

      <div className="flex flex-col gap-3 mt-8">
        <Button
          onClick={onNext}
          isLoading={loading}
          className="bg-[#EA1D2C] hover:bg-[#d11a28] text-white font-bold h-14 text-[1rem] rounded-2xl w-full transition-all duration-300 shadow-[0_8px_20px_-6px_rgba(234,29,44,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(234,29,44,0.7)] hover:-translate-y-1 active:scale-[0.98]"
        >
          {t("forgot.verify")}
        </Button>
      </div>
    </div>
  );
};

const Step3Reset = ({
  newPassword,
  newPasswordError,
  setNewPassword,
  confirmPassword,
  confirmPasswordError,
  setConfirmPassword,
  onNext,
  loading,
  error,
}: Step3ResetProps) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-5 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-extrabold text-[#111827] tracking-tight">
          {t("forgot.step3_title")}
        </h2>
        <p className="text-sm text-gray-500 mt-3">
          {t("forgot.step3_desc")}
        </p>
      </div>

      <div className="relative group">
        <Input
          label={t("forgot.new_password")}
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          error={newPasswordError || error}
          className="border-[#E5E7EB] bg-white h-14 text-lg focus:ring-[#EA1D2C] focus:border-[#EA1D2C] transition-all duration-300 group-hover:shadow-md"
          required
        />
      </div>

      <div className="relative group">
        <Input
          label={t("forgot.confirm_password")}
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={confirmPasswordError}
          className="border-[#E5E7EB] bg-white h-14 text-lg focus:ring-[#EA1D2C] focus:border-[#EA1D2C] transition-all duration-300 group-hover:shadow-md"
          required
        />
      </div>

      <div className="flex flex-col gap-3 mt-8">
        <Button
          onClick={onNext}
          isLoading={loading}
          className="bg-[#EA1D2C] hover:bg-[#d11a28] text-white font-bold h-14 text-[1rem] rounded-2xl w-full transition-all duration-300 shadow-[0_8px_20px_-6px_rgba(234,29,44,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(234,29,44,0.7)] hover:-translate-y-1 active:scale-[0.98]"
        >
          {t("forgot.save")}
        </Button>
      </div>
    </div>
  );
};

export const ForgotPasswordFlow = ({
  onSuccess,
}: ForgotPasswordFlowProps) => {
  const {
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
  } = useForgotPassword(onSuccess);

  return (
    <div className="w-full mt-2">
      <StepProgress currentStep={step} />
      {step === 1 && (
        <Step1Email
          email={email}
          setEmail={setEmail}
          onNext={handleSendCode}
          loading={loading}
          error={error}
        />
      )}
      {step === 2 && (
        <Step2Code
          code={code}
          setCode={setCode}
          onNext={handleVerifyCode}
          loading={loading}
          error={error}
        />
      )}
      {step === 3 && (
        <Step3Reset
          newPassword={newPassword}
          newPasswordError={newPasswordError}
          setNewPassword={setNewPassword}
          confirmPassword={confirmPassword}
          confirmPasswordError={confirmPasswordError}
          setConfirmPassword={setConfirmPassword}
          onNext={handleResetPassword}
          loading={loading}
          error={error}
        />
      )}
    </div>
  );
};
