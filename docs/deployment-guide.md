# Vibe Designing Deployment Guide

## Quick Start

Choose your path:

| Method | Time | Complexity | For |
|--------|------|-----------|-----|
| **CARRYME** | 5 min | Low | Just use it, no installation |
| **DRAGME** | 15 min | Medium | Build from source, full control |
| **Docker** | 10 min | Medium | Server deployment, cloud-ready |

## Option 1: CARRYME (Zero-Download Setup)

### Prerequisites
- Node.js 18+ installed
- npm or pnpm
- Figma account (free tier OK)
- Claude or Cursor IDE with MCP support

### Steps

#### 1. Install Figma Plugin

1. Open Figma → **Plugins** → **Development** → **Create new plugin**
2. Choose **Link existing plugin** → **Manifest URL**
3. Enter: `https://raw.githubusercontent.com/bienhoang/vibe-designing/refs/heads/main/src/plugin/manifest.json`
4. Plugin installs instantly

#### 2. Start MCP Server (Relay Auto-Starts)

```bash
npx @bienhoang/vibe-designing
```

Output:
```
MCP Server listening on stdio
Tunnel embedded and listening on ws://localhost:3055
Channels endpoint: http://localhost:3055/channels
```

**Keep this terminal open.** The relay auto-starts on first available port (3055-3058, configurable via `VIBE_DESIGNING_PORT`).
Relay is now **embedded in the MCP server** — no separate process needed (v0.2.0+).

#### 3. Configure MCP in Claude Desktop

Create/edit `~/.claude/claude.json`:

```json
{
  "mcpServers": {
    "vibe-designing": {
      "command": "npx",
      "args": ["@bienhoang/vibe-designing"],
      "env": {
        "VIBE_DESIGNING_TUNNEL_URL": "ws://localhost:3055",
        "VIBE_DESIGNING_CHANNEL": "my-design"
      }
    }
  }
}
```

#### 4. Configure MCP in Cursor IDE

Create `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "vibe-designing": {
      "command": "npx",
      "args": ["@bienhoang/vibe-designing"],
      "env": {
        "VIBE_DESIGNING_TUNNEL_URL": "ws://localhost:3055",
        "VIBE_DESIGNING_CHANNEL": "my-design"
      }
    }
  }
}
```

#### 5. Connect Plugin to Relay

In Figma, run **Vibe Designing** plugin → **Connection Panel**:
- Paste connection string: `ws://localhost:3055?channel=my-design`
- Click **Connect**

Expected states:
- 🟢 **Connected** — Ready to design
- 🟡 **Connecting...** — Still establishing
- 🔴 **Disconnected** — Check relay is running

#### 6. Test Connection

In Claude/Cursor, ask:
```
What fonts are available in Figma?
```

Should see font list. If error, check:
- Relay running? (`npx @bienhoang/vibe-designing-tunnel`)
- Plugin connected? (Green dot in Figma)
- MCP configured? (claude.json or .cursor/mcp.json)

---

## Option 2: DRAGME (Build from Source)

### Prerequisites
- Node.js 18+
- Git
- Figma account
- 15 minutes

### Steps

#### 1. Clone Repository

```bash
git clone https://github.com/bienhoang/vibe-designing.git
cd vibe-designing
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Build Project

```bash
npm run build
```

Output directories:
```
dist/
  └── mcp.js          # MCP server executable
plugin/
  ├── code.js         # Plugin code
  ├── ui.html         # Plugin UI
  └── manifest.json   # Plugin declaration
```

#### 4. Install Figma Plugin (Local)

In Figma → **Plugins** → **Development** → **Link existing plugin**:

Choose **Manifest file** → Browse to `vibe-designing/plugin/manifest.json`

#### 5. Start MCP Server (Relay Auto-Starts)

```bash
npm run dev
# or with custom port:
VIBE_DESIGNING_PORT=3055 npm run dev
```

The MCP server is now running with embedded relay and will accept connections from Claude/Cursor.
Relay auto-starts on first available port (3055-3058) — no separate tunnel process needed (v0.2.0+).

#### 6. Configure AI IDE (same as CARRYME steps 3-4)

#### 7. Connect Plugin (same as CARRYME step 5)

#### 8. Test (same as CARRYME step 6)

---

## Option 3: Docker Deployment

### Quick Deploy (Relay Standalone)

```bash
docker run -d \
  --name vibe-designing-relay \
  -p 3055:3055 \
  ghcr.io/bienhoang/vibe-designing:latest \
  node dist/tunnel.js
```

### Build Custom Image

```bash
# Clone repo
git clone https://github.com/bienhoang/vibe-designing.git
cd vibe-designing

# Build image
docker build -t my-vibe-designing:latest .

# Run relay standalone
docker run -d \
  --name vibe-designing-relay \
  -p 3055:3055 \
  my-vibe-designing:latest \
  node dist/tunnel.js
```

**Note:** Uses `dist/tunnel.js` (from `src/server/tunnel-standalone.ts`) for standalone relay.
MCP server with embedded relay available via: `node dist/mcp.js` (auto-starts relay on startup)

### Environment Variables

```bash
docker run -d \
  --name vibe-designing-relay \
  -p 3055:3055 \
  -e VIBE_DESIGNING_PORT=3055 \
  -e VIBE_DESIGNING_DEBUG=true \
  ghcr.io/bienhoang/vibe-designing:latest
```

### Health Check

```bash
# Check relay status
curl http://localhost:3055/channels

# Should return active channels list
```

### Docker Compose

```yaml
version: "3.8"

services:
  vibe-designing:
    image: ghcr.io/bienhoang/vibe-designing:latest
    ports:
      - "3055:3055"
    environment:
      VIBE_DESIGNING_PORT: 3055
      VIBE_DESIGNING_DEBUG: "false"
    restart: unless-stopped
    command: node dist/tunnel.js
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3055/channels"]
      interval: 30s
      timeout: 10s
      retries: 3
```

Run with:
```bash
docker-compose up -d
```

**Note:** Simplified to single relay service (v0.2.0+). MCP server runs locally with auto-embedded relay.

---

## MCP Configuration Reference

### Environment Variables

**MCP Server:**

| Variable | Default | Purpose |
|----------|---------|---------|
| `VIBE_DESIGNING_TUNNEL_URL` | `ws://localhost:3055` | Relay address |
| `VIBE_DESIGNING_CHANNEL` | `default` | Channel name for isolation |
| `VIBE_DESIGNING_TIMEOUT` | `30000` | Request timeout (ms) |
| `VIBE_DESIGNING_DEBUG` | `false` | Verbose logging |

**Tunnel Relay:**

| Variable | Default | Purpose |
|----------|---------|---------|
| `VIBE_DESIGNING_PORT` | `3055` | WebSocket server port |
| `VIBE_DESIGNING_DEBUG` | `false` | Verbose logging |
| `VIBE_DESIGNING_HEARTBEAT` | `15000` | Ping interval (ms) |

### Claude Desktop Config

**Location:** `~/.claude/claude.json`

```json
{
  "mcpServers": {
    "vibe-designing": {
      "command": "npx",
      "args": ["@bienhoang/vibe-designing"],
      "env": {
        "VIBE_DESIGNING_TUNNEL_URL": "ws://localhost:3055",
        "VIBE_DESIGNING_CHANNEL": "my-design"
      }
    },
    "vibe-designing-dev": {
      "command": "node",
      "args": ["/path/to/vibe-designing/dist/mcp.js"],
      "env": {
        "VIBE_DESIGNING_TUNNEL_URL": "ws://localhost:3055",
        "VIBE_DESIGNING_CHANNEL": "dev"
      }
    }
  }
}
```

Restart Claude Desktop for changes to take effect.

### Cursor IDE Config

**Location:** `.cursor/mcp.json` or `.vscode/settings.json`

```json
{
  "codemodels.experimental.mcpServers": {
    "vibe-designing": {
      "command": "npx",
      "args": ["@bienhoang/vibe-designing"],
      "env": {
        "VIBE_DESIGNING_TUNNEL_URL": "ws://localhost:3055",
        "VIBE_DESIGNING_CHANNEL": "my-design"
      }
    }
  }
}
```

### Remote Tunnel (Cloud Deployment)

If relay runs on cloud server:

```json
{
  "mcpServers": {
    "vibe-designing": {
      "command": "npx",
      "args": ["@bienhoang/vibe-designing"],
      "env": {
        "VIBE_DESIGNING_TUNNEL_URL": "wss://relay.example.com",
        "VIBE_DESIGNING_CHANNEL": "my-design"
      }
    }
  }
}
```

**Note:** For cloud, use `wss://` (WebSocket Secure) and set up TLS termination.

---

## Troubleshooting

### Plugin Won't Connect

**Symptom:** Red dot in Figma plugin, "Connection refused"

**Checks:**
1. Is MCP server running?
   ```bash
   npx @bienhoang/vibe-designing
   # Should show: "Tunnel embedded and listening on ws://localhost:3055..."
   ```

2. Is port 3055-3058 free?
   ```bash
   lsof -i :3055  # macOS/Linux
   netstat -ano | findstr :3055  # Windows
   ```

3. Is connection string correct?
   ```
   ws://localhost:3055?channel=my-design
   ```

4. Firewall blocking?
   - Check system firewall allows localhost:3055-3058

**Fix:**
```bash
# Kill any process on 3055
kill -9 $(lsof -ti :3055)

# Restart MCP server (relay auto-starts)
npx @bienhoang/vibe-designing
```

### MCP Server Not Found

**Symptom:** Claude/Cursor says "vibe-designing MCP server not found"

**Checks:**
1. Is MCP configured?
   ```bash
   cat ~/.claude/claude.json  # or .cursor/mcp.json
   ```

2. Correct path?
   ```bash
   which npx
   npx @bienhoang/vibe-designing --help
   ```

3. Restart IDE?
   - Close and reopen Claude Desktop or Cursor

**Fix:**
```bash
# Verify installation
npm list -g @bienhoang/vibe-designing

# Reinstall if needed
npm install -g @bienhoang/vibe-designing

# Test directly
npx @bienhoang/vibe-designing
```

### Timeout Errors

**Symptom:** "Operation timeout (30s)" or "Connection timeout"

**Causes:**
- Relay not running
- Network latency
- Large operation (100+ nodes)

**Fixes:**
1. Start MCP server (relay auto-starts):
   ```bash
   npx @bienhoang/vibe-designing
   ```

2. For large operations, use progress:
   ```
   Let me update 500 nodes. I'll do this in batches of 50
   with progress updates between.
   ```

3. Increase timeout in MCP config:
   ```json
   {
     "env": {
       "VIBE_DESIGNING_TIMEOUT": "60000"
     }
   }
   ```

### Plugin Commands Not Working

**Symptom:** "Command failed" in Figma UI

**Checks:**
1. Is design file open?
2. Is MCP server running?
3. Check plugin console:
   - Figma → Plugins → Development → Show console

**Common Errors:**
- "Node not found" — Node ID invalid or doesn't exist
- "Operation not supported" — Node type doesn't support property
- "Figma API error" — Figma temporary issue, retry

### WebSocket Connection Drops

**Symptom:** Random disconnects, "WebSocket close"

**Causes:**
- Network interruption
- Relay crashed
- Figma plugin reloaded

**Fixes:**
1. Check relay status:
   ```bash
   curl http://localhost:3055/channels
   ```

2. Restart relay:
   ```bash
   npm run tunnel
   ```

3. Reconnect plugin in Figma:
   - Run Vibe Designing plugin
   - Click Disconnect
   - Click Connect
   - Reconnect string: `ws://localhost:3055?channel=my-design`

4. Check firewall/antivirus not blocking WebSocket

### Large Design Performance

**Symptom:** Slow operations on 100+ node designs

**Causes:**
- Serialization budget exceeded
- Network latency
- Figma API throttling

**Fixes:**
1. Use targeted selection:
   ```
   Instead of: "Update all nodes"
   Try: "Update 10 frames in Section A"
   ```

2. Batch operations:
   ```
   Update 50 nodes now, then 50 more in next call
   ```

3. Reduce serialization depth:
   ```
   Tell MCP to only serialize 1 level deep, not full hierarchy
   ```

---

## Advanced Configuration

### Multi-Channel Setup

Run multiple MCP instances with different channels:

```bash
# Terminal 1: Relay (one for all)
npx @bienhoang/vibe-designing-tunnel

# Terminal 2: Design File A
VIBE_DESIGNING_CHANNEL=design-a npx @bienhoang/vibe-designing

# Terminal 3: Design File B
VIBE_DESIGNING_CHANNEL=design-b npx @bienhoang/vibe-designing
```

Each MCP connects to same relay but different channel.

### Custom Relay Port

```bash
VIBE_DESIGNING_PORT=3056 npx @bienhoang/vibe-designing-tunnel
```

Then configure MCP:
```json
{
  "env": {
    "VIBE_DESIGNING_TUNNEL_URL": "ws://localhost:3056"
  }
}
```

### Debug Logging

Enable verbose logs:

```bash
# Relay
VIBE_DESIGNING_DEBUG=true npx @bienhoang/vibe-designing-tunnel

# MCP Server
VIBE_DESIGNING_DEBUG=true npx @bienhoang/vibe-designing
```

Logs appear in terminal with:
- `[MCP]` prefix
- `[RELAY]` prefix
- `[PLUGIN]` prefix (in Figma console)

### Health Check Endpoint

```bash
# List active channels
curl http://localhost:3055/channels

# Response:
# {
#   "channels": ["my-design", "design-a"],
#   "timestamp": "2026-03-01T12:00:00Z"
# }
```

### Reset Channel

If plugin gets stuck:

```bash
# Force reset channel
curl -X DELETE http://localhost:3055/channels/my-design

# Effect: Disconnects both MCP and plugin, clears state
```

---

## Security Considerations

### Localhost-Only (Default)

- Relay only accepts localhost connections
- No remote access unless explicitly configured
- Safe for local development

### Network Access

**Plugin manifest restricts to:**
```json
"networkAccess": {
  "allowedDomains": ["localhost:3055-3058"]
}
```

### Cloud Deployment

For cloud relay, add security layer:

1. **TLS/SSL:** Use `wss://` (encrypted WebSocket)
   ```bash
   # Behind nginx with TLS termination
   server {
     listen 443 ssl;
     location / {
       proxy_pass http://localhost:3055;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
     }
   }
   ```

2. **Authentication:** Optional token validation
   ```json
   {
     "env": {
       "VIBE_DESIGNING_RELAY_TOKEN": "secret-token-here"
     }
   }
   ```

3. **Rate Limiting:** Implement in reverse proxy
   ```nginx
   limit_req_zone $remote_addr zone=design:10m rate=10r/s;
   limit_req zone=design burst=20;
   ```

### Data Privacy

- No cloud storage of designs (stays on user machine)
- WebSocket traffic unencrypted locally (safe, isolated network)
- Optional logging for debugging (disable in production)

---

## Performance Tuning

### For Large Designs (1000+ nodes)

```bash
# Increase timeout
VIBE_DESIGNING_TIMEOUT=60000 npx @bienhoang/vibe-designing

# Reduce serialization budget
export VIBE_DESIGNING_NODE_LIMIT=100

# Batch operations
# Ask AI to work on sections, not entire design
```

### For Many Concurrent Users

```bash
# Relay can handle 100+ channels
VIBE_DESIGNING_PORT=3055 npx @bienhoang/vibe-designing-tunnel

# Monitor resource usage
top  # or Task Manager
```

### Network Optimization

**Local network (0ms latency):** Default settings optimal

**Remote network (100+ms latency):**
```bash
# Increase heartbeat interval
VIBE_DESIGNING_HEARTBEAT=30000 npx @bienhoang/vibe-designing-tunnel

# Batch small commands together
# Instead of 10 separate calls, send as one batch
```

---

## Monitoring & Maintenance

### Logs to Watch

```bash
# Check for errors
npx @bienhoang/vibe-designing-tunnel 2>&1 | grep -i error

# Monitor active channels
curl http://localhost:3055/channels | jq .

# Watch heartbeat (every 15s by default)
tail -f /var/log/vibe-designing.log | grep ping
```

### Health Checks (for automation)

```bash
#!/bin/bash
# Check relay health

curl -f http://localhost:3055/channels > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "Relay healthy"
  exit 0
else
  echo "Relay unhealthy"
  exit 1
fi
```

### Update Procedure

```bash
# For npm install (CARRYME)
npm install -g @bienhoang/vibe-designing@latest

# For source build (DRAGME)
git pull
npm install
npm run build

# No downtime migration:
# Stop one relay → Update → Start
```

---

## Support

- **Issues:** https://github.com/bienhoang/vibe-designing/issues
- **Discord:** https://discord.gg/4XTedZdwV6
- **Docs:** https://github.com/bienhoang/vibe-designing/docs

---

**Last Updated:** 2026-03-02
**Vibe Designing Version:** 0.2.0
