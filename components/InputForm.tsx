
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { SystemScope, SystemEnvironment, DataSensitivity, ComplianceFramework } from '../types';
import { Translation } from '../translations';


export type InputMode = 'paste' | 'upload';
type HelpTopic = 'environments' | 'dataSensitivities' | 'compliances';

interface InputFormProps {
  scope: SystemScope;
  setScope: React.Dispatch<React.SetStateAction<SystemScope>>;
  inputMode: InputMode;
  setInputMode: React.Dispatch<React.SetStateAction<InputMode>>;
  iacCode: string;
  setIacCode: React.Dispatch<React.SetStateAction<string>>;
  files: Array<{ name: string; content: string; }>;
  onFilesChange: (files: FileList | null) => void;
  onRemoveFile: (fileName: string) => void;
  onAnalyze: () => void;
  onCancel: () => void;
  isLoading: boolean;
  error: string | null;
  fileWarnings: string[];
  T: Translation;
}

// A component that mimics a simple VS Code editor with line numbers
const CodeEditor: React.FC<{
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
  rows: number;
  readOnly?: boolean;
}> = ({ value, onChange, placeholder, rows, readOnly = false }) => {
  const linesRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [lineNumbers, setLineNumbers] = useState("1");

  useEffect(() => {
    const count = value.split('\n').length;
    const newNumbers = Array.from({ length: count || 1 }, (_, i) => i + 1).join('\n');
    setLineNumbers(newNumbers);
  }, [value]);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (linesRef.current) {
      linesRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  return (
    // The container manages focus state for the border color
    <div className="w-full flex-grow bg-gray-900 border border-gray-600 rounded-md shadow-sm focus-within:ring-2 focus-within:ring-cyan-500 focus-within:border-cyan-500 flex overflow-hidden">
      <textarea
        ref={linesRef}
        value={lineNumbers}
        readOnly
        // Hide scrollbar using tailwind JIT classes for different browsers
        className="w-12 text-right p-3 bg-gray-800/50 text-gray-500 font-mono text-sm resize-none border-0 focus:ring-0 select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-hidden="true"
        rows={rows}
      />
      <textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        onScroll={handleScroll}
        placeholder={placeholder}
        className={`w-full flex-grow bg-transparent p-3 text-gray-200 font-mono text-sm resize-none border-0 focus:ring-0 custom-scrollbar ${readOnly ? 'cursor-default' : ''}`}
        spellCheck="false"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        rows={rows}
        readOnly={readOnly}
      />
    </div>
  );
};


const InputForm: React.FC<InputFormProps> = ({
  scope,
  setScope,
  inputMode,
  setInputMode,
  iacCode,
  setIacCode,
  files,
  onFilesChange,
  onRemoveFile,
  onAnalyze,
  onCancel,
  isLoading,
  error,
  fileWarnings,
  T
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [activeHelpTopic, setActiveHelpTopic] = useState<HelpTopic | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeFileName, setActiveFileName] = useState<string | null>(null);

  const environmentOptions: SystemEnvironment[] = ['Production', 'Staging', 'Development', 'QA'];
  const dataSensitivityOptions: DataSensitivity[] = ['PII', 'Confidential', 'Regulated', 'Internal', 'Public'];
  const complianceOptions: ComplianceFramework[] = ['NIST', 'CIS', 'PCI-DSS', 'HIPAA', 'GDPR'];

  useEffect(() => {
    // If there are no files, there's no active file
    if (files.length === 0) {
        setActiveFileName(null);
        return;
    }

    // If the current active file doesn't exist in the new list,
    // or if there's no active file selected yet,
    // set the first file as active.
    const activeFileExists = files.some(f => f.name === activeFileName);
    if (!activeFileExists) {
        setActiveFileName(files[0].name);
    }
  }, [files, activeFileName]);

  const activeFileContent = useMemo(() => {
    if (!activeFileName) return '';
    return files.find(f => f.name === activeFileName)?.content || '';
  }, [files, activeFileName]);

  const handleCheckboxChange = (category: keyof SystemScope, value: SystemEnvironment | DataSensitivity | ComplianceFramework) => {
    setScope(prevScope => {
        const currentValues = prevScope[category] as string[];
        const newValues = currentValues.includes(value)
            ? currentValues.filter(item => item !== value)
            : [...currentValues, value];
        return { ...prevScope, [category]: newValues };
    });
  };
  
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // This is necessary to allow dropping
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesChange(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilesChange(e.target.files);
     if (e.target) {
      e.target.value = ''; // Allow re-uploading the same file
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const getInputModeButtonClass = (mode: InputMode) => {
    const base = "flex-1 text-center px-3 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-900";
    if (inputMode === mode) {
      return `${base} bg-cyan-600 text-white shadow`;
    }
    return `${base} bg-gray-700 text-gray-300 hover:bg-gray-600`;
  }
  
  const InfoButton = ({ topic }: { topic: HelpTopic }) => (
    <button 
      type="button" 
      onClick={() => setActiveHelpTopic(topic)} 
      className="ml-1.5 text-gray-500 hover:text-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded-full inline-flex items-center justify-center align-middle" 
      aria-label={`More information about ${topic}`}
      title={T.whatsThis}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </button>
  );

  const CheckboxGroup: React.FC<{
    label: string;
    topic: HelpTopic;
    options: string[];
    selected: string[];
    onChange: (value: any) => void;
  }> = ({ label, topic, options, selected, onChange }) => (
    <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
            {label}
            <InfoButton topic={topic} />
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {options.map(option => (
                 <label key={option} className="flex items-center space-x-2 p-2 bg-gray-900 border border-gray-600 rounded-md cursor-pointer hover:bg-gray-800 hover:border-cyan-500 transition-colors has-[:checked]:bg-cyan-900/50 has-[:checked]:border-cyan-500">
                    <input
                        type="checkbox"
                        value={option}
                        checked={selected.includes(option)}
                        onChange={() => onChange(option)}
                        className="h-4 w-4 rounded bg-gray-700 border-gray-500 text-cyan-600 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-0"
                    />
                    <span className="text-sm font-medium text-gray-300 select-none">{option}</span>
                </label>
            ))}
        </div>
    </div>
  );

  const isAnalyzeDisabled = isLoading || (inputMode === 'paste' ? iacCode.trim() === '' : files.length === 0) || scope.environments.length === 0 || scope.dataSensitivities.length === 0;
  
  const handleAnalyzeClick = () => {
    if (typeof (window as any).gtag === 'function') {
      (window as any).gtag('event', 'start_analysis', {
        'event_category': 'engagement',
        'event_label': inputMode,
        'value': inputMode === 'paste' ? iacCode.length : files.length
      });
    }
    onAnalyze();
  };

  const analyzeButtonText = () => {
    if (isLoading) return T.analyzing;
    if (inputMode === 'upload') {
      return files.length > 0 ? T.analyzeButtonFiles(files.length) : T.analyzeButtonFilesEmpty;
    }
    return T.analyzeButton;
  };

  const helpContentMap = {
    environments: {
        title: T.contextHelpEnvTitle,
        desc: T.contextHelpEnvDesc,
        items: [ T.contextHelpEnvProd, T.contextHelpEnvStaging, T.contextHelpEnvDev, T.contextHelpEnvQA ]
    },
    dataSensitivities: {
        title: T.contextHelpDataTitle,
        desc: T.contextHelpDataDesc,
        items: [ T.contextHelpDataPII, T.contextHelpDataConfidential, T.contextHelpDataRegulated, T.contextHelpDataInternal, T.contextHelpDataPublic ]
    },
    compliances: {
        title: T.contextHelpComplianceTitle,
        desc: T.contextHelpComplianceDesc,
        items: [ T.contextHelpComplianceNIST, T.contextHelpComplianceCIS, T.contextHelpCompliancePCI, T.contextHelpComplianceHIPAA, T.contextHelpComplianceGDPR ]
    }
  };

  const currentHelp = activeHelpTopic ? helpContentMap[activeHelpTopic] : null;

  return (
    <div className="flex flex-col">
       <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 mb-6 text-center shadow-inner">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto text-cyan-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <p className="text-sm text-gray-300">{T.contextHelpIntro}</p>
      </div>
      <div className="space-y-4 mb-6">
        <CheckboxGroup
          label={T.environmentLabel}
          topic="environments"
          options={environmentOptions}
          selected={scope.environments}
          onChange={(value) => handleCheckboxChange('environments', value)}
        />
        <CheckboxGroup
          label={T.dataSensitivityLabel}
          topic="dataSensitivities"
          options={dataSensitivityOptions}
          selected={scope.dataSensitivities}
          onChange={(value) => handleCheckboxChange('dataSensitivities', value)}
        />
        <CheckboxGroup
          label={T.complianceLabel}
          topic="compliances"
          options={complianceOptions}
          selected={scope.compliances}
          onChange={(value) => handleCheckboxChange('compliances', value)}
        />
      </div>
      
       <div className="flex-grow flex flex-col">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {T.provideIacCodeTitle}
        </label>
        <div className="flex bg-gray-900/50 p-1 rounded-lg border border-gray-600 mb-3">
            <button onClick={() => setInputMode('paste')} className={getInputModeButtonClass('paste')}>{T.pasteCode}</button>
            <button onClick={() => setInputMode('upload')} className={getInputModeButtonClass('upload')}>{T.uploadFiles}</button>
        </div>

        {inputMode === 'paste' ? (
           <CodeEditor
                value={iacCode}
                onChange={(e) => setIacCode(e.target.value)}
                placeholder={T.pastePlaceholder}
                rows={10}
            />
        ) : (
           <div 
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`flex-grow flex flex-col transition-colors ${isDragging ? 'border-cyan-500 bg-gray-700/50' : ''}`}
            >
             <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".tf,.tfvars,.json,.yaml,.yml,.*rc"
              />
            {files.length === 0 ? (
                 <div
                    onClick={triggerFileSelect}
                    className={`flex-grow border-2 border-dashed rounded-md p-4 text-center flex flex-col justify-center items-center cursor-pointer ${isDragging ? 'border-cyan-500' : 'border-gray-600 hover:border-gray-500'}`}
                    aria-label="File upload zone"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-4-4V7a4 4 0 014-4h4l2 2h4a2 2 0 012 2v2a4 4 0 01-4 4H7z" />
                    </svg>
                    <p className="text-gray-400">{T.dragAndDrop}</p>
                    <p className="text-sm text-gray-500">{T.orClickToBrowse}</p>
                </div>
            ) : (
                <div className="flex-grow flex flex-col bg-gray-900/90 border border-gray-600 rounded-md shadow-sm overflow-hidden">
                    {/* Tab Bar */}
                    <div className="flex items-center bg-gray-800/50 border-b border-gray-600 flex-shrink-0">
                        <div className="flex-grow flex items-center overflow-x-auto custom-scrollbar">
                            {files.map(file => {
                                const isActive = file.name === activeFileName;
                                return (
                                    <button
                                        key={file.name}
                                        onClick={() => setActiveFileName(file.name)}
                                        className={`flex items-center gap-2 px-4 py-2 text-sm border-r border-gray-700 whitespace-nowrap transition-colors ${isActive ? 'bg-gray-900 text-cyan-400' : 'text-gray-400 hover:bg-gray-700/50'}`}
                                        title={file.name}
                                    >
                                        <span className="truncate max-w-[150px]">{file.name}</span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent tab from being selected
                                                onRemoveFile(file.name);
                                            }}
                                            className="text-gray-500 hover:text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0"
                                            aria-label={`Remove ${file.name}`}
                                        >
                                            &times;
                                        </button>
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={triggerFileSelect}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 border-l border-gray-700"
                            title="Add more files"
                            aria-label="Add more files"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        </button>
                    </div>

                    {/* Editor View */}
                    <CodeEditor
                        value={activeFileContent}
                        placeholder=""
                        rows={10}
                        readOnly
                    />
                </div>
            )}
          </div>
        )}
      </div>

       {fileWarnings.length > 0 && (
        <div className="mt-4 bg-yellow-900/50 border border-yellow-700 text-yellow-300 px-4 py-3 rounded-md text-sm" role="alert">
          <strong className="font-bold">{T.fileSkippedWarningTitle}</strong>
          <ul className="list-disc list-inside mt-1 space-y-1">
            {fileWarnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <div className="mt-4 bg-red-900/50 border border-red-700 text-red-300 px-4 py-2 rounded-md text-sm" role="alert">
          <strong className="font-bold">{T.errorPrefix} </strong>
          <span>{error}</span>
        </div>
      )}


      <button
        onClick={isLoading ? onCancel : handleAnalyzeClick}
        disabled={!isLoading && isAnalyzeDisabled}
        className={`mt-6 w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors ${
          isLoading
            ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
            : 'bg-cyan-600 hover:bg-cyan-700 focus:ring-cyan-500 disabled:bg-gray-500 disabled:cursor-not-allowed'
        }`}
      >
        {isLoading ? T.cancel : analyzeButtonText()}
      </button>

      {currentHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fade-in-fast" aria-modal="true" role="dialog">
          <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-cyan-500/50">
            <header className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
              <h3 className="text-lg font-semibold text-cyan-400">{currentHelp.title}</h3>
              <button onClick={() => setActiveHelpTopic(null)} className="text-gray-400 hover:text-white text-2xl leading-none" aria-label={T.closeModal}>&times;</button>
            </header>
            <main className="p-6 overflow-y-auto custom-scrollbar">
              <p className="text-gray-300 mb-4">{currentHelp.desc}</p>
              <ul className="list-disc list-inside space-y-2 text-sm">
                {currentHelp.items.map((item, index) => (
                      <li key={index} className="text-gray-400" dangerouslySetInnerHTML={{ __html: item }} />
                ))}
              </ul>
            </main>
          </div>
        </div>
      )}
    </div>
  );
};

export default InputForm;
