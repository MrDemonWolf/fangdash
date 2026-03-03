import Image from "next/image";
import Link from "next/link";
import { Gamepad2, Users, Paintbrush, Trophy } from "lucide-react";
import { HeroCTA } from "./_components/hero-cta";

const features = [
  {
    icon: Gamepad2,
    title: "Solo Play",
    description:
      "Endless runner action — dodge obstacles, collect power-ups, and beat your high score.",
  },
  {
    icon: Users,
    title: "Multiplayer Racing",
    description:
      "Challenge friends in real-time races and climb the leaderboard.",
  },
  {
    icon: Paintbrush,
    title: "Wolf Skins",
    description:
      "Unlock and equip unique wolf skins to stand out on the track.",
  },
  {
    icon: Trophy,
    title: "Achievements",
    description:
      "Track milestones, complete challenges, and earn rewards as you play.",
  },
] as const;

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center gap-8 bg-[#091533] px-4 py-24 text-center sm:py-32">
        <Image
          src="/wolves/wolf-mrdemonwolf.png"
          alt="FangDash wolf mascot"
          width={180}
          height={180}
          priority
          className="drop-shadow-[0_0_32px_rgba(15,172,237,0.35)]"
        />

        <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-7xl">
          Fang<span className="text-[var(--color-fang-orange)]">Dash</span>
        </h1>

        <p className="max-w-md text-lg text-gray-300 sm:text-xl">
          Race as wolves in this multiplayer endless runner!
        </p>

        <HeroCTA />
      </section>

      {/* Features */}
      <section className="bg-[#0b1a3d] px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-white sm:text-4xl">
            How You&apos;ll Play
          </h2>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-xl border border-[#0FACED]/20 bg-[#091533] p-6 transition-colors hover:border-[#0FACED]/50"
              >
                <Icon className="mb-4 h-10 w-10 text-[#0FACED]" />
                <h3 className="mb-2 text-lg font-semibold text-white">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-400">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#091533] px-4 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 text-sm text-gray-400 sm:flex-row sm:justify-between">
          <p>
            Built by{" "}
            <Link
              href="https://mrdemonwolf.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0FACED] hover:underline"
            >
              MrDemonWolf
            </Link>
          </p>
          <div className="flex gap-6">
            <Link
              href="https://github.com/MrDemonWolf/fangdash"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white"
            >
              GitHub
            </Link>
            <Link href="/play" className="hover:text-white">
              Play
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
