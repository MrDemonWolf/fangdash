import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="mb-4 text-5xl font-bold tracking-tight">FangDash</h1>
      <p className="mb-2 max-w-xl text-lg text-fd-muted-foreground">
        A fast-paced multiplayer endless runner where players race as wolves,
        dodging obstacles and competing for the highest score.
      </p>
      <p className="mb-8 text-sm text-fd-muted-foreground">
        Built for Twitch streamers and their communities.
      </p>

      <div className="flex gap-4">
        <Link
          href="/docs"
          className="rounded-lg bg-fd-primary px-6 py-3 font-medium text-fd-primary-foreground transition-colors hover:bg-fd-primary/90"
        >
          Read the Docs
        </Link>
        <Link
          href="https://fangdash.mrdemonwolf.workers.dev"
          className="rounded-lg border border-fd-border px-6 py-3 font-medium transition-colors hover:bg-fd-accent"
        >
          Play Now
        </Link>
      </div>

      <div className="mt-16 grid max-w-3xl gap-6 sm:grid-cols-3">
        <div className="rounded-lg border border-fd-border p-6 text-left">
          <h3 className="mb-2 font-semibold">Endless Running</h3>
          <p className="text-sm text-fd-muted-foreground">
            Jump, dodge, and dash through procedurally generated obstacle
            courses as a wolf.
          </p>
        </div>
        <div className="rounded-lg border border-fd-border p-6 text-left">
          <h3 className="mb-2 font-semibold">Multiplayer Racing</h3>
          <p className="text-sm text-fd-muted-foreground">
            Race up to 4 players in real-time using WebSocket-powered rooms.
          </p>
        </div>
        <div className="rounded-lg border border-fd-border p-6 text-left">
          <h3 className="mb-2 font-semibold">Twitch Integration</h3>
          <p className="text-sm text-fd-muted-foreground">
            Sign in with Twitch, race your chat, and show off your skins on
            stream.
          </p>
        </div>
      </div>

      <footer className="mt-16 text-xs text-fd-muted-foreground">
        <p>Copyright FangWolf by MrDemonWolf, Inc.</p>
        <div className="mt-2 flex gap-4 justify-center">
          <Link href="/docs/legal/privacy-policy" className="hover:underline">
            Privacy Policy
          </Link>
          <Link href="/docs/legal/terms-of-service" className="hover:underline">
            Terms of Service
          </Link>
        </div>
      </footer>
    </main>
  );
}
