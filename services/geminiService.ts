
import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateQRContent = async (prompt: string, contextType: string): Promise<string> => {
  try {
    const ai = getClient();
    
    let systemInstruction = "Você é um assistente especializado em gerar dados estruturados para QR Codes.";
    
    if (contextType === 'wifi') {
      systemInstruction += " O usuário fornecerá detalhes de rede. Formate a saída estritamente como uma string de conexão WIFI no padrão: WIFI:T:WPA;S:Nome;P:Senha;; Não inclua explicações ou blocos de código.";
    } else if (contextType === 'business') {
      systemInstruction += " O usuário deseja um vCard 3.0. Retorne APENAS o texto do vCard começando com BEGIN:VCARD e terminando com END:VCARD. Não use blocos de código markdown.";
    } else if (contextType === 'email') {
      systemInstruction += " O usuário deseja compor um email. Retorne uma string no formato mailto:email@exemplo.com?subject=Assunto&body=Mensagem. Encode os espaços como %20.";
    } else if (contextType === 'social') {
      systemInstruction += " O usuário deseja um link para rede social ou um texto criativo para post. Se for um link, retorne apenas a URL. Se for um post, sugira um texto envolvente. Não inclua explicações.";
    } else {
      systemInstruction += " O usuário quer um texto criativo ou link. Mantenha o conteúdo conciso e direto ao ponto.";
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    });

    // Clean potential markdown from response
    let text = response.text || "";
    text = text.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();
    
    return text;
  } catch (error) {
    console.error("Error generating content:", error);
    throw error;
  }
};
