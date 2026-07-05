import { useParticipants, useLocalParticipant } from '@livekit/components-react';
import { Eye, EyeOff, Clock, Check, X as XIcon, Users } from 'lucide-react';

interface DbParticipant {
  user_id: string;
  users?: { email: string };
  behavior_score?: number;
}

export function ParticipantSidebar({
  isHost,
  allowParticipantsToViewList,
  showSidebar,
  toggleParticipantVisibility,
  waitingParticipants,
  activeParticipantsDb,
  handleApprove,
  handleReject,
}: {
  isHost: boolean;
  allowParticipantsToViewList: boolean;
  showSidebar: boolean;
  toggleParticipantVisibility: () => void;
  waitingParticipants: DbParticipant[];
  activeParticipantsDb: DbParticipant[];
  handleApprove: (id: string) => void;
  handleReject: (id: string) => void;
  myUserId?: string;
}) {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();

  if (!((isHost || allowParticipantsToViewList) && showSidebar)) return null;

  return (
    <div className="w-80 h-full bg-zinc-900/90 backdrop-blur-xl border-l border-zinc-800 p-4 flex flex-col gap-4 overflow-y-auto">
      
      {isHost && (
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-4 mb-2">
          <h3 className="font-bold text-white mb-2 text-sm uppercase tracking-wider">Host Controls</h3>
          <button
            onClick={toggleParticipantVisibility}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${allowParticipantsToViewList ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-white/5 text-zinc-400 hover:bg-white/10 border border-transparent'}`}
          >
            <span className="flex items-center gap-2">
              {allowParticipantsToViewList ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              Allow Attendees to View List
            </span>
          </button>
        </div>
      )}

      {/* Waiting Room */}
      {(isHost && waitingParticipants.length > 0) && (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-4">
          <h3 className="font-bold text-white mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            Waiting Room ({waitingParticipants.length})
          </h3>
          <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
            {waitingParticipants.map((p: DbParticipant) => (
              <div key={p.user_id} className="flex flex-col gap-2 p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="text-sm font-medium text-white truncate">{p.users?.email || p.user_id.substring(0, 8)}</span>
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(p.user_id)} className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition border border-emerald-500/20">
                    <Check className="w-3 h-3" /> Admit
                  </button>
                  <button onClick={() => handleReject(p.user_id)} className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition border border-red-500/20">
                    <XIcon className="w-3 h-3" /> Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Participants */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-4 flex-1">
        <h3 className={`font-bold text-white flex items-center gap-2 ${participants.length > 0 ? 'mb-3' : ''}`}>
          <Users className="w-4 h-4 text-emerald-400" />
          Active Participants ({participants.length})
        </h3>
        {participants.length > 0 && (
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {participants.map((p) => {
              // Try to find matching db record by identity (email or ID)
              const dbRecord = activeParticipantsDb.find((dbP: DbParticipant) => 
                dbP.user_id === p.identity || (dbP.users?.email && dbP.users.email === p.identity)
              );

              return (
                <div key={p.identity} className="flex flex-col gap-2 p-3 bg-white/5 rounded-xl border border-white/5 relative group">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-white truncate pr-4">
                      {p.name || p.identity} {p.identity === localParticipant.identity && "(You)"}
                    </span>
                  </div>
                  {isHost && p.identity !== localParticipant.identity && (
                    <button
                      onClick={() => handleReject(dbRecord ? dbRecord.user_id : p.identity)}
                      className="absolute right-2 top-2 p-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all border border-red-500/20"
                      title="Kick from meeting"
                    >
                      <XIcon className="w-3 h-3" />
                    </button>
                  )}
                  {isHost && dbRecord && (
                    <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono mt-1">
                      <span className="bg-white/10 px-1.5 py-0.5 rounded">Score: {dbRecord.behavior_score || 100}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
}
