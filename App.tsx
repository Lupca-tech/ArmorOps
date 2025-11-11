import React, { useState, useEffect, useRef } from 'react';
import { TRANSLATIONS, Language, Translation } from './translations';
import { auth } from './services/firebase';
// Fix: Use firebase v9 compat library to resolve module export errors.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

// Import Pages
import LandingPage from './components/LandingPage';
import AnalyzerPage from './pages/AnalyzerPage';
import PublicRulesPage from './pages/PublicRulesPage';
import AdminPage from './pages/AdminPage';
import AboutPage from './pages/AboutPage';
import AuthPage from './pages/AuthPage';
import AutoFixAgentPage from './pages/AutoFixAgentPage';

type Tab = 'home' | 'analyzer' | 'rules' | 'admin' | 'about' | 'auth' | 'autofix';

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('vi');
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [user, setUser] = useState<firebase.User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(currentUser => {
      setUser(currentUser);
      setIsAuthReady(true);
      if (!currentUser && (activeTab === 'admin')) {
        setActiveTab('home');
      }
    });
    return () => unsubscribe();
  }, [activeTab]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const T = TRANSLATIONS[lang];

  const handleNavigate = (tab: Tab) => {
    setIsMobileMenuOpen(false); // Close mobile menu on navigation
    if (tab === 'admin' && !user) {
      setActiveTab('auth');
    } else {
      setActiveTab(tab);
    }
  };

  const NavButton: React.FC<{ tab: Tab; T: string }> = ({ tab, T }) => (
    <button
      onClick={() => handleNavigate(tab)}
      className={`relative px-3 py-2 text-sm font-medium rounded-md transition-colors duration-300 group ${
        activeTab === tab
          ? 'text-white'
          : 'text-gray-300 hover:text-white'
      }`}
    >
      <span>{T}</span>
      <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out ${activeTab === tab ? 'scale-x-100' : ''}`}></span>
    </button>
  );

  const MobileNavButton: React.FC<{ tab: Tab; T: string }> = ({ tab, T }) => (
    <button
      onClick={() => handleNavigate(tab)}
      className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
        activeTab === tab
          ? 'bg-cyan-600 text-white'
          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
      }`}
    >
      {T}
    </button>
  );
  
  const FooterLink: React.FC<{ tab: Tab, T: string, isVisible?: boolean }> = ({ tab, T, isVisible = true }) => {
    if (!isVisible) return null;
    return (
        <button onClick={() => handleNavigate(tab)} className="text-gray-400 hover:text-cyan-400 transition-colors duration-200">
            {T}
        </button>
    );
  };


  const renderPage = () => {
    switch (activeTab) {
      case 'home':
        return <LandingPage onNavigate={() => handleNavigate('analyzer')} T={T} />;
      case 'analyzer':
        return <AnalyzerPage T={T} lang={lang} user={user} isAuthReady={isAuthReady} />;
      case 'rules':
        return <PublicRulesPage T={T} user={user} isAuthReady={isAuthReady} onNavigate={handleNavigate} />;
      case 'admin':
        return user ? <AdminPage T={T} lang={lang} user={user} /> : <AuthPage onAuthSuccess={() => setActiveTab('admin')} T={T} />;
      case 'about':
        return <AboutPage T={T} />;
      case 'autofix':
        return <AutoFixAgentPage T={T} user={user} />;
      case 'auth':
        return <AuthPage onAuthSuccess={() => setActiveTab('analyzer')} T={T} />;
      default:
        return <LandingPage onNavigate={() => handleNavigate('analyzer')} T={T} />;
    }
  };

  return (
    <div className="bg-gray-950 text-gray-50 min-h-screen font-sans flex flex-col">
      <header className="bg-gray-950/70 backdrop-blur-lg sticky top-0 z-40 border-b border-white/10 shadow-lg shadow-black/10">
        <nav className="container mx-auto px-4 lg:px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
            <img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEh7bwXvRLw1W1pC4ELStNRzdFy9np5GySTIL61wkMIsRD9Axbq4mIvcwAebK_U-V3Tpp6v9tAC3n0NdudSXEryvP3qvXnjFH_K7xaeJ4z6BO89H9RBujmBI993EYZA-eIdONsqs6lh4Mu0WT6DV35Q_rH0PHsS784zVEF_oN54GDfKKPavZ3RdmcA65mTA/s1920/logo.png" alt="ArmorOps Logo" className="h-9 w-auto" />
            <span className="text-xl font-bold text-white tracking-wide">{T.appName}</span>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <NavButton tab="home" T={T.homeTab} />
            <NavButton tab="analyzer" T={T.analyzerTab} />
            <NavButton tab="autofix" T={T.autoFixAgentTab} />
            <NavButton tab="rules" T={T.rulesTab} />
            {user && <NavButton tab="admin" T={T.adminTab} />}
            <NavButton tab="about" T={T.aboutTab} />
          </div>
          <div className="flex items-center gap-4">
             <div className="relative">
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as Language)}
                aria-label={T.languageSelectorLabel}
                className="bg-gray-800 border border-gray-700 text-white text-sm rounded-md focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 block w-full pl-3 pr-8 py-1.5 appearance-none"
              >
                <option value="vi">🇻🇳 Tiếng Việt</option>
                <option value="en">🇬🇧 English</option>
              </select>
               <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
            </div>
            {isAuthReady && (
              user ? (
                <div className="relative hidden md:block" ref={profileMenuRef}>
                  <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="flex items-center justify-center h-9 w-9 bg-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-gray-900">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="User avatar" className="h-full w-full rounded-full object-cover" />
                    ) : (
                      <span className="text-sm font-semibold text-white">
                        {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </button>
                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none animate__animated animate__fadeIn animate__faster" role="menu" aria-orientation="vertical" aria-labelledby="menu-button">
                      <div className="py-1" role="none">
                        <div className="px-4 py-2 border-b border-gray-700">
                           <p className="text-sm text-gray-200" role="none">Signed in as</p>
                           <p className="text-sm font-medium text-white truncate" role="none">{user.email}</p>
                        </div>
                        <button onClick={() => { auth.signOut(); setIsProfileMenuOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300" role="menuitem">
                          {T.logout}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden md:block">
                   <button
                      onClick={() => handleNavigate('auth')}
                      className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700 transition-all duration-300 transform hover:scale-105"
                    >
                      {T.login}
                    </button>
                </div>
              )
            )}
            <div className="md:hidden">
              <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  aria-controls="mobile-menu"
                  aria-expanded={isMobileMenuOpen}
              >
                  <span className="sr-only">{isMobileMenuOpen ? T.closeMenu : T.openMenu}</span>
                  {isMobileMenuOpen ? (
                      <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                  ) : (
                      <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                  )}
              </button>
            </div>
          </div>
        </nav>
        {isMobileMenuOpen && (
            <div className="md:hidden" id="mobile-menu">
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                    <MobileNavButton tab="home" T={T.homeTab} />
                    <MobileNavButton tab="analyzer" T={T.analyzerTab} />
                    <MobileNavButton tab="autofix" T={T.autoFixAgentTab} />
                    <MobileNavButton tab="rules" T={T.rulesTab} />
                    {user && <MobileNavButton tab="admin" T={T.adminTab} />}
                    <MobileNavButton tab="about" T={T.aboutTab} />
                    <div className="border-t border-gray-700 my-2"></div>
                     {isAuthReady && (
                        user ? (
                          <button onClick={() => { auth.signOut(); setIsMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-400 hover:bg-gray-700 hover:text-white">
                            {T.logout}
                          </button>
                        ) : (
                           <MobileNavButton tab="auth" T={T.login} />
                        )
                      )}
                </div>
            </div>
        )}
      </header>
      <main className="flex-grow">
        {renderPage()}
      </main>
       <footer className="bg-gray-950/50 py-12 mt-20 border-t border-white/10">
        <div className="container mx-auto px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                {/* Branding/Intro Column */}
                <div className="lg:col-span-1">
                    <div className="flex items-center gap-3 mb-4">
                        <img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEh7bwXvRLw1W1pC4ELStNRzdFy9np5GySTIL61wkMIsRD9Axbq4mIvcwAebK_U-V3Tpp6v9tAC3n0NdudSXEryvP3qvXnjFH_K7xaeJ4z6BO89H9RBujmBI993EYZA-eIdONsqs6lh4Mu0WT6DV35Q_rH0PHsS784zVEF_oN54GDfKKPavZ3RdmcA65mTA/s1920/logo.png" alt="ArmorOps Logo" className="h-9 w-auto" />
                        <span className="text-xl font-bold text-white tracking-wide">{T.appName}</span>
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed mb-4">
                        {T.footerIntro}
                    </p>
                    <a href="mailto:admin@devsecopsstory.com" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-cyan-400 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        <span>admin@devsecopsstory.com</span>
                    </a>
                </div>

                {/* Links Grid */}
                <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-8">
                    {/* Company Column */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">{T.footerCompany}</h3>
                        <ul className="space-y-3">
                            <li><FooterLink tab="about" T={T.aboutTab} /></li>
                        </ul>
                    </div>
                    {/* Product Column */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">{T.footerProduct}</h3>
                        <ul className="space-y-3">
                            <li><FooterLink tab="analyzer" T={T.analyzerTab} /></li>
                            <li><FooterLink tab="autofix" T={T.autoFixAgentTab} /></li>
                            <li><FooterLink tab="rules" T={T.rulesTab} /></li>
                        </ul>
                    </div>
                    {/* Account Column */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">{T.footerAccount}</h3>
                        <ul className="space-y-3">
                            {user ? (
                                <>
                                    <li><FooterLink tab="admin" T={T.adminTab} isVisible={!!user} /></li>
                                    <li>
                                        <button onClick={() => auth.signOut()} className="text-gray-400 hover:text-cyan-400 transition-colors duration-200">
                                            {T.logout}
                                        </button>
                                    </li>
                                </>
                            ) : (
                                <li><FooterLink tab="auth" T={T.login} /></li>
                            )}
                        </ul>
                    </div>
                     {/* Social Column */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">{T.footerCommunity}</h3>
                        <ul className="space-y-3">
                            <li>
                                <a href="https://www.devsecopsstory.com/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-cyan-400 transition-transform duration-300 inline-flex items-center gap-2 group">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    <span>{T.footerBlog}</span>
                                </a>
                            </li>
                            <li>
                                <a href="https://www.tiktok.com/@devsecopsstory" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-cyan-400 transition-transform duration-300 inline-flex items-center gap-2 group">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 16 16"><path d="M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.389 13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3V0Z"/></svg>
                                    <span>TikTok</span>
                                </a>
                            </li>
                            <li>
                                <a href="https://youtube.com/@devsecopsstory" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-cyan-400 transition-transform duration-300 inline-flex items-center gap-2 group">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 16 16"><path d="M8.051 1.999h.089c.822.003 4.987.033 6.11.335a2.01 2.01 0 0 1 1.415 1.42c.101.38.172.883.22 1.402l.01.104.022.26.008.104c.065.914.073 1.77.074 1.957v.075c-.001.188-.009 1.043-.074 1.957l-.008.104-.022.26-.01.104c-.048.519-.119 1.023-.22 1.402a2.01 2.01 0 0 1-1.415 1.42c-1.16.312-5.569.334-6.18.335h-.142c-.309 0-1.587-.006-2.927-.052l-.17-.006-.087-.004-.171-.007-.171-.007c-1.11-.049-2.167-.128-2.654-.26a2.01 2.01 0 0 1-1.415-1.419c-.111-.417-.185-.986-.235-1.558L.09 9.82l-.008-.104A31.4 31.4 0 0 1 0 7.68v-.123c.002-.215.01-.958.064-1.778l.007-.103.003-.052.008-.104.022-.26.01-.104c.048-.519.119-1.023.22-1.402a2.01 2.01 0 0 1 1.415-1.42c.487-.13 1.544-.21 2.654-.26l.17-.007.172-.006.086-.003.171-.007A99.8 99.8 0 0 1 7.858 2h.193zM6.4 5.209v4.818l4.157-2.408z"/></svg>
                                    <span>YouTube</span>
                                </a>
                            </li>
                            <li>
                                <a href="https://m.facebook.com/@devsecopsstory" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-cyan-400 transition-transform duration-300 inline-flex items-center gap-2 group">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 16 16"><path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z"/></svg>
                                    <span>Facebook</span>
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <div className="mt-12 border-t border-white/10 pt-8 text-center text-gray-500 text-sm">
                <p>&copy; {new Date().getFullYear()} {T.appName}. {T.footerText}</p>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default App;