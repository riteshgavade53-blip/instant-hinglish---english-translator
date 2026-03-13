/**
 * Service for Google Translate (Unofficial API)
 */

export async function translateWithGoogle(text: string): Promise<string> {
  if (!text.trim()) return "";
  
  try {
    // Using the free Google Translate API endpoint
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error("Google Translate API error");
    
    const data = await response.json();
    
    // The response format is nested arrays: [[["translated", "original", ...]]]
    if (data && data[0]) {
      return data[0].map((item: any) => item[0]).join("");
    }
    
    return "Translation failed";
  } catch (error) {
    console.error("Google Translate Error:", error);
    return "Error connecting to Google Translate";
  }
}
