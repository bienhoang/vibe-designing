# Changelog

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), adhering to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-03-02

### Added

- One-line installer: `curl -fsSL .../setup.sh | bash` downloads plugin + auto-configures MCP
- Auto-connect: MCP server auto-joins default channel on first tool call (no manual `join_channel` needed)
- `setup.sh` detects and configures Claude Code, Cursor, and Windsurf automatically

### Changed

- Plugin UI switched from dark to light theme using Figma's official CSS variables (`--figma-color-*`)
- Plugin UI font sizes and input heights aligned to Figma design system (12px body, 32px inputs)
- `join_channel` no longer required as first step — kept for custom channel names only
- README simplified: curl-first install, auto-connect flow, manual config in collapsible `<details>`
- Plugin version bumped to 0.3.0

### Fixed

- `.gitignore` `plugin/` → `/plugin/` so `src/plugin/` source files are tracked in git

## [0.2.0] - 2026-03-02

### Added

- Embedded WebSocket relay into MCP server — no separate tunnel process needed
- Port auto-scanning (3055–3058) with OS-assigned fallback when all busy
- CLI `--setup` command (`npx @bienhoang/vibe-designing --setup`) for plugin download
- Prebuild codegen script for auto-generated barrel registries (`scripts/generate-registries.ts`)
- Declarative `ToolDefinition[]` pattern replacing imperative `registerMcpTools()`
- Shared `resolvePaintStyle` and `getFontStyle` helpers (`src/tools/helpers.ts`)
- Standalone tunnel entry point (`src/server/tunnel-standalone.ts`)
- Port scanner module (`src/server/port-scanner.ts`)
- Tool type definitions (`src/tools/types.ts`)

### Changed

- Refactored all tool files from imperative registration to declarative `ToolDefinition[]` exports
- Updated all docs (README, architecture, code standards, deployment guide, roadmap) for v0.2.0
- `export_node_as_image` returns proper MCP image content format
- Dockerfile updated for new build architecture

### Fixed

- Redirect security: added max depth limit, URL validation, `spawnSync` hardening
- Removed CORS wildcard from tunnel HTTP server (localhost-only)
- Hardened tunnel security with stricter origin checks

### Removed

- `packages/tunnel/` standalone tunnel package (functionality embedded in MCP server)
- `src/tools/figma-registry.ts` and `src/tools/mcp-registry.ts` (replaced by codegen)
- `src/utils/figma-helpers.ts` (consolidated into `src/tools/helpers.ts`)

## [0.1.0] - 2026-03-01

### Added

- Initial release
- 50+ design tools across creation, modification, querying, design systems, and quality
- MCP server with stdio transport for AI agent integration
- Figma plugin with WebSocket connection
- Tool categories: Create (16), Modify (17), Design Systems (16), Query (14), Quality (1)
- WCAG 2.2 linting and auto-fix
- Design token and variable management
- Component and style management
- SVG import and boolean operations

[0.3.0]: https://github.com/bienhoang/vibe-designing/compare/v0.2.0...main
[0.2.0]: https://github.com/bienhoang/vibe-designing/compare/c6538b5...v0.2.0
[0.1.0]: https://github.com/bienhoang/vibe-designing/releases/tag/c6538b5
