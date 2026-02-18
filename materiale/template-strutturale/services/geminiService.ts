
import { GoogleGenAI, Type } from "@google/genai";

// Initialize the GoogleGenAI client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const scoutTalent = async (query: string, artistPool: any[]) => {
  // Use gemini-3-flash-preview for the task
  const model = 'gemini-3-flash-preview';
  
  const systemInstruction = `You are an elite Music Talent Scout for UTA. 
  Your goal is to match user queries with the most suitable artists from our roster.
  Be trendy, concise, and professional. 
  
  Roster: ${JSON.stringify(artistPool)}
  
  Return your answer in JSON format including:
  - artistId: the ID of the best match
  - reasoning: a short (1 sentence) cool explanation of why they match.
  - vibeScore: 1-10.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: query,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            artistId: { type: Type.STRING },
            reasoning: { type: Type.STRING },
            vibeScore: { type: Type.NUMBER }
          },
          required: ["artistId", "reasoning", "vibeScore"]
        }
      }
    });

    // response.text property is directly used as a string
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Scouting Error:", error);
    return null;
  }
};
