import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function LoadingSpinner({ text, size = 'md', className }: LoadingSpinnerProps) {
  const sizeMap = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-8 w-8',
  };

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <motion.div
        className={cn('border-2 border-muted-foreground/20 border-t-foreground rounded-full', sizeMap[size])}
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      />
      {text && (
        <p className="text-sm text-muted-foreground">{text}</p>
      )}
    </div>
  );
}
