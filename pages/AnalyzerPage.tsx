import React from 'react';
import { Translation } from '../translations';
import firebase from 'firebase/compat/app';

interface AnalyzerPageProps {
  T: Translation;
  lang: string;
  user: firebase.User | null;
  isAuthReady: boolean;
}

const AnalyzerPage: React.FC<AnalyzerPageProps> = ({ T, lang, user, isAuthReady }) => {
  return (
    <div className="container mx-auto px-6 lg:px-8 py-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          {T.analyzerTab}
        </h1>
        <div className="bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-8">
          <p className="text-gray-300 mb-6">{T.analyzerDescription}</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {T.uploadCode}
              </label>
              <textarea
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                rows={10}
                placeholder={T.codePlaceholder}
              />
            </div>
            <button className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105">
              {T.analyzeButton}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyzerPage;
