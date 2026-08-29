import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.redirect(new URL("/dashboard-login", process.env.NEXT_PUBLIC_SITE_URL || "https://adeelsayyad.tech"));
  response.cookies.set("cms_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
