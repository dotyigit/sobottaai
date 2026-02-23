import { Hero } from "@/components/landing/hero"
import { AppDemo } from "@/components/landing/app-demo"
import { HowItWorks } from "@/components/landing/how-it-works"
import { FeaturesGrid } from "@/components/landing/features-grid"
import { ModelShowcase } from "@/components/landing/model-showcase"
import { AiFunctions } from "@/components/landing/ai-functions"
import { PrivacyOpenSource } from "@/components/landing/privacy-opensource"
import { TechStack } from "@/components/landing/tech-stack"
import { PlatformSupport } from "@/components/landing/platform-support"
import { CtaDownload } from "@/components/landing/cta-download"
import { Footer } from "@/components/landing/footer"

export default function Page() {
  return (
    <main className="min-h-screen bg-background">
      <Hero />
      <AppDemo />
      <HowItWorks />
      <FeaturesGrid />
      <ModelShowcase />
      <AiFunctions />
      <PrivacyOpenSource />
      <TechStack />
      <PlatformSupport />
      <CtaDownload />
      <Footer />
    </main>
  )
}
