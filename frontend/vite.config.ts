import { defineConfig } from "vite";
import { devtools } from "@tanstack/devtools-vite";
import { paraglideVitePlugin } from "@inlang/paraglide-js";

import { tanstackRouter } from "@tanstack/router-plugin/vite";

import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    paraglideVitePlugin({
      project: "./project.inlang",
      outdir: "./src/paraglide",
      strategy: ["url", "baseLocale"],
      emitTsDeclarations: true,
      // urlPatterns: [{
      //   pattern: ':protocol://:domain(.*)::port?/:locale/:path(.*)?',
      //   localized: [
      //     ['en', ':protocol://:domain(.*)::port?/en/:path(.*)?'],
      //     ['ar-EG', ':protocol://:domain(.*)::port?/ar-EG/:path(.*)?']
      //   ]
      // }]
    }),
    tailwindcss(),
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    viteReact(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
});

export default config;
