import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const FALLBACK_SUPABASE_URL = "https://wxxaeupbfvlvtofflqke.supabase.co";
const FALLBACK_SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4eGFldXBiZnZsdnRvZmZscWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTEzMDQsImV4cCI6MjA4ODg4NzMwNH0.hGmcCxLHsSEWirxp5Ko6uHsCEMhaVcUVTEeFsrp3IEs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const resolvedSupabaseUrl = process.env.VITE_SUPABASE_URL ?? FALLBACK_SUPABASE_URL;
  const resolvedSupabasePublishableKey =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? FALLBACK_SUPABASE_PUBLISHABLE_KEY;

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
        protocol: "wss",
        clientPort: 443,
      },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime"],
    },
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(resolvedSupabaseUrl),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(resolvedSupabasePublishableKey),
    },
  };
});
