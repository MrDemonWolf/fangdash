import Image from "next/image";
import Link from "next/link";
import { Gamepad2, Users, Paintbrush, Trophy } from "lucide-react";
import { HeroCTA } from "./_components/hero-cta";
import { HeroBackground } from "./_components/hero-background";

const features = [
  {
    icon: Gamepad2,
    title: "Solo Play",
    color: "bg-cyan-500/20",
    description:
      "Endless runner action — dodge obstacles, rack up combos, and chase your personal best across infinite procedural terrain.",
  },
  {
    icon: Users,
    title: "Multiplayer Racing",
    color: "bg-violet-500/20",
    description:
      "Challenge friends in real-time ghost races and climb the global leaderboard to prove you're the fastest wolf.",
  },
  {
    icon: Paintbrush,
    title: "Wolf Skins",
    color: "bg-orange-500/20",
    description:
      "Unlock 6 unique wolf skins by hitting milestones — from Arctic White to the legendary Demon Wolf.",
  },
  {
    icon: Trophy,
    title: "Achievements",
    color: "bg-yellow-500/20",
    description:
      "Complete 12+ challenges, earn XP, and collect rewards that showcase your mastery on your profile.",
  },
] as const;

const stats = [
  { value: "6", label: "Wolf Skins" },
  { value: "5", label: "Difficulty Levels" },
  { value: "4", label: "Obstacle Types" },
  { value: "\u221E", label: "Endless Runs" },
];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero */}
      <section className="relative flex flex-1 flex-col items-center justify-center gap-8 bg-[#091533] px-4 py-24 text-center sm:py-32">
        <HeroBackground />

        <div className="relative z-10 flex flex-col items-center gap-8">
          {/* Badge */}
          <span className="rounded-full border border-[#0FACED]/30 bg-[#0FACED]/10 px-4 py-1.5 text-sm font-medium text-[#0FACED]">
            Free-to-play on any browser
          </span>

          <Image
            src="/wolves/wolf-mrdemonwolf.png"
            alt="FangDash wolf mascot"
            width={256}
            height={256}
            priority
            className="animate-float drop-shadow-[0_0_48px_rgba(15,172,237,0.4)]"
            style={{ imageRendering: "pixelated" }}
          />

          <h1 className="text-6xl font-extrabold tracking-tight text-white sm:text-8xl">
            Fang<span className="text-[var(--color-fang-orange)]">Dash</span>
          </h1>

          <p className="max-w-lg text-lg text-gray-300 sm:text-xl">
            Sprint, jump, and dash as pixel-art wolves in this multiplayer
            endless runner. Play solo or race friends — no download required.
          </p>

          <HeroCTA />
        </div>
      </section>

      {/* Features */}
      <section className="bg-[#0b1a3d] px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-white sm:text-4xl">
            How You&apos;ll Play
          </h2>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, description, color }) => (
              <div
                key={title}
                className="group rounded-xl border border-[#0FACED]/20 bg-[#091533] p-6 transition-all hover:border-[#0FACED]/50 hover:shadow-[0_0_24px_rgba(15,172,237,0.15)]"
              >
                <div
                  className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full ${color}`}
                >
                  <Icon className="h-7 w-7 text-[#0FACED]" />
                </div>
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

      {/* Stats */}
      <section className="bg-[#091533] px-4 py-16 sm:py-20">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 sm:grid-cols-4">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-4xl font-extrabold text-[#0FACED] sm:text-5xl">
                {value}
              </p>
              <p className="mt-2 text-sm text-gray-400">{label}</p>
            </div>
          ))}
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
