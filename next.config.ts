import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Allow hot module reloading over ngrok
  allowedDevOrigins: ["git-agent-delta.vercel.app/"],
};

export default nextConfig;
