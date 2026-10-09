/**
 * POST /api/contact
 *
 * Validates a contact submission and forwards it to Formspree, which delivers
 * the email. Nothing is stored: there is no database, no log of submissions and
 * no third-party record beyond Formspree's own delivery of the message.
 *
 * Order of operations matters. Abuse checks run *before* validation so a bot
 * never reaches the field checks, and validation runs before any outbound
 * request so nothing malformed is relayed.
 *
 * Spam replies deliberately mimic success. Telling a spammer their payload was
 * rejected is free feedback; the messages in here are for the site owner.
 */
import { NextResponse } from "next/server";
import { contactConfig } from "@/lib/contact";
import {
  LIMITS,
  findHardRejection,
  findSoftSignals,
  hasErrors,
  validateSubmission,
} from "@/lib/contact-validation";

/**
 * This reads a request body and sends an outbound request, so it cannot be
 * statically rendered at build time.
 */
export const dynamic = "force-dynamic";

const BAD_REQUEST = 400;
const TOO_LARGE = 413;
const SERVER_MISCONFIGURED = 503;
const UPSTREAM_FAILED = 502;

export async function POST(request: Request) {
  // ---- 1. body size, before anything is parsed -----------------------------
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > LIMITS.requestBytes) {
    return NextResponse.json({ ok: false, message: "Submission too large." }, { status: TOO_LARGE });
  }

  // ---- 2. configuration, so a missing key fails loudly --------------------
  if (!contactConfig.isConfigured) {
    console.error(
      "[contact] FORMSPREE_FORM_ID is not set. Submissions cannot be delivered. " +
        "Add it in the Vercel project settings."
    );
    return NextResponse.json(
      {
        ok: false,
        message: "The contact form is not configured yet. Please email contact@adeelsayyad.tech instead.",
      },
      { status: SERVER_MISCONFIGURED }
    );
  }

  // ---- 3. parse ------------------------------------------------------------
  // Both encodings are accepted. The client posts JSON, but the form carries a
  // real `method="post" action="/api/contact"`, so accepting urlencoded means a
  // visitor with JavaScript disabled still reaches the same validation and the
  // same relay instead of a parse error.
  let body: Record<string, unknown>;
  const contentType = request.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      body = Object.fromEntries((await request.formData()).entries());
    } else {
      body = (await request.json()) as Record<string, unknown>;
    }
  } catch {
    return NextResponse.json({ ok: false, message: "Could not read that submission." }, { status: BAD_REQUEST });
  }

  // ---- 4. abuse checks -----------------------------------------------------
  // Hard signals are dropped silently. Soft signals are only logged: rejecting a
  // fast submission cost a real bug, because autofill can fill and submit a form
  // in well under the threshold, and the visitor was told it had been sent.
  const hard = findHardRejection(
    body,
    request.headers.get("origin"),
    request.headers.get("host")
  );
  if (hard) {
    console.warn(`[contact] dropped a submission: ${hard}`);
    // 200, so a bot learns nothing from the response.
    return NextResponse.json({ ok: true });
  }

  const soft = findSoftSignals(body);
  if (soft.length) console.warn(`[contact] submission noted: ${soft.join("; ")}`);

  // ---- 5. validation -------------------------------------------------------
  const { data, errors } = validateSubmission(body);
  if (hasErrors(errors)) {
    return NextResponse.json({ ok: false, errors }, { status: BAD_REQUEST });
  }

  // ---- 6. forward to Formspree --------------------------------------------
  try {
    const upstream = await fetch(contactConfig.formspreeEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        reason: data.reason || undefined,
        message: data.message,
        // `replyTo` makes Reply go to the sender rather than to you.
        replyTo: data.email,
        // Formspree's own field for routing; harmless if the form has no such field.
        _subject: `New contact form submission from ${data.name}`,
      }),
      // Fail fast rather than holding the visitor on a hung request.
      signal: AbortSignal.timeout(8000),
    });

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => "");
      console.error(`[contact] Formspree responded ${upstream.status}: ${detail.slice(0, 500)}`);
      return NextResponse.json(
        {
          ok: false,
          message: "Something went wrong sending that. Please try again, or email contact@adeelsayyad.tech.",
        },
        { status: UPSTREAM_FAILED }
      );
    }
  } catch (error) {
    console.error("[contact] could not reach Formspree:", error);
    return NextResponse.json(
      {
        ok: false,
        message: "Something went wrong sending that. Please try again, or email contact@adeelsayyad.tech.",
      },
      { status: UPSTREAM_FAILED }
    );
  }

  return NextResponse.json({ ok: true });
}

/** Anything other than POST is not part of this route. */
export async function GET() {
  return NextResponse.json({ ok: false, message: "POST only." }, { status: 405 });
}