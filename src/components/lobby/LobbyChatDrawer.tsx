/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, X, VolumeX, Volume2, Sparkles, Smile } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';

const EMOJIS = ['🔥', '🐍', '⚡', '👑', '💀', '😎', '🎮', '🏆', '🎯', '💥'];
const SHORTCUTS = [
  'Ready! ✅',
  'Wait for me! ⏳',
  "Let's start! 🚀",
  'Good luck! 🍀',
  'Nice move! ⚡',
  'One more round! 🔁',
];

export function LobbyChatDrawer({
  isOpen,
  onClose,
  onToggle,
}: {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}) {
  const { room, playerId, sendChatMessage, blockedPlayerIds, toggleBlockPlayer } = useGameStore();
  const [inputText, setInputText] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastSeenCount = useRef(0);

  const messages = room?.chat || [];

  // Track unread messages when drawer is closed
  useEffect(() => {
    if (!isOpen) {
      const diff = messages.length - lastSeenCount.current;
      if (diff > 0) setUnreadCount(diff);
    } else {
      lastSeenCount.current = messages.length;
      setUnreadCount(0);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isOpen]);

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;
    sendChatMessage(text);
    setInputText('');
    setShowEmojis(false);
  };

  const visibleMessages = messages.filter((msg) => !blockedPlayerIds.includes(msg.senderId));

  return (
    <>
      {/* Floating Toggle Button (visible on mobile / desktop) */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-cyan-950/90 text-cyan-300 border border-cyan-400/50 shadow-[0_0_15px_rgba(0,245,255,0.4)] backdrop-blur-md active:scale-95 transition-all font-bold text-xs"
        >
          <MessageSquare size={16} />
          <span>Lobby Chat</span>
          {unreadCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-pink-500 text-white text-[10px] flex items-center justify-center font-mono font-bold animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Slide-Over Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-3 bottom-3 sm:bottom-4 sm:right-4 sm:left-auto sm:w-96 h-[500px] max-h-[82vh] z-50 bg-zinc-950/95 border border-cyan-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} className="text-cyan-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Lobby Chat ({room?.players ? Object.keys(room.players).length : 0} online)
                </h3>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white/80 flex items-center justify-center active:scale-90"
              >
                <X size={15} />
              </button>
            </div>

            {/* Quick Shortcuts Bar */}
            <div className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto border-b border-white/5 no-scrollbar bg-black/30">
              {SHORTCUTS.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(chip)}
                  className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-[10px] font-semibold text-zinc-300 active:scale-95 transition-transform shrink-0"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Messages Body */}
            <div className="flex-1 p-3 overflow-y-auto overscroll-contain flex flex-col gap-2">
              {visibleMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 gap-1 my-auto">
                  <Sparkles size={22} className="text-zinc-600" />
                  <p className="text-xs font-medium">No messages yet.</p>
                  <p className="text-[10px]">Send a message or use quick shortcuts!</p>
                </div>
              ) : (
                visibleMessages.map((msg) => {
                  const isMe = msg.senderId === playerId;
                  const isBlocked = blockedPlayerIds.includes(msg.senderId);

                  if (msg.isSystem) {
                    return (
                      <div
                        key={msg.id}
                        className="py-1 px-3 rounded-full bg-cyan-950/40 border border-cyan-800/40 text-cyan-300 text-[10px] font-mono text-center mx-auto my-0.5 max-w-[90%]"
                      >
                        {msg.text}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} gap-0.5`}
                    >
                      <div className="flex items-center gap-1.5 px-1">
                        <span
                          style={{ color: msg.senderColor }}
                          className="text-[10px] font-bold"
                        >
                          {msg.senderName} {isMe && '(You)'}
                        </span>
                        <span className="text-[9px] font-mono text-zinc-500">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {!isMe && (
                          <button
                            onClick={() => toggleBlockPlayer(msg.senderId)}
                            title={isBlocked ? 'Unmute player' : 'Mute player'}
                            className="text-zinc-500 hover:text-zinc-300 ml-1"
                          >
                            {isBlocked ? <VolumeX size={10} className="text-red-400" /> : <Volume2 size={10} />}
                          </button>
                        )}
                      </div>

                      <div
                        className={`py-1.5 px-3 rounded-2xl text-xs max-w-[85%] break-words ${
                          isMe
                            ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-sm'
                            : 'bg-zinc-800 text-zinc-100 rounded-tl-sm border border-white/10'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Emoji Quick Picker Dropdown */}
            {showEmojis && (
              <div className="p-2 border-t border-white/10 bg-black/60 flex items-center justify-around">
                {EMOJIS.map((emoji, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(emoji)}
                    className="text-base p-1 hover:scale-125 active:scale-95 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-2.5 border-t border-white/10 bg-black/40 flex items-center gap-1.5"
            >
              <button
                type="button"
                onClick={() => setShowEmojis(!showEmojis)}
                className={`p-2 rounded-xl text-zinc-400 hover:text-white transition-colors ${
                  showEmojis ? 'bg-cyan-950 text-cyan-300' : 'bg-white/5'
                }`}
              >
                <Smile size={18} />
              </button>

              <input
                type="text"
                maxLength={180}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type message to lobby..."
                className="flex-1 py-2 px-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
              />

              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black font-bold active:scale-95 transition-all"
              >
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
