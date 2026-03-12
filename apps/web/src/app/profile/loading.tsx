import { ProfileSkeleton } from "./_skeleton.tsx";

// biome-ignore lint/style/noDefaultExport: required by Next.js
export default function ProfileLoading() {
	return <ProfileSkeleton />;
}
