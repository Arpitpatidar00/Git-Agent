import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Allow hot module reloading over ngrok
  allowedDevOrigins: [
    "2efd-2409-40c4-281-44bd-309b-7b3c-4f22-d89.ngrok-free.app",
  ],
};

export default nextConfig;
