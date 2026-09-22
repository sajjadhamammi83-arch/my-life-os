"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import QuickCaptureModal from "../common/QuickCaptureModal";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-white text-zinc-900 selection:bg-black selection:text-white">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <Header onOpenQuickCapture={() => setIsQuickCaptureOpen(true)} />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Global Quick Capture Modal */}
      <QuickCaptureModal
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
      />
    </div>
  );
}
