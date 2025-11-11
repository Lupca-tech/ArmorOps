import React from 'react';
import { Translation } from '../translations';

interface AboutPageProps {
  T: Translation;
}

const PainPointCard: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 text-center transition-all transform hover:scale-105 hover:border-red-500/50">
    <h3 className="text-xl font-semibold text-red-400 mb-2">{title}</h3>
    <p className="text-gray-400">{children}</p>
  </div>
);

const DataVizCard: React.FC<{ icon: React.ReactNode, title: string, value: string, children: React.ReactNode }> = ({ icon, title, value, children }) => (
  <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 hover:border-cyan-500/50 hover:bg-gray-800 transition-all transform hover:-translate-y-1">
    <div className="flex items-center gap-4">
        <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
        {icon}
        </div>
        <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text">{value}</p>
        </div>
    </div>
    <p className="text-gray-400 mt-4">{children}</p>
  </div>
);


const AboutPage: React.FC<AboutPageProps> = ({ T }) => {
  return (
    <div className="animate-fade-in-up">
      {/* Hero Section */}
      <section className="text-center py-20 px-4 bg-gray-900/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-cyan-500/10 [mask-image:linear-gradient(to_bottom,white_5%,transparent_50%)]"></div>
        <div className="container mx-auto relative z-10">
          <div className="max-w-md mx-auto mb-8">
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="mx-auto h-32 w-32">
              <defs>
                <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
              <path fill="url(#shieldGradient)" fillOpacity="0.1" d="M49.8,-57.4C63.6,-45,73.4,-27.1,76.1,-8.3C78.8,10.5,74.4,30.3,62.8,44.9C51.2,59.5,32.4,69,14.1,72.4C-4.3,75.8,-22.2,73.2,-38.7,64.8C-55.2,56.4,-70.2,42.2,-77.2,25.4C-84.1,8.6,-82.9,-10.8,-74.6,-26.3C-66.3,-41.8,-50.9,-53.4,-35.3,-60.7C-19.6,-68.1,-3.8,-71.2,11.5,-68.1C26.8,-65.1,49.8,-57.4,49.8,-57.4Z" transform="translate(100 100)" />
              <path d="M100 25 L35 55 L35 125 L100 155 L165 125 L165 55 Z" stroke="url(#shieldGradient)" strokeWidth="4" fill="none" />
              <polyline points="100,55 100,125" stroke="url(#shieldGradient)" strokeWidth="2" />
              <polyline points="67,75 100,55 133,75" stroke="url(#shieldGradient)" strokeWidth="2" />
              <polyline points="67,105 100,125 133,105" stroke="url(#shieldGradient)" strokeWidth="2" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 [text-wrap:balance]">
            {T.aboutHeroTitle}
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto [text-wrap:balance]">
            {T.aboutHeroSubtitle}
          </p>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="py-20 bg-gray-800/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-12">{T.aboutValuesTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <PainPointCard title={T.value1Title}>{T.value1Desc}</PainPointCard>
            <PainPointCard title={T.value2Title}>{T.value2Desc}</PainPointCard>
            <PainPointCard title={T.value3Title}>{T.value3Desc}</PainPointCard>
          </div>
          
          <div className="my-12 flex justify-center">
             <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-cyan-400 rotate-90 md:rotate-0">
                <path d="M12 4L12 20" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18 14L12 20L6 14" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <div className="max-w-3xl mx-auto bg-gray-900/50 backdrop-blur-sm p-8 rounded-xl border border-cyan-500/50 shadow-lg">
             <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                <div className="flex-shrink-0">
                    <svg viewBox="0 0 24 24" className="h-16 w-16 text-cyan-400" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15.93,12.08 C15.75,12.26 15.5,12.35 15.25,12.35 C15,12.35 14.75,12.26 14.57,12.08 L12,9.5 L9.43,12.08 C9.08,12.42 8.5,12.42 8.15,12.08 C7.8,11.73 7.8,11.15 8.15,10.8 L11.4,7.55 C11.75,7.2 12.33,7.2 12.68,7.55 L15.93,10.8 C16.28,11.15 16.28,11.73 15.93,12.08 Z" fill="currentColor"/>
                        <path d="M21,12 C21,16.97 16.97,21 12,21 C7.03,21 3,16.97 3,12 C3,7.03 7.03,3 12,3 C16.97,3 21,7.03 21,12 Z M5,12 C5,15.87 8.13,19 12,19 C15.87,19 19,15.87 19,12 C19,8.13 15.87,5 12,5 C8.13,5 5,8.13 5,12 Z" fill="currentColor"/>
                    </svg>
                </div>
                <div className="text-center md:text-left">
                    <h3 className="text-2xl font-semibold text-white mb-2">{T.solutionTitle}</h3>
                    <p className="text-gray-300">{T.solutionDesc}</p>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Data Visualization Section */}
      <section className="py-20 px-4">
         <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-white mb-12">{T.dataVizTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <DataVizCard
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
              title={T.viz1Title}
              value="99.99%"
            >
              {T.viz1Desc}
            </DataVizCard>
            <DataVizCard
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>}
              title={T.viz2Title}
              value=">80%"
            >
              {T.viz2Desc}
            </DataVizCard>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;