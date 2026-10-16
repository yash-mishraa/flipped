import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.flipped.website";
  // W3C Date format (YYYY-MM-DD) compliant with official sitemaps.org protocol
  const todayDate = new Date().toISOString().slice(0, 10);
  const staticContentDate = "2026-10-15";

  return [
    {
      url: baseUrl,
      lastModified: todayDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/daily`,
      lastModified: todayDate,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/classic`,
      lastModified: staticContentDate,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/archive`,
      lastModified: todayDate,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/stats`,
      lastModified: staticContentDate,
      changeFrequency: "weekly",
      priority: 0.75,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: staticContentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: staticContentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: staticContentDate,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: staticContentDate,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}
