"use client";

import { bookingAttrs } from "@/lib/contact";

export default function HeaderSection() {
  return (
    <section data-wf--header-section--variant={"base"} data-wf-component-id={"24ca57b6-65bd-90cf-29f6-88f79a1acfa1"} data-wf-variant-state={"base"} className={"header-section"}>
      <div data-animation={"default"} data-collapse={"medium"} data-duration={"400"} data-easing={"ease"} data-easing2={"ease"} role={"banner"} className={"navbar w-nav"}>
        <div className={"nav-content-wrap"}>
          <div className={"container w-container"}>
            <div className={"nav-inner"}>
              <a href={"/"} aria-current={"page"} className={"nav-logo-link w-nav-brand w--current"}>
                <img loading={"lazy"} src={"/assets/brand/wordmark.svg"} alt={"Adeel Sayyad"} className={"nav-logo"} />
              </a>
              <div className={"nav-manus-wrapper"}>
                <a href={"#work"} className={"nav-link w-inline-block"}>
                  <div>Work</div>
                </a>
                <a href={"#github"} className={"nav-link w-inline-block"}>
                  <div>GitHub</div>
                </a>
                <a href={"/contact"} className={"nav-link w-inline-block"}>
                  <div>Contact</div>
                </a>
              </div>
              <div menu-bar-toggle={"true"} className={"nav-menu-wrap"}>
                <div menu-bar={"true"} className={"menu-wrapper"}>
                  <div className={"menu-wrap"}>
                    <div id={"w-node-_61536114-f853-7b8f-27e5-49cf2f79f3f8-9a1acfa1"} className={"menu-one"}>
                      <a data-wf--text-button--variant={"base"} href={"/"} aria-current={"page"} className={"text-button w-inline-block w--current"}>
                        <div className={"text-button-normal-text"}>Home</div>
                        <div className={"text-button-hover-text"}>Home</div>
                      </a>
                      <a data-wf--text-button--variant={"base"} href={"#work"} className={"text-button w-inline-block"}>
                        <div className={"text-button-normal-text"}>Work</div>
                        <div className={"text-button-hover-text"}>Work</div>
                      </a>
                      <a data-wf--text-button--variant={"base"} href={"#github"} className={"text-button w-inline-block"}>
                        <div className={"text-button-normal-text"}>GitHub</div>
                        <div className={"text-button-hover-text"}>GitHub</div>
                      </a>
                      <a data-wf--text-button--variant={"base"} href={"/contact"} className={"text-button w-inline-block"}>
                        <div className={"text-button-normal-text"}>Contact</div>
                        <div className={"text-button-hover-text"}>Contact</div>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              <div className={"nav-button-wrap"}>
                <a {...bookingAttrs()} btn-anim={"true"} data-wf--button--variant={"base"} data-wf-component-id={"90522a0b-8143-769f-2ad2-e28710708494"} data-wf-variant-state={"base"} className={"button w-inline-block"}>
                  <div className={"button-text-wrap"}>
                      <div className={"button-hover-text"}>Let's Talk</div>
                      <div className={"button-normal-text"}>Let's Talk</div>
                  </div>
                  <div className={"button-icon-box"}>
                    <div button-icon-anin-one={"ture"} className={"button-icon-wrap"}>
                      <img src={"/assets/home/_shared/arrow-1.svg"} loading={"lazy"} alt={"Icon"} className={"button-icon"} />
                    </div>
                  </div>
                </a>
              </div>
              <div className={"menu-button"}>
                <div className={"hamburger"}>
                  <div data-wf-target={"[[[\"24ca57b6-65bd-90cf-29f6-88f79a1acfa1\",\"24ca57b6-65bd-90cf-29f6-88f79a1acfb1\"],[\"24ca57b6-65bd-90cf-29f6-88f79a1acfa0\"]]]"} className={"hamburger-line-top"} />
                  <div data-wf-target={"[[[\"24ca57b6-65bd-90cf-29f6-88f79a1acfa1\",\"24ca57b6-65bd-90cf-29f6-88f79a1acfb2\"],[\"24ca57b6-65bd-90cf-29f6-88f79a1acfa0\"]]]"} className={"hamburger-line-middle"} />
                  <div data-wf-target={"[[[\"24ca57b6-65bd-90cf-29f6-88f79a1acfa1\",\"24ca57b6-65bd-90cf-29f6-88f79a1acfb3\"],[\"24ca57b6-65bd-90cf-29f6-88f79a1acfa0\"]]]"} className={"hamburger-line-bottom"} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
