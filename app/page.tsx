import Hero20 from "@/components/originkit/hero-20";
import { FeaturesSection } from "@/components/sections/featured-product";
import { About } from "@/components/sections/about";
import { Contact } from "@/components/sections/contact";

export default function Home() {
  return (
    <>
      <Hero20 />
      <FeaturesSection />
      <About />
      <Contact />
    </>
  );
}
