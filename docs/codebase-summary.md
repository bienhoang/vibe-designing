# Vibe Designing Codebase Summary

## Overview

Vibe Designing is an open-source MCP (Model Context Protocol) server that bridges AI agents with Figma through natural conversation. v0.2.0: Embedded relay + auto-registry codegen. Total codebase: ~8,600 LOC across 55 source files.

## Directory Structure

```
vibe-designing/
├── src/
│   ├── server/
│   │   ├── mcp.ts             # Main MCP server (407 LOC)
│   │   ├── tunnel.ts          # Embedded WebSocket relay (v0.2.0+)
│   │   ├── tunnel-standalone.ts # Docker standalone tunnel (v0.2.0+)
│   │   ├── port-scanner.ts    # Port auto-scanning 3055-3058 (v0.2.0+)
│   │   └── cli-setup.ts       # CLI setup command (v0.2.0+)
│   ├── plugin/                # Figma plugin UI and code
│   │   ├── code.ts            # Plugin backend (155 LOC)
│   │   ├── ui.html            # Plugin UI and connection panel (878 LOC)
│   │   ├── manifest.json      # Plugin declaration
│   │   └── setcharacters.js   # Smart text content setter (215 LOC)
│   ├── tools/                 # Tool modules (~4,600 LOC across 18 files)
│   │   ├── _mcp-registry.generated.ts    # Auto-generated MCP registration (v0.2.0+)
│   │   ├── _figma-registry.generated.ts  # Auto-generated plugin dispatch (v0.2.0+)
│   │   ├── schemas.ts         # Zod validation schemas (189 LOC)
│   │   ├── types.ts           # Shared type definitions (includes handler field)
│   │   ├── components.ts      # Component creation tools (441 LOC)
│   │   ├── create-frame.ts    # Frame creation logic (250 LOC)
│   │   ├── create-shape.ts    # Shape creation (199 LOC)
│   │   ├── create-text.ts     # Text node creation (250 LOC)
│   │   ├── modify-node.ts     # Node modification (152 LOC)
│   │   ├── fill-stroke.ts     # Color and stroke tools (172 LOC)
│   │   ├── text.ts            # Text editing (313 LOC)
│   │   ├── effects.ts         # Shadow/blur effects (153 LOC)
│   │   ├── update-frame.ts    # Frame properties (109 LOC)
│   │   ├── styles.ts          # Design token system (420 LOC)
│   │   ├── variables.ts       # Variable management (381 LOC)
│   │   ├── icons.ts           # Icon system (search/create from CDN, v0.3.5+) (169 LOC)
│   │   ├── node-info.ts       # Node querying (220 LOC)
│   │   ├── selection.ts       # Selection operations (166 LOC)
│   │   ├── document.ts        # Document structure (151 LOC)
│   │   ├── lint.ts            # Design linting (759 LOC)
│   │   ├── recommend-design.ts # AI design recommendations via ui-ux-pro-max (MCP-only, server-side)
│   │   ├── connection.ts      # Connection helpers (34 LOC)
│   │   ├── fonts.ts           # Font management (43 LOC)
│   │   ├── helpers.ts         # Utility helpers (153 LOC)
│   │   ├── prompts.ts         # MCP prompts (297 LOC)
│   │   └── icon-providers/    # Icon provider abstraction (v0.3.5+)
│   │       ├── types.ts       # IconProvider interface
│   │       ├── registry.ts    # Singleton registry + Lucide provider manager
│   │       └── lucide.ts      # LucideProvider: CDN-based icon source
│   ├── utils/                 # Utility modules (~1,100 LOC)
│   │   ├── figma-helpers.ts   # Plugin runtime helpers (267 LOC)
│   │   ├── serialize-node.ts  # Node serialization (218 LOC)
│   │   ├── filter-node.ts     # REST API JSON filter (118 LOC)
│   │   ├── wcag.ts            # WCAG 2.2 validation (163 LOC)
│   │   ├── coercion.ts        # Zod preprocessors (37 LOC)
│   │   ├── color.ts           # Color utilities (12 LOC)
│   │   ├── base64.ts          # Base64 helpers (32 LOC)
│   │   └── logger.ts          # Logging (8 LOC)
│   └── assets/
│       └── thumbnail.jpg      # Demo video thumbnail
├── scripts/
│   ├── generate-registries.ts # Codegen for tool registration (v0.2.0+)
│   └── audit-defaults.ts      # Audit script
├── package.json               # Root workspace config
├── tsconfig.json              # TypeScript config
├── tsup.config.ts             # Build config
├── README.md                  # Project overview + setup guides (NPM & source)
├── Dockerfile                 # Container deployment
└── LICENSE                    # MIT license
```

## Module Responsibilities

### Core Modules

**server/mcp.ts (407 LOC)** — MCP Server Foundation
- Stdio-based MCP server using @modelcontextprotocol/sdk
- Automatically starts embedded relay (v0.2.0+)
- WebSocket client connecting to local relay
- Channel management: join, validate, reconnect, error recovery
- Request/response with UUID tracking and 30-second timeout (extendable via progress_update)
- Port auto-scans 3055-3058 for availability
- CLI: `vibe-designing` (runs server + auto-starts relay)
- Graceful shutdown handling

**server/tunnel.ts** — Embedded WebSocket Relay (v0.2.0+)
- Relay server embedded in MCP process
- Starts automatically on MCP server init
- Channel-based message broker (MCP ↔ plugin)
- Auto-scans ports 3055-3058
- No separate process needed

**server/tunnel-standalone.ts** — Docker Standalone Tunnel (v0.2.0+)
- Relay server for Docker deployments
- Can run independently from MCP server
- Used in Docker containers via `dist/tunnel.js`

**server/port-scanner.ts** — Port Auto-Scanning (v0.2.0+)
- Detects available ports in range 3055-3058
- Called by tunnel.ts on startup
- Returns first available port

**plugin/code.ts (155 LOC)** — Plugin Backend
- Figma sandbox environment (isolated from main thread)
- Command dispatch via `allFigmaHandlers` registry
- Message handling from UI (iframe)
- Auto-focus after mutations
- Error logging to console
- Plugin lifecycle management

**plugin/ui.html (878 LOC)** — Plugin UI
- WebSocket client connecting to relay
- Connection status panel with visual indicators
- Tool progress tracking with 5KB message preview
- Dark theme stylesheet
- Command input/output display
- Auto-reconnection logic with exponential backoff
- Event listeners for connection state changes

### Tool Registry System (v0.2.0+)

**_mcp-registry.generated.ts** — Auto-Generated MCP Registration
- Generated by `scripts/generate-registries.ts` (v0.2.0+)
- Wraps all tool module `mcpTools: ToolDefinition[]` into `server.tool()` calls
- Run before build via `npm run prebuild` or manually via `npm run generate`
- Do NOT edit manually — auto-generated from tool exports
- Each tool module exports declarative `mcpTools` array (Zod-validated)

**_figma-registry.generated.ts** — Auto-Generated Plugin Dispatch
- Generated by `scripts/generate-registries.ts` (v0.2.0+)
- Merges all tool module `figmaHandlers` objects
- Used by plugin code.ts to dispatch incoming commands
- Flat hash table: `command → handler function`
- Do NOT edit manually — auto-generated from tool exports

**Adding a New Tool (v0.2.0+ Workflow):**
1. Create `src/tools/my-feature.ts`
2. Export `mcpTools: ToolDefinition[]` and `figmaHandlers`
3. Run `npm run build` (codegen runs automatically via prebuild hook)
4. Tool is auto-registered in both MCP server and plugin dispatcher

### Tool Categories (53+ Tools)

| Category | Files | Count | Purpose |
|----------|-------|-------|---------|
| **Creation** | components, create-frame, create-shape, create-text, icons | 19 tools | Create nodes, components, variants, instances, SVG imports, boolean ops, icons |
| **Modification** | modify-node, fill-stroke, text, effects, update-frame | 17 tools | Move, resize, delete, clone, update properties, set colors, effects |
| **Styling** | styles, variables | 16 tools | Design tokens, paint/text/effect styles, variable collections & bindings |
| **Querying** | node-info, selection, document | 14 tools | Get node info, CSS export, search, selection, viewport, page management |
| **Icons** | icons | 3 tools | Search icons from Lucide CDN, list providers, create icon components |
| **Quality** | lint | 1 tool (10 rules) | Design linting: 8 rules + 2 WCAG 2.2 rules + 2 auto-fix rules |
| **AI Intelligence** | recommend-design | 1 tool | Design system recommendations via ui-ux-pro-max (server-side Python) |
| **Support** | helpers, prompts, fonts, connection | 4 tools + 5 prompts | Ping, channel info, font listing, MCP system prompts |

**tools/recommend-design.ts** — AI Design Recommendations (Server-Only)
- Spawns ui-ux-pro-max Python CLI via `child_process.execFile` (no shell injection)
- Auto-detects Python3 binary and search.py script path
- Returns complete design system: colors, typography, style, layout patterns
- Graceful fallback with install instructions when dependencies missing
- 15s timeout, cross-platform path detection
- Uses `handler` field — runs server-side, no Figma plugin needed

**tools/icons.ts** — Icon System (v0.3.5+, Hybrid Pattern)
- Server-side: `search_icons` (query Lucide CDN index), `list_icon_sets` (metadata)
- Hybrid: `create_icon` fetches SVG server-side, sends to Figma plugin for component creation
- Color override: Replace `currentColor` with hex before dispatching to plugin
- Figma plugin creates Icon/{provider}/{name} component on dedicated "Icons" page
- Creates instance at specified (x, y, size) position
- Designed for reusable icon design system

**tools/icon-providers/** — Icon Provider Abstraction (v0.3.5+)
- **types.ts:** `IconProvider` interface for pluggable providers
- **lucide.ts:** `LucideProvider` (CDN-based, 4000+ icons)
- **registry.ts:** `IconRegistry` singleton managing providers
- Pattern: Define provider → register → use via `registry.get()`

### Utility Modules

**figma-helpers.ts (267 LOC)** — Plugin Runtime Utilities
- Smart text rendering: 3 font mixing strategies (prevail/strict/experimental)
- Node traversal: children, ancestors, siblings
- Property checking: visibility, locked state, component type
- Batch operations with progress tracking

**serialize-node.ts (218 LOC)** — Node Serialization
- Converts BaseNode to JSON representation
- Depth-limited traversal (default 3 levels)
- 200-node budget for serialization (configurable)
- Handles all Figma node types
- Preserves design tokens and variable bindings

**filter-node.ts (118 LOC)** — REST API Compatibility
- Filters REST API JSON response to match BaseNode structure
- Fallback for older Figma plugin versions
- Maps REST fields to internal representation

**wcag.ts (163 LOC)** — Accessibility Validation
- Full WCAG 2.2 Level AA compliance
- Contrast ratio calculation (luminance-based)
- Alpha channel compositing
- Interactive element detection (buttons, links, form fields)
- Minimum text size validation
- Touch target size validation (48x48px recommended)

**coercion.ts (37 LOC)** — Input Preprocessing
- Zod preprocessors for resilient AI input
- flexJson, flexBool, flexNum: Forgiving number/boolean parsing
- Handles string-wrapped JSON, yes/no/0/1 booleans

### CLI Setup Command (v0.2.0+)

**server/cli-setup.ts** — Plugin Auto-Download
- Implements `npx @bienhoang/vibe-designing --setup`
- Downloads Figma plugin from GitHub Releases
- Extracts to `~/vibe-designing/plugin/`
- Zero-friction plugin installation

## Dependency Graph

```
Claude AI Agent
  ↓ (stdio, MCP protocol)
mcp.ts (MCP Server)
  ↓ (WebSocket connect to relay)
tunnel/index.ts (Relay, default :3055)
  ↓ (WebSocket)
plugin/ui.html (Plugin UI, iframe)
  ↓ (postMessage)
plugin/code.ts (Plugin Backend, sandbox)
  ↓ (Figma API)
Figma Design File
```

**Bidirectional Flow:**
1. Agent sends command via MCP → mcp.ts → sendCommand(action, params) over WebSocket
2. Plugin receives message → code.ts dispatches via figmaHandlers[command]
3. Handler modifies Figma → serializes result → sends back via relay
4. mcp.ts receives response → sends to agent as MCP response

## File Size Breakdown

**Core (~2,000 LOC):**
- server/mcp.ts: 407
- plugin/{code, ui, setcharacters}: 1,248
- utils/: 1,100 (excluding types)

**Tools (~4,400 LOC across 16 modules):**
- lint.ts: 759 (largest)
- styles.ts: 420
- components.ts: 441
- variables.ts: 381
- text.ts: 313
- node-info.ts: 220
- Other creation/modification/querying tools: ~1,200

**Build & Config (~100 LOC):**
- tsconfig.json, tsup.config.ts, Dockerfile

**Total Source:** ~8,200 LOC

## Key Patterns

### Tool Implementation Pattern (v0.2.0+)

Every tool module exports declarative definitions (no registration function needed):

```typescript
import { ToolDefinition } from "@modelcontextprotocol/sdk/types";

// 1. Define Zod schema
const MyToolSchema = z.object({
  param1: flexString,
  param2: flexNum,
});

// 2. Define MCP handler
async function myTool(params: z.infer<typeof MyToolSchema>) {
  const result = await sendCommand('my_command', params);
  return mcpJson(result);
}

// 3. Define Figma handler
export const figmaHandlers = {
  my_command: async (params) => {
    return { success: true, data };
  }
};

// 4. Export tool definition (v0.2.0+)
export const mcpTools: ToolDefinition[] = [
  {
    name: "my_tool",
    description: "Does something useful",
    inputSchema: {
      type: "object",
      properties: { /* ... from schema */ },
      required: ["param1"],
    },
  },
];
```

Auto-registration via codegen — no manual server.tool() calls needed.

### Server-Only Tool Pattern (v0.3.x+)

Tools with a `handler` field in `ToolDefinition` run server-side without Figma plugin communication.
Codegen uses the handler directly instead of wrapping with `sendCommand`. Used for: external CLI integrations, AI recommendations.

```typescript
export const mcpTools: ToolDefinition[] = [{
  name: "recommend_design",
  description: "...",
  schema: { query: z.string() },
  handler: async (params) => {
    // Server-side logic (e.g., spawn Python process)
    return { content: [{ type: "text", text: output }] };
  },
}];
export const figmaHandlers: Record<string, (p: any) => Promise<any>> = {};
```

### Error Handling

- Schema validation: Zod throws on invalid input (caught by MCP framework)
- Command timeout: 30 seconds (extended by progress_update for long ops)
- Network errors: Auto-reconnect on WebSocket close (unless ROLE_OCCUPIED)
- Figma API errors: Wrapped in mcpError() with descriptive messages

### Design Token Priority

When applying visual properties:
1. Variable binding (design token) — highest priority
2. Style application (paint/text/effect styles)
3. Direct color/property assignment — lowest priority

### Message Size Limits

- MCP response: 50KB per tool (enforced by mcpJson())
- Relay progress_update: 5KB max preview
- Serialization budget: 200 nodes by default

### Batch Operations

- Progress tracking via MCP progress_update messages
- Allows long-running operations to show status
- Prevents 30s timeout on bulk operations

## Build System

**tsup Configuration:**
- Two targets:
  - **MCP Server:** ESM + CJS, Node 18+, bundled
  - **Figma Plugin:** IIFE, ES2015, separate code + ui + manifest
- Output: `dist/mcp.js` (server), `plugin/code.js`, `plugin/ui.html`, `plugin/manifest.json`

**TypeScript:**
- Target: ES2022
- Module: ESNext
- Strict: false (lenient for AI agent flexibility)

## CI/CD

**Dependabot:** Weekly npm updates (limit 10 open PRs)

**Docker:** node:18-slim container with tunnel relay (port 3055 exposed)

## Key Statistics

- **Total files:** 51
- **Source LOC:** ~8,200
- **Tokens:** 82,406 (repomix)
- **Largest file:** ui.html (878 LOC)
- **Largest tool:** lint.ts (759 LOC)
- **MCP tools:** 50+
- **Figma API node types:** 26+
- **Accessibility rules:** 10 (8 design + 2 WCAG)

## Development Workflow

1. **Setup:** Clone repo → `npm install` → `npm run build`
2. **Plugin Dev:** Edit `src/plugin/` → `npm run build` → reload plugin in Figma
3. **Tool Dev:** Add to `src/tools/` → export `registerMcpTools` + `figmaHandlers`
4. **Testing:** Run relay locally on :3055 → connect MCP + plugin → test commands
5. **Release:** Tag version → `npm publish --access public` (both root and tunnel)
