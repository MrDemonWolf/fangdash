"use client";

interface CountdownOverlayProps {
  seconds: number;
}

export function CountdownOverlay({ seconds }: CountdownOverlayProps) {
  const display = seconds === 0 ? "GO!" : String(seconds);

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm" aria-live="assertive">
      <span
        key={display}
        className={`animate-ping-once text-8xl font-black tracking-tighter drop-shadow-[0_0_40px_rgba(15,172,237,0.6)] ${seconds === 0 ? "text-[#0FACED]" : "text-white"}`}
        style={{
          animation: "countdownPop 0.6s ease-out forwards",
        }}
      >
        {display}
      </span>

      <style jsx>{`
        @keyframes countdownPop {
          0% {
            transform: scale(2);
            opacity: 0;
          }
          40% {
            transform: scale(0.95);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
