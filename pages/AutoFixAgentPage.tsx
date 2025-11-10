import React, { useState } from 'react';
import { Translation } from '../translations';

interface AutoFixAgentPageProps {
  T: Translation;
}

const AutoFixAgentPage: React.FC<AutoFixAgentPageProps> = ({ T }) => {
  const [code, setCode] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyze = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
    }, 2000);
  };

  return (
    <div className="container mx-auto px-6 lg:px-8 py-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          {T.autoFixAgentTab}
        </h1>
        <div className="bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-8">
          <p className="text-gray-300 mb-6">{T.autoFixDescription}</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {T.uploadCode}
              </label>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 font-mono text-sm"
                rows={15}
                placeholder={T.autoFixPlaceholder}
              />
            </div>
            <button
              onClick={handleAnalyze}
              disabled={analyzing || !code}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {analyzing ? T.analyzing : T.analyzeAndFix}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoFixAgentPage;
