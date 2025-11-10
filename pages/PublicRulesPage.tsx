import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/firebase';
import { ComplianceChunk, IndexedChunk, TfidfVectorizer, createTfidfVectorizer, calculateTfIdfVectors, retrieveContext } from '../services/ragData';
import { Translation } from '../translations';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

// Assumed global variables from the execution environment
declare global {
  interface Window {
    __app_id?: string;
  }
}

type Tab = 'home' | 'analyzer' | 'rules' | 'admin' | 'about' | 'auth' | 'autofix';

interface PublicRulesPageProps {
  T: Translation;
  user: firebase.User | null;
  isAuthReady: boolean;
  onNavigate: (tab: Tab) => void;
}

const PublicRulesPage: React.FC<PublicRulesPageProps> = ({ T, user, isAuthReady, onNavigate }) => {
    const [allRules, setAllRules] = useState<ComplianceChunk[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [submittedQuery, setSubmittedQuery] = useState('');
    const [searchResults, setSearchResults] = useState<IndexedChunk[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const ITEMS_PER_PAGE = 12;

    useEffect(() => {
        const appId = window.__app_id || 'default-app-id';
        const collectionPath = `artifacts/${appId}/compliance_rules`;
        const publicRulesOwnerUid = 'jv0WBnXHHhf8S2EfUZBwBJAD86i2';

        const unsubscribe = db.collection(collectionPath)
            .where('uploaderUid', '==', publicRulesOwnerUid)
            .onSnapshot((snapshot) => {
                const rules = snapshot.docs.map(doc => doc.data() as ComplianceChunk);
                setAllRules(rules);
                setIsLoading(false);
            }, (err) => {
                console.error("Error fetching rules:", err);
                setError("Could not load compliance rules.");
                setIsLoading(false);
            });

        return () => unsubscribe();
    }, []);

    const ragIndex = useMemo(() => {
        if (allRules.length === 0) {
            return { indexedChunks: [], vectorizer: null };
        }
        const vectorizer = createTfidfVectorizer(allRules);
        const indexedChunks = calculateTfIdfVectors(allRules, vectorizer);
        return { indexedChunks, vectorizer };
    }, [allRules]);

    const uniqueCategories = useMemo(() => {
        const categories = new Set(allRules.map(rule => rule.category));
        return ['All', ...Array.from(categories).sort()];
    }, [allRules]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        setSelectedCategory('All'); // Reset category filter for a global search
        if (!searchQuery.trim() || !ragIndex.vectorizer) {
            setSearchResults([]);
            setSubmittedQuery('');
            return;
        }
        
        const results = retrieveContext(searchQuery, ragIndex.indexedChunks, ragIndex.vectorizer, 50); // get top 50
        setSearchResults(results);
        setSubmittedQuery(searchQuery);
    };
    
    const handleClearSearch = () => {
        setSearchQuery('');
        setSubmittedQuery('');
        setSearchResults([]);
        setCurrentPage(1);
    };

    const handleCategorySelect = (category: string) => {
        setCurrentPage(1);
        setSelectedCategory(category);
        // Clear search when a category is selected for a clearer UX
        if (submittedQuery) {
            handleClearSearch();
        }
    };
    
    const displayRules = useMemo(() => {
        if (submittedQuery) {
            return searchResults;
        }
        if (selectedCategory !== 'All') {
            return allRules.filter(rule => rule.category === selectedCategory);
        }
        return allRules;
    }, [submittedQuery, searchResults, selectedCategory, allRules]);

    const totalPages = Math.ceil(displayRules.length / ITEMS_PER_PAGE);
    const paginatedRules = displayRules.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const Pagination = () => {
        if (totalPages <= 1) return null;

        return (
            <nav className="flex items-center justify-between mt-8" aria-label="Pagination">
                <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm font-medium rounded-md transition-colors bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:bg-gray-600/50 disabled:cursor-not-allowed"
                >
                    {T.previousPage}
                </button>
                <span className="text-sm text-gray-400">
                    {T.pageIndicator(currentPage, totalPages)}
                </span>
                <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm font-medium rounded-md transition-colors bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:bg-gray-600/50 disabled:cursor-not-allowed"
                >
                    {T.nextPage}
                </button>
            </nav>
        );
    };

    const renderRuleCard = (rule: IndexedChunk | ComplianceChunk) => (
        <div key={rule.rule_id + rule.text_chunk.slice(0, 10)} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 flex flex-col h-full transition-all duration-300 hover:border-cyan-500/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-900/50">
            <div className="flex justify-between items-start gap-2">
                <h4 className="font-semibold text-cyan-300 flex-grow">{rule.rule_id}</h4>
                {'similarity_score' in rule && rule.similarity_score && (
                     <div className="text-right text-xs flex-shrink-0">
                        <span className="font-bold text-cyan-400 bg-cyan-900/50 px-2 py-1 rounded">{(rule.similarity_score * 100).toFixed(1)}%</span>
                    </div>
                )}
            </div>
             <p className="text-xs text-gray-500 mt-1">{rule.category} / {rule.source_doc}</p>
            <p className="text-sm text-gray-300 mt-3 flex-grow">{rule.text_chunk}</p>
        </div>
    );

    const renderMainContent = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="text-center text-red-400 p-4 bg-red-900/50 border border-red-700 rounded-md">
                    {error}
                </div>
            );
        }
        
        if (allRules.length === 0) {
            return (
                <div className="text-center text-gray-400 p-8 border-2 border-dashed border-gray-700 rounded-lg mt-4">
                    <p>{T.noRulesLoaded}</p>
                </div>
            );
        }
        
        const isSearching = submittedQuery.trim() !== '';
        const title = isSearching ? T.searchResultsFor(submittedQuery) : selectedCategory === 'All' ? T.allCategories : `${selectedCategory}`;

        return (
            <div>
                 <div className="flex flex-wrap justify-between items-baseline gap-2 mb-4">
                    <h3 className="text-2xl font-semibold text-gray-200">{title}</h3>
                     {isSearching && (
                        <button 
                            onClick={handleClearSearch}
                            className="text-sm text-cyan-400 hover:text-cyan-300"
                        >
                          {T.clearSearch}
                        </button>
                     )}
                </div>

                {paginatedRules.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {paginatedRules.map(renderRuleCard)}
                        </div>
                        <Pagination />
                    </>
                ) : (
                    <div className="text-center text-gray-400 p-8 border-2 border-dashed border-gray-700 rounded-lg mt-4">
                        <p>{isSearching ? T.noRulesFound : T.noFilterMatch(selectedCategory)}</p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="container mx-auto p-4 lg:px-6 lg:py-8 animate-fade-in">
            <header className="text-center mb-8 lg:mb-12">
                <h2 className="text-3xl lg:text-4xl font-bold text-white mb-2">{T.publicRulesTitle}</h2>
                <p className="text-gray-400 max-w-2xl mx-auto">{T.publicRulesCTA}</p>
            </header>

            <div className="flex flex-col lg:flex-row lg:items-start gap-8">
                {/* Sidebar */}
                <aside className="lg:w-1/4 xl:w-1/5 space-y-6">
                    <div className="p-4 bg-gray-800/40 rounded-lg border border-gray-700/50 lg:sticky lg:top-24">
                        <form onSubmit={handleSearch} className="flex flex-col gap-2">
                            <label htmlFor="search-rules" className="sr-only">{T.searchPlaceholder}</label>
                            <input 
                                id="search-rules"
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={T.searchPlaceholder}
                                className="w-full bg-gray-900 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                            />
                            <button 
                                type="submit"
                                disabled={isLoading || !searchQuery.trim()}
                                className="w-full py-2 px-5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-gray-800 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                            >
                              {T.searchButton}
                            </button>
                        </form>

                        <div className="mt-6 border-t border-gray-700 pt-4">
                            <h3 className="text-lg font-semibold text-cyan-400 mb-3">{T.statistics}</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between items-center text-gray-300"><span>{T.totalRules}</span><span className="font-bold text-white bg-gray-700 px-2 py-0.5 rounded">{allRules.length}</span></div>
                                <div className="flex justify-between items-center text-gray-300"><span>{T.uniqueCategories}</span><span className="font-bold text-white bg-gray-700 px-2 py-0.5 rounded">{uniqueCategories.length > 0 ? uniqueCategories.length - 1 : 0}</span></div>
                            </div>
                        </div>

                        <div className="mt-6 border-t border-gray-700 pt-4">
                            <h3 className="text-lg font-semibold text-cyan-400 mb-3">{T.filterByCategory}</h3>
                            <ul className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar pr-2 -mr-2">
                                {uniqueCategories.map(cat => (
                                    <li key={cat}>
                                        <button onClick={() => handleCategorySelect(cat)} className={`w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors ${selectedCategory === cat ? 'bg-cyan-600 text-white font-semibold' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>
                                            {cat === 'All' ? T.allCategories : cat}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        
                        {isAuthReady && !user && (
                            <div className="mt-6 p-4 bg-cyan-900/50 border border-cyan-700 rounded-lg text-center">
                                <h3 className="font-semibold text-cyan-300">{T.rulesCtaTitle}</h3>
                                <p className="text-xs text-gray-300 mt-1">{T.rulesCtaDesc}</p>
                                <button
                                    onClick={() => onNavigate('auth')}
                                    className="mt-3 w-full px-4 py-2 text-xs font-medium rounded-md transition-transform transform hover:scale-105 bg-cyan-600 text-white hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                >
                                    {T.rulesCtaButton}
                                </button>
                            </div>
                        )}
                        
                        <div className="mt-6 border-t border-gray-700 pt-4">
                            <h3 className="text-lg font-semibold text-cyan-400 mb-4">{T.publicRulesResourcesTitle}</h3>
                            <div className="space-y-4">
                            {(T.complianceResources as {name: string, description: string, url: string}[]).map((resource, index) => (
                                <div key={index} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 flex flex-col transition-all duration-300 hover:border-cyan-500/50 hover:-translate-y-1">
                                    <h4 className="text-base font-semibold text-cyan-400 mb-1">{resource.name}</h4>
                                    <p className="text-xs text-gray-400 flex-grow mb-3">{resource.description}</p>
                                    <a 
                                        href={resource.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="inline-block text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-md px-3 py-1.5 self-start transition-colors"
                                    >
                                        {T.learnMore}
                                    </a>
                                </div>
                            ))}
                            </div>
                        </div>
                    </div>
                </aside>
                
                <main className="lg:w-3/4 xl:w-4/5">
                    {renderMainContent()}
                </main>
            </div>
        </div>
    );
};

export default PublicRulesPage;