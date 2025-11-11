
import React from 'react';
import { Translation } from '../../translations';
import firebase from 'firebase/compat/app';

interface AccountOverviewPageProps {
    T: Translation;
    user: firebase.User;
}

const AccountOverviewPage: React.FC<AccountOverviewPageProps> = ({ T, user }) => {
    return (
        <div className="space-y-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-white">{T.accountOverviewTitle}</h2>
            
            <div className="p-6 bg-gray-950 rounded-lg border border-gray-800">
                <h3 className="text-lg font-semibold mb-4 border-b border-gray-800 pb-3">{T.teams}</h3>
                <p className="text-sm text-gray-400 mb-4">{T.teamsDesc}</p>
                 <div className="relative">
                    <input type="search" placeholder={T.searchTeamPlaceholder} className="w-full bg-black border border-gray-700 rounded-md py-2 pl-10 pr-4 text-white focus:ring-cyan-500 focus:border-cyan-500" />
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                 </div>
                <div className="mt-4 flex items-center justify-between p-3 bg-gray-900/50 rounded-md hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                         <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center font-bold">
                           {(user.email || 'U').charAt(0).toUpperCase()}
                         </div>
                         <span className="font-medium">{T.userProjects(user.email?.split('@')[0] || 'User')}</span>
                    </div>
                     <div className="flex items-center gap-4">
                        <span className="text-xs font-medium text-gray-400 bg-gray-800 px-2 py-1 rounded-full">{T.hobby}</span>
                        <span className="text-sm text-gray-500">{T.owner}</span>
                     </div>
                </div>
            </div>
             <div className="p-6 bg-gray-950 rounded-lg border border-gray-800">
                <h3 className="text-lg font-semibold mb-4">{T.domains}</h3>
                <p className="text-sm text-gray-400">{T.noDomainsFound}</p>
            </div>
        </div>
    );
};

export default AccountOverviewPage;