import NavBar from '../components/NavBar.jsx'
import Hero from '../components/Hero.jsx'
import StatsSection from '../components/StatsSection.jsx'
import FeatureCards from '../components/FeatureCards.jsx'
import DevSection from '../components/DevSection.jsx'
import EnterpriseSection from '../components/EnterpriseSection.jsx'
import CTASection from '../components/CTASection.jsx'
import Footer from '../components/Footer.jsx'

export default function Home() {
  return (
    <div className="min-h-screen">
      <NavBar />
      <Hero />
      <StatsSection />
      <FeatureCards />
      <DevSection />
      <EnterpriseSection />
      <CTASection />
      <Footer />
    </div>
  )
}
