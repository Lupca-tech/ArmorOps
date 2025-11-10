import React, { useState, useEffect } from 'react';
import ComplianceRAGApp from '../components/ComplianceRAGApp';
import { Language, Translation } from '../translations';
import { db } from '../services/firebase';
// Fix: Import firebase v9 compat to resolve module export errors for User type.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { ComplianceChunk } from '../services/ragData';

interface AdminPageProps {
  T: Translation;
  lang: Language;
  // Fix: Use firebase.User type from the compat library.
  user: firebase.User;
}

interface UserRule extends ComplianceChunk {
  id: string; // Firestore document ID
}

const AdminPage: React.FC<AdminPageProps> = ({ T, lang, user }) => {
  const appId = window.__app_id || 'default-app-id';
  const [myRules, setMyRules] = useState<UserRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [ruleToEdit, setRuleToEdit] = useState<UserRule | null>(null);
  const [editedData, setEditedData] = useState<Partial<ComplianceChunk>>({});
  const [isUpdating, setIsUpdating] = useState(false);

  // State for the new rule creation method
  const [activeTab, setActiveTab] = useState<'upload' | 'manual'>('upload');
  const initialNewRuleState = { rule_id: '', category: '', source_doc: '', text_chunk: '' };
  const [newRule, setNewRule] = useState<ComplianceChunk>(initialNewRuleState);
  const [isSavingNewRule, setIsSavingNewRule] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);


  const collectionPath = `artifacts/${appId}/compliance_rules`;

  useEffect(() => {
    if (!user) return;

    const unsubscribe = db.collection(collectionPath)
      .where('uploaderUid', '==', user.uid)
      .onSnapshot((snapshot) => {
        const rules = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as UserRule));
        setMyRules(rules);
        setIsLoading(false);
      }, (err) => {
        console.error("Error fetching user rules:", err);
        setError("Could not load your rules.");
        setIsLoading(false);
      });

    return () => unsubscribe();
  }, [user, collectionPath]);
  
  const handleDeleteRule = async (ruleId: string) => {
    if (window.confirm(T.confirmDeleteRule)) {
      try {
        await db.collection(collectionPath).doc(ruleId).delete();
      } catch (err) {
        console.error("Error deleting rule:", err);
        alert("Failed to delete rule.");
      }
    }
  };
  
  const openEditModal = (rule: UserRule) => {
    setRuleToEdit(rule);
    setEditedData({
        rule_id: rule.rule_id,
        category: rule.category,
        text_chunk: rule.text_chunk,
        source_doc: rule.source_doc,
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setRuleToEdit(null);
    setEditedData({});
  };

  const handleSaveEdit = async () => {
    if (!ruleToEdit) return;
    setIsUpdating(true);
    try {
        await db.collection(collectionPath).doc(ruleToEdit.id).update(editedData);
        closeEditModal();
    } catch (err) {
        console.error("Error updating rule:", err);
        alert("Failed to update rule.");
    } finally {
        setIsUpdating(false);
    }
  };
  
  const handleInputChange = (field: keyof ComplianceChunk, value: string) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleNewRuleChange = (field: keyof ComplianceChunk, value: string) => {
      setNewRule(prev => ({ ...prev, [field]: value }));
  };

  const handleAddNewRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingNewRule(true);
    setSaveStatus(null);
    try {
      const ruleWithUser = { ...newRule, uploaderUid: user.uid };
      await db.collection(collectionPath).add(ruleWithUser);
      setSaveStatus({ type: 'success', message: T.ruleSavedSuccess });
      setNewRule(initialNewRuleState); // Clear form on success
      setTimeout(() => setSaveStatus(null), 3000); // Hide status after 3s
    } catch (error) {
      console.error("Error saving new rule:", error);
      setSaveStatus({ type: 'error', message: T.ruleSavedError });
    } finally {
      setIsSavingNewRule(false);
    }
  };

  const renderMyRules = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-400"></div>
        </div>
      );
    }

    if (error) {
       return <p className="text-center text-red-400 p-4">{error}</p>;
    }

    if (myRules.length === 0) {
      return (
        <div className="text-center text-gray-400 p-8 border-2 border-dashed border-gray-700 rounded-lg mt-4">
            <p>{T.noRulesUploaded}</p>
        </div>
      );
    }
    
    return (
       <div className="space-y-3 mt-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
            {myRules.map(rule => (
                <div key={rule.id} className="bg-gray-900/50 p-3 rounded-lg border border-gray-700 flex justify-between items-start gap-4">
                    <div className="flex-1">
                        <h4 className="font-semibold text-cyan-300 text-sm">{rule.rule_id} - {rule.category}</h4>
                        <p className="text-xs text-gray-500">{rule.source_doc}</p>
                        <p className="text-sm text-gray-300 mt-2 whitespace-pre-wrap">{rule.text_chunk}</p>
                    </div>
                     <div className="flex-shrink-0 flex items-center gap-2">
                        <button 
                            onClick={() => openEditModal(rule)}
                            className="text-gray-400 hover:text-cyan-400 transition-colors"
                            aria-label={`${T.editRule} ${rule.rule_id}`}
                            title={T.editRule}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536l12.232-12.232z" /></svg>
                        </button>
                        <button 
                            onClick={() => handleDeleteRule(rule.id)}
                            className="text-gray-400 hover:text-red-400 transition-colors"
                            aria-label={`${T.deleteRule} ${rule.rule_id}`}
                            title={T.deleteRule}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                </div>
            ))}
       </div>
    );
  }
  
  const getTabClass = (tabName: 'upload' | 'manual') => {
    const base = "px-4 py-2 text-sm font-medium rounded-t-md transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-800";
    if (activeTab === tabName) {
      return `${base} bg-gray-900/50 text-cyan-400 border-b-2 border-cyan-400`;
    }
    return `${base} bg-transparent text-gray-400 hover:bg-gray-700/50`;
  };

  const isNewRuleFormValid = Object.values(newRule).every(value => value.trim() !== '');

  return (
    <div className="container mx-auto p-4 lg:p-6">
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-4xl mx-auto space-y-8">
        {/* --- Rule Creation Section --- */}
        <div>
          <h2 className="text-xl font-semibold text-cyan-400 mb-4 border-b border-gray-700 pb-2">{T.adminPageTitle}</h2>
           <div className="border-b border-gray-700">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                    <button onClick={() => setActiveTab('upload')} className={getTabClass('upload')}>{T.uploadFileTab}</button>
                    <button onClick={() => setActiveTab('manual')} className={getTabClass('manual')}>{T.addManuallyTab}</button>
                </nav>
            </div>
            <div className="mt-4">
              {activeTab === 'upload' && (
                 <ComplianceRAGApp
                    T={T}
                    lang={lang}
                    db={db}
                    userId={user.uid}
                    appId={appId}
                    isAuthReady={true}
                  />
              )}
              {activeTab === 'manual' && (
                 <div className="p-6 bg-gray-900/50 rounded-lg border border-gray-700 animate-fade-in-fast">
                    <h4 className="text-lg font-semibold text-gray-200 mb-4">{T.manualFormTitle}</h4>
                     <form onSubmit={handleAddNewRule} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                              <label htmlFor="new_rule_id" className="block text-sm font-medium text-gray-300">{T.ruleIdLabel}</label>
                              <input type="text" id="new_rule_id" value={newRule.rule_id} onChange={(e) => handleNewRuleChange('rule_id', e.target.value)} placeholder={T.ruleIdPlaceholder} required className="w-full mt-1 bg-gray-900 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-cyan-500" />
                          </div>
                           <div>
                              <label htmlFor="new_category" className="block text-sm font-medium text-gray-300">{T.categoryLabel}</label>
                              <input type="text" id="new_category" value={newRule.category} onChange={(e) => handleNewRuleChange('category', e.target.value)} placeholder={T.categoryPlaceholder} required className="w-full mt-1 bg-gray-900 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-cyan-500" />
                          </div>
                        </div>
                         <div>
                              <label htmlFor="new_source_doc" className="block text-sm font-medium text-gray-300">{T.sourceDocLabel}</label>
                              <input type="text" id="new_source_doc" value={newRule.source_doc} onChange={(e) => handleNewRuleChange('source_doc', e.target.value)} placeholder={T.sourceDocPlaceholder} required className="w-full mt-1 bg-gray-900 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-cyan-500" />
                          </div>
                          <div>
                              <label htmlFor="new_text_chunk" className="block text-sm font-medium text-gray-300">{T.textChunkLabel}</label>
                              <textarea id="new_text_chunk" value={newRule.text_chunk} onChange={(e) => handleNewRuleChange('text_chunk', e.target.value)} rows={4} placeholder={T.textChunkPlaceholder} required className="w-full mt-1 bg-gray-900 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-cyan-500 custom-scrollbar"></textarea>
                          </div>
                          <div className="flex justify-end items-center gap-4">
                              {saveStatus && (
                                <p className={`text-sm ${saveStatus.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{saveStatus.message}</p>
                              )}
                              <button type="submit" disabled={!isNewRuleFormValid || isSavingNewRule} className="py-2 px-5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-gray-900 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors">
                                {isSavingNewRule ? T.saving : T.saveRule}
                              </button>
                          </div>
                     </form>
                 </div>
              )}
            </div>
        </div>

        {/* --- My Ruleset Display --- */}
        <div>
           <h2 className="text-xl font-semibold text-cyan-400 mb-4 border-b border-gray-700 pb-2">{T.myRulesTitle}</h2>
           {renderMyRules()}
        </div>
      </div>
      
      {/* Edit Rule Modal */}
      {isEditModalOpen && ruleToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate__animated animate__fadeIn animate__faster" aria-modal="true" role="dialog">
          <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-cyan-500/50">
            <header className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
                <h3 className="text-lg font-semibold text-cyan-400">{T.editRule}</h3>
                <button onClick={closeEditModal} className="text-gray-400 hover:text-white text-2xl leading-none" aria-label={T.close}>&times;</button>
            </header>
            <main className="p-6 overflow-y-auto custom-scrollbar space-y-4">
                <div>
                    <label htmlFor="rule_id" className="block text-sm font-medium text-gray-300">{T.ruleIdLabel}</label>
                    <input type="text" id="rule_id" value={editedData.rule_id} onChange={(e) => handleInputChange('rule_id', e.target.value)} className="w-full mt-1 bg-gray-900 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-cyan-500" />
                </div>
                 <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-300">{T.categoryLabel}</label>
                    <input type="text" id="category" value={editedData.category} onChange={(e) => handleInputChange('category', e.target.value)} className="w-full mt-1 bg-gray-900 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-cyan-500" />
                </div>
                 <div>
                    <label htmlFor="source_doc" className="block text-sm font-medium text-gray-300">{T.sourceDocLabel}</label>
                    <input type="text" id="source_doc" value={editedData.source_doc} onChange={(e) => handleInputChange('source_doc', e.target.value)} className="w-full mt-1 bg-gray-900 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                    <label htmlFor="text_chunk" className="block text-sm font-medium text-gray-300">{T.textChunkLabel}</label>
                    <textarea id="text_chunk" value={editedData.text_chunk} onChange={(e) => handleInputChange('text_chunk', e.target.value)} rows={6} className="w-full mt-1 bg-gray-900 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-cyan-500 custom-scrollbar"></textarea>
                </div>
            </main>
            <footer className="flex justify-end gap-4 p-4 border-t border-gray-700 flex-shrink-0">
                <button onClick={closeEditModal} className="px-4 py-2 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 focus:ring-offset-gray-800">
                    {T.cancel}
                </button>
                <button onClick={handleSaveEdit} disabled={isUpdating} className="px-4 py-2 text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-gray-800 disabled:bg-gray-500 disabled:cursor-not-allowed">
                    {isUpdating ? T.saving : T.saveChanges}
                </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;