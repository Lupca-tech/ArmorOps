import React from 'react';
import { Translation } from '../translations';
import firebase from 'firebase/compat/app';

interface AdminPageProps {
  T: Translation;
  lang: string;
  user: firebase.User;
}

const AdminPage: React.FC<AdminPageProps> = ({ T, lang, user }) => {
  return (
    <div className="container mx-auto px-6 lg:px-8 py-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          {T.adminTab}
        </h1>
        <div className="bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-8">
          <p className="text-gray-300 mb-6">Welcome, {user.email}</p>
          <div className="space-y-4">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-3">{T.adminDashboard}</h3>
              <p className="text-gray-400">{T.adminDescription}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
