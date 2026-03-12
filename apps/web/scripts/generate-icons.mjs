#!/usr/bin/env node
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const docsRoot = join(__dirname, "../../../apps/docs");
const srcPng = join(root, "public/wolves/wolf-mrdemonwolf.png");

// Ensure output dirs exist
mkdirSync(join(root, "public/icons"), { recursive: true });
mkdirSync(join(docsRoot, "public/icons"), { recursive: true });

// Crop to head region (pixels at x≈26–38, y≈9–17) with padding, square
const headCrop = { left: 22, top: 5, width: 26, height: 26 };

/**
 * Build a circular icon: white circle background, wolf head centred at 70% of canvas.
 */
async function makeCircleIcon(size) {
	const wolfSize = Math.round(size * 0.85);
	const offset = Math.round((size - wolfSize) / 2);

	// Scale up the head crop
	const wolfBuf = await sharp(srcPng)
		.extract(headCrop)
		.resize(wolfSize, wolfSize, { kernel: sharp.kernel.nearest })
		.png()
		.toBuffer();

	// White square canvas with wolf centred
	const withBg = await sharp({
		create: {
			width: size,
			height: size,
			channels: 4,
			background: { r: 255, g: 255, b: 255, alpha: 1 },
		},
	})
		.composite([{ input: wolfBuf, top: offset, left: offset }])
		.png()
		.toBuffer();

	// Circular mask — SVG circle punched via dest-in
	const circleMask = Buffer.from(
		`<svg><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" /></svg>`,
	);

	return sharp(withBg)
		.composite([{ input: circleMask, blend: "dest-in" }])
		.png()
		.toBuffer();
}

const icons = [
	{ name: "icon-32.png", size: 32 },
	{ name: "icon-192.png", size: 192 },
	{ name: "icon-512.png", size: 512 },
];

for (const { name, size } of icons) {
	const buf = await makeCircleIcon(size);
	const outWeb = join(root, "public/icons", name);
	await sharp(buf).toFile(outWeb);
	console.log(`Generated ${name} (web)`);

	const outDocs = join(docsRoot, "public/icons", name);
	copyFileSync(outWeb, outDocs);
	console.log(`Copied ${name} (docs)`);
}

// Maskable icon: wolf circle at 80% on navy background
const maskableSize = 512;
const circleBuf = await makeCircleIcon(Math.round(maskableSize * 0.8));
const padding = Math.round(maskableSize * 0.1);

await sharp({
	create: {
		width: maskableSize,
		height: maskableSize,
		channels: 4,
		background: { r: 9, g: 21, b: 51, alpha: 1 }, // #091533
	},
})
	.composite([{ input: circleBuf, top: padding, left: padding }])
	.png()
	.toFile(join(root, "public/icons/icon-512-maskable.png"));

console.log("Generated icon-512-maskable.png");

// Generate docs OG image: 1200x630, dark background, centred wolf circle
const icon192Buffer = readFileSync(join(root, "public/icons/icon-192.png"));
await sharp({
	create: {
		width: 1200,
		height: 630,
		channels: 4,
		background: { r: 9, g: 21, b: 51, alpha: 1 }, // #091533
	},
})
	.composite([
		{
			input: icon192Buffer,
			top: Math.round((630 - 192) / 2),
			left: Math.round((1200 - 192) / 2),
		},
	])
	.png()
	.toFile(join(docsRoot, "public/opengraph-image.png"));

console.log("Generated docs opengraph-image.png");
