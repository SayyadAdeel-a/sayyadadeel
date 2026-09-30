import { readFileSync } from "fs";
import { join } from "path";

export interface Project {
  slug: string;
  title: string;
  description: string;
  url: string;
  video?: string;
  image?: string;
  poster?: string;
  year?: string;
  role: string[];
  stack?: string[];
  caseStudy?: boolean;
}

export function getProjects(): Project[] {
  try {
    const raw = readFileSync(join(process.cwd(), "data", "projects.json"), "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (p): p is Project =>
        typeof p?.slug === "string" &&
        typeof p?.title === "string" &&
        typeof p?.description === "string" &&
        typeof p?.url === "string" &&
        (typeof p?.video === "string" || typeof p?.image === "string")
    );
  } catch {
    return [];
  }
}
