import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');

  useEffect(() => {
    // Logo aparece → espera → some
    const t1 = setTimeout(() => setPhase('hold'), 800);
    const t2 = setTimeout(() => setPhase('exit'), 2200);
    const t3 = setTimeout(onFinish, 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onFinish]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#000000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        opacity: phase === 'exit' ? 0 : 1,
        transition: phase === 'exit' ? 'opacity 0.6s ease-out' : 'none',
      }}
    >
      {/* Glow de fundo */}
      <div
        style={{
          position: 'absolute',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,29,255,0.25) 0%, rgba(0,0,0,0) 70%)',
          opacity: phase === 'enter' ? 0 : 1,
          transform: phase === 'enter' ? 'scale(0.5)' : 'scale(1)',
          transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
        }}
      />

      {/* Logo */}
      <div
        style={{
          opacity: phase === 'enter' ? 0 : 1,
          transform: phase === 'enter' ? 'scale(0.6) translateY(20px)' : 'scale(1) translateY(0)',
          transition: 'opacity 0.7s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)',
          position: 'relative',
        }}
      >
        <img
          src="/logo/logox.png"
          alt="Reybraz Tech"
          style={{
            width: '140px',
            height: '140px',
            objectFit: 'contain',
            filter: 'drop-shadow(0 0 30px rgba(99, 29, 255, 0.6)) drop-shadow(0 0 60px rgba(6, 182, 212, 0.3))',
          }}
        />

        {/* Anel pulsante */}
        <div
          style={{
            position: 'absolute',
            inset: '-20px',
            borderRadius: '50%',
            border: '1px solid rgba(99,29,255,0.4)',
            animation: phase === 'hold' ? 'pulse-ring 1.2s ease-out infinite' : 'none',
          }}
        />
      </div>

      {/* Nome do app */}
      <div
        style={{
          marginTop: '28px',
          opacity: phase === 'enter' ? 0 : 1,
          transform: phase === 'enter' ? 'translateY(10px)' : 'translateY(0)',
          transition: 'opacity 0.7s ease-out 0.2s, transform 0.7s ease-out 0.2s',
          textAlign: 'center',
        }}
      >
        <span
          style={{
            fontFamily: 'Outfit, sans-serif',
            fontSize: '22px',
            fontWeight: 600,
            letterSpacing: '0.05em',
            background: 'linear-gradient(135deg, #06b6d4 0%, #a855f7 50%, #ec4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Reybraz Tech
        </span>
      </div>

      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
