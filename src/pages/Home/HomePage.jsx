import {
  HeaderSection,
  HeroSection,
  FeaturesSection,
  PricingSection,
  TestimonialsSection,
  FooterSection,
} from '@/components/landing';

export const HomePage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <HeaderSection />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
        <TestimonialsSection />
      </main>
      <FooterSection />
    </div>
  );
};
