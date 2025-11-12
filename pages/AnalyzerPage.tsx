
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { SystemScope, Vulnerability, AnalysisSession, AnalysisResult } from '../types';
import InputForm, { InputMode } from '../components/InputForm';
import ResultDisplay from '../components/ResultDisplay';
import { analyzeIacCode, remediateIacCode } from '../services/geminiService';
import { Language, Translation } from '../translations';
// Fix: Use firebase v9 compat library to resolve module export errors for User and FirebaseError.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { ComplianceChunk, IndexedChunk, TfidfVectorizer, createTfidfVectorizer, calculateTfIdfVectors, retrieveContext } from '../services/ragData';
import { db } from '../services/firebase';

// Assumed global variables from the execution environment
declare global {
  interface Window {
    __app_id?: string;
  }
}

interface AnalyzerPageProps {
  T: Translation;
  lang: Language;
  // Fix: Use firebase.User type from the compat library.
  user: firebase.User | null;
  isAuthReady: boolean;
}

// --- History Panel Component ---
interface HistoryPanelProps {
  history: AnalysisSession[];
  onLoadSession: (sessionId: string) => void;
  onClearHistory: () => void;
  onClose: () => void;
  T: Translation;
}

const getRiskCounts = (vulnerabilities: Vulnerability[]) => {
    const counts: {[key: string]: number} = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    vulnerabilities.forEach(vuln => {
        const score = vuln.contextualRisk.charAt(0).toUpperCase() + vuln.contextualRisk.slice(1).toLowerCase();
        if (score in counts) {
            counts[score]++;
        }
    });
    return counts;
};


const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onLoadSession, onClearHistory, onClose, T }) => {
  return (
    <div className="flex flex-col h-full bg-gray-900 border-r border-white/10 shadow-2xl w-full max-w-md">
      <div className="flex justify-between items-center p-4 border-b border-white/10 flex-shrink-0">
        <h2 className="text-xl font-semibold text-cyan-400">
          {T.historyTitle}
        </h2>
        <div className="flex items-center gap-2">
            <button
              onClick={onClearHistory}
              disabled={history.length === 0}
              className="px-3 py-1 text-xs font-medium rounded-md transition-colors bg-red-800 text-red-200 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
              aria-label={T.clearAll}
            >
              {T.clearAll}
            </button>
            <button
                onClick={onClose}
                className="text-gray-400 hover:text-white text-2xl leading-none"
                aria-label={T.closeHistory}
            >
                &times;
            </button>
        </div>
      </div>
      <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
        {history.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <p>{T.noHistory}</p>
              <p className="text-sm">{T.noHistorySub}</p>
            </div>
          </div>
        ) : (
          <ul className="space-y-3">
            {history.map((session) => {
              const vulnerabilities = session.result.vulnerabilities;
              const counts = getRiskCounts(vulnerabilities);
              return (
                <li key={session.id}>
                  <button
                    onClick={() => onLoadSession(session.id)}
                    className="w-full text-left p-3 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-cyan-500/50 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <p className="font-semibold text-gray-200 text-sm">
                      {new Date(session.timestamp).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {vulnerabilities.length === 0 ? T.noVulnerabilitiesFound : T.vulnerabilitiesFound(vulnerabilities.length)}
                    </p>
                    {vulnerabilities.length > 0 && (
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs mt-2">
                            {counts.Critical > 0 && <span className="font-semibold text-red-400">{T.critical}: {counts.Critical}</span>}
                            {counts.High > 0 && <span className="font-semibold text-orange-400">{T.high}: {counts.High}</span>}
                            {counts.Medium > 0 && <span className="font-semibold text-yellow-400">{T.medium}: {counts.Medium}</span>}
                            {counts.Low > 0 && <span className="font-semibold text-blue-400">{T.low}: {counts.Low}</span>}
                        </div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

const isLikelyBinary = (content: string): boolean => {
    if (content.includes('\u0000')) return true;
    return false;
};

// --- New Stable Risk Scoring Logic ---
const SEVERITY_SCORES: { [key: string]: number } = {
  critical: 9.0,
  high: 7.0,
  medium: 4.0,
  low: 1.0,
};

const calculateRiskScore = (severity: string, relatedRules: IndexedChunk[]): number => {
    const baseScore = SEVERITY_SCORES[severity.toLowerCase()] || 0;
    
    if (baseScore === 0) return 0;

    const maxSimilarity = relatedRules.length > 0
        ? Math.max(...relatedRules.map(r => r.similarity_score || 0))
        : 0;
    
    const complianceMultiplier = maxSimilarity > 0.5 ? maxSimilarity * 0.5 : 0;
    
    const totalScore = baseScore * (1 + complianceMultiplier);

    return Math.min(parseFloat(totalScore.toFixed(2)), 10.0);
};

const MAX_FILE_SIZE_BYTES = 1 * 1024 * 1024; // 1 MB

const AnalyzerPage: React.FC<AnalyzerPageProps> = ({ T, lang, user, isAuthReady }) => {
  const [complianceData, setComplianceData] = useState<ComplianceChunk[]>([]);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);

  const [scope, setScope] = useState<SystemScope>(() => {
    const defaultScope: SystemScope = {
      environments: ['Production'],
      dataSensitivities: ['PII'],
      compliances: ['NIST'],
    };
    try {
      const savedScopeJSON = localStorage.getItem('iacAnalyzerScope');
      if (savedScopeJSON) {
        const savedScope = JSON.parse(savedScopeJSON);
        // Basic check to see if it's the new array-based format
        if (Array.isArray(savedScope.environments)) {
          return savedScope;
        }
      }
      return defaultScope;
    } catch (error) {
      console.error("Failed to parse scope from localStorage", error);
      return defaultScope;
    }
  });
  
  const [inputMode, setInputMode] = useState<InputMode>('paste');
  const [iacCode, setIacCode] = useState<string>('');
  const [files, setFiles] = useState<Array<{ name: string; content: string }>>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fileWarnings, setFileWarnings] = useState<string[]>([]);
  const [isRemediating, setIsRemediating] = useState<boolean>(false);
  const [remediationResult, setRemediationResult] = useState<string | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisSession[]>([]);
  const analysisCancelledRef = useRef(false);

  // Feedback state
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState<boolean>(false);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');


  // Effect for listening to Firestore data from the public collection
  useEffect(() => {
    const appId = window.__app_id || 'default-app-id';
    const collectionPath = `artifacts/${appId}/compliance_rules`;
    const publicRulesOwnerUid = 'jv0WBnXHHhf8S2EfUZBwBJAD86i2';

    // Fix: Use db.collection().onSnapshot() from the compat library.
    // Query only the admin's rules to build the RAG knowledge base.
    const unsubscribe = db.collection(collectionPath)
      .where('uploaderUid', '==', publicRulesOwnerUid)
      .onSnapshot((snapshot) => {
        const rules = snapshot.docs.map(doc => doc.data() as ComplianceChunk);
        setComplianceData(rules);
      }, (err) => {
        console.error("Error fetching Firestore data:", err);
        setError("Could not load compliance rules.");
      });

    return () => unsubscribe();
  }, []);

  // Effect to manage local storage persistence
  useEffect(() => {
    try {
      // Load from localStorage on initial mount
      const savedHistory = localStorage.getItem('iacAnalyzerHistory');
      if (savedHistory) setAnalysisHistory(JSON.parse(savedHistory));
      const savedResult = localStorage.getItem('iacAnalyzerResult');
      if (savedResult) setAnalysisResult(JSON.parse(savedResult));
    } catch (e) { console.error("Error reading from localStorage", e); }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('iacAnalyzerScope', JSON.stringify(scope));
      localStorage.setItem('iacAnalyzerHistory', JSON.stringify(analysisHistory));
      localStorage.setItem('iacAnalyzerResult', JSON.stringify(analysisResult));
    } catch (e) { console.error("Error writing to localStorage", e); }
  }, [scope, analysisHistory, analysisResult]);

  const ragIndex = useMemo(() => {
    if (complianceData.length === 0) {
      return { indexedChunks: [], vectorizer: null };
    }
    const vectorizer = createTfidfVectorizer(complianceData);
    const indexedChunks = calculateTfIdfVectors(complianceData, vectorizer);
    return { indexedChunks, vectorizer };
  }, [complianceData]);


  const handleFilesChange = useCallback(async (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    
    setFileWarnings([]);
    const warnings: string[] = [];

    const readPromises = Array.from(selectedFiles).map(file => {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        warnings.push(T.fileTooLargeWarning(file.name, "1MB"));
        return Promise.resolve(null);
      }
      return new Promise<{ name: string; content: string } | null>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const content = reader.result as string;
          if (isLikelyBinary(content)) {
            warnings.push(T.fileSkippedWarningReason(file.name));
            resolve(null);
          } else {
            resolve({ name: file.name, content });
          }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
      });
    });

    try {
      const results = await Promise.all(readPromises);
      const validFiles = results.filter(f => f !== null) as { name: string; content: string }[];
      
      setFiles(prevFiles => {
        const existingFileNames = new Set(prevFiles.map(f => f.name));
        const uniqueNewFiles = validFiles.filter(f => !existingFileNames.has(f.name));
        return [...prevFiles, ...uniqueNewFiles];
      });
      setFileWarnings(warnings);

    } catch (error) {
      console.error("Error reading files:", error);
      setError(T.errorPrefix + " Error reading one or more files.");
      setFileWarnings([]);
    }
  }, [T]);

  const handleRemoveFile = useCallback((fileNameToRemove: string) => {
    setFiles(prevFiles => prevFiles.filter(file => file.name !== fileNameToRemove));
  }, []);

  const handleAnalyze = useCallback(async () => {
    const isPasteMode = inputMode === 'paste';
    const hasContent = isPasteMode ? iacCode.trim().length > 0 : files.length > 0;
    
    if (!hasContent) {
        setError(isPasteMode ? T.errorPaste : T.errorUpload);
        return;
    }

    analysisCancelledRef.current = false;
    setIsLoading(true);
    setError(null);
    setFileWarnings([]);
    setAnalysisResult(null);
    setRemediationResult(null);

    const codeToAnalyze = isPasteMode 
      ? iacCode
      : files.map(file => `# File: ${file.name}\n\n${file.content}`).join('\n\n---\n\n');

    try {
      // RAG Step: Retrieve context before calling the API
      const contextChunks = (ragIndex.vectorizer && ragIndex.indexedChunks.length > 0)
        ? retrieveContext(codeToAnalyze, ragIndex.indexedChunks, ragIndex.vectorizer, 5)
        : [];
      
      const formattedContext = contextChunks.length > 0
        ? contextChunks.map(c => `- **Rule ${c.rule_id} (${c.source_doc}):** ${c.text_chunk}`).join('\n')
        : "";

      const result = await analyzeIacCode(scope, codeToAnalyze, formattedContext, lang);
      
      if (analysisCancelledRef.current) {
          return;
      }
      
      // Post-process to calculate stable risk scores
        const processedVulnerabilities = result.vulnerabilities.map(vuln => {
            if (!ragIndex.vectorizer) {
                return { ...vuln, riskScore: 0 };
            }
            const query = `${vuln.violatedRule} ${vuln.description}`;
            const relatedRules = retrieveContext(query, ragIndex.indexedChunks, ragIndex.vectorizer, 3);
            const riskScore = calculateRiskScore(vuln.severity, relatedRules);
            return { ...vuln, riskScore };
        });

      // Recalculate overall score based on stable individual scores
        const totalRiskPoints = processedVulnerabilities.reduce((sum, v) => sum + (v.riskScore || 0), 0);
        const newOverallScore = Math.round(Math.max(300, 1000 - (totalRiskPoints * 10)));

        const processedResult: AnalysisResult = {
            ...result,
            vulnerabilities: processedVulnerabilities,
            overallScore: newOverallScore,
        };

      const sessionData: AnalysisSession = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        scope: scope,
        iacCode: isPasteMode ? iacCode : undefined,
        iacFiles: !isPasteMode ? files : undefined,
        result: processedResult,
      };
      
      const cleanSession = JSON.parse(JSON.stringify(sessionData));

      setAnalysisResult(cleanSession.result);
      setAnalysisHistory(prevHistory => [cleanSession, ...prevHistory]);

    } catch (err) {
        if (analysisCancelledRef.current) {
          return;
        }
        if (err instanceof Error && err.message.startsWith('SYNTAX_ERROR:')) {
            setError(T.syntaxError(err.message.replace('SYNTAX_ERROR: ', '')));
        } else {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        }
    } finally {
      if (!analysisCancelledRef.current) {
        setIsLoading(false);
      }
    }
  }, [scope, files, iacCode, inputMode, lang, T, ragIndex]);

  const handleCancelAnalysis = useCallback(() => {
    analysisCancelledRef.current = true;
    setIsLoading(false);
    setError(null);
    setAnalysisResult(null);
  }, []);

  const handleStartRemediation = useCallback(async (vulnerability: Vulnerability) => {
    setIsRemediating(true);
    setRemediationResult(null);
    setError(null);
    
    const originalCode = inputMode === 'paste' 
      ? iacCode
      : files.map(file => `# File: ${file.name}\n\n${file.content}`).join('\n\n---\n\n');

    try {
      const result = await remediateIacCode(originalCode, vulnerability, lang);
      setRemediationResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown remediation error occurred.');
    } finally {
      setIsRemediating(false);
    }
  }, [files, iacCode, inputMode, lang]);


  const handleClearRemediation = () => {
      setRemediationResult(null);
      setError(null);
  };

  const handleLoadSession = useCallback((sessionId: string) => {
    if (typeof (window as any).gtag === 'function') {
        (window as any).gtag('event', 'load_history_session', {
            'event_category': 'engagement',
            'event_label': sessionId
        });
    }
    const session = analysisHistory.find(s => s.id === sessionId);
    if (session) {
        const loadedScope = session.scope;
        // Backward compatibility for old history items
        if (loadedScope.environment && !Array.isArray(loadedScope.environments)) {
            setScope({
                environments: [loadedScope.environment],
                dataSensitivities: [loadedScope.dataSensitivity],
                compliances: [loadedScope.compliance]
            });
        } else {
            setScope(session.scope);
        }

        if (session.iacFiles) {
            setFiles(session.iacFiles);
            setIacCode('');
            setInputMode('upload');
        } else {
            setIacCode(session.iacCode || '');
            setFiles([]);
            setInputMode('paste');
        }
        setAnalysisResult(session.result);
        setError(null);
        setIsHistoryPanelOpen(false); // Close panel on load
    }
  }, [analysisHistory]);

  const handleClearHistory = useCallback(() => {
    if (window.confirm(T.clearHistoryConfirm)) {
        setAnalysisHistory([]);
    }
  }, [T]);

  const handleCloseFeedbackModal = () => {
    setIsFeedbackModalOpen(false);
    // Reset state after a delay to allow for closing animation
    setTimeout(() => {
      setFeedbackText('');
      setFeedbackStatus('idle');
    }, 300);
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    setFeedbackStatus('submitting');
    const currentSessionId = analysisHistory.length > 0 ? analysisHistory[0].id : null;

    try {
      await db.collection('feedback').add({
        text: feedbackText,
        userId: user ? user.uid : 'anonymous',
        email: user ? user.email : 'anonymous',
        analysisSessionId: currentSessionId,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        language: lang,
        page: 'AnalyzerPage',
        userAgent: navigator.userAgent
      });

      if (typeof (window as any).gtag === 'function') {
        (window as any).gtag('event', 'submit_feedback', {
            'event_category': 'feedback',
            'event_label': 'analyzer_page'
        });
      }

      setFeedbackStatus('success');
      setTimeout(() => {
        handleCloseFeedbackModal();
      }, 2500);

    } catch (err) {
      console.error("Error submitting feedback:", err);
      setFeedbackStatus('error');
    }
  };


  return (
    <div className="container mx-auto p-4 lg:p-6 relative">
      {/* History Fly-out Panel */}
      <div className={`fixed inset-y-0 left-0 z-50 transform ${isHistoryPanelOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}>
          <HistoryPanel
            history={analysisHistory}
            onLoadSession={handleLoadSession}
            onClearHistory={handleClearHistory}
            onClose={() => setIsHistoryPanelOpen(false)}
            T={T}
          />
      </div>
      {isHistoryPanelOpen && (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 z-40" 
            onClick={() => setIsHistoryPanelOpen(false)}
            aria-hidden="true"
        ></div>
      )}

      {/* Main Content Grid */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/10">
          <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
              <h2 className="text-xl font-semibold text-cyan-400">
                {T.provideContextTitle}
              </h2>
              <button
                  onClick={() => setIsHistoryPanelOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors bg-gray-700 text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  aria-label={T.showHistory}
              >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
                 <span>{T.historyTitle}</span>
              </button>
          </div>
          <InputForm
            scope={scope}
            setScope={setScope}
            inputMode={inputMode}
            setInputMode={setInputMode}
            iacCode={iacCode}
            setIacCode={setIacCode}
            files={files}
            onFilesChange={handleFilesChange}
            onRemoveFile={handleRemoveFile}
            onAnalyze={handleAnalyze}
            onCancel={handleCancelAnalysis}
            isLoading={isLoading}
            error={error}
            fileWarnings={fileWarnings}
            T={T}
          />
        </div>
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/10 min-h-[calc(100vh-250px)]">
          <ResultDisplay
            result={analysisResult}
            scope={scope}
            timestamp={analysisHistory.find(s => s.result === analysisResult)?.timestamp}
            isLoading={isLoading}
            error={error}
            onStartRemediation={handleStartRemediation}
            onCancel={handleCancelAnalysis}
            isRemediating={isRemediating}
            remediationResult={remediationResult}
            onClearRemediation={handleClearRemediation}
            T={T}
          />
        </div>
      </div>
      
      {/* Feedback Button */}
       <button
        onClick={() => setIsFeedbackModalOpen(true)}
        className="fixed bottom-6 right-6 bg-cyan-600 text-white p-4 rounded-full shadow-lg hover:bg-cyan-700 transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-gray-900 z-30"
        aria-label={T.feedbackButtonLabel}
        title={T.feedbackButtonLabel}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>

      {/* Feedback Modal */}
      {isFeedbackModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate__animated animate__fadeIn animate__faster" aria-modal="true" role="dialog">
          <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col border border-cyan-500/50">
            <header className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
              <h3 className="text-lg font-semibold text-cyan-400">{T.feedbackModalTitle}</h3>
              <button onClick={handleCloseFeedbackModal} className="text-gray-400 hover:text-white text-2xl leading-none" aria-label={T.close}>&times;</button>
            </header>
            <main className="p-6 overflow-y-auto">
              {feedbackStatus === 'success' ? (
                <div className="text-center">
                   <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                   <h4 className="mt-4 text-lg font-semibold text-white">{T.feedbackSuccessTitle}</h4>
                   <p className="text-gray-300">{T.feedbackSuccessMessage}</p>
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit}>
                  <p className="text-gray-300 mb-4">{T.feedbackModalDescription}</p>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder={T.feedbackPlaceholder}
                    className="w-full h-32 bg-gray-900 border border-gray-600 rounded-md p-3 text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 custom-scrollbar"
                    required
                    disabled={feedbackStatus === 'submitting'}
                    aria-label={T.feedbackPlaceholder}
                  />
                   {feedbackStatus === 'error' && <p className="text-sm text-red-400 mt-2">{T.feedbackError}</p>}
                   <div className="flex justify-end gap-4 mt-6">
                        <button type="button" onClick={handleCloseFeedbackModal} className="px-4 py-2 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 focus:ring-offset-gray-800">
                          {T.cancel}
                        </button>
                        <button
                          type="submit"
                          disabled={feedbackStatus === 'submitting' || !feedbackText.trim()}
                          className="px-4 py-2 text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-gray-800 disabled:bg-gray-500 disabled:cursor-not-allowed"
                        >
                          {feedbackStatus === 'submitting' ? T.submittingFeedback : T.submitFeedback}
                        </button>
                    </div>
                </form>
              )}
            </main>
          </div>
        </div>
      )}

    </div>
  );
};

export default AnalyzerPage;
