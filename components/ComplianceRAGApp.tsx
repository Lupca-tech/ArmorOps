import React, { useState, useRef } from 'react';
import { Translation, Language } from '../translations';
// Fix: Use firebase v9 compat library to resolve module export errors.
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

interface ComplianceRAGAppProps {
    T: Translation;
    lang: Language;
    // Fix: Use firebase.firestore.Firestore type from compat library.
    db: firebase.firestore.Firestore;
    userId: string | null;
    appId: string;
    isAuthReady: boolean;
}

interface ComplianceChunk {
    rule_id: string;
    category: string;
    text_chunk: string;
    source_doc: string;
}

const isComplianceChunkArray = (data: any): data is ComplianceChunk[] => {
    if (!Array.isArray(data)) return false;
    return data.every(item => 
        typeof item === 'object' &&
        item !== null &&
        'rule_id' in item && typeof item.rule_id === 'string' &&
        'category' in item && typeof item.category === 'string' &&
        'text_chunk' in item && typeof item.text_chunk === 'string' &&
        'source_doc' in item && typeof item.source_doc === 'string'
    );
};

const MAX_FILE_SIZE_BYTES = 1 * 1024 * 1024; // 1 MB

const ComplianceRAGApp: React.FC<ComplianceRAGAppProps> = ({ T, userId, appId, db }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- File Upload Handlers ---
    const handleFileSelect = (files: FileList | null) => {
        if (files && files.length > 0) {
            const file = files[0];
            if (file.size > MAX_FILE_SIZE_BYTES) {
                setUploadStatus({ type: 'error', message: T.fileTooLargeError("1MB") });
                setSelectedFile(null);
                return;
            }
            setSelectedFile(file);
            setUploadStatus(null);
        }
    };
    
    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files);
            e.dataTransfer.clearData();
        }
    };

    const handleFileUpload = async () => {
        if (!selectedFile || !userId || !appId) return;

        setIsUploading(true);
        setUploadStatus(null);

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const content = event.target?.result as string;
                const data = JSON.parse(content);

                if (!isComplianceChunkArray(data)) {
                    throw new Error(T.errorInvalidStructure);
                }

                const collectionPath = `artifacts/${appId}/compliance_rules`;
                
                // Add the uploader's UID to each rule for proper filtering on the public page
                const addPromises = data.map(rule => {
                    const ruleWithUser = { ...rule, uploaderUid: userId };
                    return db.collection(collectionPath).add(ruleWithUser);
                });
                await Promise.all(addPromises);
                
                setUploadStatus({ type: 'success', message: T.uploadSuccess(data.length) });
                setSelectedFile(null);
            } catch (error) {
                console.error("File upload error:", error);
                 if (error instanceof SyntaxError) {
                    setUploadStatus({ type: 'error', message: T.errorInvalidJson });
                } else {
                    setUploadStatus({ type: 'error', message: (error as Error).message });
                }
            } finally {
                setIsUploading(false);
            }
        };

        reader.readAsText(selectedFile);
    };


    return (
        <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700 animate-fade-in-fast">
            <h4 className="text-lg font-semibold text-gray-200 mb-4">{T.uploadRulesFile}</h4>
            
            <details className="mb-4 bg-gray-900/70 p-3 rounded-md border border-gray-600 group">
                <summary className="text-sm font-medium text-cyan-400 cursor-pointer list-none flex justify-between items-center">
                    {T.jsonInstructionsTitle}
                     <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <div className="mt-3 text-sm text-gray-300 space-y-2">
                    <p>{T.jsonInstructionsDesc}</p>
                    <ul className="list-disc list-inside space-y-1 pl-2 font-mono text-xs">
                        <li><code className="bg-gray-700 px-1 rounded">rule_id</code>: (string) Mã định danh duy nhất cho quy tắc.</li>
                        <li><code className="bg-gray-700 px-1 rounded">category</code>: (string) Danh mục bảo mật.</li>
                        <li><code className="bg-gray-700 px-1 rounded">source_doc</code>: (string) Tài liệu nguồn của quy tắc.</li>
                        <li><code className="bg-gray-700 px-1 rounded">text_chunk</code>: (string) Mô tả đầy đủ của quy tắc.</li>
                    </ul>
                    <p className="mt-2">Ví dụ:</p>
                    <pre className="bg-gray-950 p-2 rounded-md text-xs overflow-x-auto custom-scrollbar">
                        <code>
{`[
  {
    "rule_id": "CKV_AWS_117",
    "category": "Network Security",
    "source_doc": "CIS AWS Foundations Benchmark v1.4.0",
    "text_chunk": "Ensure that all S3 buckets prohibit public read access. Granting public read access to S3 buckets can lead to data exposure."
  },
  {
    "rule_id": "NIST_AC-3",
    "category": "Access Control",
    "source_doc": "NIST 800-53",
    "text_chunk": "Enforce principle of least privilege, allowing only authorized accesses for users (or processes acting on behalf of users) which are necessary to accomplish assigned tasks."
  }
]`}
                        </code>
                    </pre>
                </div>
            </details>

             <div 
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex-grow border-2 border-dashed rounded-md p-6 text-center flex flex-col justify-center items-center cursor-pointer transition-colors ${isDragging ? 'border-cyan-500 bg-gray-700/50' : 'border-gray-600 hover:border-gray-500'}`}
                aria-label="File upload zone for compliance rules"
            >
                 <input
                    ref={fileInputRef}
                    type="file"
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                    accept=".json"
                />
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <p className="text-gray-400">{T.dragAndDropFile}</p>
                <p className="text-sm text-gray-500">{T.orClickToSelect}</p>
            </div>
            
            {selectedFile && (
                <div className="mt-4 text-sm text-center">
                    <span className="text-gray-400">{T.selectedFile} </span>
                    <span className="font-medium text-cyan-300">{selectedFile.name}</span>
                </div>
            )}
            
            {uploadStatus && (
                 <div className={`mt-4 text-center text-sm p-3 rounded-md border ${uploadStatus.type === 'success' ? 'bg-green-900/50 border-green-700 text-green-300' : 'bg-red-900/50 border-red-700 text-red-300'}`}>
                    {uploadStatus.message}
                </div>
            )}
            
            <div className="flex justify-end mt-6">
                <button 
                    onClick={handleFileUpload}
                    disabled={!selectedFile || isUploading}
                    className="py-2 px-5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-gray-900 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                >
                    {isUploading ? T.uploading : T.uploadAndSave}
                </button>
            </div>
         
         <div className="text-xs text-gray-500 mt-4 font-mono">
            <p>UserID: {userId || 'N/A'}</p>
            <p>AppID: {appId || 'N/A'}</p>
        </div>
    </div>
    );
};

export default ComplianceRAGApp;