import React, { useState } from 'react';
import { X, User, Lock, Sparkles, CheckCircle2, AlertCircle, Shield, Trophy } from 'lucide-react';
import { authService, PilotProfile } from '../services/auth.ts';
import { Language, TRANSLATIONS } from '../data/translations.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onSuccess: (user: PilotProfile) => void;
  initialMode?: 'login' | 'register';
  defaultUsername?: string;
  currentCoins?: number;
  currentCosmetics?: any;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  lang,
  onSuccess,
  initialMode = 'login',
  defaultUsername = '',
  currentCoins = 150,
  currentCosmetics,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [username, setUsername] = useState(defaultUsername);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = TRANSLATIONS[lang];

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim()) {
      setError(lang === 'ru' ? 'Введите имя пилота' : 'Please enter callsign');
      return;
    }
    if (password.length < 4) {
      setError(lang === 'ru' ? 'Пароль должен содержать минимум 4 символа' : 'Password must be at least 4 characters');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'register') {
        const user = await authService.register(username.trim(), password, {
          coins: currentCoins,
          equippedCosmetics: currentCosmetics,
        });
        onSuccess(user);
        onClose();
      } else {
        const user = await authService.login(username.trim(), password);
        onSuccess(user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || (lang === 'ru' ? 'Ошибка запроса' : 'Request error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-slate-900 border border-cyan-500/40 rounded-2xl overflow-hidden shadow-[0_0_35px_rgba(6,182,212,0.3)] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-cyan-500/20 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center space-x-2 text-cyan-400 font-orbitron font-bold text-base sm:text-lg">
            <Shield className="w-5 h-5 text-cyan-400" />
            <span>{t.authModalTitle}</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch: Login / Register */}
        <div className="grid grid-cols-2 border-b border-slate-800 bg-slate-950/40 p-1.5 gap-1.5">
          <button
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`py-2 rounded-xl font-orbitron font-bold text-xs uppercase transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.login}
          </button>
          <button
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`py-2 rounded-xl font-orbitron font-bold text-xs uppercase transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.register}
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            {t.authModalDesc}
          </p>

          {error && (
            <div className="bg-rose-950/60 border border-rose-500/60 rounded-xl p-3 flex items-start gap-2 text-xs text-rose-300 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Callsign / Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-orbitron font-bold text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              {t.usernameLabel}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Pilot_Ace_77"
              maxLength={20}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-orbitron font-bold text-slate-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              {t.passwordLabel}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
            />
          </div>

          {/* Highlights */}
          {mode === 'register' && (
            <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 space-y-1.5 text-[11px] text-slate-300">
              <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Начальный баланс: +{Math.max(150, currentCoins)} Монет</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Участие в мировом рейтинге Зала Славы пилотов (1000 RP)</span>
              </div>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-orbitron font-black text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all cursor-pointer active:scale-98 disabled:opacity-50"
          >
            {loading ? 'ЗАГРУЗКА...' : mode === 'register' ? t.registerBtn : t.loginBtn}
          </button>
        </form>
      </div>
    </div>
  );
};
