import ContactForm from "@/components/ContactForm";

export default function ContactSection() {
  return (
    <section group-fade-up-parent={"true"} className={"contact-section"}>
      <div className={"w-layout-blockcontainer container w-container"}>
        <div className={"contact-wrapper"}>
          <div className={"contact-header-text-wrapper"}>
            <div group-fade-up-item={"true"} className={"section-text-wrap"}>
              <div data-wf--section-label--variant={"base"} data-wf-component-id={"baea7480-3228-dedc-fd06-20620fd6c93a"} data-wf-variant-state={"base"} className={"section-label"}>
                <div className={"text-icon-box"}>
                  <img src={"/assets/shared/ellipse-2469.svg"} loading={"lazy"} move-opacty={"ture"} alt={"Icon"} className={"text-icon"} />
                </div>
                <div className={"text-block-name"}>Contact Form</div>
              </div>
            </div>
            <h1 group-fade-up-item={"true"} className={"h1 text-wrap"}>Let’s Connect</h1>
          </div>
          <div className={"contact-form-wrapper"}>
            <div className={"contact-form-wrap"}>
              <div className={"form-block w-form"}>
                <ContactForm />
                <div className={"message w-form-done"}>
                  <div>Thank you! Your submission has been received!</div>
                </div>
                <div className={"w-form-fail"}>
                  <div>Oops! Something went wrong while submitting the form.</div>
                </div>
              </div>
            </div>
            <div className={"contact-form-image-wrap"}>
              <img src={"/assets/contact/01-contact/cover-size-image-frame-2147262809.avif"} loading={"lazy"} sizes={"100vw"} srcSet={"/assets/contact/01-contact/frame-2147262809-p-500.avif 500w, /assets/contact/01-contact/cover-size-image-frame-2147262809.avif 810w"} alt={"Image"} className={"cover-size-image"} />
            </div>
          </div>
          <div className={"conact-text-icon-wrapper"}>
            <div group-fade-up-item={"true"} className={"contact-form-icon-text-wrapper"}>
              <div id={"w-node-b8d122ea-e261-f78d-3c17-3aef6e1e139e-3a890076"} className={"contact-form-icon-text-box"}>
                <div className={"contact-form-icon-box"}>
                  <img src={"/assets/contact/01-contact/contain-size-image-github.avif"} loading={"lazy"} className={"contain-size-image"} />
                </div>
                <div className={"contact-form-text-box"}>
                  <h2 className={"h6 center"}>GitHub</h2>
                  <a href={"https://github.com/SayyadAdeel-a"} target={"_blank"} rel={"noopener noreferrer"} className={"content-name"}>SayyadAdeel-a</a>
                </div>
              </div>
              <div id={"w-node-e9d58148-473f-05f9-a8c3-61315bb96930-3a890076"} className={"contact-form-icon-text-box"}>
                <div className={"contact-form-icon-box"}>
                  <img src={"/assets/contact/01-contact/contain-size-image-image-1442.avif"} loading={"lazy"} className={"contain-size-image"} />
                </div>
                <div className={"contact-form-text-box"}>
                  <h2 className={"h6 center"}>Working Hour</h2>
                  <div className={"content-name center no-hover"}>
                    Daily: 8am-5pm
                    <br />
                    Weekend: Closed
                  </div>
                </div>
              </div>
              <div id={"w-node-bc284ac0-0a56-ba37-8f9b-16cb6e82ba35-3a890076"} className={"contact-form-icon-text-box"}>
                <div className={"contact-form-icon-box"}>
                  <img src={"/assets/contact/01-contact/contain-size-image-image-994.avif"} loading={"lazy"} className={"contain-size-image"} />
                </div>
                <div className={"contact-form-text-box"}>
                  <h2 className={"h6 center"}>Mail to Us</h2>
                  <a href={"mailto:contact@adeelsayyad.tech"} className={"content-name"}>contact@adeelsayyad.tech</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
