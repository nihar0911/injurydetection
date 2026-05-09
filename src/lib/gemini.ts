import { GoogleGenAI } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "MY_GEMINI_API_KEY";

export const ai = new GoogleGenAI({ apiKey });

export const verifyAnatomy = async (imageBase64: string, expectedPart: string): Promise<{ match: boolean; reason: string }> => {
  if (apiKey === "MY_GEMINI_API_KEY" || !apiKey) {
    // Hackathon fallback if no key is provided
    console.warn("No VITE_GEMINI_API_KEY found in .env.local! Using simulated validation.");
    return { match: true, reason: "Simulated match because API key is missing." };
  }

  try {
    const base64Data = imageBase64.split(',')[1];
    const mimeType = imageBase64.split(';')[0].split(':')[1] || "image/jpeg";
    
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        {
          role: 'user',
          parts: [
            { text: `You are an anatomical verification AI. The user claims this is a photo of a '${expectedPart}'. Carefully analyze the image. Does this image clearly show a human ${expectedPart}? Return a JSON object with 'match' (boolean) and 'reason' (string explaining why it is or isn't a ${expectedPart}). If it's completely unrelated (e.g. a face when expecting a knee, or a hand when expecting a foot), return false.` },
            {
              inlineData: {
                data: base64Data,
                mimeType
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const result = JSON.parse(response.text() || "{}");
    return {
      match: result.match === true,
      reason: result.reason || "Verification completed."
    };
  } catch (err: any) {
    console.error("Gemini Verification Error:", err);
    throw new Error(err.message || "Failed to verify image anatomy.");
  }
};
