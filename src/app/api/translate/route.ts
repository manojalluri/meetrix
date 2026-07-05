import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { text, targetLang } = await req.json();

    if (!text || !targetLang) {
      return NextResponse.json({ error: 'Missing text or targetLang' }, { status: 400 });
    }

    // Ensure user is logged in
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key missing on server' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      Translate the following text accurately into the language code or name: "${targetLang}".
      If the text is already in that language, just return it exactly as is.
      Do not add any additional explanations, quotes, or conversational text. Return ONLY the translated text.

      Text:
      ${text}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const translatedText = response.text?.trim();
    if (!translatedText) throw new Error("No response from AI");

    return NextResponse.json({ success: true, text: translatedText });
  } catch (error: unknown) {
    console.error("Translation error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
