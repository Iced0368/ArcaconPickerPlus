import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";
import monkey from "vite-plugin-monkey";
import basicSsl from "@vitejs/plugin-basic-ssl";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: true,
  },
  plugins: [
    basicSsl(),
    react(),
    svgr(),
    monkey({
      entry: "src/main.jsx",
      userscript: {
        icon: "https://raw.githubusercontent.com/Iced0368/AracaconPickerPlus/refs/heads/main/ap-plus-icon.svg",
        name: "Arcacon Picker Plus",
        namespace: "npm/vite-plugin-monkey",
        match: ["https://arca.live/*"],
        description: "아카콘 기능 확장",
        license: "MIT",
        version: "1.2.0",
        "run-at": "document-start",
      },
    }),
  ],
});
