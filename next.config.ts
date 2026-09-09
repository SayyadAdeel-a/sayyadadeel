import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.adeelsayyad.tech" }],
        destination: "https://adeelsayyad.tech/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
