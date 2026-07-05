"use client";

import { LiveKitRoom, RoomAudioRenderer, VideoConference, PreJoin } from '@livekit/components-react';
import '@livekit/components-styles';
import { useEffect, useState } from 'react';
import { Loader2, ShieldAlert, Users, Clock } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TranscriptionOverlay } from './transcription-overlay';
import { ReactionOverlay } from './reaction-overlay';
import { ParticipantSidebar } from './participant-sidebar';
import { createClient } from '@/utils/supabase/client';

export function VideoRoom({ roomId, initialStatus = 'APPROVED', isHost = false }: { roomId: string, initialStatus?: string, isHost?: boolean }) {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState(initialStatus);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [waitingParticipants, setWaitingParticipants] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [activeParticipants, setActiveParticipants] = useState<any[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [allowParticipantsToViewList, setAllowParticipantsToViewList] = useState(false);
  const supabase = createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [preJoinChoices, setPreJoinChoices] = useState<any>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const meetingName = searchParams.get('name') || `Meeting Room`;
  const isAiEnabled = searchParams.get('ai') !== 'false';

  useEffect(() => {
    // Only fetch the token once we are ready to join (after PreJoin and when APPROVED)
    if (!preJoinChoices || status !== 'APPROVED') return;

    (async () => {
      try {
        const resp = await fetch(`/api/livekit/token?room=${roomId}`);
        const data = await resp.json();
        if (data.token) {
          setToken(data.token);
        } else {
          console.error("Failed to fetch token", data);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [roomId, preJoinChoices, status]);

  useEffect(() => {
    // Realtime subscription for attendee status updates (if they are waiting)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let activeChannel: any = null;
    
    const initRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const fetchAttendees = async () => {
        const { data, error } = await supabase
          .from('meeting_attendees')
          .select('*')
          .eq('meeting_id', roomId);
        
        if (error) {
          console.error("Error fetching attendees:", error);
        } else if (data) {
          setWaitingParticipants(data.filter(p => p.status === 'WAITING'));
          setActiveParticipants(data.filter(p => p.status === 'APPROVED'));
        }
      };

      fetchAttendees(); // Fetch for everyone so they have the data ready

      const uniqueChannelId = `room_${roomId}_participants`;
      activeChannel = supabase.channel(uniqueChannelId)
        .on('broadcast', { event: 'toggle_participant_list' }, (payload) => {
          setAllowParticipantsToViewList(payload.payload.visible);
          if (!payload.payload.visible && !isHost) {
            setShowSidebar(false); // Close sidebar if host hides it
          }
        })
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'meeting_attendees', 
          filter: `meeting_id=eq.${roomId}` 
        }, (payload: unknown) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const p = payload as any;
          if (!isHost && p.eventType === 'UPDATE' && p.new.user_id === user?.id) {
            setStatus(p.new.status);
          }
          fetchAttendees(); // Refresh for everyone
        })
        .subscribe();
    };
    
    initRealtime();
    return () => {
      if (activeChannel) supabase.removeChannel(activeChannel);
    };
  }, [roomId, isHost, supabase]);

  const toggleParticipantVisibility = async () => {
    const newValue = !allowParticipantsToViewList;
    setAllowParticipantsToViewList(newValue);
    
    const channel = supabase.channel(`room_${roomId}_participants`);
    await channel.send({
      type: 'broadcast',
      event: 'toggle_participant_list',
      payload: { visible: newValue }
    });
  };

  const handleApprove = async (userId: string) => {
    await fetch('/api/meetings/approval', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meetingId: roomId, userId, status: 'APPROVED' })
    });
  };
  
  const handleReject = async (userId: string) => {
    await fetch('/api/meetings/approval', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meetingId: roomId, userId, status: 'REJECTED' })
    });
  };

  const [meetingTranscript, setMeetingTranscript] = useState<{ speaker: string, text: string, time: string }[]>([]);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // If user hasn't gone through the PreJoin screen yet, show it
  if (!preJoinChoices) {
    if (status === 'REJECTED') {
      return (
        <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center relative text-zinc-900">
           <div className="z-10 bg-white p-8 rounded-3xl border border-zinc-200 shadow-xl max-w-md text-center">
             <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
             <h2 className="text-2xl font-bold mb-2">Entry Denied</h2>
             <p className="text-zinc-600 mb-6">The host has declined your request to join this meeting.</p>
             <button onClick={() => router.push('/dashboard')} className="w-full bg-zinc-900 text-white py-2 rounded-xl">Return to Dashboard</button>
           </div>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center relative text-zinc-900 overflow-hidden">
        {/* Background ambient glow */}
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
          <div className="w-[800px] h-[800px] bg-indigo-500/20 rounded-full blur-[128px]" />
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px]" />
        </div>
        
        <div className="z-10 bg-white/80 backdrop-blur-xl p-10 rounded-[2rem] border border-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] w-full max-w-md mx-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-400">Ready to join?</h2>
            <p className="text-zinc-500 mt-2 text-sm font-medium">Configure your audio and video before entering</p>
          </div>
          <PreJoin
            onSubmit={(values) => setPreJoinChoices(values)}
            className="lk-prejoin !bg-transparent !border-none custom-prejoin"
          />
        </div>
      </div>
    );
  }

  // WAITING ROOM
  if (status === 'WAITING') {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center relative text-zinc-900">
         <div className="z-10 bg-white p-8 rounded-3xl border border-zinc-200 shadow-xl max-w-md text-center flex flex-col items-center">
           <Clock className="w-12 h-12 text-indigo-500 mx-auto mb-4 animate-pulse" />
           <h2 className="text-2xl font-bold mb-2">Waiting Room</h2>
           <p className="text-zinc-600 mb-6">Please wait, the meeting host will let you in soon.</p>
           <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
         </div>
      </div>
    );
  }

  if (status === 'REJECTED') {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center relative text-zinc-900">
         <div className="z-10 bg-white p-8 rounded-3xl border border-zinc-200 shadow-xl max-w-md text-center">
           <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
           <h2 className="text-2xl font-bold mb-2">Entry Denied</h2>
           <p className="text-zinc-600 mb-6">The host has declined your request to join this meeting.</p>
           <button onClick={() => router.push('/dashboard')} className="w-full bg-zinc-900 text-white py-2 rounded-xl">Return to Dashboard</button>
         </div>
      </div>
    );
  }

  // Waiting for token to be fetched
  if (token === "") {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  const recordLeaveTime = async () => {
    try {
      await fetch('/api/meetings/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId: roomId }),
        keepalive: true
      });
    } catch (e) {
      console.error("Failed to record leave time", e);
    }
  };

  useEffect(() => {
    const handleBeforeUnload = () => recordLeaveTime();
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (token && status === 'APPROVED') {
        recordLeaveTime();
      }
    };
  }, [token, status, roomId]);

  const handleTranscriptUpdate = (text: string, speaker: string) => {
    setMeetingTranscript(prev => [...prev, {
      speaker,
      text,
      time: new Date().toLocaleTimeString()
    }]);
  };

  const handleSummarizeAndLeave = async () => {
    if (meetingTranscript.length === 0) {
      alert("No transcription data collected. Try speaking first!");
      router.push('/dashboard');
      return;
    }

    setIsSummarizing(true);
    try {
      const resp = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, transcript: meetingTranscript })
      });
      const result = await resp.json();
      
      if (result.success && result.data) {
        console.log("Summary saved to DB successfully");
        router.push('/dashboard');
      } else {
        alert(`Failed to summarize: ${result.error || 'Unknown error'}`);
        setIsSummarizing(false);
      }
    } catch (error: unknown) {
      console.error('Failed to leave room:', error);
      alert(`Error summarizing: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsSummarizing(false);
    }
  };

  return (
    <LiveKitRoom
      video={preJoinChoices.videoEnabled}
      audio={preJoinChoices.audioEnabled}
      token={token}
      serverUrl={serverUrl}
      data-lk-theme="default"
      className="bg-black relative h-full w-full flex flex-col"
      onDisconnected={() => {
        recordLeaveTime();
        router.push('/dashboard');
      }}
    >
      <div className="flex h-full w-full relative overflow-hidden">
        {/* Main Video Area */}
        <div className="flex-1 flex flex-col relative h-full min-h-0 min-w-0">
          {/* Custom Meeting Header */}
          <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent pt-4 pb-12 px-6 flex justify-between items-center pointer-events-none">
            <h2 className="text-xl font-bold text-white drop-shadow-md">{meetingName}</h2>
          </div>

          <div className="flex-1 relative w-full h-full min-h-0">
            <VideoConference />
          </div>
          
          {isAiEnabled && <TranscriptionOverlay roomId={roomId} onTranscriptUpdate={handleTranscriptUpdate} />}
          <ReactionOverlay />

          {/* Custom End & Summarize Button overlaid on top right, shifted left to avoid LiveKit controls */}
          <div className="absolute top-6 right-20 z-50">
            {isHost ? (
              <button
                onClick={handleSummarizeAndLeave}
                disabled={isSummarizing}
                className={`px-6 py-2 rounded-xl font-medium transition-all shadow-[0_0_15px_rgba(79,70,229,0.5)] flex items-center ${isSummarizing ? 'bg-indigo-600/50 text-white/70 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
              >
                {isSummarizing ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating AI Summary...</>
                ) : (
                  '✨ End & Summarize'
                )}
              </button>
            ) : (
              <button
                onClick={() => {
                  recordLeaveTime();
                  router.push('/dashboard');
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-xl font-medium transition-all shadow-[0_0_15px_rgba(220,38,38,0.5)]"
              >
                End Meeting
              </button>
            )}
          </div>

          {/* Floating Participants Button & Notification */}
          <div className="absolute bottom-6 left-6 z-50 flex flex-col items-start gap-4">
            
            {/* Waiting Room Toast Notification */}
            {isHost && waitingParticipants.length > 0 && !showSidebar && (
              <div className="bg-white shadow-xl rounded-xl p-4 border border-zinc-200 min-w-[300px] animate-in slide-in-from-bottom-5 fade-in duration-300">
                <h4 className="font-semibold text-zinc-900 mb-2">Someone wants to join</h4>
                <div className="flex justify-between items-center bg-zinc-50 p-2 rounded-lg mb-3 border border-zinc-100">
                  <span className="text-sm text-zinc-700 font-medium truncate max-w-[200px]">
                    {waitingParticipants[0].users?.email || waitingParticipants[0].user_id.substring(0, 8)}
                  </span>
                  {waitingParticipants.length > 1 && (
                    <span className="text-xs text-zinc-500 font-medium bg-zinc-200 px-2 py-0.5 rounded-full">
                      +{waitingParticipants.length - 1}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReject(waitingParticipants[0].user_id)}
                    className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    Deny
                  </button>
                  <button
                    onClick={() => handleApprove(waitingParticipants[0].user_id)}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    Admit
                  </button>
                </div>
              </div>
            )}

            {(isHost || allowParticipantsToViewList) && (
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all shadow-lg backdrop-blur-md border ${showSidebar ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-black/50 hover:bg-black/70 text-white border-white/10'}`}
              >
                <Users className="w-5 h-5" />
                <span>Participants ({activeParticipants.length})</span>
                {isHost && waitingParticipants.length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ml-1 font-bold animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                    {waitingParticipants.length} Waiting
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* HOST DASHBOARD PANEL SIDEBAR */}
        <ParticipantSidebar
          isHost={isHost}
          allowParticipantsToViewList={allowParticipantsToViewList}
          showSidebar={showSidebar}
          toggleParticipantVisibility={toggleParticipantVisibility}
          waitingParticipants={waitingParticipants}
          activeParticipantsDb={activeParticipants}
          handleApprove={handleApprove}
          handleReject={handleReject}
        />
      </div>

      {/* Automatically plays audio from other participants */}
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}
