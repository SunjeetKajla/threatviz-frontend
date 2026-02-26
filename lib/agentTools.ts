export const agentTools = [
  {
    name: "open_dashboard",
    description: "Opens the ThreatViz dashboard",
    parameters: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "navigate_tab",
    description: "Navigates to a specific tab in the dashboard",
    parameters: {
      type: "object",
      properties: {
        tab: {
          type: "string",
          enum: ["Overview", "Threats", "Logs", "Recommendations"],
          description: "The dashboard tab to navigate to",
        },
      },
      required: ["tab"],
    },
  },
];

export function handleToolCall(toolName: string, parameters: any) {
  if (toolName === "open_dashboard") {
    window.location.href = "/dashboard";
    return { success: true, message: "Opening dashboard" };
  }
  
  if (toolName === "navigate_tab") {
    const tab = parameters.tab;
    window.location.href = `/dashboard?tab=${tab}`;
    return { success: true, message: `Navigating to ${tab} tab` };
  }
  
  return { success: false, message: "Unknown tool" };
}
