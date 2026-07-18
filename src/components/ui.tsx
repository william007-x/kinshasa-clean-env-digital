import { type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { classNames } from '../lib/utils';

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={classNames('animate-spin', className)} />;
}

export function LoadingState({ message = 'Chargement…' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-forest-600">
      <Spinner className="h-8 w-8 mb-3" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="mb-4 text-forest-300">{icon}</div>}
      <h3 className="font-display text-lg font-semibold text-forest-800">{title}</h3>
      {description && <p className="mt-1.5 max-w-md text-sm text-forest-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={classNames('card', className)}>{children}</div>;
}

export function StatCard({ label, value, icon, trend, color = 'forest' }: { label: string; value: string | number; icon: ReactNode; trend?: { value: string; up: boolean }; color?: 'forest' | 'earth' | 'river' | 'amber' | 'red' }) {
  const colorMap = {
    forest: 'bg-forest-100 text-forest-700',
    earth: 'bg-earth-100 text-earth-700',
    river: 'bg-river-100 text-river-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700',
  };
  return (
    <Card className="p-5 animate-fade-in-up">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-forest-500">{label}</p>
          <p className="stat-value mt-1">{value}</p>
        </div>
        <div className={classNames('flex h-11 w-11 items-center justify-center rounded-xl', colorMap[color])}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          <span className={trend.up ? 'text-forest-600 font-semibold' : 'text-red-500 font-semibold'}>
            {trend.up ? '↑' : '↓'} {trend.value}
          </span>
          <span className="text-forest-400">vs. mois dernier</span>
        </div>
      )}
    </Card>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-bold text-forest-900 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-forest-500">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }: { open: boolean; onClose: () => void; title: string; children: ReactNode; maxWidth?: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-forest-950/40 backdrop-blur-sm" />
      <div className={classNames('relative w-full rounded-2xl bg-[#f7f6f1] shadow-2xl animate-scale-in', maxWidth)} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-sand-200 px-6 py-4">
          <h2 className="font-display text-lg font-semibold text-forest-900">{title}</h2>
          <button onClick={onClose} className="text-forest-400 hover:text-forest-700 text-xl leading-none">×</button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export function ProgressBar({ value, max = 100, color = 'forest' }: { value: number; max?: number; color?: 'forest' | 'earth' | 'amber' | 'red' }) {
  const pct = Math.min(100, (value / max) * 100);
  const colorMap = {
    forest: 'bg-forest-500',
    earth: 'bg-earth-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
  };
  return (
    <div className="h-2 w-full rounded-full bg-sand-200 overflow-hidden">
      <div className={classNames('h-full rounded-full transition-all duration-500', colorMap[color])} style={{ width: `${pct}%` }} />
    </div>
  );
}
