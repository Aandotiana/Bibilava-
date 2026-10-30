/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { Smartphone, RotateCw, X } from 'lucide-react';
import { useMobileControls } from '../store/mobileControlsStore';
import { motion, AnimatePresence } from 'framer-motion';

export function OrientationGuide() {
  const {
    isLandscape,
    setIsLandscape,
    orientationNoticeDismissed,
    dismissOrientationNotice,
    lockLandscape,
    toggleFullscreen,
  } = useMobileControls();

  useEffect(() => {
    const handleResize = () => {
      const landscape = window.innerWidth > window.innerHeight;
      setIsLandscape(landscape);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [setIsLandscape]);

  const handleRotateAndLock = async () => {
    await toggleFullscreen();
    await lockLandscape();
  };

  // Only show guidance if in portrait and user hasn't dismissed it
  const showGuide = !isLandscape && !orientationNoticeDismissed;

  return (
    <AnimatePresence>
      {showGuide && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute top-16 left-1/2 -translate-x-1/2 z-40 pointer-events-auto max-w-[92vw] w-auto bg-zinc-900/95 border border-cyan-500/40 backdrop-blur-xl px-3.5 py-2 rounded-2xl shadow-2xl flex items-center gap-2.5"
        >
          <div className="w-8 h-8 rounded-full bg-cyan-950 flex items-center justify-center text-cyan-400 shrink-0 animate-pulse">
            <Smartphone size={17} className="rotate-90" />
          </div>

          <div className="flex flex-col">
            <p className="text-xs font-bold text-white leading-tight">
              Landscape Mode Recommended
            </p>
            <p className="text-[10px] text-zinc-400">
              Turn phone sideways for wider arena vision
            </p>
          </div>

          <button
            onClick={handleRotateAndLock}
            className="flex items-center gap-1 bg-cyan-500 hover:bg-cyan-400 text-black text-[11px] font-black px-2.5 py-1.5 rounded-lg active:scale-95 shrink-0 transition-transform"
          >
            <RotateCw size={12} />
            <span>Lock</span>
          </button>

          <button
            onClick={dismissOrientationNotice}
            className="text-zinc-500 hover:text-white p-1 rounded-full active:scale-90"
            aria-label="Dismiss orientation notice"
          >
            <X size={15} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
