import { GoogleGenAI, Type } from "@google/genai";
import { SystemScope, Vulnerability, AnalysisResult } from '../types';
import { buildAnalysisPrompt, buildRemediationPrompt } from '../prompts';
import { Language } from "../translations";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const analyzeIacCode = async (scope: SystemScope, iacCode: string, formattedContext: string, lang: Language): Promise<AnalysisResult> => {
  const emptyResult: AnalysisResult = { overallScore: 950, riskFactors: [], vulnerabilities: [] };
  if (!iacCode.trim()) {
    return Promise.resolve(emptyResult);
  }
  
  const fullPrompt = buildAnalysisPrompt(scope, iacCode, formattedContext, lang);
  
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: fullPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    syntaxError: {
                        type: Type.OBJECT,
                        nullable: true,
                        properties: {
                            isError: { type: Type.BOOLEAN },
                            message: { type: Type.STRING }
                        },
                        required: ['isError', 'message']
                    },
                    overallScore: { type: Type.NUMBER },
                    riskFactors: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                status: { type: Type.STRING }
                            },
                            required: ["name", "status"]
                        }
                    },
                    vulnerabilities: {
                        type: Type.ARRAY,
                        nullable: true,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING },
                                description: { type: Type.STRING },
                                severity: { type: Type.STRING },
                                contextualRisk: { type: Type.STRING },
                                violatedRule: { type: Type.STRING },
                                vulnerableCodeSnippet: { type: Type.STRING },
                                category: { type: Type.STRING }
                            },
                             required: ["id", "description", "severity", "contextualRisk", "violatedRule", "vulnerableCodeSnippet", "category"],
                        }
                    }
                },
                required: ["overallScore", "riskFactors", "vulnerabilities"]
            }
        }
    });
    
    let jsonStr = response.text.trim();
    const parsedResponse = JSON.parse(jsonStr);

    if (parsedResponse.syntaxError && parsedResponse.syntaxError.isError) {
        // Custom prefix to identify syntax errors in the UI
        throw new Error(`SYNTAX_ERROR: ${parsedResponse.syntaxError.message}`);
    }

    if (parsedResponse.vulnerabilities) {
        return {
            overallScore: parsedResponse.overallScore || 0,
            riskFactors: parsedResponse.riskFactors || [],
            vulnerabilities: parsedResponse.vulnerabilities || [],
        };
    }

    // Fallback for empty or unexpected response
    if (Object.keys(parsedResponse).length === 0 && iacCode.trim()) {
        console.warn("Model returned an empty object.");
        return emptyResult;
    }

    return emptyResult;

  } catch (error) {
    console.error("Error calling Gemini API for analysis:", error);
    if (error instanceof Error && error.message.startsWith('SYNTAX_ERROR:')) {
      throw error; // Re-throw the specific syntax error
    }
    throw new Error("Failed to get analysis from AI. The model's response may not be valid JSON.");
  }
};

export const remediateIacCode = async (originalCode: string, vulnerability: Vulnerability, lang: Language): Promise<string> => {
  const fullPrompt = buildRemediationPrompt(originalCode, vulnerability, lang);

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: fullPrompt
    });
    
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API for remediation:", error);
    throw new Error("Failed to get remediation from AI. Please check your API key and network connection.");
  }
};