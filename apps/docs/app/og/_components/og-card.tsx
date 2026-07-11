import type { ReactElement, ReactNode } from "react";

// ── Palette (arcade-neon, deep navy + cyan) ───────────────────
const BG = "#060d1f";
const BG_RAISED = "#0a1733";
const SURFACE = "#0c1d3d";
const SURFACE_HI = "#12294f";
const HAIRLINE = "#1e3a5f";
const BRAND = "#0faced";
const BRAND_HI = "#38bdf8";
const GOLD = "#f5b301";
const PURPLE = "#a855f7";
const ORANGE = "#fb923c";
const TXT_1 = "#e8eef9";
const TXT_2 = "#93a4c4";

// Podium colors for the leaderboard proof tile.
const PODIUM = [GOLD, "#c7d2e5", "#cd7f32"] as const;

/** Fang glyph. A pair of angled fangs — the FangDash mark, cued small. */
function FangGlyph({
	size = 30,
	color = BRAND_HI,
}: {
	size?: number;
	color?: string;
}): ReactElement {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: "flex" }}>
			<path d="M4 4 C 8 12, 8 16, 9 20 C 10 15, 11 12, 12 8 Z" fill={color} />
			<path d="M20 4 C 16 12, 16 16, 15 20 C 14 15, 13 12, 12 8 Z" fill={color} opacity={0.75} />
		</svg>
	);
}

/** Wordmark. Fang mark + the fangdash text, top-left on every card. */
function Wordmark(): ReactElement {
	return (
		<div style={{ display: "flex", alignItems: "center", gap: 14 }}>
			<FangGlyph size={34} color={BRAND_HI} />
			<div
				style={{
					display: "flex",
					fontFamily: "Unbounded",
					fontSize: 32,
					fontWeight: 700,
					color: TXT_1,
					letterSpacing: -1,
				}}
			>
				FangDash
			</div>
		</div>
	);
}

/**
 * Shared card chrome: navy gradient, one cyan glow, motion speed-streaks, an
 * inset hairline frame, and a header row (wordmark left, mono tag right).
 */
function Frame({ tag, children }: { tag: string; children: ReactNode }): ReactElement {
	return (
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				background: BG,
				position: "relative",
				fontFamily: "Inter",
			}}
		>
			{/* Vertical base gradient */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					background: `linear-gradient(155deg, ${BG_RAISED} 0%, ${BG} 60%)`,
					display: "flex",
				}}
			/>
			{/* Cyan glow, top-left — single light source. */}
			<div
				style={{
					position: "absolute",
					top: -340,
					left: -280,
					width: 980,
					height: 980,
					background: `radial-gradient(circle, ${BRAND}45 0%, ${BRAND}00 58%)`,
					display: "flex",
				}}
			/>
			{/* Motion speed-streaks, lower-right, evoking the endless run. */}
			<div
				style={{
					position: "absolute",
					right: 0,
					bottom: 90,
					display: "flex",
					flexDirection: "column",
					gap: 26,
					opacity: 0.5,
				}}
			>
				{[220, 150, 300, 180, 120].map((w, i) => (
					<div
						key={i}
						style={{
							display: "flex",
							width: w,
							height: 4,
							borderRadius: 4,
							background: `linear-gradient(90deg, ${BRAND}00, ${i % 2 ? PURPLE : BRAND})`,
						}}
					/>
				))}
			</div>
			{/* Inset hairline frame */}
			<div
				style={{
					position: "absolute",
					inset: 22,
					border: `1px solid ${HAIRLINE}`,
					borderRadius: 30,
					display: "flex",
				}}
			/>

			{/* Header row */}
			<div
				style={{
					position: "relative",
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					padding: "50px 64px 0",
				}}
			>
				<Wordmark />
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 10,
						fontFamily: "JetBrains Mono",
						fontSize: 16,
						color: TXT_2,
						letterSpacing: 0.4,
					}}
				>
					<div
						style={{
							display: "flex",
							width: 7,
							height: 7,
							borderRadius: 999,
							background: BRAND_HI,
							boxShadow: `0 0 12px ${BRAND_HI}`,
						}}
					/>
					<span style={{ display: "flex" }}>{tag}</span>
				</div>
			</div>

			{/* Body */}
			<div style={{ position: "relative", display: "flex", flex: 1, padding: "34px 64px 44px" }}>
				{children}
			</div>
		</div>
	);
}

// ── Eyebrow pill ──────────────────────────────────────────────
function Eyebrow({ text }: { text: string }): ReactElement {
	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				alignSelf: "flex-start",
				gap: 12,
				padding: "9px 20px 9px 15px",
				borderRadius: 999,
				background: `${BRAND}24`,
				border: `1px solid ${BRAND}55`,
				color: BRAND_HI,
				fontSize: 21,
				fontWeight: 500,
				letterSpacing: -0.2,
			}}
		>
			<div
				style={{
					display: "flex",
					width: 10,
					height: 10,
					borderRadius: 999,
					background: BRAND_HI,
					boxShadow: `0 0 14px ${BRAND_HI}`,
				}}
			/>
			<span style={{ display: "flex" }}>{text}</span>
		</div>
	);
}

// ── Leaderboard proof tile (right column) ─────────────────────
function RacerRow({
	rank,
	name,
	score,
	color,
}: {
	rank: number;
	name: string;
	score: string;
	color: string;
}): ReactElement {
	const medal = PODIUM[rank - 1];
	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				gap: 16,
				padding: "12px 14px",
				borderRadius: 16,
				background: rank === 1 ? SURFACE_HI : "transparent",
				border: `1px solid ${rank === 1 ? `${GOLD}44` : "transparent"}`,
			}}
		>
			{/* Rank medal */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					width: 34,
					height: 34,
					borderRadius: 999,
					background: `${medal}22`,
					border: `1px solid ${medal}`,
					color: medal,
					fontFamily: "JetBrains Mono",
					fontSize: 17,
					fontWeight: 700,
				}}
			>
				{rank}
			</div>
			{/* Wolf avatar */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					width: 40,
					height: 40,
					borderRadius: 12,
					background: `linear-gradient(135deg, ${color} 0%, ${SURFACE} 130%)`,
				}}
			>
				<FangGlyph size={20} color="#ffffff" />
			</div>
			<div
				style={{
					display: "flex",
					flex: 1,
					overflow: "hidden",
					fontSize: 19,
					fontWeight: 600,
					color: TXT_1,
				}}
			>
				{name}
			</div>
			<div
				style={{
					display: "flex",
					flexShrink: 0,
					marginLeft: 14,
					fontFamily: "JetBrains Mono",
					fontSize: 19,
					fontWeight: 700,
					color: rank === 1 ? GOLD : TXT_1,
				}}
			>
				{score}
			</div>
		</div>
	);
}

function LeaderboardTile(): ReactElement {
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				width: 384,
				gap: 12,
				padding: 26,
				borderRadius: 28,
				background: SURFACE,
				border: `1px solid ${HAIRLINE}`,
				boxShadow: "0 30px 80px -30px rgba(0,0,0,0.85)",
			}}
		>
			{/* Header */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					marginBottom: 6,
				}}
			>
				<div
					style={{
						display: "flex",
						fontFamily: "JetBrains Mono",
						fontSize: 14,
						color: BRAND_HI,
						letterSpacing: 0.8,
					}}
				>
					LIVE RACE
				</div>
				<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
					<div
						style={{
							display: "flex",
							width: 8,
							height: 8,
							borderRadius: 999,
							background: "#ef4444",
							boxShadow: "0 0 12px #ef4444",
						}}
					/>
					<span
						style={{ display: "flex", fontFamily: "JetBrains Mono", fontSize: 13, color: TXT_2 }}
					>
						4 WOLVES
					</span>
				</div>
			</div>
			<RacerRow rank={1} name="Shadow" score="18,420" color={PURPLE} />
			<RacerRow rank={2} name="Blaze" score="16,905" color={ORANGE} />
			<RacerRow rank={3} name="Storm" score="15,110" color={BRAND} />
		</div>
	);
}

// ── Title with accent word ────────────────────────────────────
function splitAccent(title: string, accentWord?: string): [string, string, string] {
	if (!accentWord) return [title, "", ""];
	const idx = title.toLowerCase().indexOf(accentWord.toLowerCase());
	if (idx === -1) return [title, "", ""];
	return [
		title.slice(0, idx),
		title.slice(idx, idx + accentWord.length),
		title.slice(idx + accentWord.length),
	];
}

export interface OgCardProps {
	title: string;
	description?: string;
	eyebrow?: string;
	chips?: string[];
	accentWord?: string;
}

export function OgCard({
	title,
	description,
	eyebrow,
	chips,
	accentWord,
}: OgCardProps): ReactElement {
	const [before, accent, after] = splitAccent(title, accentWord);
	// Cap the description so a long frontmatter line can't push the chips off
	// the bottom of the 1200x630 frame.
	const desc =
		description && description.length > 120
			? `${description
					.slice(0, 116)
					.replace(/\s+\S*$/, "")
					.replace(/[\s.,;:!?]+$/, "")}…`
			: description;

	return (
		<Frame tag="multiplayer · twitch · open source">
			<div
				style={{
					display: "flex",
					width: "100%",
					justifyContent: "space-between",
					alignItems: "flex-start",
					gap: 52,
				}}
			>
				{/* Left column — message. */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						flex: 1,
						justifyContent: "flex-start",
					}}
				>
					{eyebrow ? <Eyebrow text={eyebrow} /> : null}

					{/* Headline, one word per flex item so Satori wraps on word
					    boundaries instead of clipping one long flex child. */}
					<div
						style={{
							display: "flex",
							flexWrap: "wrap",
							columnGap: 16,
							rowGap: 2,
							marginTop: eyebrow ? 26 : 0,
							fontFamily: "Unbounded",
							fontSize: 52,
							lineHeight: 1.12,
							fontWeight: 700,
							letterSpacing: -1.6,
							maxWidth: 540,
						}}
					>
						{[
							{ text: before, color: TXT_1 },
							{ text: accent, color: BRAND_HI },
							{ text: after, color: TXT_1 },
						]
							.filter((seg) => seg.text.trim().length > 0)
							.flatMap((seg, si) =>
								seg.text
									.trim()
									.split(/\s+/)
									.map((word, wi) => (
										<span key={`${si}-${wi}`} style={{ display: "flex", color: seg.color }}>
											{word}
										</span>
									)),
							)}
					</div>

					{desc ? (
						<div
							style={{
								display: "flex",
								marginTop: 22,
								fontSize: 24,
								lineHeight: 1.4,
								color: TXT_2,
								letterSpacing: -0.3,
								maxWidth: 560,
							}}
						>
							{desc}
						</div>
					) : null}

					{chips && chips.length > 0 ? (
						<div
							style={{ display: "flex", gap: 9, flexWrap: "wrap", marginTop: 26, maxWidth: 600 }}
						>
							{chips.map((c) => (
								<div
									key={c}
									style={{
										display: "flex",
										padding: "7px 16px",
										borderRadius: 999,
										background: SURFACE,
										border: `1px solid ${HAIRLINE}`,
										color: TXT_1,
										fontSize: 18,
										fontWeight: 500,
										letterSpacing: -0.2,
									}}
								>
									{c}
								</div>
							))}
						</div>
					) : null}
				</div>

				{/* Right column — leaderboard proof. */}
				<LeaderboardTile />
			</div>
		</Frame>
	);
}

export interface ChangelogOgCardProps {
	version: string;
	date: string;
	highlights: string[];
}

export function ChangelogOgCard({ version, date, highlights }: ChangelogOgCardProps): ReactElement {
	return (
		<Frame tag="release notes">
			<div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
				<Eyebrow text={`Changelog · ${date}`} />

				<div
					style={{
						display: "flex",
						marginTop: 26,
						fontFamily: "Unbounded",
						fontSize: 124,
						lineHeight: 1,
						color: TXT_1,
						fontWeight: 700,
						letterSpacing: -3,
					}}
				>
					<span style={{ display: "flex" }}>v</span>
					<span style={{ display: "flex", color: BRAND_HI, fontWeight: 700 }}>{version}</span>
				</div>

				<div
					style={{
						display: "flex",
						marginTop: 14,
						fontSize: 29,
						color: TXT_2,
						letterSpacing: -0.3,
					}}
				>
					What&apos;s new in FangDash
				</div>

				<div style={{ display: "flex", flexDirection: "column", marginTop: 28, gap: 13 }}>
					{highlights.slice(0, 3).map((h, i) => (
						<div
							key={i}
							style={{
								display: "flex",
								alignItems: "center",
								gap: 16,
								fontSize: 26,
								color: TXT_1,
								fontWeight: 500,
								letterSpacing: -0.3,
							}}
						>
							<div
								style={{
									display: "flex",
									width: 4,
									height: 22,
									borderRadius: 2,
									background: BRAND_HI,
								}}
							/>
							<span style={{ display: "flex" }}>{h}</span>
						</div>
					))}
				</div>
			</div>
		</Frame>
	);
}

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png" as const;

async function loadFont(
	family: string,
	weights: number[],
): Promise<{ name: string; data: ArrayBuffer; weight: number; style: "normal" }[]> {
	const results: { name: string; data: ArrayBuffer; weight: number; style: "normal" }[] = [];
	for (const weight of weights) {
		const url = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@${weight}&display=swap`;
		const css = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } }).then((r) =>
			r.text(),
		);
		const match = css.match(/src:\s*url\(([^)]+)\)\s*format\('(?:truetype|woff2?)'\)/);
		const fontUrl = match?.[1];
		if (!fontUrl) continue;
		const data = await fetch(fontUrl).then((r) => r.arrayBuffer());
		results.push({ name: family, data, weight, style: "normal" });
	}
	return results;
}

export async function loadOgFonts() {
	const [inter, unbounded, mono] = await Promise.all([
		loadFont("Inter", [400, 500, 700]),
		loadFont("Unbounded", [700]),
		loadFont("JetBrains Mono", [400]),
	]);
	return [...inter, ...unbounded, ...mono];
}
