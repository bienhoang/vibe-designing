import { z } from "zod";
import * as S from "./schemas";
import type { ToolDefinition, SendCommandFn } from "./types";
import { mcpJson, mcpError } from "./types";
import { iconRegistry } from "./icon-providers/registry";

// ─── Server-side Handlers ──────────────────────────────────────

async function searchIconsHandler(params: any) {
  try {
    const { query, provider: providerId, limit } = params;
    const provider = await iconRegistry.get(providerId);
    const results = await provider.search(query, limit);
    return mcpJson({ provider: provider.id, query, results, total: results.length });
  } catch (e) {
    return mcpError("search_icons", e);
  }
}

async function listIconSetsHandler() {
  return mcpJson({ providers: iconRegistry.list() });
}

async function createIconHandler(params: any, sendCommand?: SendCommandFn) {
  if (!sendCommand) return mcpError("create_icon", "sendCommand not available");

  try {
    const { name, provider: providerId, x, y, size, color, parentId } = params;
    const provider = await iconRegistry.get(providerId);

    // Fetch SVG from CDN
    let svg = await provider.getSvg(name);

    // Apply color override: replace currentColor in both stroke and fill attributes
    if (color) {
      if (!/^#([0-9a-fA-F]{3,8})$/.test(color)) {
        return mcpError("create_icon", `Invalid hex color: ${color}`);
      }
      svg = svg.replace(/(?:stroke|fill)="currentColor"/g, (match) =>
        match.replace("currentColor", color),
      );
    }

    // Dispatch to Figma plugin
    const result = await sendCommand("create_icon", {
      svg,
      iconName: name,
      provider: provider.id,
      x: x ?? 0,
      y: y ?? 0,
      size: size ?? 24,
      parentId,
    });

    return mcpJson(result);
  } catch (e) {
    return mcpError("create_icon", e);
  }
}

// ─── MCP Tool Definitions ──────────────────────────────────────

export const mcpTools: ToolDefinition[] = [
  {
    name: "search_icons",
    description:
      "Search for icons by keyword. Returns matching icon names and tags. Use before create_icon to find the right icon name.",
    schema: {
      query: z.string().describe("Search keyword (e.g., 'arrow', 'home', 'user', 'check')"),
      provider: z.string().optional().describe("Icon provider ID (default: 'lucide')"),
      limit: z.coerce.number().optional().describe("Max results (default: 20)"),
    },
    handler: searchIconsHandler,
  },
  {
    name: "list_icon_sets",
    description: "List available icon providers with their metadata (name, license, icon count).",
    schema: {},
    handler: listIconSetsHandler,
  },
  {
    name: "create_icon",
    description:
      "Create an icon in Figma. Fetches SVG from icon provider, creates a reusable Component (if first use), " +
      "then places an Instance at the specified position. Icons are stored as Components on an 'Icons' page " +
      "for design system reuse. Use search_icons first to find icon names.",
    schema: {
      name: z.string().describe("Icon name from search_icons (e.g., 'arrow-right', 'home', 'check')"),
      provider: z.string().optional().describe("Icon provider ID (default: 'lucide')"),
      x: S.xPos,
      y: S.yPos,
      size: z.coerce.number().optional().describe("Icon size in px (default: 24). Icons are square."),
      color: z.string().optional().describe('Icon stroke color as hex (e.g., "#000000", "#FF5733"). Omit for default black.'),
      parentId: S.parentId,
    },
    handler: createIconHandler,
  },
];

// ─── Figma Handlers ────────────────────────────────────────────

async function createIconFigma(params: any) {
  const { svg, iconName, provider, x, y, size, parentId } = params;
  const componentName = `Icon/${provider}/${iconName}`;

  // 1. Search for existing icon component across all pages
  await figma.loadAllPagesAsync();
  let component = figma.root.findAllWithCriteria({ types: ["COMPONENT"] })
    .find(c => c.name === componentName) as ComponentNode | undefined;

  if (!component) {
    // 2. Find or create "Icons" page
    let iconsPage = figma.root.children.find(p => p.name === "Icons");
    if (!iconsPage) {
      iconsPage = figma.createPage();
      iconsPage.name = "Icons";
    }

    // 3. Create component from SVG
    const svgNode = figma.createNodeFromSvg(svg);
    component = figma.createComponent();
    component.name = componentName;
    component.resize(svgNode.width, svgNode.height);
    component.fills = [];

    // Move SVG children into component
    for (const child of [...svgNode.children]) {
      component.appendChild(child);
    }
    svgNode.remove();

    // Place component on Icons page
    iconsPage.appendChild(component);
  }

  // 4. Create instance
  const instance = component.createInstance();
  instance.x = x;
  instance.y = y;

  // 5. Resize if different from component size
  if (size && (instance.width !== size || instance.height !== size)) {
    instance.resize(size, size);
  }

  // 6. Append to parent (uses figma-helpers appendToParent pattern)
  if (parentId) {
    const parent = await figma.getNodeByIdAsync(parentId);
    if (!parent) throw new Error(`Parent not found: ${parentId}`);
    if (!("appendChild" in parent)) {
      throw new Error(`Parent does not support children: ${parentId}`);
    }
    (parent as any).appendChild(instance);
  } else {
    figma.currentPage.appendChild(instance);
  }

  return {
    id: instance.id,
    componentId: component.id,
    name: componentName,
    size: { width: instance.width, height: instance.height },
  };
}

export const figmaHandlers: Record<string, (params: any) => Promise<any>> = {
  create_icon: createIconFigma,
};
