import { assetPath } from "@/lib/site.ts";

interface Skin {
	name: string;
	sprite: string;
	rarity: string;
	rarityColor: string;
	unlock: string;
}

const SKINS: Skin[] = [
	{
		name: "Gray Wolf",
		sprite: "wolf-gray",
		rarity: "Common",
		rarityColor: "#94a3b8",
		unlock: "Starter skin",
	},
	{
		name: "Shadow Wolf",
		sprite: "wolf-shadow",
		rarity: "Uncommon",
		rarityColor: "#22c55e",
		unlock: "Best run ≥ 2,000m",
	},
	{
		name: "Fire Wolf",
		sprite: "wolf-fire",
		rarity: "Rare",
		rarityColor: "#06b6d4",
		unlock: "Score 5,000 in a run",
	},
	{
		name: "Storm Wolf",
		sprite: "wolf-storm",
		rarity: "Epic",
		rarityColor: "#a855f7",
		unlock: "Clear 1,000 obstacles",
	},
	{
		name: "Blood Moon",
		sprite: "wolf-blood-moon",
		rarity: "Legendary",
		rarityColor: "#f5b301",
		unlock: "Score 15,000 in a run",
	},
	{
		name: "MrDemonWolf",
		sprite: "wolf-mrdemonwolf",
		rarity: "Legendary",
		rarityColor: "#f5b301",
		unlock: "Win 10 races",
	},
];

export function SkinStrip() {
	return (
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
			{SKINS.map((s) => (
				<div
					key={s.name}
					className="fd-card-hover group flex flex-col items-center rounded-2xl border p-4 text-center"
					style={{ borderColor: "var(--hairline)", background: "var(--bg-elev)" }}
				>
					<div
						className="mb-3 flex h-20 w-20 items-center justify-center rounded-xl"
						style={{
							background: `radial-gradient(circle at 50% 35%, color-mix(in srgb, ${s.rarityColor} 26%, transparent), transparent 70%)`,
						}}
					>
						{}
						<img
							src={assetPath(`/wolves/${s.sprite}.png`)}
							alt={`${s.name} wolf skin`}
							className="h-16 w-16 object-contain transition-transform duration-200 group-hover:scale-110"
						/>
					</div>
					<span className="text-sm font-semibold" style={{ color: "var(--txt-1)" }}>
						{s.name}
					</span>
					<span
						className="fd-mono mt-1 rounded-full px-2 py-0.5 text-[0.6rem] font-semibold tracking-wide uppercase"
						style={{
							color: s.rarityColor,
							background: `color-mix(in srgb, ${s.rarityColor} 15%, transparent)`,
						}}
					>
						{s.rarity}
					</span>
					<span className="mt-2 text-xs leading-snug" style={{ color: "var(--txt-2)" }}>
						{s.unlock}
					</span>
				</div>
			))}
		</div>
	);
}
