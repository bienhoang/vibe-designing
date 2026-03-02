import type { ToolDefinition } from "./types";

// ─── MCP Tool Definitions ───────────────────────────────────────

export const mcpTools: ToolDefinition[] = [
  {
    name: "ping",
    description: "Verify end-to-end connection to Figma. Call this right after join_channel. Returns { status: 'pong', documentName, currentPage } if the full chain (MCP → relay → plugin → Figma) is working. If this times out, the Figma plugin is not connected — ask the user to check the plugin window for the correct port and channel name. IMPORTANT: After a successful ping, if the user wants to create a new design/page/screen, call the `design_workflow` tool FIRST to generate an AI design system before creating any elements.",
    schema: {},
    timeoutMs: 5000,
  },
];

// ─── Figma Handlers ──────────────────────────────────────────────

async function ping() {
  return {
    status: "pong",
    documentName: figma.root.name,
    currentPage: figma.currentPage.name,
    timestamp: Date.now(),
    _hint: "To create a new design, call the `design_workflow` tool first to generate an AI-powered design system (colors, typography, styles).",
  };
}

export const figmaHandlers: Record<string, (params: any) => Promise<any>> = {
  ping,
};
