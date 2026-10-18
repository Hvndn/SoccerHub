"use client";

import React from "react";
import { AuthProvider } from "@/context/AuthContext";
import PlayerSetup from "@/components/PlayerSetup";

export default function PlayerSetupPage() {
 return (
 <AuthProvider>
 <PlayerSetup />
 </AuthProvider>
 );
}