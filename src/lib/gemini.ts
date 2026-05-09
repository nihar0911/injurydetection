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
    
    // Strip left/right and exact modifiers so AI isn't overly strict
    const basePart = expectedPart.replace(/\b(left|right|upper|lower|back)\b/gi, '').trim() || expectedPart;
    
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        {
          role: 'user',
          parts: [
            { text: `You are an anatomical verification AI. The user claims this is a photo of their '${basePart}'. Carefully analyze the image. Does this image show a human ${basePart}? Return a JSON object with 'match' (boolean) and 'reason' (string). Be highly forgiving about angles, lighting, clothing, or left vs right sides—as long as it is broadly the correct anatomical region (e.g., if they claim 'knee' and you see a knee or leg, return true). Only return false if it is completely and obviously unrelated (e.g., showing a face when expecting an ankle, or a hand when expecting a torso).` },
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

    let rawText = response.text() || "{}";
    rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    const result = JSON.parse(rawText);
    return {
      match: result.match === true,
      reason: result.reason || "Verification completed."
    };
  } catch (err: any) {
    console.error("Gemini Verification Error:", err);
    throw new Error(err.message || "Failed to verify image anatomy.");
  }
};
