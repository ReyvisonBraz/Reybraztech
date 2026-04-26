import { motion } from 'motion/react';

export const Skeleton = ({ className = '' }: { className?: string }) => (
  <motion.div
    className={`bg-slate-700/50 rounded-xl animate-pulse ${className}`}
    initial={{ opacity: 0.5 }}
    animate={{ opacity: [0.5, 1, 0.5] }}
    transition={{ duration: 1.5, repeat: Infinity }}
  />
);

export const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="flex gap-4">
      <Skeleton className="h-12 flex-1" />
      <Skeleton className="h-12 flex-1" />
    </div>
    <Skeleton className="h-48" />
    <Skeleton className="h-32" />
  </div>
);