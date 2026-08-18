import type { MetadataRoute } from "next";

const appUrl = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/api", "/login", "/register", "/reset-password", "/verify-email"],
    },
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
