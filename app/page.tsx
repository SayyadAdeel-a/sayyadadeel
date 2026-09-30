import { Hero } from "@/components/hero/hero";
import { WorkSection } from "@/components/sections/work";
import { StudioSection } from "@/components/sections/studio";
import { About } from "@/components/sections/about";
import { Contact } from "@/components/sections/contact";
import { getProjects } from "@/lib/projects";

export default function Home() {
  const projects = getProjects();

  return (
    <>
      <Hero />
      <WorkSection projects={projects} />
      <StudioSection />
      <About />
      <Contact />
    </>
  );
}
