/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Trophy, RotateCcw, LogOut, Users, Sparkles, Check } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';

export function MatchSummaryModal() {
  const { room, playerId, votePlayAgain, returnToLobby, leaveRoom, gameState } = useGameStore();

  if (!room || room.status !== 'game_over') return null;

  const isHost = room.hostId === playerId;
  const players = Object.values(room.players);
  const totalPlayers = players.length;
  const votes = room.playAgainVotes || [];
  const hasVoted = playerId ? votes.includes(playerId) : false;

  // Final rankings from room gameState leaderboard or scores
  const leaderboard = gameState?.leaderboard || [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl pointer-events-auto select-none">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-sm sm:max-w-md bg-zinc-900 border border-yellow-500/40 rounded-3xl p-5 shadow-2xl flex flex-col items-center gap-4"
        >
          {/* Trophy Header */}
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center text-yellow-400 mb-2 shadow-[0_0_20px_rgba(234,179,8,0.4)]">
              <Trophy size={28} />
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-wider">
              MATCH CONCLUDED!
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              Final arena rankings
            </p>
          </div>

          {/* Results List */}
          <div className="w-full flex flex-col gap-1.5 max-h-48 overflow-y-auto overscroll-contain pr-1">
            {leaderboard.length > 0 ? (
              leaderboard.map((entry, index) => {
                const isMe = entry.id === playerId;
                return (
                  <div
                    key={entry.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                      index === 0
                        ? 'bg-yellow-950/60 border-yellow-500/60 text-yellow-200'
                        : isMe
                        ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-200'
                        : 'bg-white/5 border-white/10 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono font-bold w-5">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                      </span>
                      <span style={{ color: entry.color }} className="font-bold truncate max-w-[120px]">
                        {entry.name} {isMe && '(You)'}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-white">
                      {entry.score} pts
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-xs text-zinc-500 py-4">
                Round finished. Good game everyone!
              </div>
            )}
          </div>

          {/* Play Again Vote Banner */}
          <div className="w-full p-3 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-between text-xs">
            <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
              <Users size={14} className="text-cyan-400" />
              Votes to Play Again:
            </span>
            <span className="font-mono font-bold text-cyan-300 bg-cyan-950 px-2.5 py-0.5 rounded border border-cyan-800">
              {votes.length} / {totalPlayers}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex flex-col gap-2">
            <button
              onClick={() => votePlayAgain()}
              className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all ${
                hasVoted
                  ? 'bg-emerald-950 border border-emerald-400 text-emerald-300 shadow-emerald-500/30'
                  : 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-cyan-500/30'
              }`}
            >
              {hasVoted ? (
                <>
                  <Check size={16} />
                  <span>VOTED TO PLAY AGAIN ({votes.length}/{totalPlayers})</span>
                </>
              ) : (
                <>
                  <RotateCcw size={16} />
                  <span>VOTE TO PLAY AGAIN</span>
                </>
              )}
            </button>

            {isHost && (
              <button
                onClick={() => returnToLobby()}
                className="w-full py-3 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/50 text-purple-300 font-bold text-xs uppercase tracking-wider active:scale-95 transition-all"
              >
                Host: Return Room to Lobby
              </button>
            )}

            <button
              onClick={() => leaveRoom()}
              className="w-full py-2.5 rounded-xl text-zinc-400 hover:text-red-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <LogOut size={14} />
              <span>Leave Room</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
