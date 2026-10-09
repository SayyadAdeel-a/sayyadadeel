import HeaderSection from "@/components/sites/adeel-site/root-8a5edab2/HeaderSection";
import HeroSection from "@/components/sites/adeel-site/root-8a5edab2/HeroSection";
import HeroIntroSection from "@/components/sites/adeel-site/root-8a5edab2/HeroIntroSection";
import OurCreatorsSection from "@/components/sites/adeel-site/root-8a5edab2/OurCreatorsSection";
import SolutionsSliderSection from "@/components/sites/adeel-site/root-8a5edab2/SolutionsSliderSection";
import MeetSection from "@/components/sites/adeel-site/root-8a5edab2/MeetSection";
import FeaturedWorkSection from "@/components/sites/adeel-site/root-8a5edab2/FeaturedWorkSection";
import CapabilitiesSection from "@/components/sites/adeel-site/root-8a5edab2/CapabilitiesSection";
import OurProcessSection from "@/components/sites/adeel-site/root-8a5edab2/OurProcessSection";
import OurClientsSection from "@/components/sites/adeel-site/root-8a5edab2/OurClientsSection";
import BrandsMarqueeSection from "@/components/sites/adeel-site/root-8a5edab2/BrandsMarqueeSection";
import WorkedSection from "@/components/sites/adeel-site/root-8a5edab2/WorkedSection";
import PricingSection from "@/components/sites/adeel-site/root-8a5edab2/PricingSection";
import OurClientsSaySection from "@/components/sites/adeel-site/root-8a5edab2/OurClientsSaySection";
import InsightsIdeasSection from "@/components/sites/adeel-site/root-8a5edab2/InsightsIdeasSection";
import CtaSection from "@/components/sites/adeel-site/root-8a5edab2/CtaSection";
import FooterSection from "@/components/sites/adeel-site/root-8a5edab2/FooterSection";
import InteractionsRuntime from "@/components/sites/adeel-site/shared/InteractionsRuntime";

/**
 * The content sections are wrapped in a single <main>, with the header and
 * footer left outside it -- they are chrome present on every page, not this
 * page's primary content.
 *
 * The wrapper used to be absent so that the sections sat as direct children of
 * <body> exactly as the reference page does. Adding <main> is safe for the
 * layout because webflow.css already ships `main { display: block }` in its
 * reset, no stylesheet in this project has an element-name selector beyond that
 * reset or keys on the ancestor chain, and no script walks body children or
 * matches on tag names. Verified rather than assumed, because this is the one
 * change here that alters the DOM shape.
 */
export default function Home() {
  return (
    <>
      <HeaderSection />
      <main>
        <HeroSection />
        <HeroIntroSection />
        <OurCreatorsSection />
        <SolutionsSliderSection />
        <MeetSection />
        <FeaturedWorkSection />
        <CapabilitiesSection />
        <OurProcessSection />
        <OurClientsSection />
        <BrandsMarqueeSection />
        <WorkedSection />
        <PricingSection />
        <OurClientsSaySection />
        <InsightsIdeasSection />
        <CtaSection />
      </main>
      <FooterSection />
      <InteractionsRuntime />
    </>
  );
}