/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { GameScene } from './components/GameScene';
import { useGameStore } from './store/gameStore';
import { useMobileControls } from './store/mobileControlsStore';
import { UI } from './components/UI';

export default function App() {
  const { connect } = useGameStore();
  const { graphicsQuality } = useMobileControls();

  useEffect(() => {
    connect();
  }, [connect]);

  // Optimize mobile DPR to prevent battery drain on 3x/4x mobile screens
  const dpr: [number, number] = graphicsQuality === 'performance' ? [1, 1.3] : [1, 2];

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative select-none touch-none">
      <Canvas
        shadows={graphicsQuality === 'high'}
        camera={{ position: [0, 0, 50], fov: 60 }}
        gl={{
          antialias: false,
          powerPreference: 'high-performance',
        }}
        dpr={dpr}
      >
        <color attach="background" args={['#050505']} />
        <GameScene />
        {graphicsQuality === 'high' && (
          <EffectComposer>
            <Bloom
              luminanceThreshold={1.5}
              mipmapBlur
              intensity={1.2}
            />
          </EffectComposer>
        )}
      </Canvas>
      <UI />
    </div>
  );
}
