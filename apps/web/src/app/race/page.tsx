"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No I,O,0,1 to avoid confusion
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function RoomCodeInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex justify-center gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          type="text"
          maxLength={1}
          value={value[i] ?? ""}
          className="h-14 w-12 rounded-lg border border-[#0FACED]/20 bg-white/5 text-center text-xl font-bold uppercase text-white outline-none transition-colors focus:border-[#0FACED] focus:bg-[#0FACED]/10"
          onChange={(e) => {
            const char = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
            if (!char) {
              const next = value.slice(0, i) + value.slice(i + 1);
              onChange(next);
              return;
            }
            const next = value.slice(0, i) + char + value.slice(i + 1);
            onChange(next.slice(0, 6));
            // Auto-focus next input
            if (char && i < 5) {
              const nextInput = e.target.parentElement?.children[i + 1] as HTMLInputElement | undefined;
              nextInput?.focus();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !value[i] && i > 0) {
              const prevInput = (e.target as HTMLElement).parentElement?.children[i - 1] as HTMLInputElement | undefined;
              prevInput?.focus();
            }
          }}
          onPaste={(e) => {
            e.preventDefault();
            const pasted = e.clipboardData
              .getData("text")
              .toUpperCase()
              .replace(/[^A-Z0-9]/g, "")
              .slice(0, 6);
            onChange(pasted);
            // Focus last filled input
            const target = (e.target as HTMLElement).parentElement?.children[
              Math.min(pasted.length, 5)
            ] as HTMLInputElement | undefined;
            target?.focus();
          }}
        />
      ))}
    </div>
  );
}

export default function RaceLobbyPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const isSignedIn = !!session?.user;
  const [roomCode, setRoomCode] = useState("");

  const handleCreate = () => {
    const code = generateRoomCode();
    router.push(`/race/${code}`);
  };

  const handleJoin = () => {
    if (roomCode.length === 6) {
      router.push(`/race/${roomCode.toUpperCase()}`);
    }
  };

  if (!isSignedIn) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#091533] px-4">
        <div className="w-full max-w-md rounded-xl border border-[#0FACED]/20 bg-[#091533]/95 p-8 text-center shadow-2xl">
          <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-white">
            Race Mode
          </h1>
          <p className="mb-6 text-white/50">
            Sign in to race against other players.
          </p>
          <Link
            href="/"
            className="inline-block rounded-lg border border-white/10 px-6 py-3 text-sm font-medium text-white/70 transition-colors hover:border-white/20 hover:text-white"
          >
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#091533] px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="mb-2 text-4xl font-extrabold tracking-tight text-white">
            Race Mode
          </h1>
          <p className="text-white/50">
            Challenge other players to a head-to-head race.
          </p>
        </div>

        {/* Create Room */}
        <div className="rounded-xl border border-[#0FACED]/20 bg-white/5 p-6">
          <h2 className="mb-3 text-lg font-semibold text-white">
            Create a Room
          </h2>
          <p className="mb-4 text-sm text-white/50">
            Start a new race room and share the code with friends.
          </p>
          <button
            type="button"
            onClick={handleCreate}
            className="w-full cursor-pointer rounded-lg bg-[#0FACED] px-6 py-3 text-sm font-bold uppercase tracking-wider text-[#091533] transition-colors hover:bg-[#0FACED]/80"
          >
            Create Room
          </button>
        </div>

        {/* Join Room */}
        <div className="rounded-xl border border-[#0FACED]/20 bg-white/5 p-6">
          <h2 className="mb-3 text-lg font-semibold text-white">
            Join a Room
          </h2>
          <p className="mb-4 text-sm text-white/50">
            Enter a 6-character room code to join an existing race.
          </p>
          <div className="mb-4">
            <RoomCodeInput value={roomCode} onChange={setRoomCode} />
          </div>
          <button
            type="button"
            onClick={handleJoin}
            disabled={roomCode.length < 6}
            className="w-full cursor-pointer rounded-lg bg-[#0FACED] px-6 py-3 text-sm font-bold uppercase tracking-wider text-[#091533] transition-colors hover:bg-[#0FACED]/80 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Join Room
          </button>
        </div>

        {/* Back link */}
        <div className="text-center">
          <Link
            href="/"
            className="text-sm text-white/40 transition-colors hover:text-white/70"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
