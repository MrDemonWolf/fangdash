/** @type {import('postcss-load-config').Config} */
const config = {
	plugins: {
		"@tailwindcss/postcss": {},
	},
};

// biome-ignore lint/style/noDefaultExport: required by framework config
export default config;
