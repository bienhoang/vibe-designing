# Vibe Designing: Project Overview & PDR

## Executive Summary

**Vibe Designing** ("Vibe Design meets Figma") is an open-source MCP (Model Context Protocol) server that enables AI agents (Claude, Cursor, etc.) to design directly in Figma through natural conversation. It bridges the gap between AI reasoning capabilities and professional design tools by providing a comprehensive API of 50+ Figma design operations.

## Vision & Mission

**Vision:** Every designer and builder should have access to AI-powered design assistance, regardless of technical background or platform.

**Mission:** Create an open-source bridge that allows conversational AI to read, create, and modify Figma designs with the same precision and control as a human designer using the UI directly.

## Problem Statement

Current state:
- AI agents can view Figma files via REST API (read-only, limited detail)
- AI cannot modify designs without human copy-paste loops
- Design automation requires custom scripts or plugins
- Non-technical creators cannot leverage AI for design iteration

Vibe Designing solves this by:
- Providing real-time, bidirectional Figma communication
- Exposing comprehensive design operations as MCP tools
- Enabling natural language design workflows
- Supporting iterative AI-human collaboration

## Target Users

1. **AI-Assisted Designers** — Use Claude/Cursor to accelerate design workflows
2. **Design System Builders** — Automate component and token management
3. **Developers with Design Needs** — Quickly prototype UI in Figma via conversation
4. **Non-Technical Creators** — Leverage AI for professional design without Figma expertise
5. **Design Automation Tools** — Build higher-level design systems on Vibe Designing

## Core Features

### Design Creation (16 tools)
- Frame/auto-layout creation with constraints
- Shape primitives: rectangle, ellipse, line, section
- Text nodes with smart font handling
- Components and variants management
- Boolean operations (union, subtract, intersect, exclude)
- SVG imports with path to shape conversion

### Design Modification (17 tools)
- Move, resize, delete, clone nodes
- Color and stroke properties
- Corner radius, opacity, rotation
- Text content and properties (weight, size, line-height)
- Effects: shadow, blur, background blur
- Constraints and export settings
- Property binding to design variables

### Design Systems (16 tools)
- Create paint/text/effect styles with descriptions
- Create variable collections with modes
- Set variable values and bindings
- Apply styles and variables to nodes
- Query available styles and variables

### Design Querying (14 tools)
- Get node properties and CSS export
- Full-text node search by name and content
- Serialize design hierarchy as JSON
- Selection and viewport management
- Page and document navigation
- Export nodes as PNG/SVG/PDF

### Design Quality (1 tool, 10 rules)
- Lint designs for common issues
- WCAG 2.2 accessibility validation: contrast, text size, target size
- Auto-fix layout issues via linting
- Design system consistency checks

### Connection Management (4 tools)
- Ping/health checks
- Channel info and status
- Tunnel reset for reconnection

## Technical Architecture

### Communication Stack

```
Claude AI Agent
  ↓ stdio (MCP Protocol)
MCP Server (src/server/mcp.ts)
  ↓ WebSocket
Tunnel Relay (packages/tunnel/)
  ↓ WebSocket
Figma Plugin UI (ui.html, iframe)
  ↓ postMessage
Figma Plugin Code (code.ts, sandbox)
  ↓ Figma REST/Plugin API
Figma Design File
```

### Key Components

1. **MCP Server** (407 LOC) — Implements Model Context Protocol, manages channels, handles timeouts
2. **WebSocket Relay** (360 LOC) — Bridges server and plugin, one-to-one channel isolation
3. **Figma Plugin** (1,248 LOC) — UI connection panel, command dispatch, Figma API integration
4. **Tool Registry** (16 modules) — 50+ design operations with Zod validation schemas
5. **Utilities** (1,100 LOC) — Serialization, WCAG validation, text rendering

### Design Decision: Local Relay

Uses local WebSocket relay instead of direct plugin communication because:
- Figma plugin can only open specific network ports (not arbitrary)
- Relay provides clean channel isolation for multiple concurrent users
- Enables future cloud deployment without plugin changes
- Allows relay-based rate limiting and monitoring

## Requirements

### Functional Requirements

**FR1: Design Creation**
- AI agent shall create frames, shapes, text, components via MCP tools
- All operations shall execute within Figma and reflect immediately
- Each tool shall have precise parameter schemas with coercion for AI input

**FR2: Design Modification**
- AI agent shall modify properties: position, size, color, effects, text
- Batch operations shall update 100+ nodes without timeout
- All operations shall support undo/redo via Figma native stack

**FR3: Design Querying**
- AI agent shall read design hierarchy, styles, variables, metadata
- Serialization shall include 200-node budget (configurable)
- Search shall support full-text and property filters

**FR4: Design Systems**
- AI agent shall create and manage design tokens (styles, variables)
- Variable bindings shall work across all applicable properties
- Modes shall enable multi-variant design systems

**FR5: Design Quality**
- AI agent shall lint designs for 8 design + 2 WCAG rules
- Auto-fix shall resolve layout issues automatically
- Linting shall run on any selection or full document

**FR6: Error Recovery**
- Plugin shall auto-reconnect on network failure
- MCP server shall handle channel occupancy gracefully
- Operations shall timeout after 30 seconds (extendable via progress_update)

### Non-Functional Requirements

**NFR1: Performance**
- Response latency: <1s for single-node operations, <5s for batch (100+ nodes)
- Throughput: Support 10+ concurrent MCP connections via relay
- Memory: Relay <50MB, plugin <100MB footprint

**NFR2: Reliability**
- Uptime: 99.9% for relay and plugin
- Error rate: <0.1% failed operations (valid schemas)
- Data integrity: No design loss on network failure (operations atomic)

**NFR3: Security**
- Network: WebSocket over localhost only (prevent remote access)
- Auth: Optional token validation per channel
- Sandbox: Plugin code runs in Figma sandbox (isolated from main thread)

**NFR4: Compatibility**
- Figma: Editor + FigJam
- Node.js: 18.0+ (using ESNext modules)
- AI Models: Optimized for Claude Opus 4.6 (GPT models supported but less reliable)
- Browsers: No browser dependency (CLI-only)

**NFR5: Code Quality**
- Coverage: Tool registration 100% testable, utilities 90%+ covered
- Linting: No errors or warnings
- Documentation: Every tool has MCP schema description

**NFR6: Accessibility**
- Plugin UI: WCAG 2.1 AA compliant
- Design Linting: Enforces WCAG 2.2 AA in created designs
- Keyboard: All UI controls keyboard accessible

## Success Metrics

1. **Adoption:** 1,000+ GitHub stars, 500+ active users within 12 months
2. **Reliability:** <0.1% operation failure rate
3. **Performance:** p95 latency <2s for single-node operations
4. **Community:** 50+ contributions, 100+ discussions in first year
5. **Capability:** All Figma design operations supported via MCP
6. **Documentation:** Zero unanswered GitHub issues on setup

## Implementation Scope

### Phase 1: MVP (Completed)
- MCP server with WebSocket relay
- 50+ core design tools (creation, modification, querying, styles, variables)
- Figma plugin UI with connection panel
- Design linting (8 design rules + 2 WCAG rules)
- Zero-download setup ([README: NPM Setup](../README.md#option-1-npm-zero-download))

### Phase 2: Enhancements (Future)
- Collaborative design (multiple users via relay)
- Design asset library integration
- Custom token naming conventions
- Advanced search (regex, properties)
- Performance profiling and optimization

### Phase 3: Ecosystem (Future)
- Official integrations: Claude Projects, Cursor IDE
- Community plugins and tool packs
- Design spec generation from code
- CI/CD pipeline for design automation

## Technical Constraints

1. **Plugin Sandbox:** Code runs in isolated Figma sandbox (no direct DOM access)
2. **Network Ports:** Plugin can only access :3055-:3058 (hardcoded in manifest)
3. **Message Size:** MCP responses capped at 50KB (design serialization limit)
4. **Timeout:** Operations timeout at 30s (extendable via progress_update)
5. **Figma Limits:** Rate limits per document and per team apply (external constraint)

## Development Status

**Current Version:** 0.1.1

**Completed:**
- MCP server and relay infrastructure
- 50+ design tools across all categories
- Plugin UI with connection management
- Design linting with auto-fix
- Documentation (setup guides, tool reference)

**Known Limitations:**
- No collaborative mode (one user per channel)
- No cloud deployment (localhost relay only)
- No plugin auto-update (manual reload required)

**Next Priorities:**
- Tool documentation and examples
- Community feedback integration
- Performance profiling and optimization
- Official IDE integrations

## Project Links

- **Repository:** https://github.com/bienhoang/vibe-designing
- **npm:** @bienhoang/vibe-designing (MCP server), @bienhoang/vibe-designing-tunnel (relay)
- **Discord:** https://discord.gg/4XTedZdwV6
- **Demo:** https://youtu.be/AltDYHHZrcY

## License

MIT (Open source, commercial use permitted)

## Contact

**Organization:** bienhoang (https://github.com/bienhoang)
**Mission:** Bridging creators and technology

---

## Appendix: Tool Categories Summary

| Category | Count | Key Tools |
|----------|-------|-----------|
| Creation | 16 | create_frame, create_component, create_text, create_shape variants |
| Modification | 17 | move_node, resize_node, set_fill_color, set_text_content |
| Styling | 16 | create_paint_style, create_variable_collection, set_variable_binding |
| Querying | 14 | get_node_info, search_nodes, get_selection, get_document_info |
| Quality | 1 | lint_node (with 10 sub-rules) |
| Support | 4 | ping, channel_info, reset_tunnel, get_available_fonts |
| MCP Prompts | 4 | System prompts for AI agents |
| **Total** | **50+** | |
