import { z } from "zod";
import { flexJson, flexBool } from "../utils/coercion";
import * as S from "./schemas";
import type { ToolDefinition, SendCommandFn } from "./types";
import { mcpJson, mcpError } from "./types";
import { batchHandler, styleNotFoundHint, suggestStyleForColor } from "./helpers";
import { customBase64Decode } from "../utils/base64";

// ─── Schemas ─────────────────────────────────────────────────────

const fillItem = z.object({
  nodeId: S.nodeId,
  color: flexJson(S.colorRgba).optional().describe('Fill color. Hex "#FF0000" or {r,g,b,a?} 0-1. Ignored when styleName is set.'),
  styleName: z.string().optional().describe("Apply fill paint style by name instead of color. Omit to use color."),
});

const strokeItem = z.object({
  nodeId: S.nodeId,
  color: flexJson(S.colorRgba).optional().describe('Stroke color. Hex "#FF0000" or {r,g,b,a?} 0-1. Ignored when styleName is set.'),
  strokeWeight: z.coerce.number().positive().optional().describe("Stroke weight (default: 1)"),
  styleName: z.string().optional().describe("Apply stroke paint style by name instead of color. Omit to use color."),
});

const cornerItem = z.object({
  nodeId: S.nodeId,
  radius: z.coerce.number().min(0).describe("Corner radius"),
  corners: flexJson(z.array(flexBool(z.boolean())).length(4)).optional()
    .describe("Which corners to round [topLeft, topRight, bottomRight, bottomLeft]. Default: all corners [true,true,true,true]."),
});

const opacityItem = z.object({
  nodeId: S.nodeId,
  opacity: z.coerce.number().min(0).max(1).describe("Opacity (0-1)"),
});

// ─── Server-side Handlers ───────────────────────────────────────

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

async function setImageFillHandler(params: any, sendCommand?: SendCommandFn) {
  if (!sendCommand) return mcpError("set_image_fill", "sendCommand not available");

  try {
    const { nodeId, imageUrl, scaleMode } = params;

    // SSRF protection: only allow http/https
    const parsed = new URL(imageUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return mcpError("set_image_fill", "Only http/https URLs allowed");
    }

    const res = await fetch(imageUrl, { signal: AbortSignal.timeout(55_000) });
    if (!res.ok) return mcpError("set_image_fill", `Fetch failed: ${res.status} ${res.statusText}`);

    const contentType = res.headers.get("content-type") || "";
    if (contentType && !/^image\/(png|jpeg|gif|webp|svg\+xml)/.test(contentType)) {
      return mcpError("set_image_fill", `Unexpected content-type: ${contentType}. Expected image (PNG, JPG, GIF, WEBP).`);
    }

    const contentLength = Number(res.headers.get("content-length") || 0);
    if (contentLength > MAX_IMAGE_BYTES) {
      return mcpError("set_image_fill", `Image too large: ${Math.round(contentLength / 1024)}KB (max 5MB)`);
    }

    const arrayBuffer = await res.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_IMAGE_BYTES) {
      return mcpError("set_image_fill", `Image too large: ${Math.round(arrayBuffer.byteLength / 1024)}KB (max 5MB)`);
    }

    const imageData = Buffer.from(arrayBuffer).toString("base64");

    const result = await sendCommand("set_image_fill", {
      nodeId,
      imageData,
      scaleMode: scaleMode || "FILL",
    });

    return mcpJson(result);
  } catch (e) {
    return mcpError("set_image_fill", e);
  }
}

// ─── MCP Tool Definitions ───────────────────────────────────────

export const mcpTools: ToolDefinition[] = [
  { name: "set_fill_color", description: "Set fill color on nodes. Use styleName to apply a paint style by name, or provide color directly. Batch: pass multiple items.", schema: { items: flexJson(z.array(fillItem)).describe("Array of {nodeId, color?, styleName?}"), depth: S.depth } },
  { name: "set_stroke_color", description: "Set stroke color on nodes. Use styleName to apply a paint style by name. Batch: pass multiple items.", schema: { items: flexJson(z.array(strokeItem)).describe("Array of {nodeId, color?, strokeWeight?, styleName?}"), depth: S.depth } },
  { name: "set_corner_radius", description: "Set corner radius on nodes. Batch: pass multiple items.", schema: { items: flexJson(z.array(cornerItem)).describe("Array of {nodeId, radius, corners?}"), depth: S.depth } },
  { name: "set_opacity", description: "Set opacity on nodes. Batch: pass multiple items.", schema: { items: flexJson(z.array(opacityItem)).describe("Array of {nodeId, opacity}"), depth: S.depth } },
  {
    name: "set_image_fill",
    description: "Set an image fill on a node from a URL. Fetches the image server-side and sends it to the Figma plugin. Supports PNG, JPG, GIF, WEBP. Max 5MB.",
    schema: {
      nodeId: S.nodeId,
      imageUrl: z.string().url().describe("Public image URL (PNG, JPG, GIF, WEBP). Max 5MB."),
      scaleMode: z.enum(["FILL", "FIT", "CROP", "TILE"]).optional().describe("How image scales within node bounds. Default: FILL"),
    },
    handler: setImageFillHandler,
    timeoutMs: 60_000,
  },
];

// ─── Figma Handlers ──────────────────────────────────────────────

async function resolveStyle(name: string): Promise<{ match: { id: string; name: string } | null, available: string[] }> {
  const styles = await figma.getLocalPaintStylesAsync();
  const available = styles.map(s => s.name);
  const exact = styles.find(s => s.name === name);
  if (exact) return { match: { id: exact.id, name: exact.name }, available };
  const fuzzy = styles.find(s => s.name.toLowerCase().includes(name.toLowerCase()));
  if (fuzzy) return { match: { id: fuzzy.id, name: fuzzy.name }, available };
  return { match: null, available };
}

async function setFillSingle(p: any) {
  const node = await figma.getNodeByIdAsync(p.nodeId);
  if (!node) throw new Error(`Node not found: ${p.nodeId}`);
  if (!("fills" in node)) throw new Error(`Node does not support fills: ${p.nodeId}`);

  if (p.styleName) {
    const { match, available } = await resolveStyle(p.styleName);
    if (match) {
      await (node as any).setFillStyleIdAsync(match.id);
      const result: any = { matchedStyle: match.name };
      if (p.color) result.warning = "Both styleName and color provided — used styleName, ignored color. Pass only one.";
      return result;
    }
    throw new Error(styleNotFoundHint("styleName", p.styleName, available));
  } else if (p.color) {
    const { r = 0, g = 0, b = 0, a = 1 } = p.color;
    (node as any).fills = [{ type: "SOLID", color: { r, g, b }, opacity: a }];
    const suggestion = await suggestStyleForColor(p.color, "styleName");
    if (suggestion) return { warning: suggestion };
  }
  return {};
}

async function setStrokeSingle(p: any) {
  const node = await figma.getNodeByIdAsync(p.nodeId);
  if (!node) throw new Error(`Node not found: ${p.nodeId}`);
  if (!("strokes" in node)) throw new Error(`Node does not support strokes: ${p.nodeId}`);

  if (p.styleName) {
    const { match, available } = await resolveStyle(p.styleName);
    if (match) {
      await (node as any).setStrokeStyleIdAsync(match.id);
      const result: any = { matchedStyle: match.name };
      if (p.color) result.warning = "Both styleName and color provided — used styleName, ignored color. Pass only one.";
      if (p.strokeWeight !== undefined && "strokeWeight" in node) (node as any).strokeWeight = p.strokeWeight;
      return result;
    }
    throw new Error(styleNotFoundHint("styleName", p.styleName, available));
  } else if (p.color) {
    const { r = 0, g = 0, b = 0, a = 1 } = p.color;
    (node as any).strokes = [{ type: "SOLID", color: { r, g, b }, opacity: a }];
  }
  if (p.strokeWeight !== undefined && "strokeWeight" in node) (node as any).strokeWeight = p.strokeWeight;
  const result: any = {};
  if (p.color) {
    const suggestion = await suggestStyleForColor(p.color, "styleName");
    if (suggestion) result.warning = suggestion;
  }
  return result;
}

async function setCornerSingle(p: any) {
  const node = await figma.getNodeByIdAsync(p.nodeId);
  if (!node) throw new Error(`Node not found: ${p.nodeId}`);
  if (!("cornerRadius" in node)) throw new Error(`Node does not support corner radius: ${p.nodeId}`);

  const corners = p.corners || [true, true, true, true];
  if ("topLeftRadius" in node && Array.isArray(corners) && corners.length === 4) {
    if (corners[0]) (node as any).topLeftRadius = p.radius;
    if (corners[1]) (node as any).topRightRadius = p.radius;
    if (corners[2]) (node as any).bottomRightRadius = p.radius;
    if (corners[3]) (node as any).bottomLeftRadius = p.radius;
  } else {
    (node as any).cornerRadius = p.radius;
  }
  return {};
}

async function setOpacitySingle(p: any) {
  const node = await figma.getNodeByIdAsync(p.nodeId);
  if (!node) throw new Error(`Node not found: ${p.nodeId}`);
  if (!("opacity" in node)) throw new Error(`Node does not support opacity`);
  (node as any).opacity = p.opacity;
  return {};
}

async function setImageFillFigma(params: any) {
  const { nodeId, imageData, scaleMode } = params;

  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node) throw new Error(`Node not found: ${nodeId}`);
  if (!("fills" in node)) throw new Error(`Node does not support fills: ${nodeId}`);

  // Decode base64 → Uint8Array (no atob in Figma sandbox)
  const bytes = customBase64Decode(imageData);

  const image = figma.createImage(bytes);
  (node as any).fills = [{
    type: "IMAGE",
    scaleMode: scaleMode || "FILL",
    imageHash: image.hash,
  }];

  return { nodeId, imageHash: image.hash, scaleMode: scaleMode || "FILL" };
}

export const figmaHandlers: Record<string, (params: any) => Promise<any>> = {
  set_fill_color: (p) => batchHandler(p, setFillSingle),
  set_stroke_color: (p) => batchHandler(p, setStrokeSingle),
  set_corner_radius: (p) => batchHandler(p, setCornerSingle),
  set_opacity: (p) => batchHandler(p, setOpacitySingle),
  set_image_fill: setImageFillFigma,
};
