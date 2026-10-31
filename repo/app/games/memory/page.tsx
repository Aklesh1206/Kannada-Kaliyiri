"use client";

import { MemoryGame } from "@/components/games/MemoryGame";
import { GameFrame } from "@/components/games/GameFrame";


export default function Page() {
  return <GameFrame title="Memory Flip">{(pool) => <MemoryGame pool={pool} />}</GameFrame>;
}
