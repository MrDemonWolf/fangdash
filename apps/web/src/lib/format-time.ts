export function formatTime(ms: number): string {
	const totalSec = Math.floor(ms / 1000);
	const mins = Math.floor(totalSec / 60);
	const secs = totalSec % 60;
	return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}
