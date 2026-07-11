export interface OgPreset {
	eyebrow: string;
	chips: string[];
}

// Per top-level section defaults for the docs OG cards. A page's own
// frontmatter (ogEyebrow / ogChips) always wins; this fills the gaps so every
// page ships a on-brand social card even with only a title + description.
const DEFAULT_PRESET: OgPreset = {
	eyebrow: "Start playing",
	chips: ["Multiplayer", "Twitch", "Leaderboards", "Free"],
};

const PRESETS: Record<string, OgPreset> = {
	"": DEFAULT_PRESET,
	"getting-started": {
		eyebrow: "Set up & self-host",
		chips: ["Install", "Database", "Twitch OAuth", "Deploy"],
	},
	gameplay: { eyebrow: "How to play", chips: ["Controls", "Scoring", "Levels", "Mods"] },
	multiplayer: {
		eyebrow: "Race in real time",
		chips: ["Up to 4 players", "WebSockets", "Twitch", "Ghosts"],
	},
	customization: {
		eyebrow: "Make it yours",
		chips: ["6 Wolf skins", "17 Achievements", "Unlockables"],
	},
	legal: { eyebrow: "The fine print", chips: ["Privacy", "Terms", "Open source"] },
	changelog: { eyebrow: "What's new", chips: ["Releases", "Features", "Fixes"] },
};

export function presetForSlug(slug: string[] | undefined): OgPreset {
	const key = slug?.[0] ?? "";
	return PRESETS[key] ?? DEFAULT_PRESET;
}
