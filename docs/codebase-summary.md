# Vibe Designing Codebase Summary

## Overview

Vibe Designing is an open-source MCP (Model Context Protocol) server that bridges AI agents with Figma through natural conversation. Total codebase: ~8,200 LOC across 51 source files.

## Directory Structure

```
vibe-designing/
├── src/
│   ├── server/
│   │   └── mcp.ts             # Main MCP server (407 LOC)
│   ├── plugin/                # Figma plugin UI and code
│   │   ├── code.ts            # Plugin backend (155 LOC)
│   │   ├── ui.html            # Plugin UI and connection panel (878 LOC)
│   │   ├── manifest.json      # Plugin declaration
│   │   └── setcharacters.js   # Smart text content setter (215 LOC)
│   ├── tools/                 # Tool modules (~4,400 LOC across 16 files)
│   │   ├── mcp-registry.ts    # Central tool registration (102 LOC)
│   │   ├── figma-registry.ts  # Plugin command dispatch (flat table)
│   │   ├── schemas.ts         # Zod validation schemas (189 LOC)
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
│   │   ├── node-info.ts       # Node querying (220 LOC)
│   │   ├── selection.ts       # Selection operations (166 LOC)
│   │   ├── document.ts        # Document structure (151 LOC)
│   │   ├── lint.ts            # Design linting (759 LOC)
│   │   ├── connection.ts      # Connection helpers (34 LOC)
│   │   ├── fonts.ts           # Font management (43 LOC)
│   │   ├── helpers.ts         # Utility helpers (153 LOC)
│   │   ├── prompts.ts         # MCP prompts (237 LOC)
│   │   └── types.ts           # Shared type definitions
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
├── packages/
│   └── tunnel/                # WebSocket relay server (~360 LOC)
│       ├── src/
│       │   └── index.ts       # Relay implementation
│       ├── package.json
│       └── tsconfig.json
├── scripts/
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
- WebSocket client connecting to relay on configured port
- Channel management: join, validate, reconnect, error recovery
- Request/response with UUID tracking and 30-second timeout (extendable via progress_update)
- CLI: `vibe-designing-mcp --server <tunnel-url> --port <tunnel-port>`
- Graceful shutdown handling

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

### Tool Registry System

**mcp-registry.ts (102 LOC)** — MCP Side Registration
- Imports 16 tool modules via `registerMcpTools(server, sendCommand)`
- Each module exports: `registerMcpTools()` function + `figmaHandlers` object
- Central point for tool availability and MCP schema registration

**figma-registry.ts** — Figma Plugin Dispatch
- Flat hash table: `command → handler function`
- Aggregates handlers from all tool modules
- Used by plugin code.ts to dispatch incoming commands
- No explicit registration; generated from tool exports

### Tool Categories (50+ Tools)

| Category | Files | Count | Purpose |
|----------|-------|-------|---------|
| **Creation** | components, create-frame, create-shape, create-text | 16 tools | Create nodes, components, variants, instances, SVG imports, boolean ops |
| **Modification** | modify-node, fill-stroke, text, effects, update-frame | 17 tools | Move, resize, delete, clone, update properties, set colors, effects |
| **Styling** | styles, variables | 16 tools | Design tokens, paint/text/effect styles, variable collections & bindings |
| **Querying** | node-info, selection, document | 14 tools | Get node info, CSS export, search, selection, viewport, page management |
| **Quality** | lint | 1 tool (10 rules) | Design linting: 8 rules + 2 WCAG 2.2 rules + 2 auto-fix rules |
| **Support** | helpers, prompts, fonts, connection | 4 tools + 4 prompts | Ping, channel info, font listing, MCP system prompts |

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

### Relay Server (packages/tunnel/)

**tunnel/index.ts (360 LOC)** — WebSocket Relay
- Bridges MCP server ↔ Figma plugin communication
- One-to-one channel isolation per MCP-plugin pair
- Message types: join, message, progress_update, reset
- HTTP endpoints:
  - `GET /channels` — List active channels (debug)
  - `DELETE /channels/:name` — Force channel reset
- 15-second heartbeat interval
- Default port 3055, configurable via VIBE_DESIGNING_PORT env var
- Published as `@bienhoang/vibe-designing-tunnel` npm package

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

### Tool Implementation Pattern

Every tool module follows this structure:

```typescript
// 1. Define Zod schema
const MyToolSchema = z.object({
  param1: flexString,
  param2: flexNum,
  // ...
});

// 2. Define MCP handler
async function myTool(params: z.infer<typeof MyToolSchema>) {
  const result = await sendCommand('my_command', params);
  return mcpJson(result);
}

// 3. Define Figma handler
const figmaHandlers = {
  my_command: async (params) => {
    // Figma API calls
    return { success: true, data };
  }
};

// 4. Register with MCP
export function registerMcpTools(server, sendCommand) {
  server.tool('my_tool', MyToolSchema, (params) => myTool(params));
}

export { figmaHandlers };
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
