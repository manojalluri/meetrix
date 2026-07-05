import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { meetingId, userId, status } = await req.json();

    if (!meetingId || !userId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify user is host
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select('host_id')
      .eq('id', meetingId)
      .single();

    if (meetingError || meeting?.host_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized: Only host can approve attendees" }, { status: 403 });
    }

    const { error: updateError } = await supabase
      .from('meeting_attendees')
      .update({ status })
      .eq('meeting_id', meetingId)
      .eq('user_id', userId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    console.error("Approval API error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
