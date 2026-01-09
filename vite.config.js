import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// IMPORTANT: set this to "/<your-repo-name>/"
const repoName = "fbs-affection-ranking";

export default defineConfig({
  plugins: [react()],
  base: `/${repoName}/`,
});
