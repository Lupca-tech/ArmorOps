import React from 'react';
import { Translation } from '../translations';

interface AboutPageProps {
  T: Translation;
}

const AboutPage: React.FC<AboutPageProps> = ({ T }) => {
  return (
    <div className="container mx-auto px-6 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          {T.aboutTab}
        </h1>
        <div className="bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">{T.aboutTitle}</h2>
            <p className="text-gray-300 leading-relaxed">{T.aboutDescription}</p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">{T.missionTitle}</h2>
            <p className="text-gray-300 leading-relaxed">{T.missionDescription}</p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">{T.contactTitle}</h2>
            <p className="text-gray-300">
              <a href="mailto:admin@devsecopsstory.com" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                admin@devsecopsstory.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
