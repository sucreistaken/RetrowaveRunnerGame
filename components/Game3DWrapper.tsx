import React, { useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import GameCanvas from "./GameCanvas";
import { GamePhase } from "../types";
import { BOSS_DISTANCE } from "../constants";

interface GameCanvasProps {
  onScoreChange: (score: number) => void;
  onPhaseChange: (phase: GamePhase) => void;
  onBossInfo: (boss: any) => void;
}

const Game3DWrapper: React.FC<GameCanvasProps> = (props) => {
  const startGame = () => {
    // Reset the shared state from the GameCanvas module
    // (GameCanvas manages its own gameStateRef internally)
    // We'll call the exposed window.startGame hook that GameCanvas previously attached.
    // If GameCanvas needs initialisation logic, it should read from global state.
    props.onPhaseChange(GamePhase.RUNNING);
    props.onScoreChange(1);
  };

  useEffect(() => {
    // @ts-ignore
    window.startGame = startGame;

    return () => {
      // @ts-ignore
      delete window.startGame;
    };
  }, []);

  return (
    <div
      className="w-full h-full bg-[#170b29] outline-none cursor-crosshair"
      tabIndex={0}
      onTouchStart={(e) => {
        const touchX = e.touches[0].clientX;
        if (touchX < window.innerWidth / 2) {
          // Simulate left input
          const ev = new KeyboardEvent("keydown", { code: "ArrowLeft" });
          window.dispatchEvent(ev);
        } else {
          const ev = new KeyboardEvent("keydown", { code: "ArrowRight" });
          window.dispatchEvent(ev);
        }
      }}
      onTouchEnd={() => {
        const ev = new KeyboardEvent("keyup", { code: "ArrowLeft" });
        window.dispatchEvent(ev);
        const ev2 = new KeyboardEvent("keyup", { code: "ArrowRight" });
        window.dispatchEvent(ev2);
      }}
    >
      <Canvas shadows camera={{ position: [0, 6, 12], fov: 60 }}>
        <GameCanvas {...props} />
      </Canvas>
    </div>
  );
};

export default Game3DWrapper;
