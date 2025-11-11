
import React from 'react';
import { Translation } from '../translations';
import firebase from 'firebase/compat/app';
import AccountOverviewPage from './account/AccountOverviewPage';
import AccountActivityPage from './account/AccountActivityPage';
import AccountSettingsPage from './account/AccountSettingsPage';

type AccountTab = 'account-overview' | 'account-activity' | 'account-settings';

interface AccountPageProps {
    T: Translation;
    user: firebase.User;
    activeTab: AccountTab;
    onNavigate: (tab: any) => void;
}

const AccountPage: React.FC<AccountPageProps> = ({ T, user, activeTab, onNavigate }) => {
    
    const SideNavLink: React.FC<{ tab: AccountTab, label: string }> = ({ tab, label }) => {
        const isActive = activeTab === tab;
        return (
            <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(tab);
                }}
                className={`block px-3 py-1.5 text-sm rounded-md transition-colors ${
                    isActive ? 'font-semibold text-white' : 'text-gray-400 hover:text-white'
                }`}
            >
                {label}
            </a>
        );
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'account-overview':
                return <AccountOverviewPage T={T} user={user} />;
            case 'account-activity':
                return <AccountActivityPage T={T} user={user} />;
            case 'account-settings':
                return <AccountSettingsPage T={T} user={user} />;
            default:
                return <AccountOverviewPage T={T} user={user} />;
        }
    };
    
    return (
        <div className="bg-black text-white min-h-[calc(100vh-65px)]">
            <div className="border-b border-gray-800">
                <div className="container mx-auto px-4 lg:px-6 py-4">
                    {/* Sub-navigation Tabs for Account */}
                    <div className="flex items-center border-b border-gray-800 text-sm">
                         <a href="#" onClick={(e) => {e.preventDefault(); onNavigate('account-overview')}} className={`px-1 py-2 border-b-2 ${activeTab === 'account-overview' ? 'border-white text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>Overview</a>
                         <a href="#" onClick={(e) => {e.preventDefault(); onNavigate('account-activity')}} className={`ml-6 px-1 py-2 border-b-2 ${activeTab === 'account-activity' ? 'border-white text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>Activity</a>
                         <a href="#" onClick={(e) => {e.preventDefault(); onNavigate('account-settings')}} className={`ml-6 px-1 py-2 border-b-2 ${activeTab === 'account-settings' ? 'border-white text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>Settings</a>
                    </div>
                </div>
            </div>
            
            <div className="container mx-auto px-4 lg:px-6 py-8">
                {renderContent()}
            </div>
        </div>
    );
};

export default AccountPage;
