
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { TranslationResult, TargetLanguage } from "../types";

export const translateDocument = async (
  base64Data: string, 
  mimeType: string,
  targetLanguage: TargetLanguage
): Promise<TranslationResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  const prompt = `
    Você é um sistema avançado de OCR e tradução.
    1. Analise a imagem ou documento fornecido.
    2. Identifique o idioma original do texto.
    3. Extraia todo o texto e traduza-o INTEGRALMENTE para o idioma: ${targetLanguage}.
    4. Mantenha a formatação, parágrafos e estrutura o máximo possível.
    
    Responda EXCLUSIVAMENTE em formato JSON com a seguinte estrutura:
    {
      "detectedLanguage": "nome do idioma detectado",
      "translatedText": "o texto traduzido completo aqui"
    }
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json"
      }
    });

    const resultText = response.text || "";
    const parsedResult = JSON.parse(resultText);

    return {
      translatedText: parsedResult.translatedText,
      detectedLanguage: parsedResult.detectedLanguage
    };
  } catch (error) {
    console.error("Erro na tradução Gemini:", error);
    throw new Error("Falha ao processar o documento com IA.");
  }
};
