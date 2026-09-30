import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth";
import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "data", "seo");
const PUBLIC_DIR = join(process.cwd(), "public");

function requireAuthOrReject(request: NextRequest): NextResponse | null {
  const session = request.cookies.get("cms_session")?.value;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

function readJson(filename: string): unknown {
  return JSON.parse(readFileSync(join(DATA_DIR, filename), "utf8"));
}

function writeJson(filename: string, data: unknown): void {
  writeFileSync(join(DATA_DIR, filename), JSON.stringify(data, null, 2) + "\n");
}

// ─── Blog ─────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const authError = requireAuthOrReject(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "blog";
  const slug = searchParams.get("slug");

  const fileMap: Record<string, string> = {
    blog: "blog.json",
    "use-cases": "use-cases.json",
    glossary: "glossary.json",
    comparisons: "comparisons.json",
  };

  const filename = fileMap[type];
  if (!filename) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const data = readJson(filename) as any[];

  if (slug) {
    const item = data.find((d: any) => d.slug === slug);
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(item);
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const authError = requireAuthOrReject(request);
  if (authError) return authError;

  const body = await request.json();
  const { type, data: item } = body;

  const fileMap: Record<string, string> = {
    blog: "blog.json",
    "use-cases": "use-cases.json",
    glossary: "glossary.json",
    comparisons: "comparisons.json",
  };

  const filename = fileMap[type];
  if (!filename) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const items = readJson(filename) as any[];

  // Check for duplicate slug
  if (items.some((i: any) => i.slug === item.slug)) {
    return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
  }

  items.push(item);
  writeJson(filename, items);

  return NextResponse.json({ success: true, slug: item.slug });
}

export async function PUT(request: NextRequest) {
  const authError = requireAuthOrReject(request);
  if (authError) return authError;

  const body = await request.json();
  const { type, slug, data: updates } = body;

  const fileMap: Record<string, string> = {
    blog: "blog.json",
    "use-cases": "use-cases.json",
    glossary: "glossary.json",
    comparisons: "comparisons.json",
  };

  const filename = fileMap[type];
  if (!filename) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const items = readJson(filename) as any[];
  const index = items.findIndex((i: any) => i.slug === slug);

  if (index === -1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  items[index] = { ...items[index], ...updates };
  writeJson(filename, items);

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const authError = requireAuthOrReject(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const slug = searchParams.get("slug");

  if (!type || !slug) {
    return NextResponse.json({ error: "Missing type or slug" }, { status: 400 });
  }

  const fileMap: Record<string, string> = {
    blog: "blog.json",
    "use-cases": "use-cases.json",
    glossary: "glossary.json",
    comparisons: "comparisons.json",
  };

  const filename = fileMap[type];
  if (!filename) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const items = readJson(filename) as any[];
  const filtered = items.filter((i: any) => i.slug !== slug);

  if (filtered.length === items.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  writeJson(filename, filtered);

  return NextResponse.json({ success: true });
}

// ─── Image Upload ─────────────────────────────────────────────────────────────

export async function PATCH(request: NextRequest) {
  const authError = requireAuthOrReject(request);
  if (authError) return authError;

  const formData = await request.formData();
  const file = formData.get("file") as File;
  const path = formData.get("path") as string;

  if (!file || !path) {
    return NextResponse.json({ error: "Missing file or path" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  writeFileSync(join(PUBLIC_DIR, path), buffer);

  return NextResponse.json({ success: true, url: `/${path}` });
}
