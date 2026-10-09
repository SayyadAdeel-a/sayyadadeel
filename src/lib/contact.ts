/**
 * Contact endpoint configuration.
 *
 * Everything the contact form and the booking buttons need, in one place, so
 * neither a Formspree id nor a calendar URL is scattered through the markup.
 *
 * ## Setting these up
 *
 * `FORMSPREE_FORM_ID`
 *   Create a form at https://formspree.io and copy its id from the endpoint URL
 *   (`https://formspree.io/f/xxxxxxxx`). Add it as a server-side environment
 *   variable in the Vercel project. It is deliberately NOT prefixed with
 *   NEXT_PUBLIC_, so it never reaches the browser bundle.
 *
 *   Until it is set, submissions fail loudly with a 503 and a message telling
 *   you what is missing. They do not silently appear to succeed.
 *
 * `NEXT_PUBLIC_CALENDAR_BOOKING_URL`
 *   The appointment-scheduling page on Google Calendar. This one IS public
 *   because it appears in an href, so it is inlined at build time.
 *
 *   While it is unset the booking buttons fall back to the contact page, which
 *   is where they already pointed -- so no dead link ships in the meantime.
 *
 * `CONTACT_EMAIL`
 *   Where Formspree delivers. Defaults to the address the site publishes.
 */

const FALLBACK_BOOKING = "/contact";

export const contactConfig = {
  /** Formspree endpoint. Empty until the env var is set. */
  get formspreeEndpoint(): string {
    const id = process.env.FORMSPREE_FORM_ID;
    return id ? `https://formspree.io/f/${id}` : "";
  },

  get isConfigured(): boolean {
    return Boolean(process.env.FORMSPREE_FORM_ID);
  },

  /** Recipient. Formspree uses this only if `replyTo` is absent. */
  get recipient(): string {
    return process.env.CONTACT_EMAIL ?? "contact@adeelsayyad.tech";
  },

  /**
   * Public booking link. Falls back to the contact page rather than to an empty
   * href, because a button with `href="#"` or no href is a link that lies about
   * where it goes -- which is the exact problem this cleanup set out to fix.
   */
  get bookingUrl(): string {
    return process.env.NEXT_PUBLIC_CALENDAR_BOOKING_URL || FALLBACK_BOOKING;
  },

  /** True once a real calendar link exists, so the CTA can be labelled as booking. */
  get hasBookingLink(): boolean {
    return Boolean(process.env.NEXT_PUBLIC_CALENDAR_BOOKING_URL);
  },
} as const;

/**
 * Anchor attributes for a booking button.
 *
 * `target="_blank"` is only added once a real calendar URL exists. While the
 * fallback is the contact page, opening the same page in a new tab is just
 * confusing -- and it would be the wrong behaviour to leave in if the variable
 * were ever unset in production.
 */
export function bookingAttrs() {
  const href = contactConfig.bookingUrl;
  const external = contactConfig.hasBookingLink;
  return {
    href,
    ...(external ? { target: "_blank" as const, rel: "noopener noreferrer" as const } : {}),
  };
}