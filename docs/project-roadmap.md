# Vibe Designing Project Roadmap

## Current Status: v0.2.0 Complete

**Current Release:** v0.2.0 (March 2026)
**Status:** Architecture Enhanced, Production Ready
**Focus:** Community tools & collaborative features (Phase 2)

---

## Phase 1: MVP (✓ Completed)

### Core Infrastructure
- ✓ MCP server (stdio-based)
- ✓ WebSocket relay (one-to-one channels)
- ✓ Figma plugin (UI + code)
- ✓ Build system (tsup for dual targets)

### Design Tools (50+)
**Creation (16 tools)**
- ✓ Frame/auto-layout creation
- ✓ Shape primitives (rectangle, ellipse, line, section)
- ✓ Text node creation with smart fonts
- ✓ Component and variant creation
- ✓ Boolean operations
- ✓ SVG import

**Modification (17 tools)**
- ✓ Move, resize, delete, clone
- ✓ Color and stroke properties
- ✓ Text editing with formatting
- ✓ Effects (shadow, blur, background blur)
- ✓ Constraints and export settings

**Design Systems (16 tools)**
- ✓ Paint/text/effect styles
- ✓ Variable collections and modes
- ✓ Variable bindings
- ✓ Design token management

**Querying (14 tools)**
- ✓ Node introspection
- ✓ CSS export
- ✓ Search functionality
- ✓ Selection management
- ✓ Page navigation

**Quality (1 tool, 10 rules)**
- ✓ Design linting
- ✓ WCAG 2.2 validation
- ✓ Auto-fix layout issues

### Documentation
- ✓ Setup guides in README (NPM zero-download + source build)
- ✓ Tool reference (inline schemas)
- ✓ Troubleshooting guide

### Deployment
- ✓ npm distribution (@bienhoang/vibe-designing)
- ✓ Tunnel relay as separate package
- ✓ Docker support
- ✓ CI/CD (Dependabot)

---

## Phase 1.5: Architecture Enhancement (✓ Completed, v0.2.0)

### v0.2.0 Improvements (March 2026)
- ✓ Embedded WebSocket tunnel in MCP server
- ✓ Auto-registry codegen (tool registration automation)
- ✓ Port auto-scanning (3055-3058 availability detection)
- ✓ CLI setup command (`npx @bienhoang/vibe-designing --setup`)
- ✓ Docker standalone tunnel support
- ✓ Simplified deployment (no separate tunnel process)

**Impact:**
- Zero-install complexity (relay auto-starts with MCP)
- DX improvement: add tool → run build (auto-registers)
- Deployment simplified: single process instead of two

---

## Phase 2: Community & Polish (In Progress, 2026 Q1-Q2)

### Accessibility & Documentation
- [ ] Interactive tool documentation with examples
- [ ] Video tutorials for common workflows
- [ ] API reference with curl examples
- [ ] Component library showcase (Vibe Designing-designed designs)

### Quality Improvements
- [ ] Unit test coverage >80%
- [ ] E2E test suite (MCP server + relay + plugin)
- [ ] Performance benchmarks
- [ ] Security audit (optional penetration test)

### Community
- [ ] GitHub discussions setup
- [ ] Discord community support
- [ ] FAQ based on first 100 issues
- [ ] Contributing guide and templates

### Ecosystem
- [ ] Official Claude Projects integration
- [ ] Cursor IDE integration templates
- [ ] Plugin auto-update mechanism
- [ ] Design asset library API (read-only)

**Timeline:** Q1-Q2 2026
**Success Metrics:**
- 1,000+ GitHub stars
- 50+ community contributions
- 100+ Discord members
- <0.1% operation failure rate

---

## Phase 3: Collaborative Design (2026 Q2-Q3)

### Multi-User Support
- [ ] Real-time synchronization
- [ ] Concurrent edit conflict resolution
- [ ] Presence indicators (who's viewing/editing)
- [ ] Change notifications
- [ ] Lock management (prevent simultaneous edits)

### Relay Enhancements
- [ ] Support 10+ concurrent channels
- [ ] Message queuing for offline scenarios
- [ ] Change history/audit log
- [ ] Webhook notifications (design changed)

### Advanced Features
- [ ] Batch operations API (1000+ nodes)
- [ ] Subscription model (watch for changes)
- [ ] Design comparison (diff view)
- [ ] Comment integration

**Timeline:** Q2-Q3 2026
**Architecture Impact:**
- Relay → event broker (not just message broker)
- Plugin → change listener (not just command executor)
- MCP → subscription protocol support

---

## Phase 4: Advanced Design Systems (2026 Q3-Q4)

### Token Management
- [ ] Custom token naming conventions
- [ ] Token grouping and hierarchies
- [ ] Token analytics (usage, coverage)
- [ ] Auto-suggest token names based on design patterns

### Performance & Scale
- [ ] 10,000+ node design support
- [ ] Incremental serialization (delta updates)
- [ ] Local caching in plugin
- [ ] Connection pooling for relay

### Integration
- [ ] Design → Code (Figma to component code)
- [ ] Code → Design (sync component changes)
- [ ] Design spec generation
- [ ] Handoff format (Zeroheight, Frontify compatibility)

**Timeline:** Q3-Q4 2026
**Research Required:**
- Code generation templates
- Component code parsing
- Design spec AI generation

---

## Phase 5: Cloud & Scalability (2027)

### Cloud Deployment
- [ ] Hosted relay service (vibe-designing.cloud)
- [ ] Multi-region deployment
- [ ] Load balancing for 1000+ concurrent users
- [ ] SLA monitoring and alerts

### Enterprise Features
- [ ] Role-based access control (viewer/editor/admin)
- [ ] Team management
- [ ] Usage analytics and quotas
- [ ] Audit logging and compliance (SOC 2)

### Monetization
- [ ] Free tier: <100 designs/month
- [ ] Pro tier: Unlimited + priority support
- [ ] Enterprise: Custom deployments + dedicated support

**Timeline:** 2027
**Business Model:**
- Open-source core (always free)
- Cloud hosting as service
- Enterprise support contracts

---

## Known Limitations & Workarounds

### Current (v0.1.1)

| Limitation | Impact | Workaround | Fix Timeline |
|-----------|--------|-----------|--------------|
| Single user per channel | Can't collaborate | Use separate channels per user | Phase 3 |
| 200-node serialization budget | Large designs slow | Query specific sections | Phase 4 |
| Localhost relay only | No remote access | Run relay in same network | Phase 5 |
| No cloud deployment | Not SaaS-ready | Docker + manual infra | Phase 5 |
| Plugin manual reload | Friction on updates | Browser cache clear | Phase 2 |
| 50KB MCP response limit | Some ops return paginated | Design batching strategy | Phase 4 |

### Design API Constraints (Figma Limits)

Not our limitations but external:
- Figma rate limits: ~10 ops/second per document
- File size: Max 100MB design file
- Permissions: Must have edit access to file
- Text fonts: Limited to fonts in Figma library

---

## Feature Priority Matrix

### High Value, Low Effort (Do First)
- [x] Core 50+ tools (MVP complete)
- [ ] API documentation with examples (Phase 2)
- [ ] Unit test coverage (Phase 2)
- [ ] Community discussions (Phase 2)

### High Value, High Effort (Plan Carefully)
- [ ] Collaborative design (Phase 3)
- [ ] Cloud deployment (Phase 5)
- [ ] Enterprise features (Phase 5)

### Low Value, Low Effort (Nice-to-Have)
- [ ] Additional color formats (hex/hsl/hwb)
- [ ] More font strategies
- [ ] Plugin keyboard shortcuts

### Low Value, High Effort (Defer)
- [ ] Mobile app support
- [ ] FigJam animation support
- [ ] AI-generated design suggestions

---

## Technical Debt & Refactoring

### Current Code Health

| Area | Status | Debt Level | Impact |
|------|--------|-----------|--------|
| **MCP Server** | Stable | Low | <500ms latency |
| **Tool Registry** | Organized | Low | Easy to add tools |
| **Figma Plugin** | Functional | Medium | UI could be more modular |
| **Tests** | Minimal | High | Risky on refactor |
| **Documentation** | Baseline | Low | Covers essentials |

### Planned Refactors

**Phase 2 (2026 Q1):**
- Extract UI components from ui.html (Monaco editor for input)
- Add comprehensive test suite
- Split large tool files (lint.ts, styles.ts)

**Phase 3 (2026 Q2):**
- Redesign relay for event streaming
- Plugin → listener pattern refactor
- Message broker for change events

---

## Metrics & Success Criteria

### Adoption Metrics

| Metric | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 |
|--------|---------|---------|---------|---------|---------|
| **Stars** | 500 | 1,000 | 5,000 | 10,000 | 50,000+ |
| **Users** | 100 | 500 | 2,000 | 10,000 | 100,000+ |
| **Contributors** | 5 | 50 | 200 | 500 | 1,000+ |
| **Discord** | 100 | 500 | 2,000 | 10,000 | 50,000+ |

### Quality Metrics

| Metric | Phase 1 | Phase 2 | Phase 3+ |
|--------|---------|---------|----------|
| **Error Rate** | <1% | <0.5% | <0.1% |
| **Test Coverage** | 30% | 80%+ | 90%+ |
| **Uptime (Relay)** | 95% | 99% | 99.9% |
| **p95 Latency** | <2s | <1s | <500ms |

### Feature Completeness

| Area | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 |
|------|---------|---------|---------|---------|---------|
| **Creation** | 16/16 | 16/16 | 16/16 | 18/18 | 20/20 |
| **Modification** | 17/17 | 17/17 | 19/19 | 25/25 | 30/30 |
| **Querying** | 14/14 | 20/20 | 25/25 | 30/30 | 35/35 |
| **Systems** | 16/16 | 20/20 | 25/25 | 30/30 | 35/35 |
| **Collab** | 0/5 | 0/5 | 5/5 | 5/5 | 5/5 |

---

## Dependency Roadmap

### External Dependency Updates

**Annual Security Audits:**
- npm dependencies (weekly via Dependabot)
- @modelcontextprotocol/sdk (follows MCP releases)
- Figma plugin API (backward compatible)

**Breaking Changes to Monitor:**
- Node.js 18 → 20 (2026, still supported)
- TypeScript 5.x → 6.x (if released)
- Figma API changes (rare, with deprecation)

### Internal Dependency Chain

```
Phase 1 (MVP)
  ├─ MCP Server + Tool Registry
  ├─ WebSocket Relay
  └─ Figma Plugin

Phase 2 (Polish)
  ├─ Enhanced Testing Framework
  └─ Documentation (no code deps)

Phase 3 (Collab)
  ├─ Relay → Event Broker
  ├─ Plugin → Change Listener
  └─ Message Queue (Redis/etc)

Phase 4 (Advanced)
  ├─ Caching Layer (Redis)
  ├─ Design Index (Elasticsearch)
  └─ Analytics (optional)

Phase 5 (Cloud)
  ├─ Cloud Infra (AWS/GCP)
  ├─ Auth Service (Auth0/etc)
  ├─ Observability (Datadog/etc)
  └─ CDN (CloudFront/etc)
```

---

## Release Schedule

### v0.1.x (2026 Q1: Completed)
- ✓ 0.1.1 — MVP release
- ✓ 0.1.2 — Bug fixes, performance tuning
- ✓ 0.1.3 — Community feedback integration
- ✓ 0.1.4 — Documentation improvements

### v0.2.0 (2026 Q1: Completed)
- ✓ Embedded relay in MCP server
- ✓ Auto-registry codegen (improved DX)
- ✓ Port auto-scanning
- ✓ CLI setup command
- ✓ Simplified deployment

### v0.3.0 (2026 Q2: Quality & Community)
- Tests >80% coverage
- Enhanced UI
- Community integrations
- Advanced search

### v0.3.0 (2026 Q3: Collaboration)
- Multi-user support
- Real-time sync
- Change notifications
- Webhooks

### v0.4.0 (2026 Q4: Systems)
- Advanced token management
- 10,000+ node support
- Design → Code
- Spec generation

### v1.0.0 (2027: Stable)
- Cloud deployment
- Enterprise features
- SaaS offering
- Production SLA

---

## Community Involvement

### How to Help

**Code:**
- Pick "good first issue" labels
- Create new tools
- Add tests
- Performance optimizations

**Documentation:**
- Write tutorials
- Translate guides
- Create examples
- Fix typos

**Community:**
- Answer questions on Discord/GitHub
- Share designs created with Vibe Designing
- Report bugs with reproducible steps
- Suggest features with use cases

**Design:**
- Create component libraries
- Build design systems
- Share workflows
- Beta test new features

---

## Long-Term Vision (2027+)

### "Everyone Can Design with AI"

1. **Accessibility:** Vibe Designing lowers barrier to professional design
2. **Productivity:** Designers spend less time on repetitive work
3. **Collaboration:** AI + human creativity > either alone
4. **Ecosystem:** Vibe Designing becomes design infrastructure

### Winning Conditions

- Used by 100,000+ designers monthly
- 10,000+ open-source contributions
- Vibe Designing-designed products in production
- Industry recognition (design tools built on Vibe Designing)
- Thriving community and ecosystem

---

**Last Updated:** 2026-03-02
**Next Review:** 2026-06-01
**Maintained By:** bienhoang team

See also: [Project Overview & PDR](./project-overview-pdr.md)
