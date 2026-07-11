"use client";
import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

// Landing-only floating back-to-top. Appears after the first viewport of
// scroll; hidden from the a11y tree until visible.
export function BackToTop() {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const onScroll = () => setVisible(window.scrollY > 700);
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	return (
		<button
			type="button"
			aria-label="Back to top"
			aria-hidden={!visible}
			tabIndex={visible ? 0 : -1}
			onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
			className={`fd-to-top${visible ? " is-visible" : ""}`}
		>
			<ArrowUp className="h-5 w-5" />
		</button>
	);
}
