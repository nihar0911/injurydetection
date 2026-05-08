import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not defined. Please add it to your environment variables.");
}

export const ai = new GoogleGenAI({ apiKey });

export const MODELS = {
  GENERAL: "gemini-3-flash-preview",
  VISION: "gemini-3-flash-preview",
};
