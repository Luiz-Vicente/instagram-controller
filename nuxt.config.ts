// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
	css: ["~/assets/css/tailwind.css"],
	vite: {
		plugins: [tailwindcss()],
	},
	modules: ["shadcn-nuxt", "@nuxtjs/i18n"],
	i18n: {
		strategy: 'no_prefix',
		locales: [
			{ code: 'en', language: 'en-US', file: 'en.json' },
			{ code: 'pt', language: 'pt-BR', file: 'pt.json' },
		],
		defaultLocale: 'en',
		detectBrowserLanguage: false,
	},
	shadcn: {
		/**
		 * Prefix for all the imported component.
		 * @default "Ui"
		 */
		prefix: "",
		/**
		 * Directory that the component lives in.
		 * Will respect the Nuxt aliases.
		 * @link https://nuxt.com/docs/api/nuxt-config#alias
		 * @default "@/components/ui"
		 */
		componentDir: "@/components/ui",
	},
	ssr: false,
	compatibilityDate: "2025-07-15",
	devtools: { enabled: true },
});
