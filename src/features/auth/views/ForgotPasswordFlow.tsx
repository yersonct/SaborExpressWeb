'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { authService } from '../hooks/use-auth';

const MOCK_REGISTERED_EMAILS = [
    'yersonstivencuellarrubiano@gmail.com',
    'admin@saborexpress.com',
    'cajero@saborexpress.com',
    'usuario@saborexpress.com'
];
const MOCK_VALID_CODE = '123456';

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
    setNewPassword: (value: string) => void;
    onNext: () => Promise<void>;
    loading: boolean;
    error: string;
}

const StepProgress = ({ currentStep }: { currentStep: number }) => (
    <div className="flex justify-center items-center gap-2 mb-8 animate-in fade-in duration-700">
        {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full transition-all duration-500 ${step === currentStep
                        ? 'bg-[#EA1D2C] scale-125 shadow-[0_0_12px_rgba(234,29,44,0.6)]'
                        : step < currentStep
                            ? 'bg-[#10B981]' // Color verde si ya pasó este paso
                            : 'bg-gray-200'
                    }`} />
                {step < 3 && (
                    <div className={`h-1 w-8 rounded-full transition-all duration-500 ${step < currentStep ? 'bg-[#10B981]' : 'bg-gray-200'
                        }`} />
                )}
            </div>
        ))}
    </div>
);

const Step1Email = ({ email, setEmail, onNext, loading, error }: Step1EmailProps) => {
    const { t } = useTranslation();
    return (
        <div className="space-y-5 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-6">
                <h2 className="text-3xl font-extrabold text-[#111827] tracking-tight">{t('forgot.step1_title', 'Recuperar Contraseña')}</h2>
                <p className="text-sm text-gray-500 mt-3">{t('forgot.step1_desc', 'Ingresa tu correo para recibir un código.')}</p>
            </div>

            <div className="relative group">
                <Input
                    label={t('login.email')}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={error}
                    className="border-[#E5E7EB] bg-white h-14 text-lg focus:ring-[#EA1D2C] focus:border-[#EA1D2C] transition-all duration-300 group-hover:shadow-md"
                    required
                />
            </div>

            <div className="flex flex-col gap-3 mt-8">
                <Button onClick={onNext} isLoading={loading} className="bg-[#EA1D2C] hover:bg-[#d11a28] text-white font-bold h-14 text-[1rem] rounded-2xl w-full transition-all duration-300 shadow-[0_8px_20px_-6px_rgba(234,29,44,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(234,29,44,0.7)] hover:-translate-y-1 active:scale-[0.98]">
                    {t('forgot.send_code', 'Enviar Código')}
                </Button>
            </div>
        </div>
    );
};

const Step2Code = ({ code, setCode, onNext, loading, error }: Step2CodeProps) => {
    const { t } = useTranslation();
    return (
        <div className="space-y-5 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-6">
                <h2 className="text-3xl font-extrabold text-[#111827] tracking-tight">{t('forgot.step2_title', 'Ingresa el Código')}</h2>
                <p className="text-sm text-gray-500 mt-3">{t('forgot.step2_desc', 'Revisa tu bandeja de entrada.')}</p>
            </div>

            <div className="relative group">
                <Input
                    label={t('forgot.code', 'Código de 6 dígitos')}
                    type="text"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    error={error}
                    className="border-[#E5E7EB] bg-white h-14 text-center font-mono text-2xl tracking-[0.5em] focus:ring-[#EA1D2C] focus:border-[#EA1D2C] transition-all duration-300 group-hover:shadow-md uppercase"
                    required
                />
            </div>

            <div className="flex flex-col gap-3 mt-8">
                <Button onClick={onNext} isLoading={loading} className="bg-[#EA1D2C] hover:bg-[#d11a28] text-white font-bold h-14 text-[1rem] rounded-2xl w-full transition-all duration-300 shadow-[0_8px_20px_-6px_rgba(234,29,44,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(234,29,44,0.7)] hover:-translate-y-1 active:scale-[0.98]">
                    {t('forgot.verify', 'Verificar Código')}
                </Button>
            </div>
        </div>
    );
};

const Step3Reset = ({ newPassword, setNewPassword, onNext, loading, error }: Step3ResetProps) => {
    const { t } = useTranslation();
    return (
        <div className="space-y-5 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-6">
                <h2 className="text-3xl font-extrabold text-[#111827] tracking-tight">{t('forgot.step3_title', 'Nueva Contraseña')}</h2>
                <p className="text-sm text-gray-500 mt-3">{t('forgot.step3_desc', 'Crea tu nueva contraseña segura.')}</p>
            </div>

            <div className="relative group">
                <Input
                    label={t('forgot.new_password', 'Nueva Contraseña')}
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    error={error}
                    className="border-[#E5E7EB] bg-white h-14 text-lg focus:ring-[#EA1D2C] focus:border-[#EA1D2C] transition-all duration-300 group-hover:shadow-md"
                    required
                />
            </div>

            <div className="flex flex-col gap-3 mt-8">
                <Button onClick={onNext} isLoading={loading} className="bg-[#EA1D2C] hover:bg-[#d11a28] text-white font-bold h-14 text-[1rem] rounded-2xl w-full transition-all duration-300 shadow-[0_8px_20px_-6px_rgba(234,29,44,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(234,29,44,0.7)] hover:-translate-y-1 active:scale-[0.98]">
                    {t('forgot.save', 'Guardar Contraseña')}
                </Button>
            </div>
        </div>
    );
};

export const ForgotPasswordFlow = ({ 
    onSuccess, 
    onNotify 
}: { 
    onSuccess: (msg: string) => void,
    onNotify: (msg: string, type: 'success' | 'error') => void 
}) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const handleSendCode = async () => {
        if(!email) {
            setError('Ingresa un correo electrónico');
            return;
        }

        if (!MOCK_REGISTERED_EMAILS.includes(email.toLowerCase())) {
            setError('Este correo no está registrado en el sistema.');
            return; 
        }

        setError('');
        setLoading(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        
            
            onNotify(`Código ${MOCK_VALID_CODE} enviado (Simulación)`, 'success');
            setStep(2);
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : 'No se pudo enviar el código');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        if(!code) {
            setError('Ingresa el código');
            return;
        }

        if (code !== MOCK_VALID_CODE) {
            setError('Código incorrecto. Por favor, intenta de nuevo.');
            return;
        }

        setError('');
        setLoading(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            onNotify('Código verificado', 'success');
            setStep(3);
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : 'No se pudo verificar el código');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if(!newPassword) {
            setError('Ingresa una nueva contraseña');
            return;
        }
        setError('');
        setLoading(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            onSuccess('Contraseña actualizada con éxito');
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : 'No se pudo actualizar la contraseña');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full mt-2">
            <StepProgress currentStep={step} />
            {step === 1 && <Step1Email email={email} setEmail={(value) => { setEmail(value); setError(''); }} onNext={handleSendCode} loading={loading} error={error} />}
            {step === 2 && <Step2Code code={code} setCode={(value) => { setCode(value); setError(''); }} onNext={handleVerifyCode} loading={loading} error={error} />}
            {step === 3 && <Step3Reset newPassword={newPassword} setNewPassword={(value) => { setNewPassword(value); setError(''); }} onNext={handleResetPassword} loading={loading} error={error} />}
        </div>
    );
};