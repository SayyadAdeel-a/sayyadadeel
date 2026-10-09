"use client";

/**
 * The contact form, wired to POST /api/contact.
 *
 * The markup, class names and field ids are the reference's, unchanged -- this
 * only attaches behaviour. In particular it keeps the existing
 * `.w-form-done` and `.w-form-fail` blocks, which Webflow's stylesheet hides with
 * `display: none` and which nothing else on this site ever revealed, because the
 * captured Webflow runtime never boots. They are toggled by className here.
 *
 * Nothing is stored client-side either: no localStorage, no state that outlives
 * the tab beyond the in-flight submission status.
 */
import { useEffect, useRef, useState } from "react";
import type { FieldErrors } from "@/lib/contact-validation";

type Status = "idle" | "sending" | "sent" | "error";

const MESSAGES = {
  fail: "Oops! Something went wrong while submitting the form.",
} as const;

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [problem, setProblem] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // The render timestamp, used by the server to reject submissions that arrive
  // implausibly fast.
  //
  // It lives in a ref and is written to the hidden input imperatively on mount,
  // rather than as state. Two earlier shapes were rejected by lint: reading a
  // ref during render (react-hooks/refs), and calling setState synchronously in
  // an effect (react-hooks/purity, since it cascades a render on mount). A ref
  // read only inside the submit handler is what refs are actually for.
  const renderedAtRef = useRef(0);
  const renderedAtField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    renderedAtRef.current = Date.now();
    if (renderedAtField.current) {
      renderedAtField.current.value = String(renderedAtRef.current);
    }
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;

    const form = formRef.current;
    if (!form) return;

    setStatus("sending");
    setErrors({});
    setProblem(null);

    const data = new FormData(form);
    // The timestamp is merged in from the ref rather than read off the hidden
    // input: React re-applies `defaultValue` on render, which wipes the
    // imperative write the mount effect makes, so the DOM value turned out not
    // to be a reliable carrier for it. The hidden input stays for the no-JS
    // path, where an empty timestamp simply reads as "no signal" to the server.
    const payload = {
      ...Object.fromEntries(data.entries()),
      renderedAt: String(renderedAtRef.current),
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await res.json().catch(() => null)) as
        | { ok?: boolean; errors?: FieldErrors; message?: string }
        | null;

      if (res.ok && json?.ok) {
        setStatus("sent");
        form.reset();
        return;
      }

      // Field-level problems are shown inline; anything else gets the summary.
      if (json?.errors && Object.keys(json.errors).length) setErrors(json.errors);
      else setProblem(json?.message ?? MESSAGES.fail);
      setStatus("error");
    } catch {
      setProblem(MESSAGES.fail);
      setStatus("error");
    }
  }

  const err = (field: keyof FieldErrors) =>
    errors[field] ? (
      <div className="field-error" role="alert">
        {errors[field]}
      </div>
    ) : null;

  return (
    <>
      <form
        ref={formRef}
        id={"wf-form-Contact-Form"}
        name={"wf-form-Contact-Form"}
        data-name={"Contact Form"}
        method={"post"}
        action={"/api/contact"}
        onSubmit={onSubmit}
        noValidate
        data-wf-page-id={"6a97e757adfa59f93a890076"}
        data-wf-element-id={"14f8f832-6ec0-19bc-d714-4c12f3fd4610"}
        className={status === "sent" ? "hidden" : undefined}
        aria-hidden={status === "sent"}
      >
        <div className={"form"}>
          <div className={"from-box-wrapper"}>
            <div className={"from-box"}>
              <label htmlFor={"name"} className={"text-default blold-meddle"}>
                Name
              </label>
              <input
                className={"text-field w-input"}
                maxLength={120}
                name={"name"}
                data-name={"Name"}
                placeholder={"Your full name"}
                type={"text"}
                id={"name"}
                required
              />
              {err("name")}
            </div>
            <div className={"from-box"}>
              <label htmlFor={"Reason"} className={"text-default blold-meddle"}>
                Reason
              </label>
              <select
                id={"Reason"}
                name={"reason"}
                data-name={"Reason"}
                defaultValue={""}
                className={"text-field w-select"}
              >
                {/* No `required`, and the empty option is selectable rather than
                    disabled: a disabled first option is how the template signalled
                    "pick one", which fights an optional field. Leaving it
                    enabled means the form submits with no reason instead of
                    being blocked by the browser. The styling and the dropdown's
                    native behaviour are untouched. */}
                <option value={""}>No reason, just saying hi</option>
                <option value={"Website / Project"}>Website / Project</option>
                <option value={"Just Asking"}>Just Asking</option>
                <option value={"Want To Connect"}>Want To Connect</option>
                <option value={"Something Else"}>Something Else</option>
              </select>
              {err("reason")}
            </div>
            <div className={"from-box"}>
              <label htmlFor={"Phone-Number"} className={"text-default blold-meddle"}>
                Phone Number
              </label>
              <input
                className={"text-field w-input"}
                maxLength={40}
                name={"Phone"}
                data-name={"Phone"}
                placeholder={"Your Phone Number"}
                type={"tel"}
                id={"Phone-Number"}
              />
              {err("phone")}
            </div>
            <div className={"from-box"}>
              <label htmlFor={"Email"} className={"text-default blold-meddle"}>
                Email
              </label>
              <input
                className={"text-field w-input"}
                maxLength={254}
                name={"email"}
                data-name={"Email"}
                placeholder={"Your Email"}
                type={"email"}
                id={"Email"}
                required
              />
              {err("email")}
            </div>
          </div>
          <div className={"from-box"}>
            <label htmlFor={"message"} className={"text-default blold-meddle"}>
              Your Message
            </label>
            <textarea
              required
              placeholder={"Tell me what’s on your mind."}
              maxLength={4000}
              id={"message"}
              name={"message"}
              data-name={"message"}
              className={"text-area w-input"}
            />
            {err("message")}
          </div>

          {/* Spam defences. `website` is the honeypot: hidden from people,
              irresistible to bots. `renderedAt` timestamps the render. */}
          <div className={"hp-field"} aria-hidden="true">
            <label htmlFor={"website"}>Leave this field empty</label>
            <input id={"website"} name={"website"} type={"text"} tabIndex={-1} autoComplete="off" defaultValue={""} />
          </div>
          <input type={"hidden"} name={"renderedAt"} ref={renderedAtField} defaultValue={""} readOnly />

          {problem ? (
            <div className={"w-form-fail contact-form-fail"} role="alert">
              <div>{problem}</div>
            </div>
          ) : null}

          <div className={"submit-wrapper"}>
            <div className={"submit-button-icon-wrapper"}>
              <input
                type={"submit"}
                data-wait={" "}
                className={"submit-button w-button"}
                value={" "}
                disabled={status === "sending"}
              />
              <div className={"submit-icon-wrap"}>
                <a
                  icon-btn-anim={"true"}
                  data-wf--icon-button--variant={"base"}
                  href={"mailto:contact@adeelsayyad.tech"}
                  aria-label={"Or email contact@adeelsayyad.tech directly"}
                  className={"icon-button w-inline-block"}
                >
                  <img loading={"lazy"} src={"/assets/shared/frame-1.svg"} alt={""} className={"icon icon-button-icon"} />
                </a>
              </div>
            </div>
            <div className={"text-medium blold-meddle"}>Send Message</div>
          </div>
        </div>
      </form>

      {/* Revealed by className because the Webflow runtime that would normally
          do this never boots on this build. The `contact-form-*` classes scope
          the reveal to this form -- see app/globals.css. */}
      <div className={`message w-form-done contact-form-done${status === "sent" ? "" : " hidden"}`} role="status">
        <div>Thank you! Your submission has been received!</div>
      </div>
    </>
  );
}