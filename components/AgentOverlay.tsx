"use client";
import { useState } from "react";
import { useConversation } from "@elevenlabs/react";
import { agentTools, handleToolCall } from "@/lib/agentTools";

export default function AgentOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  
  const conversation = useConversation({
    agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID!,
    onToolCall: (toolName: string, parameters: any) => handleToolCall(toolName, parameters),
    clientTools: agentTools,
  });

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsOpen(false)} />
      )}
      
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex justify-between items-center">
            <h3 className="font-semibold text-white">ThreatViz Assistant</h3>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200">✕</button>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <button
              onClick={() => conversation.startSession({ agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID!, connectionType: "websocket" })}
              disabled={conversation.status === "connected"}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50 hover:bg-indigo-700 transition"
            >
              {conversation.status === "connected" ? "Connected" : "Start Conversation"}
            </button>
            <button
              onClick={() => conversation.endSession()}
              disabled={conversation.status !== "connected"}
              className="px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50 hover:bg-red-700 transition"
            >
              End Conversation
            </button>
            <p className="text-sm text-gray-400">Status: <span className="text-white">{conversation.status}</span></p>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full shadow-lg hover:shadow-xl transition-all z-50 flex items-center justify-center text-white text-2xl"
      >
        🎙️
      </button>
    </>
  );
}
