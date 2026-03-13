import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

export type TranslationTone = 'casual' | 'professional';

export interface TranslationResult {
  casual: string;
  professional: string;
}

function getAIInstance(apiKey: string) {
  return new GoogleGenAI({ apiKey });
}

export async function translateHinglishLive(text: string, apiKey: string): Promise<string> {
  if (!text.trim()) return "";
  if (!apiKey) return "Error: Gemini API key is missing.";

  const ai = getAIInstance(apiKey);
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Translate the following Hinglish text to natural English. Provide ONLY the translated text, no extra words or formatting.\n\nText to translate:\n${text}`,
      config: {
        systemInstruction: "You are a fast Hinglish-to-English translator. Convert Hinglish slang and intent into natural, flowing English. Provide ONLY the translated text, no extra words, no quotes around the output.",
      },
    });
    
    let resultText = response.text || "";
    // Remove surrounding quotes if the model added them
    resultText = resultText.replace(/^["'](.*)["']$/, '$1').trim();
    
    return resultText;
  } catch (error: any) {
    console.error("Translation API Error:", error);
    if (error?.message?.includes('429') || error?.message?.includes('quota')) {
      return "Quota exceeded. Please wait.";
    }
    return "Error: Translation failed. Text might be too long or API issue.";
  }
}
