"use client";

import React from "react";
import MatchmakingMarketplace from "./MatchmakingMarketplace";

export default function CommunityElo({ user, onSelectSlot }: { user?: any; onSelectSlot?: any }) {
  return <MatchmakingMarketplace user={user} onSelectMatch={onSelectSlot} />;
}
