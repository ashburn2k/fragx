import { Star } from 'lucide-react';

interface ReputationScoreProps {
  score: number;
  totalReviews: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function ReputationScore({ score, totalReviews, size = 'md' }: ReputationScoreProps) {
  const stars = Math.round(score);
  const sizeClasses = {
    sm: { star: 12, text: 'text-xs', gap: 'gap-0.5' },
    md: { star: 14, text: 'text-sm', gap: 'gap-1' },
    lg: { star: 18, text: 'text-base', gap: 'gap-1' },
  };
  const s = sizeClasses[size];

  return (
    <div className={`flex items-center ${s.gap}`}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={s.star}
            className={i <= stars ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'}
          />
        ))}
      </div>
      <span className={`${s.text} text-slate-500 dark:text-slate-400`}>
        {score.toFixed(1)} ({totalReviews})
      </span>
    </div>
  );
}
