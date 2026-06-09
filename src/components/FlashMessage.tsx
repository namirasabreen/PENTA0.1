import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

type FlashMessageProps = {
  message: string;
  type: 'success' | 'error';
  onDismiss: () => void;
};

export default function FlashMessage({ message, type, onDismiss }: FlashMessageProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-slide-in ${
      type === 'success'
        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
        : 'bg-red-50 border-red-200 text-red-800'
    }`}>
      {type === 'success'
        ? <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
        : <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onDismiss} className="ml-auto p-1 rounded-lg hover:bg-black/10 transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

type Flash = { message: string; type: 'success' | 'error'; id: number };

export function useFlash() {
  const [flashes, setFlashes] = useState<Flash[]>([]);

  function showFlash(message: string, type: 'success' | 'error') {
    const id = Date.now();
    setFlashes(f => [...f, { message, type, id }]);
  }

  function dismiss(id: number) {
    setFlashes(f => f.filter(fl => fl.id !== id));
  }

  return { flashes, showFlash, dismiss };
}

export function FlashContainer({ flashes, dismiss }: { flashes: Flash[]; dismiss: (id: number) => void }) {
  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 w-80">
      {flashes.map(fl => (
        <FlashMessage key={fl.id} message={fl.message} type={fl.type} onDismiss={() => dismiss(fl.id)} />
      ))}
    </div>
  );
}
