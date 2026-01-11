import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Avoid workspace-root inference issues when multiple lockfiles exist on the machine.
  outputFileTracingRoot: __dirname,
  images: {
    remotePatterns: [
      // Supabase public bucket URLs will match here (you may tighten host once you know it)
      { protocol: "https", hostname: "**" }
    ]
  }
};

export default nextConfig;

