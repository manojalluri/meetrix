"use client";

import { useEffect, useState } from 'react';
import { useRoomContext, useLocalParticipant } from '@livekit/components-react';
import { motion, AnimatePresence } from 'framer-motion';

const EMOJIS = ['👍', '❤️', '😂', '🎉', '👏', '👀'];

export function ReactionOverlay() {
  const room = useRoomContext();
  const [reactions, setReactions] = useState<{ id: string; emoji: string; x: number }[]>([]);

  useEffect(() => {
    const handleData = (payload: Uint8Array) => {
      try {
        const decoded = new TextDecoder().decode(payload);
        const data = JSON.parse(decoded);
        
        if (data.type === 'reaction') {
          // Generate a random X position (percentage) for the emoji to float up from
          const randomX = Math.floor(Math.random() * 80) + 10;
          
          const newReaction = {
            id: Math.random().toString(36).substring(7),
            emoji: data.emoji,
            x: randomX
          };
          
          setReactions(prev => [...prev, newReaction]);
          
          // Remove reaction after animation completes (3 seconds)
          setTimeout(() => {
            setReactions(prev => prev.filter(r => r.id !== newReaction.id));
          }, 3000);
        }
      } catch {
        // Ignore non-reaction data
      }
    };

    room.on('dataReceived', handleData);
    return () => {
      room.off('dataReceived', handleData);
    };
  }, [room]);

  const sendReaction = (emoji: string) => {
    // Show locally immediately
    // eslint-disable-next-line
    const randomX = Math.floor(Math.random() * 80) + 10;
    const newReaction = {
      // eslint-disable-next-line
      id: Math.random().toString(36).substring(7),
      emoji,
      x: randomX
    };
    setReactions(prev => [...prev, newReaction]);
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== newReaction.id));
    }, 3000);

    // Broadcast to others
    const payload = JSON.stringify({ type: 'reaction', emoji });
    const encoded = new TextEncoder().encode(payload);
    room.localParticipant.publishData(encoded, { reliable: true });
  };

  return (
    <>
      {/* Floating Emojis Area */}
      <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden">
        <AnimatePresence>
          {reactions.map((reaction) => (
            <motion.div
              key={reaction.id}
              initial={{ y: '100vh', opacity: 1, scale: 0.5 }}
              animate={{ y: '-20vh', opacity: 0, scale: 2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 3, ease: 'easeOut' }}
              className="absolute text-5xl"
              style={{ left: `${reaction.x}%` }}
            >
              {reaction.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Reaction Toolbar */}
      <div className="absolute bottom-24 right-6 z-50 flex gap-2 bg-black/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-xl">
        {EMOJIS.map(emoji => (
          <button
            key={emoji}
            onClick={() => sendReaction(emoji)}
            className="text-2xl hover:scale-125 hover:-translate-y-2 transition-all duration-200 active:scale-95"
            title="React"
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  );
}
