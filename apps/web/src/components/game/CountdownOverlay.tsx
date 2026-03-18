"use client";

interface CountdownOverlayProps {
	seconds: number;
}

export function CountdownOverlay({ seconds }: CountdownOverlayProps) {
	const display = seconds === 0 ? "GO!" : String(seconds);

	return (
		<div
			className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm"
			aria-live="assertive"
		>
			<span
				key={display}
				className={`text-8xl font-black tracking-tighter ${seconds === 0 ? "text-glow-cyan text-primary" : "text-foreground"}`}
				style={{
					animation: "countdownPop 0.6s ease-out forwards",
					filter:
						seconds === 0
							? "drop-shadow(0 0 40px oklch(0.72 0.15 210 / 0.6))"
							: "drop-shadow(0 0 30px rgba(255,255,255,0.3))",
				}}
			>
				{display}
			</span>

			<style jsx={true}>{`
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
