"use client";

import { BuilderGame } from "@/components/games/BuilderGame";
import { GameFrame } from "@/components/games/GameFrame";

export default function Page() {
  return <GameFrame title="Word Builder">{(pool) => <BuilderGame pool={pool} />}</GameFrame>;
}
