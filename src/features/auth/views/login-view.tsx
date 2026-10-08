'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '@/components/ui/language-selector';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { NotificationModal } from '@/components/ui/modal';
import { useAuth } from "../hooks/use-auth";
import { useRouter } from 'next/navigation';
import logo from '@/assets/img/logo.png';
import i18n from '@/config/i18n';
import { ROUTES } from '@/config/routes';

import { ForgotPasswordFlow } from './ForgotPasswordFlow'; 
import { authService } from '../services/auth.service';

export default function LoginView() {
  // SOLUCIÓN 1: Estado para evitar el error de hidratación
  const [mounted, setMounted] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [activeView, setActiveView] = useState<'login' | 'forgot'>('login');
  
  const { login } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const logos: Record<string, any> = {
    es: logo,
  };

  const currentLang = i18n.resolvedLanguage?.split('-')[0] || 'es';
  const activeLogo = logos[currentLang] || logo;
  const [modal, setModal] = useState({
    isOpen: false,
    message: '',
    type: 'success' as 'success' | 'error',
  });

  // SOLUCIÓN 1: Esperar a que el componente se monte en el cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  const ALLOWED_WEB_ROLES = ["GERENTE", "ADMINISTRADOR"];

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const session = await authService.login({ email, password });

      const tieneAccesoWeb = session.roles.some((r) =>
        ALLOWED_WEB_ROLES.includes(r),
      );

      if (!tieneAccesoWeb) {
        setModal({
          isOpen: true,
          message:
            "Esta cuenta no tiene acceso al panel web. Usa la app móvil de SaborExpress.",
          type: "error",
        });
        setLoading(false);
        return;
      }

      login(session);
      setModal({ isOpen: true, message: t("login.success"), type: "success" });
      setTimeout(() => {
        router.push(ROUTES.dashboard);
      }, 2000);
    } catch (error: any) {
      console.error(
        "LOGIN ERROR:",
        error?.response?.status,
        error?.response?.data,
        error?.message,
      );
      setModal({
        isOpen: true,
        message: error?.message || t("login.error"),
        type: "error",
      });
      setLoading(false);
    }
  };

  // SOLUCIÓN 1: Si no está montado, devolvemos null para no generar HTML discordante
  if (!mounted) {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full bg-[#F3F4F6] overflow-hidden">

      <div className="hidden lg:flex w-[60%] bg-gradient-to-br from-[#081A38] via-[#0F2F6B] to-[#163B80] items-center justify-center relative overflow-hidden transition-all duration-700">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03),transparent_70%)]"></div>
          <div className="absolute top-[-120px] left-[-120px] w-[350px] h-[350px] bg-[#EA1D2C] opacity-20 blur-3xl rounded-full animate-pulse"></div>
          <div className="absolute bottom-[-150px] right-[-100px] w-[400px] h-[400px] bg-[#F59E0B] opacity-10 blur-3xl rounded-full animate-pulse"></div>
          <div className="absolute top-[40%] left-[50%] w-[320px] h-[320px] bg-[#2563EB] opacity-20 blur-[120px] rounded-full"></div>
          <div className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:60px_60px]"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center px-12">
          <div className="relative flex items-center justify-center animate-in fade-in zoom-in duration-1000">
            <div className="absolute w-[420px] h-[420px] bg-[#EA1D2C] opacity-15 blur-[120px] rounded-full"></div>
            {/* SOLUCIÓN 2: w-auto h-auto agregado en el className */}
            <Image
              src={activeLogo}
              alt="SaborExpress"
              width={720}
              height={820}
              priority
              className="relative object-contain w-auto h-auto drop-shadow-[0_0_45px_rgba(234,29,44,0.28)] hover:scale-105 transition-all duration-500"
            />
          </div>
          <div className="mt-8 text-center animate-in fade-in slide-in-from-bottom duration-1000">
            <p className="mt-4 text-gray-300 text-lg tracking-wide max-w-md">
               {t('login.description')}
            </p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[40%] flex items-center justify-center p-8 bg-[#F3F4F6] relative overflow-hidden">

        <div className="absolute top-6 right-6 md:top-8 md:right-8 z-50 w-40">
          <LanguageSelector direction="down" />
        </div>

        <div className="absolute top-[-80px] right-[-80px] w-[250px] h-[250px] bg-[#EA1D2C] opacity-10 blur-3xl rounded-full"></div>
        <div className="absolute bottom-[-120px] left-[-100px] w-[300px] h-[300px] bg-[#F59E0B] opacity-10 blur-3xl rounded-full"></div>

        <div className="relative z-10 w-full max-w-sm bg-white/80 backdrop-blur-2xl rounded-3xl border border-white/40 shadow-[0_20px_60px_rgba(0,0,0,0.12)] p-10 flex flex-col gap-6 animate-in fade-in slide-in-from-right duration-700">
          
          <div className="absolute inset-x-0 top-0 h-[4px] bg-gradient-to-r from-[#EA1D2C] via-[#F59E0B] to-[#EA1D2C] rounded-t-3xl"></div>

          {activeView === 'forgot' && (
            <button 
              type="button"
              onClick={() => setActiveView('login')}
              className="absolute top-6 left-6 text-gray-400 hover:text-[#EA1D2C] transition-all hover:-translate-x-1 duration-300 z-50"
              title="Volver al inicio"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
          )}

          <div className="flex lg:hidden justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-[#EA1D2C] opacity-20 blur-2xl rounded-full"></div>
              {/* SOLUCIÓN 2: w-auto h-auto agregado en el className */}
              <Image
                src={activeLogo}
                alt="SaborExpress"
                width={260}
                height={220}
                className="relative object-contain w-auto h-auto drop-shadow-[0_0_25px_rgba(234,29,44,0.25)]"
              />
            </div>
          </div>

          {activeView === 'login' ? (
            <form onSubmit={onSubmit} className="flex flex-col gap-6 w-full animate-in fade-in zoom-in duration-300">
              <div className="text-center">
                <h1 className="text-5xl font-extrabold leading-tight text-[#111827] uppercase">
                  {t('login.title1')}
                  <br />
                  <span className="text-[#EA1D2C]">
                    {t('login.title2')}
                  </span>
                </h1>
                <p className="text-sm text-gray-500 mt-4 leading-relaxed">
                  {t('login.subtitle')}
                </p>
              </div>

              <div className="space-y-5">
                <Input
                  label={t('login.email')}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-[#E5E7EB] bg-white focus:ring-[#EA1D2C] focus:border-[#EA1D2C] transition-all duration-300"
                  required
                />

                <div className="space-y-1">
                  <Input
                    label={t('login.password')}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-[#E5E7EB] bg-white focus:ring-[#EA1D2C] focus:border-[#EA1D2C] transition-all duration-300"
                    required
                  />
                  <div className="flex justify-end pt-1 ">
                    <button 
                      type="button" 
                      onClick={() => setActiveView('forgot')}
                      className="text-xs text-[#EA1D2C] hover:underline font-medium transition-all"
                    >
                      {t('login.forgot_password', '¿Olvidaste tu contraseña?')}
                    </button>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                isLoading={loading}
                className="bg-[#EA1D2C] hover:bg-[#d11a28] text-white font-bold py-6 rounded-2xl transition-all duration-300 shadow-lg shadow-red-500/20 hover:shadow-red-500/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                {t('login.submit')}
              </Button>
            </form>
          ) : (
            <ForgotPasswordFlow 
              onNotify={(msg, type) => {
                setModal({ isOpen: true, message: msg, type: type });
              }}
              onSuccess={(msg) => {
                setModal({ isOpen: true, message: msg, type: 'success' });
                setActiveView('login');
              }} 
            />
          )}

        </div>
      </div>

      <NotificationModal
        isOpen={modal.isOpen}
        message={modal.message}
        type={modal.type}
        onClose={() => setModal({ ...modal, isOpen: false })}
      />
    </div>
  );
};