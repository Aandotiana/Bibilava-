/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Trophy, X } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { useMobileControls } from '../store/mobileControlsStore';
import { motion, AnimatePresence } from 'framer-motion';

export function LeaderboardMobile() {
  const { gameState, playerId } = useGameStore();
  const { leaderboardOpen, setLeaderboardOpen } = useMobileControls();

  if (!gameState || !gameState.leaderboard || gameState.leaderboard.length === 0) {
    return null;
  }

  const topPlayer = gameState.leaderboard[0];
  const myRankIndex = playerId
    ? gameState.leaderboard.findIndex((e) => e.id === playerId)
    : -1;

  return (
    <>
      {/* Collapsed mini indicator (shown when closed during gameplay) */}
      {!leaderboardOpen && topPlayer && (
        <div
          onClick={() => setLeaderboardOpen(true)}
          className="absolute top-14 right-3 z-20 pointer-events-auto flex items-center gap-2 bg-black/40 hover:bg-black/60 active:scale-95 transition-all backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 cursor-pointer shadow-md"
        >
          <Trophy size={13} className="text-yellow-400 shrink-0" />
          <span className="text-[11px] font-semibold text-white/90 truncate max-w-[80px]">
            {topPlayer.name}
          </span>
          <span className="text-[11px] font-mono text-yellow-300 font-bold">
            {topPlayer.score}
          </span>
          {myRankIndex >= 0 && (
            <span className="text-[10px] font-mono text-cyan-300 border-l border-white/20 pl-1.5 font-medium">
              #{myRankIndex + 1}
            </span>
          )}
        </div>
      )}

      {/* Expanded Leaderboard Drawer / Modal */}
      <AnimatePresence>
        {leaderboardOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-14 right-3 z-40 pointer-events-auto w-64 sm:w-72 bg-zinc-950/90 backdrop-blur-xl border border-white/15 rounded-2xl p-3.5 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <div className="flex items-center gap-1.5 text-sm font-bold text-white">
                <Trophy size={16} className="text-yellow-400" />
                <span>LEADERBOARD</span>
              </div>
              <button
                onClick={() => setLeaderboardOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/80 active:scale-90"
                aria-label="Close Leaderboard"
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto overscroll-contain pr-1">
              {gameState.leaderboard.map((entry, index) => {
                const isMe = entry.id === playerId;
                return (
                  <div
                    key={entry.id}
                    className={`flex items-center justify-between py-1 px-2 rounded-lg text-xs ${
                      isMe ? 'bg-cyan-950/60 border border-cyan-500/40' : 'bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className={`w-4 font-mono font-bold ${
                          index === 0
                            ? 'text-yellow-400'
                            : index === 1
                            ? 'text-zinc-300'
                            : index === 2
                            ? 'text-amber-600'
                            : 'text-zinc-500'
                        }`}
                      >
                        {index + 1}.
                      </span>
                      <span
                        style={{ color: entry.color }}
                        className="font-medium truncate max-w-[110px]"
                      >
                        {entry.name} {isMe && '(You)'}
                      </span>
                    </div>
                    <span className="font-mono text-zinc-300 font-bold ml-2">
                      {entry.score}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
