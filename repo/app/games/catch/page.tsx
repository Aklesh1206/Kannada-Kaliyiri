"use client";

import { CatchGame } from "@/components/games/CatchGame";
import { GameFrame } from "@/components/games/GameFrame";


export default function Page() {
  return <GameFrame title="Sky Catch">{(pool) => <CatchGame pool={pool} />}</GameFrame>;
}
