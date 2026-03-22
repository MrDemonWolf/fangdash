export function formatDate(date: Date | string | null): string {
	if (!date) return "";
	const d = typeof date === "string" ? new Date(date) : date;
	if (Number.isNaN(d.getTime())) return "";
	return d.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

export function formatNumber(n: number): string {
	return n.toLocaleString();
}

export function formatDistance(meters: number): string {
	return `${(meters / 1000).toFixed(1)} km`;
}
