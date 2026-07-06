import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { roomId, transcript } = await req.json();

    if (!transcript || transcript.length === 0) {
      return NextResponse.json({ error: 'No transcript provided' }, { status: 400 });
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

    // Format the transcript for the LLM
    const formattedTranscript = transcript.map((t: { time: string, speaker: string, text: string }) => `[${t.time}] ${t.speaker}: ${t.text}`).join('\n');

    const prompt = `
      You are an expert executive assistant. I will provide you with a raw transcript from a video meeting.
      Please analyze the transcript and provide a clean JSON object containing:
      1. "summary": A concise 2-3 paragraph summary of the entire meeting.
      2. "action_items": An array of strings representing specific tasks or follow-ups mentioned, including who is responsible if known.

      Transcript:
      ${formattedTranscript}
      
      Respond ONLY with valid JSON. Do not include markdown formatting like \`\`\`json.
    `;

    let response;
    let resultText = "";
    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-3.5-flash'];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          }
        });
        if (response.text) {
          resultText = response.text;
          break; // Success!
        }
      } catch (err: any) {
        console.warn(`Model ${modelName} failed:`, err.message || err);
        lastError = err;
        // Continue to the next model in the fallback list
      }
    }

    if (!resultText) {
      throw new Error(`AI generation failed after trying multiple models. Last error: ${lastError?.message || 'Unknown'}`);
    }



    const parsedData = JSON.parse(resultText);

    const adminSupabase = (await import('@supabase/supabase-js')).createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Save to Supabase using admin client to bypass RLS for this trusted action
    const { error: updateError } = await adminSupabase
      .from('meetings')
      .update({
        summary: parsedData.summary,
        action_items: parsedData.action_items,
        transcript: transcript // Save raw transcript JSON
      })
      .eq('id', roomId);

    if (updateError) {
      console.error("Error saving summary to Supabase:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: parsedData });
  } catch (error: unknown) {
    console.error("Summarization Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
