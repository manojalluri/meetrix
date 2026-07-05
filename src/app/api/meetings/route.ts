import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, title, scheduledFor, endTime, capacity, meetingType, invitedEmails, isAiEnabled } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Missing meeting ID" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('meetings')
      .insert({
        id,
        host_id: user.id,
        title: title || `Meeting with ${user.email}`,
        scheduled_for: scheduledFor ? new Date(scheduledFor).toISOString() : new Date().toISOString(),
        end_time: endTime ? new Date(endTime).toISOString() : null,
        capacity: capacity ? parseInt(capacity) : 50,
        meeting_type: meetingType || 'PRIVATE',
        invited_emails: Array.isArray(invitedEmails) ? invitedEmails.join(',') : null,
        is_ai_enabled: isAiEnabled
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating meeting (Supabase):", error);
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }

    // Generate Secure Invitations
    if (Array.isArray(invitedEmails) && invitedEmails.length > 0) {
      const invitations = invitedEmails.map(email => ({
        token: crypto.randomBytes(16).toString('hex'),
        meeting_id: id,
        email: email
      }));

      const { error: inviteError } = await supabase
        .from('meeting_invitations')
        .insert(invitations);

      if (inviteError) {
        console.error("Error creating invitations:", inviteError);
        // We don't fail the meeting creation, just log it.
      } else {
        // MOCK EMAIL SERVICE
        console.log("\n================ MOCK EMAIL SERVICE ================");
        console.log(`Sending invitations for meeting: ${title || id}`);
        invitations.forEach(inv => {
          console.log(`To: ${inv.email}`);
          console.log(`Subject: You have been invited to a meeting`);
          console.log(`Link: http://localhost:3000/join/${inv.token}`);
          console.log("----------------------------------------------------");
        });
        console.log("====================================================\n");
      }
    }

    return NextResponse.json({ success: true, meeting: data });

  } catch (error: unknown) {
    console.error('Create meeting error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
