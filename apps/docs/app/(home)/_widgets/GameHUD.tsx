import { assetPath } from "@/lib/site.ts";

// A stylized mock of the in-game view: score/distance HUD, a dashing wolf on a
// scrolling ground line, drifting obstacles, and speed streaks. Pure CSS motion
// (scoped keyframes below), reduced-motion safe. Decorative — aria-hidden.
export function GameHUD() {
	return (
		<div
			className="fd-hud fd-glass relative w-full overflow-hidden"
			style={{ aspectRatio: "16 / 10", maxWidth: 560, borderRadius: "1.25rem" }}
			role="img"
			aria-label="A mock of FangDash in play: a wolf dashing past obstacles with a live score and distance readout."
		>
			<style>{`
				.fd-hud { background: linear-gradient(180deg,#0a1733 0%,#060d1f 78%,#0b1e3f 100%); }
				.fd-hud-star { position:absolute; width:2px; height:2px; border-radius:2px; background:#38bdf8; opacity:.5; }
				.fd-hud-ground { position:absolute; left:0; right:0; bottom:16%; height:2px;
					background:linear-gradient(90deg,transparent,#0faced,transparent); opacity:.6; }
				.fd-hud-wolf { position:absolute; left:14%; bottom:16%; width:20%; max-width:96px; animation:fd-bob 1s ease-in-out infinite; }
				.fd-hud-ob { position:absolute; bottom:16%; width:22px; height:34px; border-radius:5px;
					background:linear-gradient(180deg,#a855f7,#6d28d9); box-shadow:0 0 16px rgba(168,85,247,.5);
					animation:fd-scroll 2.4s linear infinite; }
				.fd-hud-ob.b { height:24px; background:linear-gradient(180deg,#fb923c,#c2410c); box-shadow:0 0 16px rgba(251,146,60,.45); animation-delay:1.1s; }
				.fd-hud-streak { position:absolute; height:2px; border-radius:2px;
					background:linear-gradient(90deg,transparent,#0faced); animation:fd-scroll 1.1s linear infinite; opacity:.55; }
				@keyframes fd-bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
				@keyframes fd-scroll { from{transform:translateX(560px)} to{transform:translateX(-60px)} }
				@media (prefers-reduced-motion: reduce){
					.fd-hud-wolf,.fd-hud-ob,.fd-hud-streak{animation:none!important}
				}
			`}</style>

			{/* parallax stars */}
			<span className="fd-hud-star" style={{ top: "18%", left: "22%" }} />
			<span className="fd-hud-star" style={{ top: "30%", left: "68%" }} />
			<span className="fd-hud-star" style={{ top: "12%", left: "82%" }} />
			<span className="fd-hud-star" style={{ top: "44%", left: "40%" }} />

			{/* speed streaks */}
			<span className="fd-hud-streak" style={{ top: "38%", width: 120 }} />
			<span className="fd-hud-streak" style={{ top: "52%", width: 80, animationDelay: "0.5s" }} />

			{/* HUD readout */}
			<div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 py-3">
				<div className="flex flex-col">
					<span className="fd-mono text-[0.6rem] tracking-widest" style={{ color: "var(--txt-2)" }}>
						SCORE
					</span>
					<span className="fd-mono text-lg font-bold tabular-nums" style={{ color: "var(--gold)" }}>
						14,820
					</span>
				</div>
				<span
					className="fd-mono rounded-md px-2 py-1 text-[0.6rem] font-semibold"
					style={{ background: "color-mix(in srgb, #f97316 22%, transparent)", color: "#fb923c" }}
				>
					HARD
				</span>
				<div className="flex flex-col items-end">
					<span className="fd-mono text-[0.6rem] tracking-widest" style={{ color: "var(--txt-2)" }}>
						DISTANCE
					</span>
					<span
						className="fd-mono text-lg font-bold tabular-nums"
						style={{ color: "var(--brand-500)" }}
					>
						2,140m
					</span>
				</div>
			</div>

			{/* ground + obstacles + wolf */}
			<div className="fd-hud-ground" />
			<span className="fd-hud-ob" style={{ right: 0 }} />
			<span className="fd-hud-ob b" style={{ right: 0 }} />
			{}
			<img
				className="fd-hud-wolf"
				src={assetPath("/wolves/wolf-gray.png")}
				alt=""
				aria-hidden="true"
			/>
		</div>
	);
}
