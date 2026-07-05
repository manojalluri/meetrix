import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { VideoRoom } from "@/components/video-room";

export default async function RoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const urlParams = await searchParams;
  const token = urlParams?.token as string;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/room/${id}`);
  }

  // Fetch meeting details to check access
  const { data: meeting } = await supabase
    .from('meetings')
    .select('host_id, invited_emails, meeting_type, waiting_room_enabled')
    .eq('id', id)
    .single();

  let attendeeStatus = 'APPROVED';
  let isHost = false;

  if (meeting) {
    isHost = meeting.host_id === user.id;
    
    if (!isHost) {
      if (meeting.meeting_type === 'PRIVATE') {
        if (!token) {
           redirect('/dashboard?error=You must use your unique invitation link to join this private meeting.');
        }
        
        // Verify token again just in case they bypassed /join
        const { data: invite } = await supabase
          .from('meeting_invitations')
          .select('*')
          .eq('token', token)
          .eq('meeting_id', id)
          .eq('email', user.email)
          .single();

        if (!invite) {
           redirect('/dashboard?error=Invalid or unauthorized invitation token.');
        }

        // They are allowed in, waiting room for private can be optional, but let's say they are APPROVED if they have a token.
        // Or if waiting_room_enabled is true, they go to WAITING. Let's set it to WAITING if enabled.
        if (meeting.waiting_room_enabled) {
          attendeeStatus = 'WAITING';
        }
      } else {
        // PUBLIC meeting
        if (meeting.waiting_room_enabled) {
          attendeeStatus = 'WAITING';
        }
      }
    }
  }

  const { headers } = await import('next/headers');
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || 'Unknown';
  let browser = 'Unknown';
  let os = 'Unknown';

  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';

  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'MacOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';

  // Record attendance and identity
  const { error: attendanceError } = await supabase.from('meeting_attendees').upsert({
    meeting_id: id,
    user_id: user.id,
    status: attendeeStatus,
    browser,
    os,
    device_info: userAgent,
    join_time: new Date().toISOString()
  }, { onConflict: 'meeting_id,user_id' }).select().single();
  
  if (attendanceError) {
    console.error("Error recording attendance:", attendanceError.message || attendanceError);
  }

  return (
    <div className="h-screen w-full bg-black overflow-hidden flex flex-col">
      <VideoRoom roomId={id} initialStatus={attendeeStatus} isHost={isHost} />
    </div>
  );
}
