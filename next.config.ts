import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allows a phone on the same private Wi-Fi to load development assets.
  allowedDevOrigins: ["192.168.0.17"],
  images: {
    qualities: [75, 85, 90],
  },
};

export default nextConfig;
