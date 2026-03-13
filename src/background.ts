import { translateHinglishLive } from './services/gemini';

declare const chrome: any;

// Simple cache to save API quota for repeated translations
const translationCache = new Map<string, string>();

chrome.runtime.onMessage.addListener((request: any, sender: any, sendResponse: any) => {
  if (request.type === 'TRANSLATE_LIVE') {
    const cacheKey = `gemini_${request.text.trim()}`;
    
    if (translationCache.has(cacheKey)) {
      sendResponse({ text: translationCache.get(cacheKey) });
      return true;
    }

    translateHinglishLive(request.text, request.apiKey)
      .then(text => {
        // Only cache successful translations
        if (text && !text.startsWith("Error:") && !text.includes("Quota")) {
          // Keep cache size manageable (max 100 items)
          if (translationCache.size > 100) {
            const firstKey = translationCache.keys().next().value;
            if (firstKey) translationCache.delete(firstKey);
          }
          translationCache.set(cacheKey, text);
        }
        sendResponse({ text });
      })
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
});
