import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'quiet';
};

export default function ActionButton({ children, className = '', variant = 'primary', ...buttonProps }: ActionButtonProps) {
  return (
    <button className={`action-button action-button--${variant} ${className}`.trim()} {...buttonProps}>
      {children}
    </button>
  );
}
