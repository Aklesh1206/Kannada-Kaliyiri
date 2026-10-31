"use client";

import { SpeedGame } from "@/components/games/SpeedGame";
import { GameFrame } from "@/components/games/GameFrame";


export default function Page() {
  return <GameFrame title="Speed Round">{(pool) => <SpeedGame pool={pool} />}</GameFrame>;
}
