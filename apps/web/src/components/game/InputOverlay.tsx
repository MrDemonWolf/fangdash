"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface InputOverlayProps {
	visible?: boolean;
}

function KeyIcon({ label, pressed }: { label: string; pressed: boolean }) {
	return (
		<div
			className={cn(
				"flex items-center justify-center rounded border px-2 py-1 font-mono text-xs font-bold transition-all duration-75 select-none",
				pressed
					? "border-[#0FACED] bg-[#0FACED]/20 text-[#0FACED] shadow-[0_0_8px_rgba(15,172,237,0.5)]"
					: "border-white/20 bg-white/5 text-white/30",
			)}
		>
			{label}
		</div>
	);
}

export function InputOverlay({ visible = true }: InputOverlayProps) {
	const [spacePressed, setSpacePressed] = useState(false);
	const [clickPressed, setClickPressed] = useState(false);

	useEffect(() => {
		if (!visible) return;

		function onKeyDown(e: KeyboardEvent) {
			if (e.code === "Space") setSpacePressed(true);
		}
		function onKeyUp(e: KeyboardEvent) {
			if (e.code === "Space") setSpacePressed(false);
		}
		function onMouseDown() {
			setClickPressed(true);
		}
		function onMouseUp() {
			setClickPressed(false);
		}

		window.addEventListener("keydown", onKeyDown);
		window.addEventListener("keyup", onKeyUp);
		window.addEventListener("mousedown", onMouseDown);
		window.addEventListener("mouseup", onMouseUp);

		return () => {
			window.removeEventListener("keydown", onKeyDown);
			window.removeEventListener("keyup", onKeyUp);
			window.removeEventListener("mousedown", onMouseDown);
			window.removeEventListener("mouseup", onMouseUp);
		};
	}, [visible]);

	if (!visible) return null;

	return (
		<div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 pointer-events-none">
			<KeyIcon label="SPACE" pressed={spacePressed} />
			<KeyIcon label="CLICK" pressed={clickPressed} />
		</div>
	);
}
