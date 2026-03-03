export function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Sky layer — slowest */}
      <div
        className="absolute inset-0 animate-scroll-slow bg-repeat-x"
        style={{
          backgroundImage: "url(/backgrounds/bg-sky.png)",
          backgroundSize: "auto 100%",
          imageRendering: "pixelated",
        }}
      />
      {/* Hills layer — medium */}
      <div
        className="absolute inset-0 animate-scroll-medium bg-repeat-x"
        style={{
          backgroundImage: "url(/backgrounds/bg-hills.png)",
          backgroundSize: "auto 100%",
          imageRendering: "pixelated",
        }}
      />
      {/* Trees layer — fastest */}
      <div
        className="absolute inset-0 animate-scroll-fast bg-repeat-x"
        style={{
          backgroundImage: "url(/backgrounds/bg-trees.png)",
          backgroundSize: "auto 100%",
          imageRendering: "pixelated",
        }}
      />
      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#091533]/60 via-[#091533]/40 to-[#091533]/80" />
    </div>
  );
}
