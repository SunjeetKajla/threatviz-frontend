export const agentTools = {
  open_dashboard: () => {
    window.location.href = "/dashboard";
    return "Opening dashboard";
  },
  navigate_tab: (parameters: any) => {
    const tab = parameters.tab;
    window.location.href = `/dashboard?tab=${tab}`;
    return `Navigating to ${tab} tab`;
  },
};

export function handleToolCall(toolName: string, parameters: any) {
  if (toolName === "open_dashboard") {
    return agentTools.open_dashboard();
  }
  
  if (toolName === "navigate_tab") {
    return agentTools.navigate_tab(parameters);
  }
  
  return "Unknown tool";
}
