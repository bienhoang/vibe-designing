import type { ToolDefinition } from "./types";

// ─── MCP Tool Definitions ───────────────────────────────────────

export const mcpTools: ToolDefinition[] = [
  {
    name: "ping",
    description: "Verify end-to-end connection to Figma. Call this right after join_channel. Returns { status: 'pong', documentName, currentPage } if the full chain (MCP → relay → plugin → Figma) is working. If this times out, the Figma plugin is not connected — ask the user to check the plugin window for the correct port and channel name.",
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
  };
}

export const figmaHandlers: Record<string, (params: any) => Promise<any>> = {
  ping,
};
