import React, { useState } from 'react';
import { Translation } from '../translations';

interface AutoFixAgentPageProps {
  T: Translation;
}

// Icons for features
const FeatureIconPRFinal = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V7.618a1 1 0 01.553-.894L9 4m0 16v-8m0-8v8m0 8h11.447a1 1 0 00.894-.553L22 12l-1.659-3.317a1 1 0 00-.894-.553H9m0-8l5.447 2.724A1 1 0 0115 7.618v8.764a1 1 0 01-.553.894L9 20" />
    </svg>
);

const FeatureIconIntegration = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const FeatureIconMTTR = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 12l-4 4m0 0l-4-4m4 4V8" />
    </svg>
);


// Hero visual SVG
const HeroVisual: React.FC<{T: Translation}> = ({T}) => (
  <svg viewBox="0 0 400 200" className="w-full max-w-2xl mx-auto my-8">
    <defs>
      <linearGradient id="autoFixTealGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{stopColor: '#2dd4bf', stopOpacity: 1}} />
        <stop offset="100%" style={{stopColor: '#06b6d4', stopOpacity: 1}} />
      </linearGradient>
      <linearGradient id="autoFixGreenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{stopColor: '#34d399', stopOpacity: 1}} />
        <stop offset="100%" style={{stopColor: '#10b981', stopOpacity: 1}} />
      </linearGradient>
      <style>
        {`
          .dash-animate {
            stroke-dasharray: 1000;
            stroke-dashoffset: 1000;
            animation: draw-path 4s ease-out forwards;
          }
          @keyframes draw-path {
            to {
              stroke-dashoffset: 0;
            }
          }
          .node {
            opacity: 0;
            animation: fade-in-node 0.5s ease-out forwards;
          }
          @keyframes fade-in-node {
            to {
              opacity: 1;
            }
          }
        `}
      </style>
    </defs>

    {/* Path */}
    <path d="M 50 100 C 50 20, 150 20, 150 100 S 250 180, 250 100 S 350 20, 350 100" stroke="url(#autoFixTealGradient)" strokeWidth="2" fill="none" className="dash-animate" />

    {/* Bug Icon */}
    <g transform="translate(40, 90)" className="node" style={{animationDelay: '0.2s'}}>
      <circle cx="10" cy="10" r="10" fill="#ef4444" />
      <path d="M 6 6 L 14 14 M 14 6 L 6 14" stroke="white" strokeWidth="2" />
      <text x="10" y="35" fill="white" fontSize="10" textAnchor="middle">{T.autoFixVisualBug}</text>
    </g>

    {/* AI Agent Icon */}
    <g transform="translate(140, 90)" className="node" style={{animationDelay: '1.2s'}}>
      <circle cx="10" cy="10" r="10" fill="url(#autoFixTealGradient)" />
      <path d="M 8 9 L 12 13 L 12 7 L 8 11" stroke="white" strokeWidth="1.5" fill="none" transform="rotate(45 10 10)" />
       <text x="10" y="35" fill="white" fontSize="10" textAnchor="middle">{T.autoFixVisualAgent}</text>
    </g>
    
    {/* PR Icon */}
    <g transform="translate(240, 90)" className="node" style={{animationDelay: '2.2s'}}>
      <circle cx="10" cy="10" r="10" fill="url(#autoFixGreenGradient)" />
      <path d="M 7 10 L 9 12 L 13 8" stroke="white" strokeWidth="2" fill="none" />
      <text x="10" y="35" fill="white" fontSize="10" textAnchor="middle">{T.autoFixVisualPR}</text>
    </g>
    
    {/* Deployed Icon */}
     <g transform="translate(340, 90)" className="node" style={{animationDelay: '3.2s'}}>
      <circle cx="10" cy="10" r="10" fill="white" />
      <path d="M10 2L18 7L10 12L2 7z" stroke="url(#autoFixGreenGradient)" strokeWidth="1.5" fill="url(#autoFixGreenGradient)" fillOpacity="0.5"/>
       <path d="M2 7v6l8 5 8-5V7" stroke="url(#autoFixGreenGradient)" strokeWidth="1.5" fill="none"/>
       <text x="10" y="35" fill="white" fontSize="10" textAnchor="middle">{T.autoFixVisualDeployed}</text>
    </g>

  </svg>
);

const AutoFixAgentPage: React.FC<AutoFixAgentPageProps> = ({ T }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [title, setTitle] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, you'd send this data to a server
        console.log({ name, email, title });
        setSubmitted(true);
    };

    return (
        <div className="font-sans antialiased animate-fade-in-up">
            {/* Hero Section */}
            <section className="text-center py-16 md:py-24 px-6">
                <div className="container mx-auto">
                    <h1 className="text-4xl md:text-6xl font-extrabold leading-tight [text-wrap:balance]">
                        <span className="bg-gradient-to-r from-teal-400 to-cyan-500 text-transparent bg-clip-text">{T.autoFixHeroTitle}</span><br /> {T.autoFixHeroSubheading}
                    </h1>
                    <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mt-6 [text-wrap:balance]">
                        {T.autoFixHeroSubtitle}
                    </p>
                    <HeroVisual T={T}/>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 md:py-20 bg-gray-900/50">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="flex flex-col items-center text-center p-6 border border-transparent rounded-lg hover:border-white/10 hover:bg-gray-800/50 transition-colors">
                            <FeatureIconPRFinal />
                            <h3 className="text-xl font-semibold mt-4 mb-2">{T.autoFixFeature1Title}</h3>
                            <p className="text-gray-400">{T.autoFixFeature1Desc}</p>
                        </div>
                        <div className="flex flex-col items-center text-center p-6 border border-transparent rounded-lg hover:border-white/10 hover:bg-gray-800/50 transition-colors">
                            <FeatureIconIntegration />
                            <h3 className="text-xl font-semibold mt-4 mb-2">{T.autoFixFeature2Title}</h3>
                            <p className="text-gray-400">{T.autoFixFeature2Desc}</p>
                        </div>
                        <div className="flex flex-col items-center text-center p-6 border border-transparent rounded-lg hover:border-white/10 hover:bg-gray-800/50 transition-colors">
                            <FeatureIconMTTR />
                            <h3 className="text-xl font-semibold mt-4 mb-2">{T.autoFixFeature3Title}</h3>
                            <p className="text-gray-400">{T.autoFixFeature3Desc}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section id="early-access" className="py-20 md:py-24 bg-gradient-to-br from-cyan-900/50 to-gray-950">
                <div className="container mx-auto px-6">
                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-2xl p-8 md:p-12 max-w-3xl mx-auto border border-white/10">
                        {submitted ? (
                            <div className="text-center animate-fade-in-up">
                                <h2 className="text-3xl font-bold text-white">{T.autoFixCtaSuccessTitle}</h2>
                                <p className="text-gray-300 mt-4">{T.autoFixCtaSuccessDesc}</p>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-3xl font-bold text-center text-white">{T.autoFixCtaTitle}</h2>
                                <p className="text-center text-gray-400 mt-2 mb-8">{T.autoFixCtaSubtitle}</p>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-300">{T.autoFixCtaFormName}</label>
                                        <input
                                            type="text"
                                            id="name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-teal-500 focus:border-teal-500"
                                            aria-label={T.autoFixCtaFormName}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-bold text-gray-200">{T.autoFixCtaFormEmail}</label>
                                        <input
                                            type="email"
                                            id="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-teal-500 focus:border-teal-500"
                                            aria-label={T.autoFixCtaFormEmail}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="title" className="block text-sm font-medium text-gray-300">{T.autoFixCtaFormTitle}</label>
                                        <input
                                            type="text"
                                            id="title"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            required
                                            className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-teal-500 focus:border-teal-500"
                                            aria-label={T.autoFixCtaFormTitle}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full py-3 px-6 border border-transparent rounded-md shadow-sm text-lg font-bold text-white bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 focus:ring-offset-gray-800 transition-transform transform hover:scale-105"
                                    >
                                        {T.autoFixCtaFormButton}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AutoFixAgentPage;