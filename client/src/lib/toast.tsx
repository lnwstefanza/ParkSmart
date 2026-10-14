import { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X, Heart } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'favorite';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

type ToastListener = (toast: ToastMessage) => void;

const listeners: Set<ToastListener> = new Set();

export const showToast = (message: string, type: ToastType = 'success', duration = 2800) => {
  const id = Math.random().toString(36).substring(2, 9);
  const toast: ToastMessage = { id, type, message, duration };
  listeners.forEach(fn => fn(toast));
};

export const toast = {
  success: (msg: string, dur?: number) => showToast(msg, 'success', dur),
  error: (msg: string, dur?: number) => showToast(msg, 'error', dur),
  info: (msg: string, dur?: number) => showToast(msg, 'info', dur),
  favorite: (msg: string, dur?: number) => showToast(msg, 'favorite', dur),
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleNewToast = (t: ToastMessage) => {
      setToasts(prev => [...prev, t]);
      setTimeout(() => {
        setToasts(prev => prev.filter(item => item.id !== t.id));
      }, t.duration || 2800);
    };

    listeners.add(handleNewToast);
    return () => {
      listeners.delete(handleNewToast);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0">
      {toasts.map(t => {
        let borderClass = 'border-slate-200 bg-white/95 text-slate-800 shadow-xl';
        let IconComponent = CheckCircle2;
        let iconColor = 'text-emerald-600';

        if (t.type === 'success') {
          borderClass = 'border-emerald-200 bg-white/95 text-emerald-950 shadow-emerald-500/10 shadow-xl';
          IconComponent = CheckCircle2;
          iconColor = 'text-emerald-600';
        } else if (t.type === 'favorite') {
          borderClass = 'border-rose-200 bg-white/95 text-rose-950 shadow-rose-500/10 shadow-xl';
          IconComponent = Heart;
          iconColor = 'text-rose-500 fill-rose-500';
        } else if (t.type === 'error') {
          borderClass = 'border-rose-200 bg-white/95 text-rose-950 shadow-rose-500/10 shadow-xl';
          IconComponent = AlertCircle;
          iconColor = 'text-rose-600';
        } else if (t.type === 'info') {
          borderClass = 'border-sky-200 bg-white/95 text-sky-950 shadow-sky-500/10 shadow-xl';
          IconComponent = Info;
          iconColor = 'text-sky-600';
        }

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-2xl border backdrop-blur-md transition-all animate-in slide-in-from-bottom-5 duration-200 shadow-lg ${borderClass}`}
          >
            <div className="flex items-center gap-2.5">
              <IconComponent className={`w-5 h-5 shrink-0 ${iconColor}`} />
              <p className="text-xs sm:text-sm font-semibold">{t.message}</p>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100/50 transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
