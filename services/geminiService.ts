
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { TranslationResult, TargetLanguage, OCRMode } from "../types";

export const translateDocument = async (
  base64Data: string, 
  mimeType: string,
  targetLanguage: TargetLanguage,
  mode: OCRMode = 'rápido'
): Promise<TranslationResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  const precisionInstruction = mode === 'alta-precisão' 
    ? "Realize uma análise exaustiva e meticulosa de cada caractere, incluindo textos pequenos, notas de rodapé ou selos. Priorize a fidelidade absoluta ao layout original."
    : "Extraia o texto principal de forma ágil e clara.";

  const prompt = `
    Você é um sistema especializado em OCR e tradução de alta performance.
    
    INSTRUÇÃO DE PROCESSAMENTO (${mode.toUpperCase()}):
    ${precisionInstruction}
    
    OBJETIVO:
    1. Analise o documento/imagem em anexo.
    2. Identifique o idioma original.
    3. Traduza INTEGRALMENTE para o idioma: ${targetLanguage}.
    4. Mantenha a estrutura de parágrafos e formatação.
    
    Responda EXCLUSIVAMENTE em formato JSON:
    {
      "detectedLanguage": "nome do idioma",
      "translatedText": "texto traduzido"
    }
  `;

  try {
    const config: any = {
      responseMimeType: "application/json"
    };

    // Para alta precisão, ativamos o thinking budget para melhorar o raciocínio sobre o layout e textos complexos
    if (mode === 'alta-precisão') {
      config.thinkingConfig = { thinkingBudget: 4000 };
    }

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
      config
    });

    const resultText = response.text || "";
    const parsedResult = JSON.parse(resultText);

    return {
      translatedText: parsedResult.translatedText,
      detectedLanguage: parsedResult.detectedLanguage
    };
  } catch (error) {
    console.error("Erro na tradução Gemini:", error);
    throw new Error("Falha ao processar o documento com IA. Verifique sua conexão ou tente o modo Rápido.");
  }
};
