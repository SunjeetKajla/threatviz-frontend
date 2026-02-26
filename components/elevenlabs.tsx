"use client";
import { useConversation } from "@elevenlabs/react";


export default function ElevenLabsAgent() {
  const conversation = useConversation({
    agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID!,
  });

  return (
    <div className="flex flex-col gap-4 p-4">
      <button
        onClick={() => conversation.startSession({ agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID!, connectionType: "websocket" })}
        disabled={conversation.status === "connected"}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        Start Conversation
      </button>
      <button
        onClick={() => conversation.endSession()}
        disabled={conversation.status !== "connected"}
        className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50"
      >
        End Conversation
      </button>
      <p>Status: {conversation.status}</p>
    </div>
  );
}