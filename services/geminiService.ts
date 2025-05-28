import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL_NAME } from '../constants';

const API_KEY = process.env.API_KEY;

let ai: GoogleGenAI | null = null;

if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  console.error("CRITICAL: API_KEY environment variable is not set. Gemini API calls will fail.");
}

export async function generateGeminiText(
  prompt: string,
  systemInstruction?: string
): Promise<string> {
  if (!ai) {
    throw new Error("Gemini API client is not initialized. API_KEY might be missing.");
  }

  try {
    const result = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: prompt,
      ...(systemInstruction && { config: { systemInstruction } }),
    });
    // Ensure result.text is used as per Gemini guidance
    return result.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
      // Attempt to provide a more specific error message
      let message = `Gemini API Error: ${error.message}`;
      if (error.message.includes("API key not valid")) {
        message = "Gemini API Error: The provided API key is not valid. Please check your configuration.";
      } else if (error.message.includes("quota")) {
        message = "Gemini API Error: You have exceeded your API quota. Please check your Google AI Studio account.";
      }
      throw new Error(message);
    }
    throw new Error("Unknown Gemini API Error occurred.");
  }
}
