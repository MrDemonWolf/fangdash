import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface ProfileHeaderProps {
	userName: string;
	userImage: string | null | undefined;
	skinSpriteKey: string | null;
	skinName: string | null;
	highScore: number;
	gamesPlayed: number;
}

/** Shared profile banner used by the private (/profile) and public (/profile/[id]) pages. */
export function ProfileHeader({
	userName,
	userImage,
	skinSpriteKey,
	skinName,
	highScore,
	gamesPlayed,
}: ProfileHeaderProps) {
	return (
		<Card className="relative overflow-hidden">
			<div
				className="pointer-events-none absolute inset-0 opacity-5"
				style={{
					backgroundImage:
						"linear-gradient(oklch(0.72 0.15 210 / 0.4) 1px, transparent 1px), linear-gradient(90deg, oklch(0.72 0.15 210 / 0.4) 1px, transparent 1px)",
					backgroundSize: "40px 40px",
				}}
			/>

			<CardContent className="relative flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-center">
				<div className="shrink-0">
					{skinSpriteKey ? (
						<div className="relative h-32 w-32">
							<Image
								src={`/wolves/${skinSpriteKey}.png`}
								alt={skinName ?? "Wolf"}
								fill={true}
								className="object-contain drop-shadow-[0_0_40px_rgba(15,172,237,0.5)]"
								style={{ imageRendering: "pixelated" }}
							/>
						</div>
					) : (
						<div className="flex h-32 w-32 items-center justify-center rounded-2xl border border-primary/20 bg-primary/5 text-6xl">
							🐺
						</div>
					)}
				</div>

				<div className="flex flex-1 flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div className="text-center sm:text-left">
						<h1 className="text-2xl font-bold text-foreground">{userName}</h1>
						<div className="mt-1 flex items-center justify-center gap-2 sm:justify-start">
							{userImage && (
								<Image
									src={userImage}
									alt={userName}
									width={20}
									height={20}
									className="rounded-full"
								/>
							)}
							<span className="text-sm text-muted-foreground">
								@{userName.toLowerCase().replace(/\s+/g, "")}
							</span>
						</div>
						{skinName && <p className="mt-1 text-xs text-primary/70">Equipped: {skinName}</p>}
					</div>

					<div className="flex flex-wrap items-center justify-center gap-3 sm:justify-end">
						<Badge className="font-mono font-bold">HI {highScore.toLocaleString()}</Badge>
						<Badge variant="purple" className="font-mono font-bold">
							{gamesPlayed} RUNS
						</Badge>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
