# Vibe Designing System Architecture

## Overview

Vibe Designing is a distributed system connecting AI agents to Figma through three layers: MCP protocol, WebSocket relay, and Figma plugin API. Each layer is independently deployable and testable.

```
┌─────────────────────────────────────────────────────────────┐
│ AI Agent (Claude, Cursor, etc.)                             │
│ Sends: MCP tool calls via stdio                             │
└────────────────────┬────────────────────────────────────────┘
                     │ stdio (MCP Protocol)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ MCP Server (src/server/mcp.ts)                               │
│ • Stdio-based MCP server                                    │
│ • Manages 16 tool modules → 50+ MCP tools                   │
│ • WebSocket client to embedded relay                        │
│ • Request/response with UUID tracking & 30s timeout         │
└────────────────────┬────────────────────────────────────────┘
                     │ WebSocket (tcp://localhost:3055-3058)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ WebSocket Relay (src/server/tunnel.ts - EMBEDDED)           │
│ • Embedded in MCP server (v0.2.0+)                          │
│ • Auto-scans ports 3055-3058 for availability               │
│ • Channel-based message broker                              │
│ • One MCP + one plugin per channel                          │
│ • Message types: join, message, progress_update, reset      │
│ • 15s heartbeat for health checks                           │
│ • HTTP /channels (debug), DELETE for reset                  │
│ • Standalone Docker mode: src/server/tunnel-standalone.ts   │
└────────────────────┬────────────────────────────────────────┘
                     │ WebSocket
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Figma Plugin (src/plugin/)                                  │
├─────────────────┬───────────────────────┬──────────────────┤
│                 │                       │                  │
│ UI (ui.html)    │ Code (code.ts)        │ Manifest.json    │
│ • Connection    │ • Command dispatch    │ • Permissions    │
│   panel         │ • Error handling      │ • UI size        │
│ • Progress      │ • Auto-focus          │ • Network access │
│   tracking      │ • Figma API calls     │   (3055-3058)    │
│ • WebSocket     │ • Result serialization│                  │
│   client        │                       │                  │
└─────────────────┴───────────────────────┴──────────────────┘
                     │ Figma Plugin API
                     ▼
         ┌───────────────────────────┐
         │ Figma Design File         │
         │ (Frames, components,      │
         │  styles, variables, etc.) │
         └───────────────────────────┘
```

## Layer Details

### Layer 1: MCP Protocol (AI ↔ Server)

**Interface:** stdio (standard input/output)

**Protocol:** Model Context Protocol (MCP)

**Flow:**
1. AI sends: `{"jsonrpc":"2.0","method":"tools/call","params":{"name":"create_frame","arguments":{...}}}`
2. MCP server parses, validates, routes to tool handler
3. Tool handler calls `sendCommand()` to relay
4. Waits for response (30s timeout, extendable)
5. Returns: `{"jsonrpc":"2.0","result":{...}}`

**Key Properties:**
- Bidirectional: AI can stream progress via progress_update
- Stateless: Each call is independent
- Validated: Zod schemas enforce structure
- Documented: Each tool has MCP schema with descriptions

### Layer 2: WebSocket Relay (Server ↔ Plugin)

**Implementation:** Embedded in MCP server (`src/server/tunnel.ts`) — starts automatically (v0.2.0+)

**Port Auto-Scanning:** Relay tries ports 3055-3058 in order, uses first available
- If all ports busy: falls back to OS-assigned ephemeral port (port 0)
- Configurable via `VIBE_DESIGNING_PORT` env var
- Auto-starts with MCP server (no separate process)
- Standalone Docker mode: `src/server/tunnel-standalone.ts` for custom deployments

**Protocol:** Custom JSON-RPC over WebSocket

**Message Types:**

```typescript
// Client → Server
{
  type: "join",
  channel: "my-channel",
  role: "mcp" | "plugin",
  version: "0.2.0"
}

// Bidirectional
{
  type: "message",
  id: "uuid-123",
  action: "create_frame", // command name
  params: { ... },        // tool arguments
  timestamp: 1234567890
}

// Server → Client (progress)
{
  type: "progress_update",
  requestId: "uuid-123",
  message: "Updated 50/100 nodes",
  current: 50,
  total: 100
}

// Server → Client (response)
{
  type: "message",
  id: "uuid-123",
  success: true,
  data: { ... }
}

// Either → Other (heartbeat)
{
  type: "ping"
}
```

**Channel Isolation:**
- One MCP client per channel
- One Plugin per channel
- Multiple channels supported (multiple design files)
- Channels are ephemeral (cleared on disconnect)

**Health Monitoring:**
- 15-second heartbeat interval
- Auto-disconnect on 3 failed pings
- Graceful cleanup on WebSocket close

### Layer 3: Figma Plugin (Plugin ↔ API)

**Components:**

#### code.ts (Plugin Backend - Figma Sandbox)
- Receives commands from relay via WebSocket → plugin UI
- Dispatches to `figmaHandlers[command]`
- Executes Figma API operations
- Serializes results (respecting 200-node budget)
- Sends response back to relay

**Execution Model:**
- Event-driven (Figma doesn't support async operations)
- All operations are synchronous except UI callbacks
- Auto-focus after mutations (debounced 300ms, v0.4.1+) — prevents excessive focus thrashing during batch operations

#### ui.html (Plugin UI - iframe)
- WebSocket client connecting to relay
- Connection status panel (connected/disconnected/error states)
- Command input field (for debugging)
- Progress tracker with message preview
- Handles auto-reconnect with exponential backoff (1s → 10s)
- Dark theme stylesheet

#### manifest.json (Plugin Declaration)
```json
{
  "name": "Vibe Designing",
  "main": "code.js",
  "ui": "ui.html",
  "editorType": ["figma", "figjam"],
  "networkAccess": {
    "allowedDomains": ["localhost:3055", "localhost:3056", ...]
  }
}
```

**Key Restrictions:**
- Can only access localhost:3055-3058 (hardcoded by Figma for security)
- Sandbox isolation: Plugin code runs in separate context
- postMessage bridge: UI ↔ Code communication via iframe postMessage API

#### setcharacters.js (Text Font Helper)
- Three font mixing strategies for smart text rendering
- **prevail:** First available font wins
- **strict:** All fonts must exist
- **experimental:** Mix fonts with family fallbacks
- Used by `set_text_content` tool

## Data Flow Diagrams

### Create Frame Operation

```
Agent                    MCP Server              Relay              Plugin
  │                         │                      │                  │
  ├─ create_frame ───────>  │                      │                  │
  │                         │                      │                  │
  │                         ├─ validate schema     │                  │
  │                         │                      │                  │
  │                         ├─ sendCommand ───────> join/message ──> dispatch
  │                         │                      │                  │
  │                         │                      │                  ├─ get nodes
  │                         │                      │                  ├─ create frame
  │                         │                      │                  ├─ set properties
  │                         │                      │                  ├─ serialize
  │                         │                      │                  │
  │                         │                      │ <─ response ─────┤
  │                         │  <────── response ────┤                  │
  │                         │                      │                  │
  │ <──── result ────────────┤                      │                  │
```

**Timeline:**
1. Agent sends create_frame via MCP
2. MCP server validates with Zod schema
3. Calls sendCommand("create_frame", params) → relay
4. Relay routes to plugin via WebSocket
5. Plugin dispatches to figmaHandlers.create_frame
6. Handler executes Figma API: figma.createFrame()
7. Serializes result with 200-node budget
8. Sends response back through relay
9. MCP server formats as mcpJson()
10. Agent receives result

**Latency:** Typical <500ms (local WebSocket + Figma API)

### Batch Update with Progress

```
Agent                    MCP Server              Relay              Plugin
  │                         │                      │                  │
  ├─ lint_node (100) ─────> │                      │                  │
  │                         │                      │                  │
  │                         ├─ sendCommand ───────> message ────────> dispatch
  │                         │                      │                  │
  │                         │                      │                  ├─ for 100 nodes:
  │                         │                      │                  │   ├─ validate
  │                         │                      │                  │   ├─ check rules
  │                         │                      │                  │   ├─ every 10:
  │                         │                      │                  │   │   ├─ serialize
  │                         │                      │ progress ────────┤   │   └─ send
  │                         │  <─ progress ────────┤                  │   │
  │ <──── progress ────────--|                      │                  │   │
  │                         │                      │                  │   │
  │                         │                      │                  │   ├─ send final
  │                         │                      │ <─ response ─────┤
  │                         │  <────── response ────┤                  │
  │                         │                      │                  │
  │ <──── result ────────────┤                      │                  │
```

**Progress Flow:**
1. Plugin processes nodes in batches
2. Every N nodes: send progress_update with current/total
3. Relay routes progress → MCP server
4. MCP server forwards to AI via progress_update
5. AI can display status or cancel
6. Final response sent when complete

**Timeout Extension:**
- Default 30s for single operations
- Each progress_update resets timeout
- Long operations (500+ nodes) automatically extended

## State Management

### MCP Server State

```typescript
{
  // Active request tracking
  pendingRequests: Map<UUID, {
    command: string,
    params: object,
    startTime: number,
    timeout: NodeJS.Timeout
  }>,

  // WebSocket connection
  relay: WebSocket | null,
  connected: boolean,

  // Channel info
  channel: string,
  channelReady: boolean
}
```

### Relay State

```typescript
{
  // Channel → Client mapping
  channels: Map<string, {
    mcp: WebSocket,
    plugin: WebSocket,
    created: Date,
    messageCount: number
  }>,

  // Heartbeat tracking
  heartbeats: Map<WebSocket, {
    lastPing: Date,
    pendingPongs: number
  }>
}
```

### Plugin State

```typescript
{
  // Connection state
  connected: boolean,
  connecting: boolean,
  lastError: string | null,

  // Relay communication
  websocket: WebSocket | null,
  messageQueue: Array<Message>,

  // UI state
  commandHistory: string[],
  currentRequest: Message | null
}
```

## Error Handling

### Error Scenarios & Recovery

| Scenario | Detection | Recovery |
|----------|-----------|----------|
| **Network failure** | WebSocket close event | Plugin: auto-reconnect with exponential backoff |
| **Invalid schema** | Zod validation | Return mcpError with validation details |
| **Figma API error** | Try-catch in handler | Return mcpError with operation context |
| **Timeout (30s)** | Timer in MCP server | Cancel request, return mcpError |
| **Channel conflict** | ROLE_OCCUPIED in relay | Reject new client, notify via error |
| **Large response** | Response >50KB | Truncate, include pagination guidance |
| **Plugin sandbox crash** | WebSocket close + timeout | Relay detects, cleans up channel |

### Error Response Format

```typescript
{
  "success": false,
  "error": {
    "title": "Invalid Node ID",
    "details": "Node 999:999 not found in current document"
  }
}
```

## Concurrency Model

### Single-threaded Plugin

Figma plugin runs on main thread:
- All Figma API calls are synchronous
- No async/await in handlers
- Operations execute one at a time
- postMessage between UI and code is asynchronous

### Multi-request MCP Server

MCP server processes multiple requests:
- Each request gets unique UUID
- Timeout per request (not global)
- Relay multiplexes responses to correct caller
- Progress updates routed by UUID

### Race Condition Prevention

```typescript
// ✓ Good: Serial operations
for (const nodeId of nodeIds) {
  const node = figma.getNodeById(nodeId);
  if (node) node.name = newName; // Single operation
}

// ✗ Avoid: Parallel (Figma doesn't support)
// Promise.all(nodeIds.map(id => updateNode(id)));
```

## Scalability Limits

### Throughput

- **Single Relay:** ~100 concurrent channels (depends on machine)
- **Per Channel:** 1 MCP client + 1 plugin client
- **Message Rate:** ~1,000 messages/second per relay (WebSocket limit)

### Message Size

- **Input:** Typically <1KB (tool parameters)
- **Output:** Capped at 50KB per MCP response
- **Serialization:** 200 nodes by default (2-5KB per node)

### Concurrency

- **Document Operations:** One at a time (Figma plugin serial)
- **Relay Processing:** Multi-threaded (Node.js)
- **Multiple Designs:** Each design gets separate channel

### Connection Limits

- **Per Machine:** Limited by OS file descriptors (~1,000 on Linux)
- **Per Design:** One relay channel active at a time
- **Idle Timeout:** None (persistent WebSocket)

## Security Architecture

### Network Security

```
┌─────────────────────────────┐
│ AI Agent                    │
│ (usually remote)            │
└──────────────┬──────────────┘
               │ stdio (secure, same machine)
┌──────────────▼──────────────┐
│ MCP Server                  │
│ (local machine)             │
└──────────────┬──────────────┘
               │ WebSocket to localhost:3055 (local network only)
┌──────────────▼──────────────┐
│ Relay Server                │
│ (local machine)             │
└──────────────┬──────────────┘
               │ WebSocket (iframe sandbox)
┌──────────────▼──────────────┐
│ Plugin UI & Code            │
│ (Figma sandbox)             │
└──────────────┬──────────────┘
               │ Figma API (authenticated)
┌──────────────▼──────────────┐
│ Figma Design File           │
│ (cloud)                     │
└─────────────────────────────┘
```

**Security Properties:**
- AI agent isolated by stdout/stdin (no direct network access)
- MCP server trusts local relay (hardcoded to localhost)
- Relay only accepts localhost connections (configurable)
- Plugin runs in Figma sandbox (isolated from web)
- Figma API requires user authentication (handled by Figma)

### Input Validation

- Zod schemas enforce structure before execution
- Type guards prevent unsafe operations
- Node IDs validated against document
- String inputs checked for length/encoding

### Data Privacy

- No logging of sensitive data (colors, text content)
- Design data doesn't leave Figma (stays on user machine)
- WebSocket traffic unencrypted (localhost only)
- Optional: TLS if relay behind proxy

## Deployment Models

### Local Development (v0.2.0+)

```
┌─ Terminal 1 ──────────┐
│ npm run dev           │
│ MCP server + Relay    │
│ (auto-starts relay)   │
│ Listening :3055-3058  │
└───────────────────────┘

┌─ Figma ───────────────┐
│ Install plugin        │
│ Connect to localhost  │
│ Design interactively  │
└───────────────────────┘

┌─ AI IDE ──────────────┐
│ Claude/Cursor         │
│ Configure MCP server  │
│ Send design commands  │
└───────────────────────┘
```

**No separate tunnel process needed** — relay auto-starts with MCP server (v0.2.0+)

### Docker Deployment

```dockerfile
FROM node:18-slim

WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

EXPOSE 3055

CMD ["node", "dist/tunnel.js"]
```

Relay runs standalone via `dist/tunnel.js` (from `src/server/tunnel-standalone.ts`), accessible via network.

### Cloud Deployment (Future)

```
┌────────────────────────────────┐
│ Cloud (AWS/GCP/etc.)           │
│                                │
│ ┌──────────────────────────────┤
│ │ Container with Relay         │
│ │ Port 3055 exposed            │
│ │ TLS termination (nginx)      │
│ └──────────────────────────────┤
│                                │
│ ┌──────────────────────────────┤
│ │ Authentication/Rate-limiting │
│ │ (optional API gateway)       │
│ └──────────────────────────────┤
└────────────────────────────────┘
         ↑
         │ Network (encrypted TLS)
         │
    ┌─────────────────┐
    │ Plugin connects │
    │ MCP server      │
    └─────────────────┘
```

## Observability

### Metrics Worth Tracking

- **Latency:** Operation time from request to response
- **Throughput:** Operations/second per relay
- **Error Rate:** % of failed operations
- **Connection Status:** Active channels, reconnects
- **Message Size:** Input/output serialization

### Logging Points

- **MCP Server:** Tool calls, command routing, timeouts, errors
- **Relay:** Channel lifecycle, message routing, health checks
- **Plugin:** Command dispatch, Figma API results, UI events

### Health Checks

```
GET /channels → Returns active channel count
→ Returns OK if relay operational
→ Used for monitoring uptime
```

## Batch Operations (v0.4.1+)

### execute_batch Tool

The `execute_batch` tool enables efficient multi-command execution in a single round-trip:

**Features:**
- **Single API Call:** Send up to 50 commands in one request
- **Cross-command References:** Commands can reference outputs from previous commands using `$prev[N].id`
- **Atomic Semantics:** All commands fail or succeed together
- **Reduced Latency:** Typical batch operation <200ms (vs. 50 individual ops = 2.5s)

**Example:**
```json
{
  "type": "batch",
  "commands": [
    { "action": "create_frame", "params": { "name": "Group" } },
    { "action": "create_frame", "params": { "name": "Child", "parentId": "$prev[0].id" } },
    { "action": "set_fill_color", "params": { "nodeId": "$prev[1].id", "color": "#FF0000" } }
  ]
}
```

**batchHandler Options (v0.4.1+):**
- `deferSnapshot`: Skip intermediate snapshots during batch processing for faster batch operations
- Reduces serialization overhead for large operations

### Performance Impact

- **Before (v0.4.0):** 50 frame operations = ~2.5s (50 round-trips)
- **After (v0.4.1):** 50 frame operations in batch = ~200ms (1 round-trip)
- **AutoFocus debouncing:** Reduces focus overhead from ~50 calls → 1 final focus event

## Future Architecture Considerations

### Collaborative Design (Multi-user)

Current: One user per channel
Future: Multiple users reading/writing same design

Challenges:
- Conflict resolution (concurrent edits)
- Change notifications (user A updates, user B sees)
- Lock management (prevent simultaneous edits)

### Performance Optimization

- Message batching (multiple small ops in one call)
- Subscription model (plugin subscribes to changes)
- Incremental serialization (delta instead of full snapshot)
- Caching (local node cache in plugin)

### Extensibility

- Plugin SDK for custom tools
- Webhook system for design change events
- Custom variable/style namespaces
- Template marketplace

---

**Last Updated:** 2026-03-03
**Architecture Version:** 2.1 (v0.4.1, includes execute_batch and debounced autoFocus)
