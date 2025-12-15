import { GoogleGenAI, Type } from "@google/genai";

// A chave é obtida do process.env (que configuramos no index.html para este ambiente web)
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface RawFoodResponse {
  name: string;
  calories100g: number;
  protein100g: number;
  carbs100g: number;
  fat100g: number;
  standardPortionGrams: number;
  standardPortionName: string;
}

export const analyzeFood = async (foodName: string): Promise<RawFoodResponse | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Identifique as informações nutricionais para o alimento: "${foodName}". 
      Responda sempre em Português do Brasil (pt-BR), incluindo o nome do alimento e da porção.
      Retorne valores médios padrão. 
      Se o alimento não for comestível ou não identificado, retorne dados zerados ou null.
      Forneça calorias, proteínas, carboidratos e gorduras por 100g.
      Forneça também um peso de porção padrão (ex: peso de 1 maçã média, ou 1 fatia de pão).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Nome formatado do alimento" },
            calories100g: { type: Type.NUMBER, description: "Calorias por 100g" },
            protein100g: { type: Type.NUMBER, description: "Proteína por 100g" },
            carbs100g: { type: Type.NUMBER, description: "Carboidratos por 100g" },
            fat100g: { type: Type.NUMBER, description: "Gorduras por 100g" },
            standardPortionGrams: { type: Type.NUMBER, description: "Peso da porção padrão em gramas" },
            standardPortionName: { type: Type.STRING, description: "Nome da porção padrão (ex: 1 unidade, 1 colher)" },
          },
          required: ["name", "calories100g", "protein100g", "carbs100g", "fat100g", "standardPortionGrams", "standardPortionName"],
        },
      },
    });

    const text = response.text;
    if (!text) return null;
    
    return JSON.parse(text) as RawFoodResponse;
  } catch (error) {
    console.error("Error analyzing food:", error);
    return null;
  }
};