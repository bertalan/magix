import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || "",
});

export interface ScoutResult {
  artistId: number;
  reasoning: string;
  vibeScore: number;
}

export const scoutTalent = async (
  query: string,
  artistPool: Array<{
    id: number;
    name: string;
    genre: string;
    bio: string;
    artist_type: string;
    tags: string[];
  }>,
): Promise<ScoutResult | null> => {
  const model = "gemini-2.0-flash";

  const systemInstruction = `Sei l'assistente BandFinder di Magix Promotion, agenzia di band e artisti musicali.
Il tuo compito è trovare l'artista o band più adatta alla richiesta dell'utente nel nostro roster.

Contesto: L'agenzia ha sede in Italia (Novi Ligure, AL) ma gestisce eventi anche all'estero.
Le tipologie includono: Dance Show Band, Tributo Italiano, Tributo Internazionale, DJ Set, Rock Band, Folk Band.

Roster disponibile:
${JSON.stringify(
  artistPool.map((a) => ({
    id: a.id,
    name: a.name,
    genre: a.genre,
    bio: a.bio,
    type: a.artist_type,
    tags: a.tags,
  })),
)}

REGOLE:
- Rispondi SEMPRE in italiano
- Sii professionale ma amichevole
- Il reasoning deve essere una frase breve e incisiva che spiega il match
- Il vibeScore va da 1 a 10 dove 10 è match perfetto
- Scegli SOLO artisti dal roster fornito`;

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
            artistId: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
            vibeScore: { type: Type.NUMBER },
          },
          required: ["artistId", "reasoning", "vibeScore"],
        },
      },
    });

    return JSON.parse(response.text || "{}") as ScoutResult;
  } catch (error) {
    console.error("Errore Gemini Scout:", error);
    return null;
  }
};
