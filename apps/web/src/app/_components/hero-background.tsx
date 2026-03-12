export function HeroBackground() {
	return (
		<div
			className="pointer-events-none absolute inset-0 overflow-hidden"
			aria-hidden="true"
		>
			{/* Sky layer — slowest */}
			<div
				className="absolute inset-0 animate-scroll-slow bg-repeat-x"
				style={{
					backgroundImage: "url(/backgrounds/bg-sky.png)",
					backgroundSize: "800px 100%",
					imageRendering: "pixelated",
				}}
			/>
			{/* Hills layer — medium */}
			<div
				className="absolute inset-0 animate-scroll-medium bg-repeat-x"
				style={{
					backgroundImage: "url(/backgrounds/bg-hills.png)",
					backgroundSize: "1600px 100%",
					imageRendering: "pixelated",
				}}
			/>
			{/* Trees layer — fastest */}
			<div
				className="absolute inset-0 animate-scroll-fast bg-repeat-x"
				style={{
					backgroundImage: "url(/backgrounds/bg-trees.png)",
					backgroundSize: "1600px 100%",
					imageRendering: "pixelated",
				}}
			/>
			{/* Gradient overlay for text readability */}
			<div className="absolute inset-0 bg-gradient-to-b from-[#091533]/70 via-[#091533]/60 to-[#091533]/90" />
			{/* Top fade — blends into navbar */}
			<div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#091533] to-transparent backdrop-blur-sm [mask-image:linear-gradient(to_bottom,black_50%,transparent)]" />
		</div>
	);
}
