export type LevelInfo = {
	level: number;
	currentXp: number;
	xpForCurrentLevel: number;
	xpForNextLevel: number;
	progress: number;
};

export function totalXpForLevel(n: number): number {
	if (n <= 1) return 0;
	return 5 * (n - 1) * (n - 1) * (n - 1);
}

export function getXpForLevel(level: number): number {
	if (level <= 1) return 0;
	return totalXpForLevel(level) - totalXpForLevel(level - 1);
}

export function getPlacementBonus(placement: number): number {
	if (placement === 1) return 500;
	if (placement === 2) return 250;
	if (placement === 3) return 100;
	return 0;
}

export function getLevelFromXp(xp: number): LevelInfo {
	if (!Number.isFinite(xp) || xp < 0) {
		return {
			level: 1,
			currentXp: 0,
			xpForCurrentLevel: 0,
			xpForNextLevel: getXpForLevel(2),
			progress: 0,
		};
	}

	// Binary search for the highest level whose cumulative XP <= xp
	let low = 1;
	let high = 1;

	while (totalXpForLevel(high) <= xp) {
		high *= 2;
	}

	while (low < high - 1) {
		const mid = Math.floor((low + high) / 2);
		if (totalXpForLevel(mid) <= xp) {
			low = mid;
		} else {
			high = mid;
		}
	}

	const level = low;
	const levelStartXp = totalXpForLevel(level);
	const levelEndXp = totalXpForLevel(level + 1);
	const xpIntoLevel = xp - levelStartXp;
	const xpSpanForLevel = levelEndXp - levelStartXp;

	return {
		level,
		currentXp: xp,
		xpForCurrentLevel: xpIntoLevel,
		xpForNextLevel: xpSpanForLevel,
		progress: xpIntoLevel / xpSpanForLevel,
	};
}
