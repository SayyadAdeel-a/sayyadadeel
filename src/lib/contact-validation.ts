/**
 * Contact form validation.
 *
 * Hand-written rather than a schema library, deliberately. Zod is present in
 * node_modules only as a `dev: true` transitive dependency, so a Vercel
 * production build would prune it and the route would fail at runtime with a
 * bare module-not-found. Five fields do not justify that risk.
 *
 * Two jobs here, and the distinction matters:
 *
 *   - *Shape* validation is for the visitor. It trims, caps lengths, checks
 *     that the email looks like an email, and returns per-field messages the
 *     form can render.
 *   - *Abuse* rejection is for the route. Those checks are not about the
 *     visitor being wrong, so they fail the whole submission with a generic
 *     message rather than explaining themselves.
 *
 * The caps are the cheapest spam control there is: a request carrying a
 * 200 KB "message" is never a person filling in a form.
 */

export type FieldName = "name" | "email" | "phone" | "reason" | "message";

export type FieldErrors = Partial<Record<FieldName, string>>;

export type ValidSubmission = {
  name: string;
  email: string;
  phone: string;
  reason: string;
  message: string;
};

/** Hard caps. Deliberately well under the form's own maxLength attributes. */
export const LIMITS = {
  name: 120,
  email: 254,
  phone: 40,
  reason: 80,
  message: 4000,
  /** Ceiling for the whole request body, before any field is looked at. */
  requestBytes: 16 * 1024,
} as const;

/** Deliberately permissive: enough to catch a typo, not to reject a valid address. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const clean = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export function validateSubmission(input: Record<string, unknown>): {
  data: ValidSubmission;
  errors: FieldErrors;
} {
  const errors: FieldErrors = {};

  const name = clean(input.name);
  const email = clean(input.email).toLowerCase();
  const phone = clean(input.phone);
  const reason = clean(input.reason);
  const message = clean(input.message);

  if (!name) errors.name = "Please add your name.";
  else if (name.length > LIMITS.name) errors.name = `Keep this under ${LIMITS.name} characters.`;

  if (!email) errors.email = "Please add your email.";
  else if (!EMAIL.test(email)) errors.email = "That does not look like an email address.";
  else if (email.length > LIMITS.email) errors.email = "That email address is too long.";

  // The phone field is on the form, so it stays validated -- but the site no
  // longer publishes a number, and nothing requires the visitor to give one.
  if (phone.length > LIMITS.phone) errors.phone = `Keep this under ${LIMITS.phone} characters.`;

  // Reason is a convenience picker, not a requirement: an empty answer says
  // nothing about whether the message is worth reading, so rejecting it would
  // turn away a real enquiry over a field the visitor can see is optional.
  // Only the cap is enforced, and a <select> cannot realistically reach it.
  if (reason.length > LIMITS.reason) errors.reason = `Keep this under ${LIMITS.reason} characters.`;

  if (!message) errors.message = "Tell me a little about what you have in mind.";
  else if (message.length > LIMITS.message) errors.message = `Keep this under ${LIMITS.message} characters.`;

  return { data: { name, email, phone, reason, message }, errors };
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

/**
 * Signals that mean "definitely not a person filling in this form".
 *
 * Only these two are safe to reject outright, and both reject *silently* by
 * answering as though the submission succeeded. Neither can fire for a genuine
 * visitor: a person cannot see the honeypot, and a person loading the form has
 * this site's own origin.
 */
export function findHardRejection(
  body: Record<string, unknown>,
  origin: string | null,
  host: string | null
): string | null {
  const honeypot = clean(body.website).toLowerCase();
  if (honeypot) return "honeypot";

  if (origin && host) {
    let originHost: string;
    try {
      originHost = new URL(origin).host;
    } catch {
      return "bad origin";
    }
    if (originHost !== host) return "foreign origin";
  }

  return null;
}

/**
 * Softer signals: worth logging, not worth dropping a submission over.
 *
 * The render timestamp originally rejected anything arriving within two
 * seconds. That turned out to be a real defect rather than a theoretical one --
 * browser autofill and password managers can fill and submit a form in well
 * under that, so a genuine enquiry would be silently discarded while the
 * visitor was told it had been sent.
 *
 * The asymmetry settles it. A false rejection costs someone a real message
 * they believe was delivered; a false accept costs one spam email. So a fast
 * submission is logged and allowed through.
 */
export function findSoftSignals(body: Record<string, unknown>, now = Date.now()): string[] {
  const signals: string[] = [];

  const renderedAt = Number(clean(body.renderedAt));
  if (Number.isFinite(renderedAt) && renderedAt > 0) {
    const elapsed = now - renderedAt;
    if (elapsed < 2000) signals.push(`arrived ${elapsed}ms after render`);
    if (elapsed < 0) signals.push("timestamp from the future");
    if (elapsed > 1000 * 60 * 60 * 24 * 7) signals.push("timestamp over a week old");
  }

  // Recorded only. There is no message-length threshold that separates a terse
  // first enquiry from an automated one, so any cutoff would also catch a
  // person writing "hi, are you available?".
  const message = clean(body.message);
  if (message && message.length < 12) signals.push("very short message");

  return signals;
}