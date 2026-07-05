"use client";

import { useEffect, useState } from 'react';
import { useRoomContext, useLocalParticipant } from '@livekit/components-react';

export function TranscriptionOverlay({ roomId, onTranscriptUpdate }: { roomId: string, onTranscriptUpdate: (text: string, speaker: string) => void }) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const [captions, setCaptions] = useState<{ text: string, speaker: string, isInterim?: boolean } | null>(null);
  const [spokenLanguage, setSpokenLanguage] = useState('en-US');
  const [readingLanguage, setReadingLanguage] = useState('en-US');

  useEffect(() => {
    // 1. Listen for incoming text from other participants via LiveKit Data Channels
    const handleData = async (payload: Uint8Array, participant?: unknown) => {
      try {
        const decoded = new TextDecoder().decode(payload);
        const data = JSON.parse(decoded);
        
        if (data.type === 'transcription') {
          let displayText = data.text;
          
          // If the incoming text language is different from our reading language, translate it!
          if (data.lang && data.lang !== readingLanguage) {
            try {
              const res = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: data.text, targetLang: readingLanguage })
              });
              const translationData = await res.json();
              if (translationData.success) {
                displayText = translationData.text;
              }
            } catch (e) {
              console.error("Translation failed:", e);
            }
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const p = participant as any;
          setCaptions({ text: displayText, speaker: p?.name || p?.identity || "Unknown" });
          onTranscriptUpdate(displayText, p?.name || p?.identity || "Unknown");
          
          // Clear caption after 5 seconds
          setTimeout(() => setCaptions(null), 5000);
        }
      } catch {
        // Ignore non-transcription data
      }
    };

    room.on('dataReceived', handleData);
    return () => {
      room.off('dataReceived', handleData);
    };
  }, [room, onTranscriptUpdate, readingLanguage]);

  useEffect(() => {
    // 2. Setup local Web Speech API for free STT (Chrome/Edge/Safari)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return; // Browser doesn't support it

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = spokenLanguage;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const myName = localParticipant.name || "Me";
      
      if (interimTranscript) {
        // Show interim locally only
        setCaptions({ text: interimTranscript.trim(), speaker: myName, isInterim: true });
      }

      if (finalTranscript) {
        const text = finalTranscript.trim();
        if (!text) return;

        // Show final locally
        setCaptions({ text, speaker: myName, isInterim: false });
        onTranscriptUpdate(text, myName);

        // Clear after 5s
        setTimeout(() => setCaptions(null), 5000);

        // Broadcast to others with spoken language attached
        const payload = JSON.stringify({ type: 'transcription', text, lang: spokenLanguage });
        const encoded = new TextEncoder().encode(payload);
        room.localParticipant.publishData(encoded, { reliable: true });

        // AI Moderation (Background)
        fetch('/api/moderate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId, text })
        })
        .then(res => res.json())
        .then(data => {
          if (data.violation) {
            alert(`⚠️ WARNING: Inappropriate language detected. Behavior score reduced to ${data.newScore}.`);
            if (data.kicked) {
              window.location.href = '/dashboard?error=You have been removed from the meeting due to repeated behavior violations.';
            }
          }
        })
        .catch(e => console.error("Moderation error:", e));
      }
    };

    // Auto-restart if it stops (e.g. due to silence)
    recognition.onend = () => {
      try {
        recognition.start();
      } catch (e) {
        console.error(e);
      }
    };

    try {
      recognition.start();
    } catch (e) {
      console.error(e);
    }

    return () => {
      recognition.onend = null; // Prevent restart loop
      recognition.abort();
    };
  }, [room, localParticipant, onTranscriptUpdate, spokenLanguage, roomId]);

  return (
    <>
      {/* Language Selector Controls */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex gap-4 bg-black/50 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 shadow-xl w-max">
        <div className="flex items-center gap-3 justify-between">
          <label className="text-white text-xs font-medium">I am speaking:</label>
          <select 
            value={spokenLanguage}
            onChange={(e) => setSpokenLanguage(e.target.value)}
            className="bg-zinc-800 text-white text-xs rounded-lg px-2 py-1 border border-zinc-700 outline-none"
          >
            <option value="en-US">English</option>
            <option value="es-ES">Spanish</option>
            <option value="fr-FR">French</option>
            <option value="de-DE">German</option>
            <option value="hi-IN">Hindi</option>
            <option value="ja-JP">Japanese</option>
            <option value="zh-CN">Chinese</option>
          </select>
        </div>
        <div className="flex items-center gap-3 justify-between">
          <label className="text-white text-xs font-medium">Translate to:</label>
          <select 
            value={readingLanguage}
            onChange={(e) => setReadingLanguage(e.target.value)}
            className="bg-indigo-600 text-white text-xs rounded-lg px-2 py-1 border border-indigo-500 outline-none font-medium"
          >
            <option value="en-US">English</option>
            <option value="es-ES">Spanish</option>
            <option value="fr-FR">French</option>
            <option value="de-DE">German</option>
            <option value="hi-IN">Hindi</option>
            <option value="ja-JP">Japanese</option>
            <option value="zh-CN">Chinese</option>
          </select>
        </div>
      </div>

      {captions && (
        <div className="absolute bottom-28 left-0 right-0 flex justify-center z-50 pointer-events-none px-4">
          <div className="bg-black/70 backdrop-blur-xl text-white px-8 py-4 rounded-3xl max-w-3xl w-full text-center shadow-2xl border border-white/20 transition-all duration-300">
            <span className="font-bold text-indigo-400 mr-3 text-lg">{captions.speaker}:</span>
            <span className={`text-xl tracking-wide ${captions.isInterim ? 'text-zinc-300 font-normal italic' : 'text-white font-medium'}`}>{captions.text}</span>
          </div>
        </div>
      )}
    </>
  );
}
