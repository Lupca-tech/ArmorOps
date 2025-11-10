import React, { useState, useMemo } from 'react';
import { Vulnerability, AnalysisResult, RiskFactor, SystemScope } from '../types';
import { Translation } from '../translations';

interface ResultDisplayProps {
  result: AnalysisResult | null;
  scope: SystemScope;
  timestamp?: string;
  isLoading: boolean;
  error: string | null;
  onStartRemediation: (vulnerability: Vulnerability) => void;
  onCancel: () => void;
  isRemediating: boolean;
  remediationResult: string | null;
  onClearRemediation: () => void;
  T: Translation;
}

const SimpleMarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');
  
  const renderTable = (tableLines: string[]) => {
    if (tableLines.length < 2) return null;
    const headers = tableLines[0].split('|').map(h => h.trim()).slice(1, -1);
    const rows = tableLines.slice(2).map(rowLine => rowLine.split('|').map(c => c.trim()).slice(1, -1));
    
    return (
      <div className="overflow-x-auto my-4 rounded-lg border border-gray-700">
        <table className="min-w-full divide-y divide-gray-600">
          <thead className="bg-gray-700/50">
            <tr>
              {headers.map((header, i) => (
                <th key={i} scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">{header.replace(/&ast;/g, '*')}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-gray-800/50 divide-y divide-gray-700">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-gray-700/50">
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-2 whitespace-pre-wrap text-sm text-gray-300" dangerouslySetInnerHTML={{ __html: cell.replace(/`([^`]+)`/g, '<code class="bg-gray-900 text-cyan-400 px-1 rounded">\$1</code>').replace(/\*\*([^\*]+)\*\*/g, '<strong>\$1</strong>') }}></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  const renderCodeBlock = (codeLines: string[], lang: string) => (
    <pre className="bg-gray-900 rounded-md p-4 my-4 overflow-x-auto border border-gray-700">
      <code className={`language-${lang} text-sm`}>
        {codeLines.join('\n')}
      </code>
    </pre>
  );

  let elements: React.ReactNode[] = [];
  let inTable = false;
  let tableLines: string[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let codeLang = '';

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    if (inCodeBlock) {
      if (trimmedLine.startsWith('```')) {
        elements.push(renderCodeBlock(codeBlockLines, codeLang));
        inCodeBlock = false;
        codeBlockLines = [];
        codeLang = '';
      } else {
        codeBlockLines.push(line);
      }
      return;
    }
    
    if (inTable) {
        if (!trimmedLine.startsWith('|') || trimmedLine.length === 0) {
        elements.push(renderTable(tableLines));
        inTable = false;
        tableLines = [];
      } else {
        tableLines.push(line);
        if (index === lines.length - 1) { // End of content
             elements.push(renderTable(tableLines));
        }
        return;
      }
    }
    
    // Handle translated headers
    const header1Regex = /^(?:# KẾT QUẢ ĐẦU RA CHO LẦN THỬ HIỆN TẠI|## OUTPUT FOR CURRENT ATTEMPT|# )/
    if (line.startsWith('# KẾT QUẢ') || line.startsWith('# ')) {
      elements.push(<h1 key={index} className="text-2xl font-bold text-white mb-4 mt-2">{line.substring(2)}</h1>);
    } else if (line.startsWith('## ')) {
       elements.push(<h2 key={index} className="text-xl font-semibold text-cyan-400 mt-6 mb-3 border-b border-gray-700 pb-2">{line.substring(3)}</h2>);
    } else if (line.startsWith('### ')) {
       elements.push(<h3 key={index} className="text-lg font-semibold text-cyan-300 mt-4 mb-2">{line.substring(4)}</h3>);
    } else if (trimmedLine.startsWith('|')) {
       inTable = true;
       tableLines.push(line);
    } else if (trimmedLine.startsWith('```')) {
       inCodeBlock = true;
       codeLang = trimmedLine.substring(3);
    } else if (trimmedLine.startsWith('**') || trimmedLine.startsWith('* **')) {
        const cleanedLine = line.replace(/^\s*\*\s*/, '');
        elements.push(<p key={index} className="my-2" dangerouslySetInnerHTML={{ __html: cleanedLine.replace(/\*\*([^\*]+)\*\*/g, '<strong class="text-gray-100">\$1</strong>') }} />);
    } else if (trimmedLine !== '') {
        elements.push(<p key={index} className="my-2">{line}</p>);
    }
  });

  return <div>{elements}</div>;
};

const RISK_LEVELS: Record<string, { value: number; color: string; textColor: string; labelKey: keyof Translation, gradient: string }> = {
  low: { value: 25, color: 'bg-blue-600', textColor: 'text-blue-200', labelKey: 'low', gradient: 'from-blue-500 to-cyan-500' },
  medium: { value: 50, color: 'bg-yellow-600', textColor: 'text-yellow-200', labelKey: 'medium', gradient: 'from-yellow-500 to-orange-500' },
  high: { value: 75, color: 'bg-orange-600', textColor: 'text-orange-200', labelKey: 'high', gradient: 'from-orange-500 to-red-500' },
  critical: { value: 100, color: 'bg-red-700', textColor: 'text-red-200', labelKey: 'critical', gradient: 'from-red-600 to-rose-600' },
};

const RiskScoreGauge: React.FC<{ score: number, T: Translation }> = ({ score, T }) => {
    const scoreMin = 300;
    const scoreMax = 1000;
    const percentage = Math.max(0, Math.min(100, ((score - scoreMin) / (scoreMax - scoreMin)) * 100));

    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const strokeOffset = circumference - (percentage / 100) * circumference;

    let riskLabelKey: keyof Translation;
    let riskColorClass: string;
    let strokeColor: string;

    if (score >= 900) {
        riskLabelKey = 'lowRisk'; riskColorClass = 'text-green-400'; strokeColor = '#4ade80';
    } else if (score >= 700) {
        riskLabelKey = 'mediumRisk'; riskColorClass = 'text-yellow-400'; strokeColor = '#facc15';
    } else if (score >= 400) {
        riskLabelKey = 'highRisk'; riskColorClass = 'text-orange-400'; strokeColor = '#fb923c';
    } else {
        riskLabelKey = 'criticalRisk'; riskColorClass = 'text-red-500'; strokeColor = '#ef4444';
    }
    const riskLabel = T[riskLabelKey] as string;

    return (
        <div className="relative flex flex-col items-center justify-center p-4 h-full">
            <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 200 200">
                <circle
                    cx="100"
                    cy="100"
                    r={radius}
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="16"
                    fill="transparent"
                />
                <circle
                    cx="100"
                    cy="100"
                    r={radius}
                    stroke={strokeColor}
                    strokeWidth="16"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.25, 1, 0.5, 1)', strokeDashoffset: strokeOffset }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold text-white tracking-tighter">{score}</span>
                <div className={`mt-1 text-sm font-bold ${riskColorClass} uppercase tracking-wider`}>
                    {riskLabel}
                </div>
            </div>
        </div>
    );
};


const RiskFactors: React.FC<{ factors: RiskFactor[] }> = ({ factors }) => {
    const getStatusColor = (status: RiskFactor['status']) => {
        switch (status) {
            case 'good': return 'bg-green-500';
            case 'bad': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {factors.map(factor => (
                <div key={factor.name} className="flex items-center space-x-3 py-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${getStatusColor(factor.status)} shadow-lg`}></span>
                    <span className="text-gray-300">{factor.name}</span>
                </div>
            ))}
        </div>
    );
};


const ScoreReport: React.FC<{ result: AnalysisResult, timestamp?: string, T: Translation }> = ({ result, timestamp, T }) => {
  return (
    <div className="bg-gray-900/30 p-4 rounded-lg border border-white/10 mb-6 flex flex-col h-full">
      <h3 className="text-base font-semibold text-center text-gray-200 mb-2 uppercase tracking-widest">{T.cyberRiskScoreTitle}</h3>
      <div className="flex-grow">
        <RiskScoreGauge score={result.overallScore} T={T} />
      </div>
      {timestamp && <p className="text-center text-xs text-gray-500 mt-2">{T.updated(new Date(timestamp).toLocaleDateString())}</p>}

      <div className="mt-6 border-t border-white/10 pt-4">
        <h4 className="text-sm font-semibold text-center text-gray-400 uppercase tracking-wider mb-3">{T.scoreRiskFactorsTitle}</h4>
        <RiskFactors factors={result.riskFactors} />
      </div>
    </div>
  );
}


const RiskSummaryChart: React.FC<{ vulnerabilities: Vulnerability[], T: Translation }> = ({ vulnerabilities, T }) => {
    const riskCounts: { [key: string]: number } = {
      Critical: 0,
      High: 0,
      Medium: 0,
      Low: 0,
    };

    vulnerabilities.forEach(vuln => {
        const score = vuln.contextualRisk.charAt(0).toUpperCase() + vuln.contextualRisk.slice(1).toLowerCase();
        if (score in riskCounts) {
            riskCounts[score]++;
        }
    });

    const total = vulnerabilities.length;
    if (total === 0) return null;

    const chartData = Object.entries(riskCounts)
        .map(([name, count]) => ({
            name: name as keyof typeof riskCounts,
            count,
            percentage: total > 0 ? (count / total) * 100 : 0,
            level: RISK_LEVELS[name.toLowerCase()]
        }))
        .filter(item => item.count > 0 && item.level); // Ensure level exists

    return (
        <div className="bg-gray-900/30 p-4 rounded-lg border border-white/10">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">{T.vulnerabilityOverview}</h3>
            <div className="space-y-3">
                {chartData.map(data => {
                    const label = T[data.level.labelKey] as string || data.name;
                    return (
                      <div key={data.name}>
                          <div className="flex justify-between mb-1">
                               <span className={`text-sm font-medium ${data.level.textColor}`}>{label}</span>
                               <span className="text-sm font-medium text-gray-300">{T.vulnerabilitiesCount(data.count)}</span>
                          </div>
                          <div className="w-full bg-gray-700/50 rounded-full h-2.5 overflow-hidden">
                               <div className={`bg-gradient-to-r ${data.level.gradient} h-2.5 rounded-full transition-all duration-700 ease-out`} style={{ width: `${data.percentage}%` }}></div>
                          </div>
                      </div>
                    )
                })}
            </div>
        </div>
    );
};

const ScoringExplanation: React.FC<{ T: Translation }> = ({ T }) => {
    const scoreLevels = [
        { labelKey: 'scoringRangeLow', range: '900-1000', color: 'bg-green-600', textColor: 'text-green-100', borderColor: 'border-green-400' },
        { labelKey: 'scoringRangeMedium', range: '700-899', color: 'bg-yellow-600', textColor: 'text-yellow-100', borderColor: 'border-yellow-400' },
        { labelKey: 'scoringRangeHigh', range: '400-699', color: 'bg-orange-600', textColor: 'text-orange-100', borderColor: 'border-orange-400' },
        { labelKey: 'scoringRangeCritical', range: '300-399', color: 'bg-red-700', textColor: 'text-red-100', borderColor: 'border-red-500' },
    ];

    return (
        <div className="bg-gray-900/30 p-4 rounded-lg border border-white/10">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">{T.scoringExplanationTitle}</h3>
            <div className="space-y-3 text-sm">
                <p className="text-gray-400">{T.scoringDeductions}</p>
                
                <div className="mt-4 pt-3 border-t border-gray-700">
                    <h4 className="font-semibold text-gray-300 mb-2 text-center text-base">{T.scoringHigherIsBetter}</h4>
                    <div className="flex flex-col space-y-2">
                        {scoreLevels.map(level => (
                            <div key={level.range} className={`flex justify-between items-center p-2 rounded-md ${level.color} border-l-4 ${level.borderColor}`}>
                                <span className={`font-bold ${level.textColor}`}>{T[level.labelKey as keyof Translation] as string}</span>
                                <span className={`font-mono font-semibold text-white bg-black/20 px-2 py-0.5 rounded`}>{level.range}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};


const RiskAdjustmentIndicator: React.FC<{ severity: string; contextualRisk: string; T: Translation }> = ({ severity, contextualRisk, T }) => {
    const severityLower = severity.toLowerCase();
    const riskScoreLower = contextualRisk.toLowerCase();

    if (severityLower === riskScoreLower) {
        return null;
    }
    const severityLevel = RISK_LEVELS[severityLower];
    const riskScoreLevel = RISK_LEVELS[riskScoreLower];

    if (!severityLevel || !riskScoreLevel) return null;

    return (
        <div className="my-3 p-3 bg-gray-900/50 rounded-md border border-gray-700/50" title="Điểm rủi ro được điều chỉnh dựa trên ngữ cảnh hệ thống bạn đã cung cấp.">
            <div className="flex items-center justify-around text-xs text-gray-400">
                <div className="text-center px-2">
                    <span className="font-semibold block truncate">{T.technicalSeverity}</span>
                    <div className={`mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-semibold text-white ${severityLevel.color}`}>
                        {severity}
                    </div>
                </div>
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400 mx-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                <div className="text-center px-2">
                    <span className="font-semibold block truncate">{T.contextualRisk}</span>
                     <div className={`mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-semibold text-white ${riskScoreLevel.color}`}>
                        {contextualRisk}
                    </div>
                </div>
            </div>
        </div>
    );
};

type FilterLevel = 'All' | 'Critical' | 'High' | 'Medium' | 'Low';

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, scope, timestamp, isLoading, error, onStartRemediation, isRemediating, remediationResult, onClearRemediation, onCancel, T }) => {
    const [selectedVulnerability, setSelectedVulnerability] = useState<Vulnerability | null>(null);
    const [activeFilter, setActiveFilter] = useState<FilterLevel>('All');

    const handleRemediateClick = (vulnerability: Vulnerability) => {
        setSelectedVulnerability(vulnerability);
        onStartRemediation(vulnerability);
    }

    const handleCloseModal = () => {
        setSelectedVulnerability(null);
        onClearRemediation();
    }
    
    const getFilterButtonClass = (level: FilterLevel) => {
        const base = "px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-gray-900";
        if (activeFilter === level) {
            return `${base} bg-cyan-500 text-white shadow-md shadow-cyan-500/20`;
        }
        return `${base} bg-gray-700/50 text-gray-300 hover:bg-gray-600/80`;
    }

    const groupedVulnerabilities = useMemo(() => {
        if (!result || !result.vulnerabilities) return {};
        
        const filtered = result.vulnerabilities.filter(vuln => 
            activeFilter === 'All' || vuln.contextualRisk.toLowerCase() === activeFilter.toLowerCase()
        );

        return filtered.reduce((acc, vuln) => {
            const category = vuln.category || 'Uncategorized';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(vuln);
            return acc;
        }, {} as Record<string, Vulnerability[]>);

    }, [result, activeFilter]);
    
    const handleDownloadReport = () => {
        if (!result) return;

        const getRiskLevelFromScore = (score: number) => {
            if (score >= 900) return T.lowRisk;
            if (score >= 700) return T.mediumRisk;
            if (score >= 400) return T.highRisk;
            return T.criticalRisk;
        };
        
        const riskCounts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
        result.vulnerabilities.forEach(v => {
            const risk = v.contextualRisk.charAt(0).toUpperCase() + v.contextualRisk.slice(1);
            if (risk in riskCounts) {
                riskCounts[risk as keyof typeof riskCounts]++;
            }
        });

        const summaryTable = `| ${T.overallRiskScore} | ${T.overallRiskLevel} | ${T.vulnerabilityCounts} |
| :--- | :--- | :--- |
| **${result.overallScore}** | ${getRiskLevelFromScore(result.overallScore)} | ${T.critical}: ${riskCounts.Critical}, ${T.high}: ${riskCounts.High}, ${T.medium}: ${riskCounts.Medium}, ${T.low}: ${riskCounts.Low} |`;

        const contextSection = `## ${T.reportSystemContext}
- **${T.reportEnvironments}:** ${scope.environments.join(', ')}
- **${T.reportDataSensitivities}:** ${scope.dataSensitivities.join(', ')}
- **${T.reportComplianceFrameworks}:** ${scope.compliances.join(', ')}
`;

        const vulnerabilitiesSection = result.vulnerabilities.map(vuln => {
            return `### ${T.reportRule}: ${vuln.violatedRule}

**${T.reportDetails}:**
| ${T.reportId} | ${T.reportCategory} | ${T.reportTechSeverity} | ${T.reportContextRisk} | ${T.reportRiskScore} |
| :--- | :--- | :--- | :--- | :--- |
| \`${vuln.id}\` | ${vuln.category} | ${vuln.severity} | ${vuln.contextualRisk} | ${vuln.riskScore?.toFixed(2) || 'N/A'} |

**${T.reportDescription}:**
${vuln.description}

**${T.reportVulnerableCode}:**
\`\`\`
${vuln.vulnerableCodeSnippet}
\`\`\`
`;
        }).join('\n---\n\n');

        const reportContent = `# ${T.reportTitle}
**${T.generatedOn}:** ${new Date().toLocaleString()}

## ${T.reportSummary}
${summaryTable}

${contextSection}

## ${T.reportVulnerabilityDetails}
${vulnerabilitiesSection}
`;

        const blob = new Blob([reportContent], { type: 'text/markdown;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const date = new Date().toISOString().split('T')[0];
        link.setAttribute("href", url);
        link.setAttribute("download", `ArmorOps-Security-Report-${date}.md`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };


    const renderVulnerabilityList = () => {
        if (!result) return null;

        if (result.vulnerabilities.length > 0) {
            const categories = Object.keys(groupedVulnerabilities);
            if (categories.length === 0) {
                return (
                    <div className="text-center text-gray-400 p-8 border-2 border-dashed border-gray-700 rounded-lg mt-4">
                        <p>{T.noFilterMatch(activeFilter)}</p>
                    </div>
                );
            }

            return categories.map(category => (
                <details key={category} open className="mb-4 bg-gray-900/30 rounded-lg border border-white/10 transition-all duration-300">
                    <summary className="p-3 cursor-pointer text-md font-semibold text-cyan-300 list-none flex justify-between items-center hover:bg-gray-800/50 rounded-t-lg">
                        <span>{category}</span>
                        <span className="text-sm bg-gray-700 text-gray-200 rounded-full px-2 py-0.5">
                            {groupedVulnerabilities[category].length}
                        </span>
                    </summary>
                    <div className="p-4 border-t border-white/10">
                        {groupedVulnerabilities[category].map(vuln => {
                            const riskLevel = RISK_LEVELS[vuln.contextualRisk.toLowerCase()];
                            const label = riskLevel ? T[riskLevel.labelKey] as string : vuln.contextualRisk;
                            return (
                                <div key={vuln.id} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 mb-4 transition-all hover:border-cyan-500/50 hover:shadow-lg">
                                    <div className="flex items-start gap-3 flex-wrap">
                                        <div className="flex-grow">
                                            <h3 className="font-semibold text-lg text-gray-100 flex items-center gap-3">
                                                {riskLevel && (
                                                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold leading-none ${riskLevel.color} ${riskLevel.textColor}`}>
                                                        {label}
                                                    </span>
                                                )}
                                                <span>{vuln.violatedRule}</span>
                                            </h3>
                                        </div>
                                        {vuln.riskScore !== undefined && (
                                            <div className="ml-auto text-right flex-shrink-0">
                                                <span className="text-xs text-gray-400 block leading-tight">Risk Score</span>
                                                <span className="text-2xl font-bold text-cyan-400 leading-tight">{vuln.riskScore.toFixed(2)}</span>
                                            </div>
                                        )}
                                    </div>
                                    <RiskAdjustmentIndicator severity={vuln.severity} contextualRisk={vuln.contextualRisk} T={T}/>
                                    <p className="text-sm text-gray-300 mt-2 mb-3">{vuln.description}</p>
                                    <details className="group">
                                        <summary className="text-xs text-cyan-400 cursor-pointer list-none inline-flex items-center gap-1 hover:underline">
                                            Show Code Snippet 
                                            <svg className="w-3 h-3 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                        </summary>
                                        <pre className="bg-gray-900 text-sm font-mono p-3 rounded-md mt-2 overflow-x-auto border border-gray-600">
                                            <code>{vuln.vulnerableCodeSnippet}</code>
                                        </pre>
                                    </details>
                                    <div className="text-right mt-4">
                                        <button 
                                            onClick={() => handleRemediateClick(vuln)}
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-gray-900 transition-transform hover:scale-105"
                                        >
                                        {T.autoRemediate}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </details>
            ));
        }

        return null; // Should not be reached if result exists
    };


    const renderContent = () => {
        if (isLoading) {
             return (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                   <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
                   <p className="mt-4 text-lg">{T.analyzingCode}</p>
                   <p className="text-sm text-gray-400">{T.analyzingSub}</p>
                   <button
                     onClick={onCancel}
                     className="mt-6 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-gray-900"
                   >
                     {T.cancel}
                   </button>
                </div>
              </div>
            );
        }
        if (error && !remediationResult) { // Don't show main error if modal has its own error
            return (
                <div className="flex items-center justify-center h-full">
                    <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-md" role="alert">
                        <strong className="font-bold">{T.errorPrefix} </strong>
                        <span className="block sm:inline">{error}</span>
                    </div>
                </div>
            );
        }
        if (!result) {
            return (
               <div className="flex items-center justify-center h-full">
                 <div className="text-center text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-2">{T.resultsHere}</p>
                 </div>
               </div>
            );
        }

        const filterButtons: { level: FilterLevel; label: string }[] = [
            { level: 'All', label: T.all },
            { level: 'Critical', label: T.critical },
            { level: 'High', label: T.high },
            { level: 'Medium', label: T.medium },
            { level: 'Low', label: T.low },
        ];

        return (
            <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="md:col-span-1 h-full">
                        <ScoreReport result={result} timestamp={timestamp} T={T} />
                    </div>
                    <div className="md:col-span-2 flex flex-col gap-6">
                        {result.vulnerabilities.length > 0 ? (
                            <RiskSummaryChart vulnerabilities={result.vulnerabilities} T={T} />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full bg-gray-900/30 p-4 rounded-lg border border-white/10">
                                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="mt-2 text-lg">{T.noVulnerabilitiesFoundSuccess}</p>
                            </div>
                        )}
                        <ScoringExplanation T={T} />
                    </div>
                </div>

                {result.vulnerabilities.length > 0 && (
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-gray-400 self-center mr-2">{T.filterByRisk}</span>
                        {filterButtons.map(({ level, label }) => (
                            <button key={level} onClick={() => setActiveFilter(level)} className={getFilterButtonClass(level)}>{label}</button>
                        ))}
                    </div>
                )}
                
                {renderVulnerabilityList()}
            </>
        );
    };
    
    return (
    <div className="h-full flex flex-col">
       <div className="flex-shrink-0">
        <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
          <h2 className="text-xl font-semibold text-cyan-400">
            {T.resultsTitle}
          </h2>
          {result && result.vulnerabilities && (
             <button
              onClick={handleDownloadReport}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors bg-gray-700 text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              title={T.downloadReport}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              <span>{T.downloadReport}</span>
            </button>
          )}
        </div>
       </div>
      
      <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar -mr-2">
        {renderContent()}
      </div>

      {selectedVulnerability && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate__animated animate__fadeIn animate__faster" aria-modal="true" role="dialog">
              <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-cyan-500/50">
                  <header className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
                      <h3 className="text-lg font-semibold text-cyan-400">{T.remediationModalTitle}</h3>
                      <button onClick={handleCloseModal} className="text-gray-400 hover:text-white text-2xl leading-none" aria-label="Close">&times;</button>
                  </header>
                  <main className="p-6 overflow-y-auto custom-scrollbar">
                      {isRemediating && (
                           <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                   <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-400 mx-auto"></div>
                                   <p className="mt-4 text-md">{T.remediating}</p>
                                   <p className="text-sm text-gray-400">{T.remediatingSub}</p>
                                </div>
                            </div>
                      )}
                      {error && (
                           <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-md" role="alert">
                             <strong className="font-bold">{T.remediationError} </strong>
                             <span className="block sm:inline">{error}</span>
                           </div>
                      )}
                      {remediationResult && <SimpleMarkdownRenderer content={remediationResult} />}
                  </main>
              </div>
          </div>
      )}
    </div>
  );
};

export default ResultDisplay;