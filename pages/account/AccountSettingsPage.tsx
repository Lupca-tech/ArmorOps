
import React, { useState } from 'react';
import { Translation } from '../../translations';
import firebase from 'firebase/compat/app';

interface AccountSettingsPageProps {
    T: Translation;
    user: firebase.User;
}

const AccountSettingsPage: React.FC<AccountSettingsPageProps> = ({ T, user }) => {
    const [displayName, setDisplayName] = useState(user.displayName || '');
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [error, setError] = useState('');

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        // Return early if there's no change or the name is just whitespace
        if (!displayName.trim() || displayName.trim() === (user.displayName || '').trim()) {
            return;
        }

        setIsSaving(true);
        setSaveStatus('idle');
        setError('');

        try {
            await user.updateProfile({ displayName: displayName.trim() });
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (err) {
            console.error("Error updating profile:", err);
            setError("Failed to update profile. Please try again.");
            setSaveStatus('error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-10 animate-fade-in">
            <h2 className="text-2xl font-bold text-white">Account Settings</h2>
            
            {/* Avatar Section */}
            <section className="p-6 bg-gray-950 rounded-lg border border-gray-800">
                <h3 className="text-lg font-semibold mb-4 border-b border-gray-800 pb-3">Avatar</h3>
                <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                         {user.photoURL ? (
                            <img src={user.photoURL} alt="User avatar" className="h-20 w-20 rounded-full object-cover" />
                        ) : (
                            <span className="h-20 w-20 flex items-center justify-center bg-gray-800 rounded-full text-3xl font-semibold">
                                {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                            </span>
                        )}
                    </div>
                    <div className="text-sm">
                        <p className="text-gray-300">This is your avatar.</p>
                        <p className="text-gray-400 mt-1">Click on the avatar to upload a custom one from your files.</p>
                        <p className="text-gray-500 mt-2">An avatar is optional but strongly recommended.</p>
                    </div>
                </div>
            </section>

            {/* Display Name Section */}
            <form onSubmit={handleSave}>
                <section className="p-6 bg-gray-950 rounded-lg border border-gray-800">
                    <div className="md:flex md:justify-between md:items-start">
                         <div>
                            <h3 className="text-lg font-semibold">Display Name</h3>
                            <p className="text-sm text-gray-400 mt-1 max-w-md">Please use 32 characters at maximum.</p>
                        </div>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            maxLength={32}
                            className="mt-4 md:mt-0 w-full md:w-1/2 bg-black border border-gray-700 rounded-md py-2 px-3 text-white focus:ring-cyan-500 focus:border-cyan-500"
                        />
                    </div>
                    <footer className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center">
                        <div className="text-sm text-gray-500 h-5">
                            {saveStatus === 'success' && <span className="text-green-400 animate-fade-in">Successfully saved!</span>}
                            {saveStatus === 'error' && <span className="text-red-400">{error}</span>}
                        </div>
                        <button
                            type="submit"
                            disabled={isSaving || displayName.trim() === (user.displayName || '').trim()}
                            className="px-4 py-2 text-sm font-medium rounded-md transition-colors bg-white text-black hover:bg-gray-200 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
                        >
                           {isSaving ? 'Saving...' : 'Save'}
                        </button>
                    </footer>
                </section>
            </form>
             {/* Email Address Section */}
            <section className="p-6 bg-gray-950 rounded-lg border border-gray-800">
                <div className="md:flex md:justify-between md:items-start">
                        <div>
                        <h3 className="text-lg font-semibold">Email Address</h3>
                        <p className="text-sm text-gray-400 mt-1 max-w-md">Your email address cannot be changed.</p>
                    </div>
                    <input
                        type="email"
                        value={user.email || ''}
                        disabled
                        className="mt-4 md:mt-0 w-full md:w-1/2 bg-black border border-gray-700 rounded-md py-2 px-3 text-gray-400 cursor-not-allowed"
                    />
                </div>
            </section>
        </div>
    );
};
export default AccountSettingsPage;
