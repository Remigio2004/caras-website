import Header from "@/components/site/Header";
import Hero from "@/components/site/Hero";
import About from "@/components/site/About";
import Parish from "@/components/site/Parish";
import Ministries from "@/components/site/Ministries";
import Events from "@/components/site/Events";
import Gallery from "@/components/site/Gallery";
import JoinUs from "@/components/site/JoinUs";
import Contact from "@/components/site/Contact";
import Footer from "@/components/site/Footer";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main>
        <Hero />
        <About />
        <Parish />
        <Ministries />
        <Events />
        <Gallery />
        <JoinUs />
        <Contact />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
