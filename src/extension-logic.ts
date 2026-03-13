import { translateHinglish } from './services/gemini';

// This is a mock of the background script logic for the simulator
// In a real extension, this would use chrome.runtime.onMessage
export async function handleTranslationRequest(text: string, apiKey: string) {
  try {
    const result = await translateHinglish(text, apiKey);
    return { success: true, data: result };
  } catch (error) {
    console.error("Translation error:", error);
    return { success: false, error: "Failed to translate text." };
  }
}
