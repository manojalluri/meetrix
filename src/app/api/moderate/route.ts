import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@/utils/supabase/server';
import { RoomServiceClient } from 'livekit-server-sdk';

export async function POST(req: NextRequest) {
  try {
    const { roomId, text } = await req.json();

    if (!text || text.trim() === '') {
      return NextResponse.json({ success: true, ignored: true });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'Gemini API key missing' }, { status: 500 });

    const ai = new GoogleGenAI({ apiKey });

    // Step 1: AI Moderation
    const prompt = `
      You are an strict enterprise chat moderator. Analyze the following spoken text for toxicity, hate speech, severe profanity, or abusive language.
      Text: "${text}"
      
      Respond ONLY with a valid JSON object matching this schema:
      {
        "is_toxic": boolean,
        "severity": number, // 1 to 10 (10 being highly abusive/racist/threats, 1 being very mild)
        "reason": string // short explanation of why it is toxic or null if not
      }
      Do not include any markdown blocks.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("No response from AI");
    const parsedData = JSON.parse(resultText);

    if (!parsedData.is_toxic) {
      return NextResponse.json({ success: true, clean: true });
    }

    // Bypass RLS with Admin Client to update the attendee score securely
    const adminSupabase = (await import('@supabase/supabase-js')).createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Step 2: Fetch current score
    const { data: attendee } = await adminSupabase
      .from('meeting_attendees')
      .select('behavior_score, id')
      .eq('meeting_id', roomId)
      .eq('user_id', user.id)
      .single();

    if (!attendee) {
      return NextResponse.json({ error: 'Attendee not found' }, { status: 404 });
    }

    let currentScore = attendee.behavior_score || 100;
    
    // Step 3: Deduct Score
    const deduction = Math.max(5, parsedData.severity * 3);
    currentScore = Math.max(0, currentScore - deduction);

    await adminSupabase
      .from('meeting_attendees')
      .update({ behavior_score: currentScore })
      .eq('meeting_id', roomId)
      .eq('user_id', user.id);

    // Step 4: Log Incident
    await adminSupabase
      .from('incidents')
      .insert({
        meeting_id: roomId,
        user_id: user.id,
        incident_type: 'TOXIC_SPEECH',
        confidence_score: parsedData.severity,
        transcript: text
      });

    // Step 5: Automatic Actions (Kick if below threshold)
    let kicked = false;
    if (currentScore <= 50) {
      const roomService = new RoomServiceClient(
        process.env.LIVEKIT_API_URL!,
        process.env.LIVEKIT_API_KEY,
        process.env.LIVEKIT_API_SECRET
      );
      
      try {
        // Find the participant's identity in LiveKit
        const participants = await roomService.listParticipants(roomId);
        const target = participants.find(p => p.identity === user.email || p.identity === user.id);
        
        if (target) {
          await roomService.removeParticipant(roomId, target.identity);
          kicked = true;
          
          // Also set them to REJECTED so they can't easily rejoin
          await adminSupabase
            .from('meeting_attendees')
            .update({ status: 'REJECTED' })
            .eq('meeting_id', roomId)
            .eq('user_id', user.id);
        }
      } catch (err) {
        console.error("Failed to kick participant:", err);
      }
    }

    return NextResponse.json({ 
      success: true, 
      violation: true,
      newScore: currentScore,
      kicked 
    });

  } catch (error: unknown) {
    console.error("Moderation Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
