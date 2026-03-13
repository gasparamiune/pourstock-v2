import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface ElapsedTimerProps {
  startTime: string;
  className?: string;
}

export function ElapsedTimer({ startTime, className }: ElapsedTimerProps) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const update = () => {
      const diff = Date.now() - new Date(startTime).getTime();
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setElapsed(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <span className={className || "text-xs flex items-center gap-0.5 font-mono"}>
      <Clock className="h-3 w-3" />
      {elapsed}
    </span>
  );
}
