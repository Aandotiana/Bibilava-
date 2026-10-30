/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { VirtualJoystick } from './VirtualJoystick';
import { BoostButton } from './BoostButton';
import { MobileTopBar } from './MobileTopBar';
import { LeaderboardMobile } from './LeaderboardMobile';
import { MobileSettingsModal } from './MobileSettingsModal';
import { OrientationGuide } from './OrientationGuide';
import { LobbyHome } from './lobby/LobbyHome';
import { RoomLobbyView } from './lobby/RoomLobbyView';
import { LobbyChatDrawer } from './lobby/LobbyChatDrawer';
import { HostSettingsModal } from './lobby/HostSettingsModal';
import { VoiceArchitectureModal } from './lobby/VoiceArchitectureModal';
import { MatchSummaryModal } from './lobby/MatchSummaryModal';
import { Skull, Eye } from 'lucide-react';

export function UI() {
  const { room, gameState, playerId } = useGameStore();

  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const player = playerId && gameState ? gameState.players[playerId] : null;
  const isAlive = player?.state === 'alive';
  const isDead = player?.state === 'dead';
  const isInGame = room?.status === 'in_game';

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between overflow-hidden select-none touch-none">
      {/* Top Bar with Voice Controls, Audio, Screen Orientation, and Timer */}
      <MobileTopBar />

      {/* Landscape Orientation Guidance for Mobile */}
      <OrientationGuide />

      {/* MAIN VIEW ROUTING: */}

      {/* 1. LOBBY HOME: When not in any room */}
      {!room && (
        <div className="flex-1 overflow-y-auto pointer-events-auto flex items-center justify-center">
          <LobbyHome />
        </div>
      )}

      {/* 2. ROOM LOBBY / PRE-MATCH: When inside a room before launch */}
      {room && (room.status === 'lobby' || room.status === 'starting') && (
        <div className="flex-1 overflow-y-auto pointer-events-auto">
          <RoomLobbyView
            onOpenSettings={() => setSettingsModalOpen(true)}
            onOpenVoice={() => setVoiceModalOpen(true)}
          />
        </div>
      )}

      {/* 3. IN-GAME: Active match */}
      {room && isInGame && (
        <>
          {/* Collapsible Mobile Leaderboard */}
          <LeaderboardMobile />

          {/* Touch Joystick & Turbo Boost Controls */}
          {isAlive && (
            <>
              <VirtualJoystick />
              <BoostButton />
            </>
          )}

          {/* Elimination / Spectator Banner if player crashed */}
          {isDead && (
            <div className="absolute bottom-16 inset-x-4 max-w-sm mx-auto pointer-events-auto flex items-center justify-center p-3.5 rounded-2xl bg-black/85 border border-red-500/40 backdrop-blur-xl shadow-2xl gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-950 flex items-center justify-center text-red-400 shrink-0">
                <Skull size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                  You Crashed!
                </span>
                <span className="text-[10px] text-zinc-400">
                  Spectating match • Final score: {Math.floor(player.score)}
                </span>
              </div>
            </div>
          )}
        </>
      )}

      {/* 4. POST-MATCH PODIUM & PLAY AGAIN */}
      <MatchSummaryModal />

      {/* 5. REAL-TIME ROOM CHAT DRAWER (Accessible in Lobby and In-Game) */}
      {room && (
        <LobbyChatDrawer
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          onToggle={() => setChatOpen(!chatOpen)}
        />
      )}

      {/* 6. MODALS */}
      <HostSettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />

      <VoiceArchitectureModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
      />

      <MobileSettingsModal />
    </div>
  );
}
