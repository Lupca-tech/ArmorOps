import React from 'react';
import { Translation } from '../translations';
import firebase from 'firebase/compat/app';

interface PublicRulesPageProps {
  T: Translation;
  user: firebase.User | null;
  isAuthReady: boolean;
  onNavigate: (tab: any) => void;
}

const PublicRulesPage: React.FC<PublicRulesPageProps> = ({ T, user, isAuthReady, onNavigate }) => {
  return (
    <div className="container mx-auto px-6 lg:px-8 py-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          {T.rulesTab}
        </h1>
        <div className="bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-8">
          <p className="text-gray-300 mb-6">{T.rulesDescription}</p>
          <div className="space-y-4">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-3">{T.sampleRuleTitle}</h3>
              <p className="text-gray-400">{T.sampleRuleDescription}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicRulesPage;
