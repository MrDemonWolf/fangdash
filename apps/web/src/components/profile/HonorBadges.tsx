import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface HonorBadge {
	icon: string;
	name: string;
	description: string;
	unlocked: boolean;
}

export function HonorBadges({
	badges,
	unlockedCount,
	totalCount,
}: {
	badges: HonorBadge[];
	unlockedCount: number;
	totalCount: number;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Honor Badges</CardTitle>
				<span className="font-mono text-xs text-primary">
					{unlockedCount} / {totalCount}
				</span>
			</CardHeader>
			<CardContent>
				<TooltipProvider delayDuration={200}>
					<div className="flex flex-wrap gap-3">
						{badges.map((badge, i) => (
							<Tooltip key={i}>
								<TooltipTrigger asChild>
									<div
										tabIndex={0}
										className={cn(
											"flex size-12 items-center justify-center rounded-full border-2 transition-all cursor-default",
											badge.unlocked
												? "border-primary/40 bg-primary/10 shadow-[0_0_12px_rgba(15,172,237,0.2)]"
												: "border-border bg-muted/50 grayscale opacity-40",
										)}
									>
										<span className="text-2xl" role="img" aria-label={badge.name}>
											{badge.unlocked ? badge.icon : "🔒"}
										</span>
									</div>
								</TooltipTrigger>
								<TooltipContent>
									<p className="font-semibold">{badge.name}</p>
									<p className="text-muted-foreground">{badge.description}</p>
								</TooltipContent>
							</Tooltip>
						))}
					</div>
				</TooltipProvider>
			</CardContent>
		</Card>
	);
}
