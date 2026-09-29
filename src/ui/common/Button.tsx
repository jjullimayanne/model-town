import type { ButtonHTMLAttributes } from 'react';

type Variant = 'sun' | 'leaf' | 'berry' | 'coral' | 'ghost' | 'danger';

const styles: Record<Variant, string> = {
  sun: 'bg-sun text-ink-dark hover:brightness-105',
  leaf: 'bg-leaf text-ink-dark hover:brightness-105',
  berry: 'bg-berry text-white hover:brightness-105',
  coral: 'bg-coral text-ink-dark hover:brightness-105',
  danger: 'bg-danger text-ink-dark hover:brightness-105',
  ghost: 'bg-white/90 text-bark hover:bg-cream border border-sky/30',
};

export function Button({
  variant = 'sun', size = 'md', className = '', ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'lg' ? 'px-7 py-3.5 text-xl' : size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-5 py-2.5 text-base';
  return (
    <button
      {...rest}
      className={`chunky font-display font-semibold rounded-2xl transition disabled:opacity-40 disabled:saturate-50 ${sz} ${styles[variant]} ${className}`}
    />
  );
}
