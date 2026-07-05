import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle2, FileText, Sparkles, Users, Clock } from "lucide-react";
import { createClient } from "@/utils/supabase/server";

export async function PastMeetings() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch meetings hosted by the user
  const { data: hostedMeetings, error: hostError } = await supabase
    .from('meetings')
    .select('*, all_attendees:meeting_attendees(*)')
    .eq('host_id', user.id)
    .order('created_at', { ascending: false });

  // Fetch meetings attended by the user
  const { data: attendedMeetings, error: attendError } = await supabase
    .from('meetings')
    .select('*, all_attendees:meeting_attendees(*), my_attendance:meeting_attendees!inner(user_id)')
    .eq('meeting_attendees.user_id', user.id)
    .order('created_at', { ascending: false });

  if (hostError) console.error("Error fetching hosted meetings:", hostError);
  if (attendError) console.error("Error fetching attended meetings:", attendError);

  const allMeetings = [...(hostedMeetings || []), ...(attendedMeetings || [])];
  // Deduplicate by meeting id and sort by created_at descending
  const validMeetings = Array.from(new Map(allMeetings.map(m => [m.id, m])).values())
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (validMeetings.length === 0) {
    return (
      <Card className="bg-white border-zinc-200 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-zinc-200 to-zinc-100" />
        <CardContent className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6 ring-8 ring-indigo-50/50">
            <Sparkles className="w-10 h-10 text-indigo-500" />
          </div>
          <h3 className="text-xl font-semibold text-zinc-900 mb-2">No past meetings yet</h3>
          <p className="text-zinc-500 max-w-sm">
            When you host meetings with AI enabled, your smart summaries and action items will magically appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatDuration = (ms: number) => {
    if (ms <= 0 || isNaN(ms)) return "0s";
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-6">
      {validMeetings.map((meeting, idx) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const attendees = meeting.all_attendees || [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const uniqueAttendees = Array.from(new Map(attendees.map((a: any) => [a.user_id, a])).values());
        const totalAttendees = uniqueAttendees.length;
        
        // Calculate total meeting duration (max leave time - min join time)
        let meetingDuration = 0;
        if (attendees.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const joinTimes = attendees.map((a: any) => new Date(a.joined_at).getTime());
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const leaveTimes = attendees.map((a: any) => a.leave_time ? new Date(a.leave_time).getTime() : new Date(meeting.created_at).getTime() + 10000);
          const minJoin = Math.min(...joinTimes);
          const maxLeave = Math.max(...leaveTimes);
          meetingDuration = Math.max(0, maxLeave - minJoin);
        }

        return (
          <Card key={idx} className="bg-white border-zinc-200 shadow-sm text-zinc-900 overflow-hidden hover:shadow-md transition-shadow">
          <CardHeader className="bg-zinc-50/50 border-b border-zinc-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Meeting Room: {meeting.id}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1 text-zinc-500">
                  <Calendar className="w-4 h-4" /> {new Date(meeting.created_at).toLocaleDateString()}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            
            {/* Analytics Section */}
            <div className="grid grid-cols-2 gap-4 mb-2">
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 flex flex-col">
                <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> Total Attendees
                </span>
                <span className="text-2xl font-bold text-zinc-900">{totalAttendees}</span>
              </div>
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 flex flex-col">
                <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Meeting Duration
                </span>
                <span className="text-2xl font-bold text-zinc-900">{formatDuration(meetingDuration)}</span>
              </div>
            </div>

            {meeting.summary ? (
              <div className="bg-indigo-50/50 rounded-xl p-5 border border-indigo-100/50 mt-4">
                <h4 className="text-base font-bold text-indigo-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  AI Summary
                </h4>
                <p className="text-zinc-700 leading-relaxed text-base font-medium">
                  {meeting.summary}
                </p>
              </div>
            ) : (
              <div className="bg-zinc-50 rounded-xl p-5 border border-zinc-100 mt-4">
                <h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">AI Summary</h4>
                <p className="text-zinc-500 italic text-base">
                  No summary was generated for this meeting.
                </p>
              </div>
            )}
            {meeting.action_items && meeting.action_items.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-purple-600 uppercase tracking-wider mb-3">Action Items</h4>
                <ul className="space-y-2">
                  {meeting.action_items.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-zinc-700 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {meeting.transcript && meeting.transcript.length > 0 && (
              <div className="pt-4 border-t border-zinc-100">
                <h4 className="text-sm font-semibold text-zinc-900 flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-zinc-500" />
                  Full Transcript
                </h4>
                <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-200 max-h-60 overflow-y-auto custom-scrollbar">
                  {meeting.transcript.map((t: { speaker: string, time: string, text: string }, i: number) => (
                    <div key={i} className="mb-2 last:mb-0">
                      <span className="font-semibold text-zinc-800 text-sm">{t.speaker} <span className="text-xs text-zinc-400 font-normal ml-1">[{t.time}]</span></span>
                      <p className="text-zinc-600 text-sm mt-0.5">{t.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )})}
    </div>
  );
}
