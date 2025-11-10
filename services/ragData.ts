// This file contains the self-contained RAG logic for in-browser similarity search.

// =================================================================
// START: RAG Logic (Self-Contained)
// =================================================================

// Cấu trúc Dữ liệu Tuân thủ (Data & Interfaces)
export interface ComplianceChunk {
    rule_id: string; 
    category: string; 
    text_chunk: string; 
    source_doc: string; 
}

export interface IndexedChunk extends ComplianceChunk {
    tfidf_vector: number[]; 
    similarity_score?: number;
}

export interface TfidfVectorizer {
    vocabulary: Map<string, number>; 
    idf_values: number[]; 
}

// Hàm tiện ích để xử lý văn bản
export const tokenize = (text: string): string[] => {
    return text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").split(/\s+/).filter(Boolean);
};

// Yêu cầu Chức năng Logic (Core Logic Functions)

export const createTfidfVectorizer = (docs: ComplianceChunk[]): TfidfVectorizer => {
    const tokenizedDocs = docs.map(doc => tokenize(doc.text_chunk));
    const vocabulary = new Map<string, number>();
    const docFreq = new Map<string, number>();
    let vocabIndex = 0;

    for (const doc of tokenizedDocs) {
        const seenWords = new Set<string>();
        for (const word of doc) {
            if (!vocabulary.has(word)) {
                vocabulary.set(word, vocabIndex++);
            }
            if (!seenWords.has(word)) {
                docFreq.set(word, (docFreq.get(word) || 0) + 1);
                seenWords.add(word);
            }
        }
    }

    const numDocs = docs.length;
    const idf_values = new Array(vocabulary.size).fill(0);
    vocabulary.forEach((index, word) => {
        idf_values[index] = Math.log(numDocs / (1 + (docFreq.get(word) || 0))) + 1;
    });
    
    return { vocabulary, idf_values };
};

export const calculateTfIdfVectors = (docs: ComplianceChunk[], vectorizer: TfidfVectorizer): IndexedChunk[] => {
    const tokenizedDocs = docs.map(doc => tokenize(doc.text_chunk));

    return docs.map((doc, i) => {
        const docTokens = tokenizedDocs[i];
        const tf = new Map<string, number>();
        for (const token of docTokens) {
            tf.set(token, (tf.get(token) || 0) + 1);
        }

        const tfidf_vector = new Array(vectorizer.vocabulary.size).fill(0);
        let magnitude = 0;
        
        const maxFreq = Math.max(...Array.from(tf.values()));

        tf.forEach((count, word) => {
            if (vectorizer.vocabulary.has(word)) {
                const termIndex = vectorizer.vocabulary.get(word)!;
                const tfValue = 0.5 + (0.5 * count) / maxFreq;
                const tfidf = tfValue * vectorizer.idf_values[termIndex];
                tfidf_vector[termIndex] = tfidf;
                magnitude += tfidf * tfidf;
            }
        });
        
        magnitude = Math.sqrt(magnitude);
        if (magnitude > 0) {
            for (let j = 0; j < tfidf_vector.length; j++) {
                tfidf_vector[j] /= magnitude;
            }
        }
        
        return { ...doc, tfidf_vector };
    });
};

export const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
    let dotProduct = 0;
    const minLength = Math.min(vecA.length, vecB.length);
    for (let i = 0; i < minLength; i++) {
        dotProduct += (vecA[i] || 0) * (vecB[i] || 0);
    }
    // Note: Vectors are already normalized, so no need to divide by magnitudes
    return dotProduct;
};

export const retrieveContext = (query: string, index: IndexedChunk[], vectorizer: TfidfVectorizer, k: number): IndexedChunk[] => {
    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) return [];

    const queryTf = new Map<string, number>();
    for (const token of queryTokens) {
        queryTf.set(token, (queryTf.get(token) || 0) + 1);
    }
    
    const queryVector = new Array(vectorizer.vocabulary.size).fill(0);
    let queryMagnitude = 0;
    
    const maxQueryFreq = Math.max(...Array.from(queryTf.values()));

    queryTf.forEach((count, word) => {
        if (vectorizer.vocabulary.has(word)) {
            const termIndex = vectorizer.vocabulary.get(word)!;
            const tfValue = 0.5 + (0.5 * count) / maxQueryFreq;
            const tfidf = tfValue * vectorizer.idf_values[termIndex];
            queryVector[termIndex] = tfidf;
            queryMagnitude += tfidf * tfidf;
        }
    });

    queryMagnitude = Math.sqrt(queryMagnitude);
    if (queryMagnitude > 0) {
        for (let j = 0; j < queryVector.length; j++) {
            queryVector[j] /= queryMagnitude;
        }
    }
    
    const scoredChunks = index.map(chunk => ({
        ...chunk,
        similarity_score: cosineSimilarity(queryVector, chunk.tfidf_vector),
    }));

    return scoredChunks
        .sort((a, b) => (b.similarity_score || 0) - (a.similarity_score || 0))
        .filter(chunk => (chunk.similarity_score || 0) > 0.01)
        .slice(0, k);
};
