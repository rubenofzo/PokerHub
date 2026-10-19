import type { MetadataRoute } from "next";

// Friends' results: keep search engines out.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
