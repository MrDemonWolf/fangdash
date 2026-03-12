"use client";

import { useCallback, useState } from "react";

interface OnboardingOverlayProps {
	onComplete: () => void;
}

const STEPS = [
	{
		title: "Jump!",
		description:
			"Press SPACE or tap the screen to jump. You can double jump too!",
		icon: (
			// biome-ignore lint/a11y/noSvgWithoutTitle: decorative icon
			<svg
				className="mx-auto mb-4 h-16 w-16 animate-bounce text-[#0FACED]"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<path d="M12 19V5" />
				<path d="M5 12l7-7 7 7" />
			</svg>
		),
	},
	{
		title: "Dodge!",
		description: "Dodge rocks, logs, and spikes. Hit one and it's game over!",
		icon: (
			// biome-ignore lint/a11y/noSvgWithoutTitle: decorative icon
			<svg
				className="mx-auto mb-4 h-16 w-16 text-[#0FACED]"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
				<line x1="12" y1="9" x2="12" y2="13" />
				<line x1="12" y1="17" x2="12.01" y2="17" />
			</svg>
		),
	},
	{
		title: "Run far!",
		description:
			"The longer you survive, the higher your score. Good luck, wolf!",
		icon: (
			// biome-ignore lint/a11y/noSvgWithoutTitle: decorative icon
			<svg
				className="mx-auto mb-4 h-16 w-16 text-[#0FACED]"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
			</svg>
		),
	},
] as const;

// biome-ignore lint/style/noDefaultExport: required by Next.js
export default function OnboardingOverlay({
	onComplete,
}: OnboardingOverlayProps) {
	const [currentStep, setCurrentStep] = useState(0);
	const [isTransitioning, setIsTransitioning] = useState(false);

	const isLastStep = currentStep === STEPS.length - 1;

	const goNext = useCallback(() => {
		if (isLastStep) {
			onComplete();
			return;
		}
		setIsTransitioning(true);
		setTimeout(() => {
			setCurrentStep((prev) => prev + 1);
			setIsTransitioning(false);
		}, 200);
	}, [isLastStep, onComplete]);

	const step = STEPS[currentStep];

	return (
		<div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70">
			<div
				className={`mx-4 w-full max-w-md rounded-2xl border border-[#0FACED]/20 bg-[#091533]/95 p-8 text-center shadow-2xl transition-opacity duration-200 ${
					isTransitioning ? "opacity-0" : "opacity-100"
				}`}
			>
				{/* Step icon */}
				{step.icon}

				{/* Title */}
				<h2 className="mb-3 text-3xl font-bold tracking-wide text-white">
					{step.title}
				</h2>

				{/* Description */}
				<p className="mb-8 text-lg leading-relaxed text-white/70">
					{step.description}
				</p>

				{/* Step indicators */}
				<div className="mb-6 flex items-center justify-center gap-2">
					{STEPS.map((_, i) => (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: static placeholder list
							key={i}
							className={`h-2 rounded-full transition-all duration-300 ${
								i === currentStep
									? "w-6 bg-[#0FACED]"
									: i < currentStep
										? "w-2 bg-[#0FACED]/50"
										: "w-2 bg-white/20"
							}`}
						/>
					))}
				</div>

				{/* Buttons */}
				<div className="flex flex-col items-center gap-3">
					<button
						type="button"
						onClick={goNext}
						className="w-full rounded-lg bg-[#0FACED] px-8 py-3 font-bold uppercase tracking-wider text-[#091533] transition-colors hover:bg-[#0FACED]/80"
					>
						{isLastStep ? "Let's Go!" : "Next"}
					</button>

					{!isLastStep && (
						<button
							type="button"
							onClick={onComplete}
							className="text-sm text-white/40 transition-colors hover:text-white/70"
						>
							Skip
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
