export function HeroBackground() {
	return (
		<div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
			{/* Sky layer — slowest */}
			<div
				className="absolute inset-0 animate-scroll-slow bg-repeat-x opacity-50"
				style={{
					backgroundImage: "url(/backgrounds/bg-sky.png)",
					backgroundSize: "800px 100%",
					imageRendering: "pixelated",
				}}
			/>
			{/* Hills layer — medium */}
			<div
				className="absolute inset-0 animate-scroll-medium bg-repeat-x opacity-40"
				style={{
					backgroundImage: "url(/backgrounds/bg-hills.png)",
					backgroundSize: "1600px 100%",
					imageRendering: "pixelated",
				}}
			/>
			{/* Trees layer — fastest */}
			<div
				className="absolute inset-0 animate-scroll-fast bg-repeat-x opacity-30"
				style={{
					backgroundImage: "url(/backgrounds/bg-trees.png)",
					backgroundSize: "1600px 100%",
					imageRendering: "pixelated",
				}}
			/>
			{/* Radial cyan glow — emanates from center-bottom */}
			<div
				className="absolute inset-0"
				style={{
					background:
						"radial-gradient(ellipse 60% 50% at 50% 80%, oklch(0.72 0.15 210 / 0.06) 0%, transparent 70%)",
				}}
			/>
			{/* Heavy gradient overlay for depth and readability */}
			<div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/75 to-background" />
			{/* Top fade — blends into navbar */}
			<div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background to-transparent" />
		</div>
	);
}
