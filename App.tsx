import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import { GamePhase, Boss } from './types';
import { Play, RotateCcw, ShieldAlert, Trophy, Users, Zap } from 'lucide-react';

declare global {
  interface Window {
    startGame: () => void;
  }
}

const App: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>(GamePhase.MENU);
  const [score, setScore] = useState(1);
  const [bossInfo, setBossInfo] = useState<Boss | null>(null);
  
  const handleStart = () => {
    if (window.startGame) {
      window.startGame();
    }
  };

  const getPhaseUI = () => {
    switch (phase) {
      case GamePhase.MENU:
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10 backdrop-blur-sm p-6 text-center">
            <h1 className="text-5xl md:text-6xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-b from-fuchsia-400 to-purple-700 italic drop-shadow-[0_0_10px_rgba(255,0,255,0.5)]">
              NEON<br/>HORDE
            </h1>
            <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent mb-6 opacity-80"></div>
            <p className="mb-8 text-cyan-200 text-sm tracking-widest uppercase font-bold drop-shadow-md">
              Synthwave Run v1.0
            </p>
            <button 
              onClick={handleStart}
              className="group relative px-10 py-4 bg-transparent border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black rounded-sm font-bold text-xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] flex items-center gap-2 clip-path-slant"
            >
              <Play className="w-6 h-6" />
              START_RUN
            </button>
          </div>
        );

      case GamePhase.BOSS_FIGHT:
        return (
          <div className="absolute top-24 left-0 right-0 flex flex-col items-center justify-center z-10 pointer-events-none">
            <div className="animate-pulse bg-gradient-to-r from-red-900/80 to-purple-900/80 text-white px-8 py-2 border-y-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)] flex items-center gap-3 skew-x-[-10deg]">
              <ShieldAlert className="text-red-400 animate-bounce" />
              <span className="font-bold text-xl tracking-widest skew-x-[10deg]">BOSS ENCOUNTER</span>
            </div>
            {bossInfo && (
              <div className="mt-4 bg-black/80 p-4 border border-fuchsia-500/50 text-center max-w-[90%] shadow-[0_0_15px_rgba(217,70,239,0.3)]">
                <p className="text-fuchsia-400 font-bold text-lg uppercase tracking-wider drop-shadow-sm">{bossInfo.name}</p>
                <p className="text-gray-300 text-sm italic font-mono mt-1">"{bossInfo.taunt}"</p>
              </div>
            )}
          </div>
        );

      case GamePhase.GAME_OVER:
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/80 text-white z-10 backdrop-blur-md">
            <h2 className="text-6xl font-black mb-4 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] italic">WASTED</h2>
            <p className="text-xl mb-8 text-red-200 font-mono">SYSTEM FAILURE</p>
            <button 
              onClick={handleStart}
              className="px-8 py-3 border border-white text-white hover:bg-white hover:text-red-900 font-bold text-lg transition-all hover:shadow-[0_0_20px_white] flex items-center gap-2"
            >
              <RotateCcw />
              RETRY
            </button>
          </div>
        );

      case GamePhase.VICTORY:
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-fuchsia-950/80 text-white z-10 backdrop-blur-md">
            <h2 className="text-6xl font-black mb-4 text-yellow-300 drop-shadow-[0_0_15px_rgba(253,224,71,0.8)] italic">VICTORY</h2>
            <p className="text-xl mb-8 text-fuchsia-200 tracking-widest">BOSS DESTROYED</p>
            <div className="flex flex-col items-center gap-2 mb-8 bg-black/40 p-6 border border-yellow-500/30">
               <span className="text-xs uppercase tracking-widest text-yellow-500">Survivors</span>
               <span className="text-5xl font-mono font-bold text-yellow-300 drop-shadow-md">{score}</span>
            </div>
            <button 
              onClick={handleStart}
              className="px-8 py-3 bg-yellow-400 text-black hover:bg-yellow-300 font-bold text-lg transition-all hover:shadow-[0_0_20px_rgba(250,204,21,0.6)] flex items-center gap-2"
            >
              <Zap className="fill-black" />
              PLAY AGAIN
            </button>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0518] flex items-center justify-center p-4 font-sans overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-[#0f0518] to-black">
      {/* Retro background grid effect overlay (CSS) */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
      
      <div className="relative w-full max-w-md aspect-[9/18] rounded-none shadow-[0_0_50px_rgba(168,85,247,0.4)] border-4 border-slate-800 bg-black overflow-hidden ring-1 ring-white/10">
        
        {/* Game Canvas */}
        <GameCanvas 
          onScoreChange={setScore} 
          onPhaseChange={setPhase}
          onBossInfo={setBossInfo}
        />

        {/* HUD - Always visible during Run */}
        <div className="absolute top-6 left-6 z-0 pointer-events-none">
          <div className="flex items-center gap-3 bg-black/60 backdrop-blur-sm px-5 py-2 border-l-4 border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.3)] skew-x-[-10deg]">
            <Users className="text-cyan-400 w-6 h-6 skew-x-[10deg]" />
            <span className="text-3xl font-bold text-white font-mono skew-x-[10deg] drop-shadow-[0_0_5px_rgba(0,255,255,0.8)]">{score}</span>
          </div>
        </div>

        {/* Boss Health HUD */}
        {phase === GamePhase.BOSS_FIGHT && bossInfo && (
           <div className="absolute top-6 right-6 z-0 pointer-events-none">
              <div className="flex flex-col items-end">
                <span className="text-fuchsia-500 font-bold text-xs tracking-widest mb-1 shadow-black drop-shadow-md">BOSS INTEGRITY</span>
                <div className="flex items-center gap-2">
                   <div className="h-4 w-32 bg-gray-900 border border-fuchsia-900 skew-x-[-15deg] overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-fuchsia-600 to-red-500 transition-all duration-300"
                        style={{ width: `${Math.min(100, (bossInfo.currentHp / bossInfo.maxHp) * 100)}%` }}
                      ></div>
                   </div>
                   <span className="text-xl font-black text-fuchsia-500 font-mono">
                     {Math.max(0, Math.floor(bossInfo.currentHp))}
                   </span>
                </div>
              </div>
           </div>
        )}

        {/* Phase Overlays */}
        {getPhaseUI()}

      </div>
      
      {/* Background hint */}
      <div className="fixed bottom-4 text-fuchsia-500/50 text-xs font-mono tracking-widest uppercase">
        Controls: A/D or Arrows •  "DEMO"
      </div>
    </div>
  );
};

export default App;
