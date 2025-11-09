import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ClassInfoFrameProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export const ClassInfoFrame = ({ children, className, onClick }: ClassInfoFrameProps) => {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={cn(
        'w-full text-center bg-accent rounded-lg px-4 py-3 transition-smooth border-2 border-accent shadow-soft',
        onClick && 'hover:opacity-90 cursor-pointer',
        className
      )}
    >
      {children}
    </Component>
  );
};
