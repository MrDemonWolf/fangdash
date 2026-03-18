// ── Mod Bitflags ──

export const MOD_NONE = 0;
export const MOD_FOG = 1 << 0;
export const MOD_HEADWIND = 1 << 1;
export const MOD_TREMOR = 1 << 5;

export const MOD_DEFINITIONS = [
	{
		id: "fog",
		name: "Fog",
		description: "Visibility shrinks over distance. Can you run blind?",
		flag: MOD_FOG,
		multiplier: 1.15,
		icon: "\u{1F32B}\u{FE0F}",
		category: "visual" as const,
		ready: true,
	},
	{
		id: "headwind",
		name: "Headwind",
		description: "Wind pushes you down mid-air. Gets stronger over distance.",
		flag: MOD_HEADWIND,
		multiplier: 1.15,
		icon: "\u{1F4A8}",
		category: "movement" as const,
		ready: true,
	},
	{
		id: "tremor",
		name: "Tremor",
		description: "Earthquake shakes the ground. Landings get harder.",
		flag: MOD_TREMOR,
		multiplier: 1.15,
		icon: "\u{1F30B}",
		category: "movement" as const,
		ready: true,
	},
] as const;

export type ModId = (typeof MOD_DEFINITIONS)[number]["id"];
export type ModCategory = "visual" | "movement" | "ease";

export interface ModDefinition {
	id: string;
	name: string;
	description: string;
	flag: number;
	multiplier: number;
	icon: string;
	category: ModCategory;
	ready: boolean;
}

// Pairs of flags that cannot be combined
const INCOMPATIBLE_PAIRS: [number, number][] = [];

/** Bitmask of all mods marked as ready */
export const READY_MODS_MASK = MOD_DEFINITIONS.reduce(
	(mask, m) => (m.ready ? mask | m.flag : mask),
	0,
);

export function encodeMods(modIds: ModId[]): number {
	let flags = 0;
	for (const id of modIds) {
		const def = MOD_DEFINITIONS.find((m) => m.id === id);
		if (def) flags |= def.flag;
	}
	return flags;
}

export function decodeMods(flags: number): ModDefinition[] {
	return MOD_DEFINITIONS.filter((m) => (flags & m.flag) !== 0) as ModDefinition[];
}

export function getScoreMultiplier(flags: number): number {
	if (flags === 0) return 1.0;
	let multiplier = 1.0;
	for (const mod of MOD_DEFINITIONS) {
		if ((flags & mod.flag) !== 0) {
			multiplier *= mod.multiplier;
		}
	}
	return Math.round(multiplier * 1000) / 1000;
}

export function areModsCompatible(flags: number): boolean {
	for (const [a, b] of INCOMPATIBLE_PAIRS) {
		if ((flags & a) !== 0 && (flags & b) !== 0) return false;
	}
	return true;
}

export function hasmod(flags: number, mod: number): boolean {
	return (flags & mod) !== 0;
}

export function getModById(id: string): ModDefinition | undefined {
	return MOD_DEFINITIONS.find((m) => m.id === id) as ModDefinition | undefined;
}

export function formatModNames(flags: number): string {
	if (flags === 0) return "No Mods";
	return decodeMods(flags)
		.map((m) => m.name)
		.join(" + ");
}

/** Returns true if every active mod in the flags bitmask has `ready: true` */
export function areAllModsReady(flags: number): boolean {
	if (flags === 0) return true;
	// Any bits set outside the ready mask means a non-ready mod is active
	return (flags & ~READY_MODS_MASK) === 0;
}
