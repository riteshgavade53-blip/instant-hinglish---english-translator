// Background script for Hinglish Translator Extension

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'TRANSLATE_TEXT') {
    // In a real extension, you'd fetch the API key from storage
    // and call the Gemini API directly here.
    
    // For this demo, we'll simulate the response
    // In production, this would use the same logic as gemini.ts
    
    translateText(request.text).then(result => {
      sendResponse({ success: true, data: result });
    }).catch(err => {
      sendResponse({ success: false, error: err.message });
    });

    return true; // Keep channel open for async response
  }
});

async function translateText(text) {
  // Mock API call
  return {
    casual: "I won't be able to come to the meeting, I have some work.",
    professional: "I will be unable to attend the meeting due to prior commitments."
  };
}
