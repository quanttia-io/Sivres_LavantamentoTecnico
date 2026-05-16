interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className = '', style }: SkeletonProps) {
  return <div className={`skeleton ${className}`} style={style} />;
}

export function SkeletonCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="card flex items-center gap-4">
      {children}
    </div>
  );
}
