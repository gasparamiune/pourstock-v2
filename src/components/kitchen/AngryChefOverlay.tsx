import { useEffect, useState } from 'react';

interface Props {
  visible: boolean;
  onComplete: () => void;
}

export function AngryChefOverlay({ visible, onComplete }: Props) {
  const [phase, setPhase] = useState<'idle' | 'animate' | 'fade'>('idle');

  useEffect(() => {
    if (!visible) { setPhase('idle'); return; }
    setPhase('animate');
    const t1 = setTimeout(() => setPhase('fade'), 800);
    const t2 = setTimeout(() => { setPhase('idle'); onComplete(); }, 1100);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [visible, onComplete]);

  if (phase === 'idle') return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center pointer-events-none"
      style={{
        background: phase === 'fade' ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,0.6)',
        transition: 'background 0.3s ease-out',
      }}
    >
      <div
        className="flex flex-col items-center gap-2"
        style={{
          animation: phase === 'animate'
            ? 'chefSlam 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
            : 'chefFadeOut 0.3s ease-out forwards',
        }}
      >
        {/* Anger marks */}
        <div className="relative">
          <span
            className="absolute -top-4 -right-6 text-3xl"
            style={{ animation: 'angerPop 0.3s ease-out 0.1s both' }}
          >
            💢
          </span>
          <span
            className="absolute -top-2 -left-8 text-2xl"
            style={{ animation: 'angerPop 0.3s ease-out 0.25s both' }}
          >
            💢
          </span>
          {/* Chef */}
          <span
            className="text-[80px] block"
            style={{ animation: 'chefShake 0.4s ease-in-out 0.15s' }}
          >
            👨‍🍳
          </span>
        </div>
        {/* Ticket flying away */}
        <div
          className="bg-[#FFFEF5] border border-black/20 rounded px-4 py-2 font-mono text-sm text-black shadow-lg"
          style={{ animation: 'ticketFly 0.6s ease-in 0.3s forwards' }}
        >
          🎫 WTF?!
        </div>
      </div>

      <style>{`
        @keyframes chefSlam {
          0% { transform: scale(0) rotate(-10deg); opacity: 0; }
          60% { transform: scale(1.3) rotate(5deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes chefFadeOut {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(0.8); opacity: 0; }
        }
        @keyframes chefShake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-8px) rotate(-3deg); }
          30% { transform: translateX(8px) rotate(3deg); }
          45% { transform: translateX(-6px) rotate(-2deg); }
          60% { transform: translateX(6px) rotate(2deg); }
          75% { transform: translateX(-3px); }
        }
        @keyframes angerPop {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.4); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes ticketFly {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(80px) rotate(25deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
