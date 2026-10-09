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
 * The sections are rendered as direct children of <body>, exactly as the
 * reference page does — no wrapper element is introduced, so the DOM tree the
 * stylesheet sees is identical to the original.
 */
export default function Home() {
  return (
    <>
      <HeaderSection />
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
      <FooterSection />
      <InteractionsRuntime />
    </>
  );
}