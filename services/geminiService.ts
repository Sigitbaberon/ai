
import { GoogleGenAI } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";

if (!process.env.API_KEY) {
  // In a real app, you'd want to handle this more gracefully,
  // but for this context, we assume the key is provided.
  console.warn(
    "API_KEY environment variable not set. Using a placeholder. The app will not function correctly without a valid API key."
  );
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "YOUR_API_KEY_HERE" });

export const generateContent = async (systemInstruction: string, userPrompt: string): Promise<string> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Error generating content:", error);
    if (error instanceof Error) {
        // Provide a more user-friendly error message
        if (error.message.includes('API key not valid')) {
            return "Error: The provided API key is not valid. Please ensure you have a valid Gemini API key set up.";
        }
        return `An error occurred while communicating with the Gemini API: ${error.message}`;
    }
    return "An unknown error occurred. Please check the console for details.";
  }
};
