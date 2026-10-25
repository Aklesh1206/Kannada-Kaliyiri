"use client";

import { ListenGame } from "@/components/games/ListenGame";
import { GameFrame } from "@/components/games/GameFrame";

export default function Page() {
  return <GameFrame title="Listen Up">{(pool) => <ListenGame pool={pool} />}</GameFrame>;
}
