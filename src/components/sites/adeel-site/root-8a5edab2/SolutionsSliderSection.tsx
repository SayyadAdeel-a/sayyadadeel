"use client";

import { projects, projectLayouts, type Project } from "@/lib/projects";

/** Joins class tokens, skipping the ones a card layout does not override. */
const cls = (...tokens: (string | undefined)[]) => tokens.filter(Boolean).join(" ");

function ProjectSlide({ project }: { project: Project }) {
  const layout = projectLayouts[project.layout];

  return (
    <div className={"services-slide w-slide"}>
      <div className={"w-dyn-list"}>
        <div role={"list"} className={"w-dyn-items"}>
          <div role={"listitem"} className={"w-dyn-item"}>
            <div className={"slide-creators-wrapper"}>
              <div className={"slide-creators-wrap"}>
                <div className={"slide-creators-text-wrapper"}>
                  <div className={cls("slide-creators-text-wrap", layout.textWrapClass)}>
                    <div className={"slide-creators-contain-wrap"}>
                      {project.tags.map((tag) => (
                        <div
                          key={tag}
                          data-wf--text-title-box--variant={"style-two"}
                          className={"text-title-box w-variant-140bda40-e9e6-59e8-874a-a23dcd055b01"}
                        >
                          <div className={"text-mediums"}>{tag}</div>
                        </div>
                      ))}
                    </div>
                    <h3 className={"h5"}>{project.title}</h3>
                  </div>
                  <div className={"slide-creators-text-dectlies-button-wrap"}>
                    <div className={"slide-creators-text-dectlies-wrap"}>
                      <p className={"text-default rbg8"}>{project.description}</p>
                    </div>
                    <div className={"slide-creators-button-wrap"}>
                      <a btn-anim={"true"} data-wf--button--variant={"style-four"} data-wf-component-id={"90522a0b-8143-769f-2ad2-e28710708494"} data-wf-variant-state={"0cf5b68d-ba2c-c2d9-8662-c17e91483685"} href={project.href} className={"button w-inline-block"}>
                        <div className={"button-text-wrap"}>
                          <div className={"button-hover-text w-variant-0cf5b68d-ba2c-c2d9-8662-c17e91483685"}>View Project</div>
                          <div className={"button-normal-text w-variant-0cf5b68d-ba2c-c2d9-8662-c17e91483685"}>View Project</div>
                        </div>
                        <div className={"button-icon-box"}>
                          <div button-icon-anin-one={"ture"} className={"button-icon-wrap"}>
                            <img src={"/assets/home/_shared/arrow-1.svg"} loading={"lazy"} alt={"Icon"} className={"button-icon"} />
                          </div>
                        </div>
                      </a>
                    </div>
                  </div>
                </div>
                <div className={"slide-creators-image-wrapper"}>
                  <div className={cls("slide-creators-image-wrap", layout.imageWrapClass)}>
                    <div className={"slide-creators-image-bg-wrap"}>
                      <img src={layout.bgImage} loading={"lazy"} alt={"Icon BG"} className={"contain-size-image"} />
                    </div>
                    <div className={"slide-creators-image-priend-wrapper"}>
                      <div contain-left-move-child={"ture"} className={cls("slide-creators-image-left-wrap", layout.leftWrapClass)}>
                        <img alt={""} src={project.leftCutout} loading={"lazy"} className={"contain-size-image"} />
                      </div>
                      <div text-box-child={"ture"} className={cls("slide-creators-image-text-wrap", layout.badgeClass)}>
                        <div className={"text-default font-three meddel-blod"}>{project.note[0]}</div>
                        <div className={"text-default font-three"}>{project.note[1]}</div>
                      </div>
                      <div className={"slide-creators-image-priend-wrap"}>
                        <img src={project.image.src} loading={"lazy"} alt={project.image.alt} sizes={"100vw"} srcSet={project.image.srcSet} className={"cover-size-image"} />
                      </div>
                      <div className={cls("slide-creators-image-love-wrap", layout.loveWrapClass)}>
                        <div love-child={"ture"} className={"love-icon"}>
                          <img alt={""} src={layout.loveIcon} loading={"lazy"} className={"contain-size-image"} />
                        </div>
                        <div className={"display-six"}>{project.loveLabel}</div>
                      </div>
                      <div contain-right-move-child={"ture"} className={cls("slide-creators-image-right-wrap", layout.rightWrapClass)}>
                        <img alt={""} src={project.rightCutout} loading={"lazy"} className={"contain-size-image"} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SolutionsSliderSection() {
  return (
    <section id={"work"} className={"selider-section"}>
      <div className={"w-layout-blockcontainer container w-container"}>
        <div className={"creators-wrapper"}>
          <div className={"creators-wrap"}>
            <div className={"text-creats-wrap"}>
              <div className={"creators-text-wrap"}>
                <div fade-up={"true"} className={"serves-sectin-text-wrap"}>
                  <div data-wf--section-label--variant={"base"} data-wf-component-id={"baea7480-3228-dedc-fd06-20620fd6c93a"} data-wf-variant-state={"base"} className={"section-label"}>
                    <div className={"text-icon-box"}>
                      <img src={"/assets/home/_shared/ellipse-2469.svg"} loading={"lazy"} move-opacty={"ture"} alt={"Icon"} className={"text-icon"} />
                    </div>
                    <div className={"text-block-name"}>Selected Work</div>
                  </div>
                </div>
                <h2 fade-up={"true"} className={"h3"}>Selected Projects</h2>
              </div>
            </div>
            <div data-delay={"1"} data-animation={"slide"} className={"services-slider w-slider"} data-autoplay={"true"} data-easing={"ease-out-cubic"} data-hide-arrows={"false"} data-disable-swipe={"false"} data-autoplay-limit={"1"} data-nav-spacing={"3"} data-duration={"800"} data-infinite={"true"}>
              <div fade={"true"} className={"services-mask w-slider-mask"}>
                {projects.map((project) => (
                  <ProjectSlide key={project.title} project={project} />
                ))}
              </div>
              <div slider-click-btn={"true"} fade-up={"true"} className={"left-arrow w-slider-arrow-left"}>
                <div className={"icon-wrap"}>
                  <img src={"/assets/home/_shared/long-arrow-alt-left-solid.svg"} loading={"lazy"} alt={"Icon"} className={"contain-size-image"} />
                </div>
                <div className={"text-medium"}>Prev</div>
              </div>
              <div slider-click-btn={"true"} fade-up={"true"} className={"right-arrow w-slider-arrow-right"}>
                <div className={"text-medium"}>Next</div>
                <div className={"icon-wrap"}>
                  <img src={"/assets/home/_shared/long-arrow-alt-right-solid.svg"} loading={"lazy"} alt={"Icon"} className={"contain-size-image"} />
                </div>
              </div>
              <div className={"display-none w-slider-nav w-round"} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
