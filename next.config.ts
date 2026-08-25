import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allows a phone on the same private Wi-Fi to load development assets.
  allowedDevOrigins: ["192.168.0.17"],
};

export default nextConfig;
