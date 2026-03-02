# Vibe Designing Code Standards & Patterns

## File Organization

### Structure Overview

```
src/
├── server/
│   ├── mcp.ts               # Main MCP server entry point
│   ├── tunnel.ts            # Embedded WebSocket relay (v0.2.0+)
│   ├── tunnel-standalone.ts # Docker tunnel (v0.2.0+)
│   ├── port-scanner.ts      # Port auto-scanning 3055-3058 (v0.2.0+)
│   └── cli-setup.ts         # CLI setup command (v0.2.0+)
├── plugin/                   # Figma plugin files
│   ├── code.ts              # Plugin code (sandbox)
│   ├── ui.html              # Plugin UI (iframe)
│   ├── manifest.json        # Plugin declaration
│   └── setcharacters.js     # Text rendering utility
├── tools/                    # Design operation tools & MCP services
│   ├── _mcp-registry.generated.ts      # Auto-generated MCP registry (v0.2.0+)
│   ├── _figma-registry.generated.ts    # Auto-generated Figma registry (v0.2.0+)
│   ├── schemas.ts           # Zod validation schemas
│   ├── types.ts             # Shared TypeScript types (includes handler field, v0.3.0+)
│   ├── icons.ts             # Icon system: search, list, create (hybrid pattern, v0.3.5+)
│   ├── prompts.ts           # MCP prompts (including design_workflow v0.3.0+)
│   ├── icon-providers/      # Icon provider abstraction (v0.3.5+)
│   │   ├── types.ts         # IconProvider interface
│   │   ├── registry.ts      # Singleton registry + provider manager
│   │   └── lucide.ts        # LucideProvider: CDN-based icon source
│   └── [figma-tools]/       # Figma-connected tools (dispatch to plugin)
│       ├── components.ts
│       ├── create-frame.ts
│       ├── create-shape.ts
│       ├── create-text.ts
│       ├── modify-node.ts
│       ├── fill-stroke.ts
│       ├── text.ts
│       ├── effects.ts
│       ├── update-frame.ts
│       ├── styles.ts
│       ├── variables.ts
│       ├── node-info.ts
│       ├── selection.ts
│       ├── document.ts
│       ├── lint.ts
│       ├── connection.ts
│       └── fonts.ts
└── utils/                    # Utility functions
    ├── figma-helpers.ts     # Plugin runtime helpers
    ├── serialize-node.ts    # Node JSON serialization
    ├── filter-node.ts       # REST API compatibility
    ├── wcag.ts              # Accessibility validation
    ├── coercion.ts          # Input preprocessing
    ├── color.ts             # Color utilities
    ├── base64.ts            # Base64 encoding
    └── logger.ts            # Logging utility
```

### File Naming Conventions

- **kebab-case** for all TypeScript files: `create-frame.ts`, `fill-stroke.ts`
- **camelCase** for exports: `registerMcpTools`, `figmaHandlers`
- **UPPERCASE** for constants: `DEFAULT_TIMEOUT`, `MAX_NODES`
- **lowercase** for Zod schemas: `CreateFrameSchema`, `FillColorSchema`

### File Size Guidelines

- **Target:** Keep individual files under 200 LOC
- **Exceptions:** Lint tools (759 LOC), UI HTML (878 LOC) acceptable due to complexity
- **Strategy:** If a file grows beyond 250 LOC, refactor into focused modules

## Tool Registration Pattern (v0.2.0+)

Tool modules now use **declarative registration** via code generation for improved DX and maintainability.

### Pattern Overview

Every tool module exports two items:
1. **`mcpTools: ToolDefinition[]`** — Declarative tool definitions (v0.2.0+)
2. **`figmaHandlers`** — Plugin command dispatchers (unchanged)

The build system auto-generates registries from these exports:
- `scripts/generate-registries.ts` runs pre-build
- Generates `src/tools/_mcp-registry.generated.ts` (auto-wrapped in server.tool() calls)
- Generates `src/tools/_figma-registry.generated.ts` (merged dispatcher table)

### 1. Define Zod Schema

```typescript
// src/tools/your-tool.ts
import { z } from "zod";
import { flexNum, flexString, flexBool } from "./schemas";

const YourToolSchema = z.object({
  nodeId: flexString.describe("Node ID or path"),
  value: flexNum.describe("Numeric value"),
  enabled: flexBool.describe("Enable feature"),
});
```

**Schema Guidelines:**
- Use `flexNum`, `flexBool`, `flexString` from schemas.ts for AI input resilience
- Always include `.describe()` for MCP documentation
- Mark optional fields with `.optional()`
- Validate before use in Figma handler

### 2. Define MCP Handler

```typescript
export async function yourTool(
  params: z.infer<typeof YourToolSchema>
) {
  // Coerce/validate (already done by MCP framework)
  const { nodeId, value, enabled } = params;

  // Send command to plugin
  const result = await sendCommand("your_command", {
    nodeId,
    value,
    enabled,
  });

  // Return formatted response
  return mcpJson({
    success: true,
    nodeId,
    newValue: result.value,
  });
}
```

**Handler Guidelines:**
- Accept typed params from Zod schema
- Call `sendCommand(command, params)` to plugin
- Return `mcpJson()` for success or `mcpError()` for errors
- Include relevant context in response (IDs, before/after values)

### 3. Define Figma Handler

```typescript
export const figmaHandlers: Record<string, CommandHandler> = {
  your_command: async (params) => {
    const { nodeId, value, enabled } = params;

    // Get node from Figma
    const node = figma.getNodeById(nodeId);
    if (!node) {
      throw new Error(`Node not found: ${nodeId}`);
    }

    // Apply operation
    node.customData = { value, enabled };

    // Return result
    return {
      success: true,
      value: node.customData.value,
    };
  },
};
```

**Handler Guidelines:**
- Use Figma plugin API directly
- Throw descriptive errors (caught and formatted by relay)
- Return plain object (will be JSON serialized)
- Don't use async/await unless necessary (Figma uses event-driven model)

### 4. Export Tool Definition (v0.2.0+)

Two patterns: **Figma-connected tools** (default) and **server-only tools** (with handler).

#### Standard Tool (Figma-connected)

```typescript
import { ToolDefinition } from "@modelcontextprotocol/sdk/types";

export const mcpTools: ToolDefinition[] = [
  {
    name: "your_tool",
    description: "Does something useful",
    schema: {
      nodeId: z.string().describe("Node ID or path"),
      value: z.number().describe("Numeric value"),
      enabled: z.boolean().describe("Enable feature"),
    },
  },
];

export { figmaHandlers };
```

#### Server-Only Tool (with handler)

For tools that execute server-side (e.g., spawn external CLIs, compute data) without Figma plugin interaction:

```typescript
import { ToolDefinition } from "@modelcontextprotocol/sdk/types";
import { z } from "zod";
import { execFile } from "child_process";

async function myServerTool(params: { query: string }) {
  const { query } = params;

  // Execute CLI or other server-side process
  const output = await execProcess("tool", [query]);

  return { content: [{ type: "text", text: output }] };
}

export const mcpTools: ToolDefinition[] = [
  {
    name: "my_server_tool",
    description: "Server-side tool example",
    schema: {
      query: z.string().max(500).describe("Query string"),
    },
    handler: myServerTool,  // Server-side execution
  },
];

export const figmaHandlers = {};  // Empty — no plugin dispatch needed
```

#### Hybrid Tool (Server + Plugin)

For tools combining server-side processing with Figma plugin execution (e.g., fetch resource, create design element):

```typescript
// Server-side: process/fetch data
async function createIconHandler(params: any, sendCommand?: SendCommandFn) {
  const provider = await iconRegistry.get(params.provider);
  let svg = await provider.getSvg(params.name);

  // Apply overrides
  if (params.color) {
    svg = svg.replace(/currentColor/g, params.color);
  }

  // Dispatch to plugin
  return await sendCommand("create_icon", { svg, ...params });
}

// Plugin: create design element from processed data
export const figmaHandlers = {
  create_icon: async (params) => {
    const svgNode = figma.createNodeFromSvg(params.svg);
    const component = figma.createComponent();
    // ... component creation logic
    return { id: component.id };
  }
};

export const mcpTools: ToolDefinition[] = [{
  name: "create_icon",
  description: "Create icon component",
  schema: { name: z.string(), ... },
  handler: createIconHandler,  // Server-side preprocessing
}];
```

**Key:** Both `handler` and corresponding `figmaHandlers` entry exist.

**Declarative Guidelines (v0.2.0+):**
- Export `mcpTools` array with `ToolDefinition` objects
- Auto-wrapped by codegen into server.tool() calls
- Use `handler` field for **server-only tools** (spawns processes, reads files, etc.)
- Use `handler` + `figmaHandlers` for **hybrid tools** (preprocess, then dispatch)
- Without `handler`: codegen wraps in sendCommand() → Figma plugin dispatch
- Export `figmaHandlers` (required for Figma-connected tools, can be empty for server-only)
- No manual `registerMcpTools()` function needed
- Run `npm run build` (or `npm run generate` standalone) to generate registries

**Handler Return Format:**
```typescript
{
  content: [{
    type: "text",  // or "image" for imageData
    text: "output"
  }]
}
```

**Adding a New Tool (Simplified Workflow):**

*Figma-connected tool:*
1. Create `src/tools/my-feature.ts`
2. Export `mcpTools: ToolDefinition[]` (without handler) and `figmaHandlers`
3. Run `npm run build` (codegen runs automatically via prebuild)
4. Tool is auto-registered in MCP server

*Server-only tool:*
1. Create `src/tools/my-service.ts`
2. Implement handler function (spawns process, reads files, etc.)
3. Export `mcpTools` with `handler` field, empty `figmaHandlers`
4. Run `npm run build` — codegen detects handler and skips sendCommand wrapper
5. Tool is auto-registered in MCP server

## Naming Conventions

### MCP Tool Names

Use `snake_case`, descriptive, action-oriented:

```typescript
// ✓ Good
create_frame
move_node
set_fill_color
get_node_info
lint_node
create_paint_style

// ✗ Avoid
createFrame         // camelCase
frame_create        # verb second
makeFrame           # unclear intent
color_fill          # unclear subject
```

### Plugin Commands

Mirror MCP tool names but can be more terse:

```typescript
// MCP tool          Plugin command
create_frame    →   create_frame (same)
set_fill_color  →   fill_color   (optional shortening)
```

### Figma Variables & Custom Data

Use descriptive `camelCase`:

```typescript
// ✓ Good
node.customData = { isComponent: true, variantKey: "size/large" };

// ✗ Avoid
node.customData = { comp: true, key: "s/l" }; // Too abbreviated
```

## Error Handling

### MCP Errors (Server Side)

```typescript
import { mcpError } from "../utils/logger";

export async function toolName(params: z.infer<typeof Schema>) {
  try {
    const result = await sendCommand("command", params);
    return mcpJson(result);
  } catch (error) {
    return mcpError(
      "Tool failed",
      `Details: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
```

### Figma Errors (Plugin Side)

```typescript
export const figmaHandlers = {
  command: async (params) => {
    // Validation
    if (!params.nodeId) {
      throw new Error("nodeId is required");
    }

    // Figma API checks
    const node = figma.getNodeById(params.nodeId);
    if (!node) {
      throw new Error(`Node not found: ${params.nodeId}`);
    }

    // Type guards
    if (node.type !== "FRAME") {
      throw new Error(`Expected FRAME, got ${node.type}`);
    }

    // Operation
    try {
      node.name = "New Name";
      return { success: true, name: node.name };
    } catch (err) {
      throw new Error(`Failed to rename: ${err}`);
    }
  },
};
```

**Error Guidelines:**
- Throw descriptive errors with context
- Include what failed and why
- Don't expose internal Figma IDs unnecessarily
- All thrown errors are caught and formatted by relay

## Input Validation

### Coercion Strategy

Use forgiving Zod preprocessors for AI agent input:

```typescript
// src/tools/schemas.ts
export const flexNum = z
  .union([z.number(), z.string()])
  .transform((val) => {
    if (typeof val === "number") return val;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
  });

export const flexBool = z
  .union([z.boolean(), z.string()])
  .transform((val) => {
    if (typeof val === "boolean") return val;
    return ["true", "yes", "1", "on"].includes(
      String(val).toLowerCase()
    );
  });

export const flexString = z
  .union([z.string(), z.number()])
  .transform((val) => String(val));
```

**Usage:**

```typescript
// AI agent sends: { color: "FF0000" } or { color: "red" }
// Both work with flexString

const ColorSchema = z.object({
  color: flexString,
  opacity: flexNum, // Accepts 0.5, "0.5", "50%"
});
```

### Type Guards

```typescript
// ✓ Good: Explicit type checking
function isFrame(node: SceneNode): node is FrameNode {
  return node.type === "FRAME";
}

if (isFrame(node)) {
  // TypeScript now knows node.autoLayout exists
  node.autoLayout = { layoutMode: "VERTICAL" };
}

// ✗ Avoid: Weak type checks
if (node?.layoutMode) {
  // Might fail on non-layout nodes
}
```

## API Response Format

### Success Response (mcpJson)

```typescript
return mcpJson({
  success: true,
  nodeId: "123:456",
  name: "New Frame",
  properties: {
    width: 800,
    height: 600,
  },
});
```

**Response Guidelines:**
- Always include `success: true`
- Include the modified node ID(s)
- Include changed properties (before/after if helpful)
- Keep response <50KB (enforced by mcpJson)
- Serialize complex objects carefully

### Error Response (mcpError)

```typescript
return mcpError(
  "Operation Failed",
  `Could not resize node: ${nodeId} (node type: COMPONENT_SET)`
);
```

**Error Guidelines:**
- First param: Error title (short)
- Second param: Detailed explanation with context
- Avoid exposing error codes, use readable messages
- Include relevant IDs/names for debugging

## Node Serialization

### Serialization Budget

Default 200 nodes max per serialization to prevent huge responses:

```typescript
import { serializeNode } from "../utils/serialize-node";

const serialized = serializeNode(node, {
  depth: 3,           // Traverse 3 levels deep
  nodeLimit: 200,     // Stop at 200 nodes
});

return mcpJson(serialized);
```

### What Gets Serialized

✓ Basic properties: `id`, `name`, `type`, `x`, `y`, `width`, `height`
✓ Content: text, fills, strokes, effects
✓ Structure: children (if within budget)
✓ Design tokens: styles, variables, bindings
✓ Constraints: horizontal, vertical rules

✗ Very large data: images, fonts (use references)
✗ Non-serializable: function references, circular refs

## Logging

### Logger Pattern

```typescript
import { logger } from "../utils/logger";

// Development (visible in plugin console)
logger.log("Operation started", { nodeId, action });

// Errors (always visible)
logger.error("Operation failed", { nodeId, error: err.message });
```

**Logger Guidelines:**
- Use for debugging, not for required output
- Include context object with relevant data
- Never log sensitive information (API keys, user data)
- Keep logs concise and searchable

## Type Definitions

### Shared Types (types.ts)

```typescript
// Command protocol
export interface CommandMessage {
  id: string;
  action: string;
  params: Record<string, any>;
  timestamp: number;
}

export interface CommandResponse {
  id: string;
  success: boolean;
  data?: Record<string, any>;
  error?: {
    title: string;
    details: string;
  };
}

// Node info
export interface NodeInfo {
  id: string;
  name: string;
  type: string;
  properties: Record<string, any>;
}
```

**Type Guidelines:**
- Use interfaces for external contracts
- Use types for internal unions and utilities
- Always export from types.ts for visibility
- Document complex types with JSDoc comments

## Code Comments

### When to Comment

✓ **Complex algorithms:** WCAG contrast calculation, boolean operations
✓ **Non-obvious intent:** Why we serialize nodes with 200-node limit
✓ **Workarounds:** Why we use postMessage instead of direct API
✓ **Figma API quirks:** Undocumented behavior or limitations

✗ **Self-documenting code:** `const nodeId = params.nodeId;` needs no comment
✗ **What (obvious):** `count++` doesn't need a comment
✗ **API descriptions:** Use JSDoc instead

### Comment Style

```typescript
// ✓ Good: Explains why
// We limit serialization to 200 nodes to prevent >50KB MCP responses
// that crash some AI agents. Larger designs should use search_nodes.
const MAX_SERIALIZED_NODES = 200;

// ✓ Good: Documents quirk
// Figma plugin API doesn't support direct font file access.
// Use getAvailableFontsAsync() with font family name only.
const fontName = `${family}-${weight}`;

// ✗ Avoid: States obvious
// Create a frame node
const frame = figma.createFrame();

// ✗ Avoid: Too wordy
// This variable is a string that represents the identifier
// of a particular node within the Figma document structure.
const nodeId = params.nodeId;
```

## Testing Strategy

### Unit Test Pattern

```typescript
import { describe, it, expect } from "vitest";
import { YourTool } from "./your-tool";

describe("yourTool", () => {
  it("should update node properties", async () => {
    const result = await yourTool({
      nodeId: "123:456",
      value: 100,
    });

    expect(result.success).toBe(true);
    expect(result.newValue).toBe(100);
  });

  it("should handle missing nodes gracefully", async () => {
    const result = await yourTool({
      nodeId: "invalid:id",
      value: 100,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

### Schema Validation Testing

```typescript
import { YourToolSchema } from "./your-tool";

describe("YourToolSchema", () => {
  it("should coerce string numbers", () => {
    const result = YourToolSchema.parse({
      nodeId: "123:456",
      value: "50.5", // String number
    });

    expect(result.value).toBe(50.5);
    expect(typeof result.value).toBe("number");
  });

  it("should reject invalid node IDs", () => {
    expect(() =>
      YourToolSchema.parse({
        nodeId: 123, // Must be string
        value: 50,
      })
    ).toThrow();
  });
});
```

## Performance Considerations

### Node Operations

```typescript
// ✓ Good: Batch operations with progress_update
async function updateManyNodes(nodeIds: string[]) {
  for (let i = 0; i < nodeIds.length; i++) {
    const node = figma.getNodeById(nodeIds[i]);
    if (node) node.fills = [{ type: "SOLID", color: { r: 1, g: 0, b: 0 } }];

    // Notify agent every 10 nodes
    if (i % 10 === 0) {
      // Send progress_update to MCP
      sendProgress(`Updated ${i}/${nodeIds.length} nodes`);
    }
  }
}

// ✗ Avoid: Waiting for each operation
// for (const nodeId of nodeIds) {
//   await updateNode(nodeId); // Too slow
// }
```

### Large Serialization

```typescript
// ✓ Good: Serialize with budget
const serialized = serializeNode(root, {
  depth: 2,
  nodeLimit: 100, // Smaller budget
});

// ✗ Avoid: Serialize entire document
// const serialized = serializeNode(figma.root, { depth: 10 });
// This could create 50KB+ responses
```

## Security Guidelines

### Input Validation

```typescript
// ✓ Good: Validate before use
const nodeId = params.nodeId;
if (!nodeId || typeof nodeId !== "string") {
  throw new Error("nodeId must be a non-empty string");
}

// ✗ Avoid: Trust untrusted input
// const node = figma.getNodeById(params.nodeId);
// If params.nodeId is "" or null, this might fail silently
```

### Network Security

- WebSocket: localhost only (enforced in manifest.json)
- Auth: Optional token validation per relay channel
- TLS: Not enforced (localhost), but supported if relay runs behind proxy

### Data Sensitivity

```typescript
// ✓ Good: Don't log sensitive data
logger.log("Color updated", { nodeId, oldColor: "red", newColor: "blue" });

// ✗ Avoid: Logging user data
// logger.log("User request", { userId, apiKey, token });
```

## Build & Deployment

### Build Output
- **MCP Server:** ESM + CJS (Node 18+)
- **Figma Plugin:** IIFE (ES2015, bundled)
- **TypeScript:** ES2022 target, strict: false (AI flexibility)

## Deployment Standards

### Version Bumping

- Patch: Bug fixes, documentation
- Minor: New tools, non-breaking changes
- Major: Breaking API changes, large refactors

### Release Checklist

- [ ] Run tests: `npm test`
- [ ] Run linting: `npm run lint`
- [ ] Build: `npm run build`
- [ ] Test setup guides (README: [NPM](../README.md#option-1-npm-zero-download), [Source](../README.md#option-2-build-from-source))
- [ ] Update CHANGELOG with version notes
- [ ] Tag release: `git tag v0.1.1`
- [ ] Publish: `npm publish --access public`

## Common Patterns & Anti-Patterns

**Do:** Use type guards, validate early, consistent response structures, named exports, serialize with budget.

**Don't:** Use type assertions, inconsistent responses, default exports, validate late, log sensitive data, trust untrusted input.

---

**Last Updated:** 2026-03-02
**Version:** 0.2.0
**Status:** Current and enforced for all pull requests
