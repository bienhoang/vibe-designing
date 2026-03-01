# Vibe Designing Documentation Index

Complete documentation for the Vibe Designing project — an open-source AI-powered MCP bridge to Figma.

## Getting Started

**New to Vibe Designing?** Start here:

1. **[README.md](../README.md)** — Project overview, quick start (5 min setup)
2. **[Deployment Guide](./deployment-guide.md)** — Installation and configuration
3. Try the demo from the [README](../README.md)

## Core Documentation

### Project Understanding

- **[Project Overview & PDR](./project-overview-pdr.md)** — Vision, goals, target users, feature scope, requirements, success metrics, technical constraints, development status
- **[Project Roadmap](./project-roadmap.md)** — Current status (MVP v0.1.1), planned phases, timeline, feature priorities, success metrics

### Technical Documentation

- **[System Architecture](./system-architecture.md)** — Architecture overview, layer details, data flows, state management, error handling, concurrency model, scalability limits, security, deployment models, observability
- **[Codebase Summary](./codebase-summary.md)** — Directory structure, module responsibilities, file LOC breakdown, dependency graph, build system, key patterns, development workflow
- **[Code Standards](./code-standards.md)** — File organization, naming conventions, tool registration pattern, error handling, input validation, API response format, logging, testing, security guidelines, common patterns

## Setup & Deployment

- **[Deployment Guide](./deployment-guide.md)** — Three setup options (CARRYME/DRAGME/Docker), MCP configuration, troubleshooting, advanced configuration, monitoring

## Navigation by Role

### For Designers/Users

1. Read [README.md](../README.md) — What Vibe Designing does
2. Follow [Deployment Guide: Quick Start](./deployment-guide.md#quick-start) — Get it running
3. Check [Troubleshooting](./deployment-guide.md#troubleshooting) — If issues arise

### For Developers

1. Read [Project Overview & PDR](./project-overview-pdr.md) — Understand vision and requirements
2. Read [System Architecture](./system-architecture.md) — Learn how components interact
3. Read [Codebase Summary](./codebase-summary.md) — Understand file structure and modules
4. Read [Code Standards](./code-standards.md) — Follow conventions before coding
5. Read [Deployment Guide](./deployment-guide.md#option-2-dragme-build-from-source) — Build from source

### For DevOps/Infra Teams

1. Read [System Architecture: Deployment Models](./system-architecture.md#deployment-models)
2. Read [Deployment Guide: Docker Deployment](./deployment-guide.md#option-3-docker-deployment)
3. Read [Code Standards: Security Guidelines](./code-standards.md#security-guidelines)
4. Check [Deployment Guide: Monitoring](./deployment-guide.md#monitoring--maintenance)

### For Contributors

1. Read [Code Standards](./code-standards.md) — Especially tool registration pattern
2. Read [Codebase Summary](./codebase-summary.md) — Know where things are
3. Read [Project Roadmap](./project-roadmap.md) — See what's planned and prioritized
4. Check GitHub issues for "good first issue" labels

### For Decision Makers

1. Read [Project Overview & PDR](./project-overview-pdr.md) — Vision, goals, success metrics
2. Skim [System Architecture: Overview](./system-architecture.md#overview) — Understand technical approach
3. Review [Project Roadmap](./project-roadmap.md) — Development timeline and priorities

## Search Tips

**Looking for...**

| Need | File |
|------|------|
| Setup instructions | [Deployment Guide](./deployment-guide.md) |
| Tool reference | [Codebase Summary: Tool Categories](./codebase-summary.md#tool-categories-50-tools) |
| Code conventions | [Code Standards](./code-standards.md) |
| Architecture diagrams | [System Architecture](./system-architecture.md) |
| How to add a tool | [Code Standards: Tool Registration Pattern](./code-standards.md#tool-registration-pattern) |
| Troubleshooting | [Deployment Guide: Troubleshooting](./deployment-guide.md#troubleshooting) |
| Future plans | [Project Roadmap](./project-roadmap.md) |
| Security info | [System Architecture: Security](./system-architecture.md#security-architecture) |
| Performance tuning | [Deployment Guide: Performance Tuning](./deployment-guide.md#performance-tuning) |
| MCP config examples | [Deployment Guide: MCP Configuration](./deployment-guide.md#mcp-configuration-reference) |

## Documentation Statistics

| Document | Type | LOC | Focus |
|-----------|------|-----|-------|
| [project-overview-pdr.md](./project-overview-pdr.md) | Strategic | 420 | Vision, goals, requirements |
| [codebase-summary.md](./codebase-summary.md) | Technical | 380 | Structure, modules, tools |
| [code-standards.md](./code-standards.md) | Developer | 650 | Patterns, conventions |
| [system-architecture.md](./system-architecture.md) | Technical | 650 | Layers, flows, security |
| [deployment-guide.md](./deployment-guide.md) | Operational | 750 | Setup, config, troubleshooting |
| [project-roadmap.md](./project-roadmap.md) | Strategic | 450 | Timeline, phases, metrics |
| **Total** | | **3,300** | Complete coverage |

## Key Concepts

### The Stack

**Vibe Designing** = MCP Protocol + WebSocket Relay + Figma Plugin

1. **MCP Server** (mcp.ts, 407 LOC) — Stdio-based protocol handler
2. **Tool Registry** (16 modules, 4,400 LOC) — 50+ design operations
3. **WebSocket Relay** (tunnel/index.ts, 360 LOC) — Channel-based message broker
4. **Figma Plugin** (code.ts + ui.html, 1,248 LOC) — UI and Figma API integration
5. **Utilities** (8 modules, 1,100 LOC) — Serialization, validation, accessibility

### Tool Categories

| Category | Count | Purpose |
|----------|-------|---------|
| Creation | 16 | Create frames, components, text, shapes |
| Modification | 17 | Edit properties, move, resize, delete |
| Design Systems | 16 | Manage styles, variables, tokens |
| Querying | 14 | Read design, search, serialize |
| Quality | 1 | Lint, validate accessibility |
| Support | 4 | Health checks, connection management |
| **Total** | **50+** | Full design workflow coverage |

See [Codebase Summary](./codebase-summary.md#tool-categories-50-tools) for detailed tool list.

### Design Token Priority

When applying visual properties:

1. **Variable binding** (design token) — highest priority
2. **Style application** (paint/text/effect styles)
3. **Direct color/property** — lowest priority

### Key Patterns

- Every tool follows: Schema → MCP handler → Plugin handler → Figma API
- Error handling: Schema validation → Command routing → Response formatting
- Progress tracking: Long operations use progress_update to prevent timeout
- Serialization: 200-node budget by default to keep responses <50KB

## Maintenance Notes

### Regular Updates Needed

- **Quarterly:** Review [Project Roadmap](./project-roadmap.md) against actual progress
- **Monthly:** Update [Codebase Summary](./codebase-summary.md) tool counts if tools added
- **On major changes:** Update [System Architecture](./system-architecture.md) and [Code Standards](./code-standards.md)
- **Before release:** Update version numbers and dates across all docs

### Document Sync

These documents must stay in sync:
- **Code Standards + Codebase Summary** — Tool counts, file locations
- **Architecture + Deployment Guide** — Port numbers, component interactions
- **Overview & PDR + Roadmap** — Feature lists, timeline

### Links to Maintain

All documentation uses relative links within `./docs/`. Update carefully:
- `[text](./other-doc.md)` — Internal documentation link
- `[text](../README.md)` — Link to project root
- `[text](../README.md#setup)` — Link to setup guides

## Contributing to Docs

**Quick edits:**
- Fix typos, clarify wording → Edit directly

**Major additions:**
- New tools added → Update [Codebase Summary](./codebase-summary.md)
- Architecture changes → Update [System Architecture](./system-architecture.md)
- Code pattern changes → Update [Code Standards](./code-standards.md)

**New documents:**
- Keep under 800 LOC per file (split if larger)
- Add link to this index
- Include table of contents for files >300 LOC

## Resources

- **GitHub:** https://github.com/bienhoang/vibe-designing
- **npm:** @bienhoang/vibe-designing (MCP server), @bienhoang/vibe-designing-tunnel (relay)
- **Discord:** https://discord.gg/4XTedZdwV6
- **Demo:** https://youtu.be/AltDYHHZrcY

## Version Info

- **Vibe Designing Version:** 0.1.1
- **Documentation Version:** 1.0 (2026-03-01)
- **Status:** Complete and current

---

**Last Updated:** 2026-03-01
**Maintained By:** bienhoang team
**Next Review:** 2026-06-01
