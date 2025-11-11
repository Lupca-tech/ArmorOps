import React from 'react';
import { Translation } from '../translations';

interface NotFoundPageProps {
    T: Translation;
    onNavigateHome: () => void;
}

const NotFoundPage: React.FC<NotFoundPageProps> = ({ T, onNavigateHome }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center px-4 animate-fade-in-up">
            <div className="relative">
                <h1 className="text-9xl font-extrabold text-gray-800 tracking-widest" aria-label="404 Error">
                    404
                </h1>
                <div className="bg-cyan-500 px-2 text-sm rounded rotate-12 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    {T.notFoundTitle}
                </div>
            </div>
            <p className="mt-4 text-2xl font-semibold text-white">{T.notFoundSubtitle}</p>
            <p className="mt-2 text-gray-400 max-w-sm mx-auto">{T.notFoundMessage}</p>
            <button
                onClick={onNavigateHome}
                className="mt-8 px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-lg transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-cyan-500/50"
            >
                {T.notFoundButton}
            </button>
        </div>
    );
};

export default NotFoundPage;
