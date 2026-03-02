import { z } from "zod";
import { flexJson } from "../utils/coercion";
import type { ToolDefinition } from "./types";
import { nodeSnapshot } from "./helpers";

// ─── Handler Registry (set by code.ts to avoid circular imports) ─

let _handlers: Record<string, (params: any) => Promise<any>> = {};

/** Called by code.ts after allFigmaHandlers is assembled */
export function setHandlerRegistry(handlers: Record<string, (params: any) => Promise<any>>) {
  _handlers = handlers;
}

// ─── $prev[N] Reference Resolver ─────────────────────────────────

/**
 * Resolve $prev[N].path references in params.
 * Replaces "$prev[0].id" with the actual value from results[0].id.
 */
function resolvePrevRefs(params: any, results: any[]): any {
  if (!params || typeof params !== "object") return params;
  const json = JSON.stringify(params);
  if (!json.includes("$prev")) return params;
  const resolved = json.replace(/"\$prev\[(\d+)\]\.(\w+)"/g, (_, idx, field) => {
    const i = parseInt(idx);
    if (i < results.length && results[i]?.[field] !== undefined) {
      return JSON.stringify(results[i][field]);
    }
    return `"$prev[${idx}].${field}_UNRESOLVED"`;
  });
  // Catch unsupported syntax like $prev[0].results[0].id (only single-level supported)
  if (resolved.includes("$prev[")) {
    throw new Error("Unresolved $prev reference. Only $prev[N].field (single-level) is supported.");
  }
  return JSON.parse(resolved);
}

// ─── Schema ──────────────────────────────────────────────────────

const commandItem = z.object({
  command: z.string().describe("Tool command name (e.g. create_frame, set_fill_color)"),
  params: flexJson(z.record(z.any()).default({})).describe("Parameters for the command"),
});

// ─── MCP Tool Definition ────────────────────────────────────────

export const mcpTools: ToolDefinition[] = [
  {
    name: "execute_batch",
    description: "Execute multiple commands in a single round-trip. "
      + "Commands run sequentially in order. Failed commands return error; "
      + "subsequent commands continue. Use $prev[N].id in params to reference "
      + "the id from result of command N (0-indexed). Max 50 commands. "
      + "Much faster than calling tools individually during design generation.",
    schema: {
      commands: flexJson(z.array(commandItem).min(1).max(50))
        .describe("Array of {command, params} to execute sequentially"),
      snapshot_depth: z.coerce.number().int().min(0).optional()
        .describe("If set, snapshot final created/modified nodes at this depth"),
    },
    timeoutMs: 120_000,
  },
];

// ─── Figma Handler ──────────────────────────────────────────────

export const figmaHandlers: Record<string, (params: any) => Promise<any>> = {
  execute_batch: async (params: any) => {
    const { commands, snapshot_depth } = params;
    const results: any[] = [];

    for (let i = 0; i < commands.length; i++) {
      const { command, params: cmdParams } = commands[i];
      try {
        if (command === "execute_batch") {
          results.push({ index: i, command, error: "Recursive execute_batch is not allowed" });
          continue;
        }
        const handler = _handlers[command];
        if (!handler) {
          results.push({ index: i, command, error: `Unknown command: ${command}` });
          continue;
        }
        const resolvedParams = resolvePrevRefs(cmdParams, results);
        // Check for _UNRESOLVED refs (predecessor failed or had no result)
        const paramStr = JSON.stringify(resolvedParams);
        if (paramStr.includes("_UNRESOLVED")) {
          results.push({ index: i, command, error: "Skipped: depends on a failed or missing predecessor result" });
          continue;
        }
        const result = await handler(resolvedParams);
        results.push({ index: i, command, ...result });
      } catch (e: any) {
        results.push({ index: i, command, error: e.message });
      }
    }

    // Optional: deferred snapshot for nodes with IDs
    if (snapshot_depth !== undefined) {
      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        if (r.error || !r.id) continue;
        try {
          const snapshot = await nodeSnapshot(r.id, snapshot_depth);
          if (snapshot) results[i] = { ...r, ...snapshot };
        } catch { /* skip */ }
      }
    }

    return {
      batchSize: commands.length,
      succeeded: results.filter(r => !r.error).length,
      failed: results.filter(r => r.error).length,
      results,
    };
  },
};
