import React, { useRef, useEffect } from 'react';
import { Translation } from '../translations';

interface LandingPageProps {
  onNavigate: () => void;
  T: Translation;
}

const FeatureCard: React.FC<{ icon: React.ReactNode, title: string, children: React.ReactNode, delay: string }> = ({ icon, title, children, delay }) => (
  <div className={`bg-gray-900/40 backdrop-blur-lg p-8 rounded-xl border border-white/10 transition-all duration-300 transform hover:-translate-y-2 shadow-lg hover:shadow-cyan-500/10 animate__animated animate__fadeInUp group [perspective:1000px] ${delay}`}>
    <div className="transition-transform duration-500 ease-out group-hover:[transform:translateZ(20px)]">
      <div className="flex items-center justify-center h-14 w-14 rounded-full bg-cyan-500/10 text-cyan-300 mb-5 border border-cyan-500/20">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{children}</p>
    </div>
  </div>
);

const HowItWorksStep: React.FC<{ num: string, title: string, children: React.ReactNode, delay: string }> = ({ num, title, children, delay }) => (
    <div className={`relative pl-12 animate__animated animate__fadeInUp group ${delay}`}>
        <div className="absolute left-0 top-0 flex items-center justify-center h-10 w-10 bg-gray-800 border-2 border-cyan-500/50 rounded-full font-bold text-cyan-400 text-lg transition-all duration-300 group-hover:shadow-[0_0_15px_rgba(34,211,238,0.7)] group-hover:border-cyan-400 group-hover:scale-110">
            {num}
        </div>
        <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
        <p className="text-gray-400">{children}</p>
    </div>
);

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, T }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particlesArray: Particle[] = [];
    const mouse = { x: null as number | null, y: null as number | null, radius: 100 };

    window.addEventListener('mousemove', (event) => {
      mouse.x = event.x;
      mouse.y = event.y;
    });
     window.addEventListener('mouseout', () => {
      mouse.x = null;
      mouse.y = null;
    });

    class Particle {
      x: number;
      y: number;
      directionX: number;
      directionY: number;
      size: number;
      speed: number;

      constructor(x: number, y: number, directionX: number, directionY: number, size: number) {
        this.x = x;
        this.y = y;
        this.directionX = directionX;
        this.directionY = directionY;
        this.size = size;
        this.speed = 0.05 + Math.random() * 0.2;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.fillStyle = 'rgba(34, 211, 238, 0.5)'; // cyan-400 with opacity
        ctx.fill();
      }

      update() {
        if (this.x > canvas.width || this.x < 0) this.directionX = -this.directionX;
        if (this.y > canvas.height || this.y < 0) this.directionY = -this.directionY;
        
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < mouse.radius) {
            this.x -= dx / distance * 2;
            this.y -= dy / distance * 2;
          }
        }

        this.x += this.directionX * this.speed;
        this.y += this.directionY * this.speed;
        this.draw();
      }
    }

    const init = () => {
      particlesArray = [];
      const numberOfParticles = (canvas.height * canvas.width) / 9000;
      for (let i = 0; i < numberOfParticles; i++) {
        const size = Math.random() * 1.5 + 0.5;
        const x = Math.random() * (canvas.width - size * 2) + size;
        const y = Math.random() * (canvas.height - size * 2) + size;
        const directionX = (Math.random() * 2) - 1;
        const directionY = (Math.random() * 2) - 1;
        particlesArray.push(new Particle(x, y, directionX, directionY, size));
      }
    };

    const connect = () => {
      if (!ctx) return;
      const connectDistance = 120;
      for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a + 1; b < particlesArray.length; b++) {
          const distance = Math.sqrt(
            Math.pow(particlesArray[a].x - particlesArray[b].x, 2) +
            Math.pow(particlesArray[a].y - particlesArray[b].y, 2)
          );
          if (distance < connectDistance) {
            const opacityValue = 1 - (distance / connectDistance);
            ctx.strokeStyle = `rgba(207, 250, 254, ${opacityValue * 0.3})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
            ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const particle of particlesArray) {
        particle.update();
      }
      connect();
      animationFrameId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      init();
    };
    
    handleResize();
    animate();

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', (event) => { mouse.x = event.x; mouse.y = event.y; });
      window.removeEventListener('mouseout', () => { mouse.x = null; mouse.y = null; });
      cancelAnimationFrame(animationFrameId);
    };
  }, []);


  return (
    <div className="overflow-x-clip">
      {/* Hero Section */}
      <section className="relative text-center py-24 md:py-32 px-4 overflow-hidden h-screen flex flex-col justify-center items-center">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0"></canvas>
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950/0 via-gray-950/50 to-gray-950"></div>
        <div className="container mx-auto relative z-10">
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight animate__animated animate__fadeInDown [text-wrap:balance]">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text" style={{filter: `drop-shadow(0 0 25px rgba(34, 211, 238, 0.6))`}}>
              {T.appName}
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-10 animate__animated animate__fadeInUp animate__delay-05s [text-wrap:balance]">
            {T.landingSubtitle}
          </p>
          <button
            onClick={onNavigate}
            className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-lg transform hover:scale-105 transition-all duration-300 text-lg focus:outline-none focus:ring-4 focus:ring-cyan-500/50 animate__animated animate__fadeInUp animate__delay-1s animate-pulse-shadow shine-effect"
          >
            {T.landingCTA}
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 bg-transparent overflow-hidden">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(34,211,238,0.05)_0%,_transparent_40%)]" aria-hidden="true"></div>
        <div className="container mx-auto px-4 relative">
          <h2 className="text-4xl font-bold text-center text-white mb-16 animate__animated animate__fadeInUp">{T.landingFeaturesTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              delay="animate__delay-0s"
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M12 6V3m0 18v-3" /></svg>}
              title={T.feature1Title}
            >
              {T.feature1Desc}
            </FeatureCard>
            <FeatureCard
              delay="animate__delay-05s"
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
              title={T.feature2Title}
            >
              {T.feature2Desc}
            </FeatureCard>
            <FeatureCard
              delay="animate__delay-1s"
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>}
              title={T.feature3Title}
            >
              {T.feature3Desc}
            </FeatureCard>
          </div>
        </div>
      </section>
      
        {/* Why Choose Us Section */}
        <section className="py-20 px-4 bg-gray-900/50">
            <div className="container mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="animate__animated animate__fadeInLeft">
                        <div className="relative w-full max-w-md mx-auto">
                             <div className="absolute -inset-2 bg-gradient-to-r from-cyan-600 to-blue-700 rounded-full blur-xl opacity-20"></div>
                             <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
                                <defs>
                                    <linearGradient id="why-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#22d3ee" />
                                        <stop offset="100%" stopColor="#3b82f6" />
                                    </linearGradient>
                                </defs>
                                <path fill="url(#why-grad)" fillOpacity="0.1" d="M51.9,-54.9C65,-40.4,72.1,-20.2,71.5,-0.6C70.9,19,62.6,38,48.5,50.1C34.4,62.2,14.5,67.3,-5.7,68.8C-25.9,70.2,-52.1,68,-63.9,55.1C-75.7,42.2,-73.1,18.6,-66.8,-2C-60.5,-22.6,-50.5,-40.2,-37.2,-54.3C-23.9,-68.4,-7.3,-79,10.2,-80.7C27.7,-82.4,55.4,-76,51.9,-54.9Z" transform="translate(100 100)" />
                                {/* Icon representing shield, automation, and speed */}
                                <g transform="translate(100 100) scale(0.6)" fill="none" stroke="url(#why-grad)" strokeWidth="5">
                                    {/* Shield */}
                                    <path d="M 0 -50 L -45 0 L 0 50 L 45 0 Z" />
                                    {/* Gear (Automation) */}
                                    <circle cx="0" cy="0" r="20" />
                                    <path d="M 0 -25 L 0 -15 M 0 15 L 0 25 M -25 0 L -15 0 M 15 0 L 25 0 M -17.7 -17.7 L -10.6 -10.6 M 10.6 10.6 L 17.7 17.7 M -17.7 17.7 L -10.6 10.6 M 10.6 -10.6 L 17.7 -17.7" />
                                    {/* Arrow (Speed/Acceleration) */}
                                    <path d="M -10 -5 L 0 5 L 10 -5" transform="translate(0, 5)"/>
                                </g>
                            </svg>
                        </div>
                    </div>
                    <div className="animate__animated animate__fadeInRight">
                        <h2 className="text-4xl font-bold text-white mb-8">{T.whyChooseUsTitle}</h2>
                        <ul className="space-y-6">
                            <li className="flex items-start">
                                <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400 mt-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-lg font-semibold text-white">{T.why1Title}</h3>
                                    <p className="text-gray-400">{T.why1Desc}</p>
                                </div>
                            </li>
                            <li className="flex items-start">
                                <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400 mt-1">
                                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4-8-4V7m8 4v10" /></svg>
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-lg font-semibold text-white">{T.why2Title}</h3>
                                    <p className="text-gray-400">{T.why2Desc}</p>
                                </div>
                            </li>
                            <li className="flex items-start">
                                <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400 mt-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.085a2 2 0 00-1.736.93L5 10m7 0a2 2 0 002 2h2.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20" /></svg>
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-lg font-semibold text-white">{T.why3Title}</h3>
                                    <p className="text-gray-400">{T.why3Desc}</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>


      {/* How It Works Section */}
       <section className="py-20 px-4 bg-transparent">
        <div className="container mx-auto">
            <h2 className="text-4xl font-bold text-white mb-16 text-center animate__animated animate__fadeInUp">{T.landingHowItWorksTitle}</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="relative">
                    <div className="absolute left-5 top-5 h-[calc(100%-2.5rem)] w-0.5 bg-gradient-to-b from-cyan-700/50 via-gray-700/50 to-transparent hidden md:block" aria-hidden="true"></div>
                    <div className="space-y-12 md:space-y-16">
                        <HowItWorksStep num="1" title={T.step1Title} delay="animate__delay-0s">
                            {T.step1Desc}
                        </HowItWorksStep>
                        <HowItWorksStep num="2" title={T.step2Title} delay="animate__delay-05s">
                            {T.step2Desc}
                        </HowItWorksStep>
                        <HowItWorksStep num="3" title={T.step3Title} delay="animate__delay-1s">
                            {T.step3Desc}
                        </HowItWorksStep>
                    </div>
                </div>
                <div className="relative animate__animated animate__fadeInUp animate__delay-05s">
                    <div className="absolute -inset-2 md:-inset-4 bg-gradient-to-r from-cyan-600 to-blue-700 rounded-full blur-3xl opacity-20"></div>
                    <div className="relative p-2 bg-gray-900/50 rounded-xl border border-white/10 shadow-2xl">
                        <img 
                            src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhNs9_-qBn3rpUEhrj-K5Lfi4czvBQLZTWx0jV-eNHJG9rm8q_1Ke4HmD906DlN4GhUBjw5NWmNAi4IjdmPKtxCpGSH5ohfAH0-dy3KVP1obzqdvCtiyKjOJqYTcMnzuoJxd6X5dgyYtsorP5pFKrKrQaMvvKjO3KOF0vjVRjM84tQ8aBbUnC4Sj8oLAVw/s1600/Screenshot%202025-11-10%20165754.png" 
                            alt="Analysis Results Screenshot" 
                            className="rounded-lg w-full h-auto"
                        />
                    </div>
                </div>
            </div>
        </div>
      </section>

       {/* Final CTA Section */}
      <section className="relative text-center py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-grid-cyan-500/10 [mask-image:radial-gradient(ellipse_at_center,transparent_40%,black)]"></div>
        <div className="container mx-auto relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 animate__animated animate__fadeInUp [text-wrap:balance]">
            {T.finalCtaTitle}
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-10 animate__animated animate__fadeInUp animate__delay-05s [text-wrap:balance]">
            {T.finalCtaDesc}
          </p>
          <button
            onClick={onNavigate}
            className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-lg transform hover:scale-105 transition-all duration-300 text-lg focus:outline-none focus:ring-4 focus:ring-cyan-500/50 animate__animated animate__fadeInUp animate__delay-1s animate-pulse-shadow shine-effect"
          >
            {T.finalCtaButton}
          </button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;