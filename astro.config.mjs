import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://bagi-sh.github.io",
  i18n: {
    defaultLocale: "pt",
    locales: ["pt", "en"],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false,
    },
  },
  markdown: {
    shikiConfig: {
      theme: "github-dark",
      langs: [
        "c",
        "cpp",
        "bash",
        "shell",
        "json",
        "markdown",
        "typescript",
        "javascript",
        "html",
        "css",
        "java",
      ],
      wrap: true,
    },
  },
});
