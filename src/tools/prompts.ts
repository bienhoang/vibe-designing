import { join } from "path";
import type { McpServer } from "./types";
import type { ToolDefinition } from "./types";

// Resolve bundled ui-ux-pro-max script path
// __dirname in bundled CJS = dist/, so scripts are at dist/libs/ui-ux-pro-max/scripts/
const SEARCH_SCRIPT = typeof __dirname !== "undefined"
  ? join(__dirname, "libs", "ui-ux-pro-max", "scripts", "search.py")
  : join(process.cwd(), "dist", "libs", "ui-ux-pro-max", "scripts", "search.py");

/** Build the design workflow text (shared between prompt and tool) */
function getDesignWorkflowText(): string {
  return `# Design Workflow — AI-Powered Figma Design Creation

## Prerequisites
- Figma plugin connected (run ping() to verify)
- Python 3 installed (python3 --version)
  - macOS: brew install python3
  - Ubuntu: sudo apt install python3
  - Windows: winget install Python.Python.3.12

## Step 1: Analyze Requirements

Extract from user request:
- **Product type**: SaaS, e-commerce, portfolio, dashboard, landing page, etc.
- **Style keywords**: minimal, playful, professional, elegant, dark mode, etc.
- **Industry**: healthcare, fintech, gaming, education, beauty, etc.

## Step 2: Generate Design System (REQUIRED)

Always start with \`--design-system\` to get comprehensive recommendations with reasoning:

\`\`\`bash
python3 "${SEARCH_SCRIPT}" "<product_type> <industry> <keywords>" --design-system [-p "Project Name"]
\`\`\`

This command:
1. Searches 5 domains in parallel (product, style, color, landing, typography)
2. Applies reasoning rules from ui-reasoning.csv to select best matches
3. Returns complete design system: pattern, style, colors, typography, effects
4. Includes anti-patterns to avoid

Output formats:
\`\`\`bash
# ASCII box (default) - best for terminal
python3 "${SEARCH_SCRIPT}" "fintech crypto" --design-system
# Markdown - best for documentation
python3 "${SEARCH_SCRIPT}" "fintech crypto" --design-system -f markdown
\`\`\`

**Example:**
\`\`\`bash
python3 "${SEARCH_SCRIPT}" "beauty spa wellness service elegant" --design-system -p "Serenity Spa"
\`\`\`

## Step 3: Supplement Searches (as needed)

After design system, use domain searches for additional details:

\`\`\`bash
python3 "${SEARCH_SCRIPT}" "<keyword>" --domain <domain> [-n <max_results>]
\`\`\`

### Available Domains

| Domain | Use For | Example Keywords |
|--------|---------|------------------|
| product | Product type recommendations | SaaS, e-commerce, portfolio, healthcare, beauty |
| style | UI styles, colors, effects | glassmorphism, minimalism, dark mode, brutalism |
| typography | Font pairings, Google Fonts | elegant, playful, professional, modern |
| color | Color palettes by product type | saas, ecommerce, healthcare, beauty, fintech |
| landing | Page structure, CTA strategies | hero, hero-centric, testimonial, pricing |
| chart | Chart types, library recs | trend, comparison, timeline, funnel, pie |
| ux | Best practices, anti-patterns | animation, accessibility, z-index, loading |
| react | React/Next.js performance | waterfall, bundle, suspense, memo, cache |
| web | Web interface guidelines | aria, focus, keyboard, semantic, virtualize |
| icons | Icon recommendations | navigation, actions, status |
| prompt | AI prompts, CSS keywords | (style name) |

### Available Stacks

\`\`\`bash
python3 "${SEARCH_SCRIPT}" "<keyword>" --stack <stack>
\`\`\`

| Stack | Focus |
|-------|-------|
| html-tailwind | Tailwind utilities, responsive, a11y (DEFAULT) |
| react | State, hooks, performance, patterns |
| nextjs | SSR, routing, images, API routes |
| vue | Composition API, Pinia, Vue Router |
| svelte | Runes, stores, SvelteKit |
| swiftui | Views, State, Navigation, Animation |
| react-native | Components, Navigation, Lists |
| flutter | Widgets, State, Layout, Theming |
| shadcn | shadcn/ui components, theming, forms, patterns |

## Step 4: Figma Best Practices

**Understand Before Creating:**
- get_document_info() to see pages and current page
- get_styles() and get_local_variables() to discover existing design tokens
- Plan layout hierarchy before creating elements

**Design Tokens — Never Hardcode:**
- Colors: create_paint_style, apply via fillStyleName/strokeStyleName or fillVariableId/strokeVariableId
- Text: create_text_style, apply via textStyleName (controls font size, weight, line height)
- Effects: effectStyleName for shadow/blur styles
- Spacing: create_variable_collection + create_variable for spacing tokens
- Only use raw fillColor/fontColor for one-off values not in the design system

**Auto-Layout Everything:**
- create_frame() with layoutMode: "VERTICAL" or "HORIZONTAL" for every container
- Set itemSpacing, padding, alignment at creation time
- layoutSizingHorizontal/Vertical: "FILL" for responsive children
- Avoid absolute positioning — let auto-layout handle spacing

**Naming & Structure:**
- Descriptive semantic names for all elements
- Property=Value pattern for component variants (e.g. "Size=Small") before combine_as_variants
- No "Frame 1", "Rectangle 1" defaults

**Variable Modes:**
- set_explicit_variable_mode() to pin a frame to a specific mode (e.g. Dark)
- get_node_variables() to verify which variables are bound to a node

**Icons:**
- search_icons(query) → pick best match → create_icon(name, parentId)
- Icons are created as reusable Components, default 24x24px, use size/color params
- Common mappings:
  - Buttons: arrow-right, plus, trash-2, check, x, download, upload
  - Navigation: menu, home, chevron-left, chevron-right, search
  - Status: check-circle, alert-triangle, info, x-circle, loader
  - Forms: eye, eye-off, calendar, upload, search, filter
  - Actions: edit, copy, share, settings, log-out, refresh-cw

**Quality Gate — Lint Early and Often:**
- Run lint_node after each section to catch:
  - hardcoded-color: fills/strokes not using styles or variables
  - no-text-style: text without a text style applied
  - no-autolayout: frames with children but no auto-layout
  - default-name: nodes still named "Frame", "Rectangle", etc.
- Auto-fix: lint_fix_autolayout(), lint_fix_replace_shape_with_frame()
- Cheaper to fix during creation than after

## Step 5: Create Figma Design

Build in this order:
1. **Tokens** — paint styles, text styles, variables
2. **Frames** — page sections with auto-layout (Hero, Features, CTA, Footer)
3. **Content** — text with textStyleName + fillStyleName, images
4. **Icons** — search_icons → create_icon inside auto-layout frames
5. **Lint** — lint_node after each section, fix issues immediately

## Step 6: Quality Check

### Figma Design Checklist
- [ ] lint_node returns clean results
- [ ] All fills use paint styles or variable bindings
- [ ] All text uses text styles
- [ ] Auto-layout on all container frames
- [ ] Proper layer naming (no default names)
- [ ] Icons from Lucide via search_icons/create_icon
- [ ] Component structure for reusable elements

### Code Output Checklist (if generating code)
- [ ] No emojis used as icons (use SVG instead)
- [ ] All clickable elements have cursor-pointer
- [ ] Hover states don't cause layout shift
- [ ] Light/dark mode text has sufficient contrast (4.5:1)
- [ ] Responsive at 375px, 768px, 1024px, 1440px
- [ ] prefers-reduced-motion respected
- [ ] Form inputs have labels

## UX Rule Priority (search --domain ux for details)

| Priority | Category | Impact |
|----------|----------|--------|
| 1 | Accessibility | CRITICAL — color contrast 4.5:1, focus states, aria-labels, keyboard nav |
| 2 | Touch & Interaction | CRITICAL — 44x44px targets, cursor-pointer, loading buttons |
| 3 | Performance | HIGH — image optimization, prefers-reduced-motion |
| 4 | Layout & Responsive | HIGH — min 16px body, no horizontal scroll, z-index scale |
| 5 | Typography & Color | MEDIUM — line-height 1.5-1.75, 65-75 chars/line |
| 6 | Animation | MEDIUM — 150-300ms micro-interactions, transform/opacity only |
| 7 | Style Selection | MEDIUM — match style to product, no emoji icons |

## Example Workflow

**User:** "Làm landing page cho dịch vụ chăm sóc da chuyên nghiệp"

**Step 1 — Analyze:** Product=Beauty/Spa, Style=elegant/professional/soft, Industry=Beauty/Wellness

**Step 2 — Design System:**
\`\`\`bash
python3 "${SEARCH_SCRIPT}" "beauty spa wellness service elegant" --design-system -p "Serenity Spa"
\`\`\`

**Step 3 — Supplement:**
\`\`\`bash
python3 "${SEARCH_SCRIPT}" "animation accessibility" --domain ux
python3 "${SEARCH_SCRIPT}" "elegant luxury serif" --domain typography
\`\`\`

**Step 4 — Figma:** Create tokens → frames → content → icons → lint
**Step 5 — Quality:** Run checklist, fix lint issues

## Common Rules for Professional Figma Design

### Icons & Visual Elements
| Rule | Do | Don't |
|------|----|-------|
| No emoji icons | Use search_icons → create_icon (Lucide SVG) | Place text emojis as icon substitutes |
| Consistent sizing | All icons 24x24 default, use size param to adjust | Mix random icon sizes |
| Brand logos | Import correct SVG via create_node_from_svg | Guess or use wrong logo shapes |

### Colors & Contrast
| Rule | Do | Don't |
|------|----|-------|
| Token everything | create_paint_style, apply via fillStyleName | Hardcode hex in every fill |
| Text contrast | Primary text ≥ 4.5:1 ratio vs background | Light gray text on white backgrounds |
| Muted text | Use dedicated "text-muted" paint style | Reuse background colors for text |
| Borders | Visible border paint styles for both modes | Invisible low-opacity strokes |

### Layout & Spacing
| Rule | Do | Don't |
|------|----|-------|
| Auto-layout always | layoutMode on every container frame | Absolute-position child elements |
| Spacing tokens | create_variable for spacing (8, 16, 24, 32) | Hardcode itemSpacing values everywhere |
| Consistent widths | Same max-width across sections (1200-1440) | Different widths per section |
| Navbar spacing | Add padding around fixed nav frames | Nav flush to edges with no padding |

### Typography
| Rule | Do | Don't |
|------|----|-------|
| Text styles | create_text_style, apply via textStyleName | Set fontSize/fontFamily per text node |
| Body size | Minimum 16px for body text | Use 12-14px body text |
| Line height | 1.5-1.75x for body, 1.2x for headings | Default or 1.0 line height |
| Line length | Constrain text frames to ~600-700px width | Full-width text spanning 1440px |

## Pre-Delivery Checklist

### Figma Design Quality
- [ ] lint_node returns 0 issues
- [ ] All fills use paint styles or variable bindings (no hardcoded colors)
- [ ] All text uses text styles (no loose fontSize/fontFamily)
- [ ] Auto-layout on every container frame
- [ ] Proper semantic layer naming (no "Frame 1", "Rectangle 1")
- [ ] Icons via search_icons/create_icon (Lucide, no emoji)
- [ ] Components created for reusable elements (combine_as_variants)
- [ ] Spacing uses variables or consistent itemSpacing values
- [ ] Text contrast ≥ 4.5:1 for body, ≥ 3:1 for large text
- [ ] Responsive structure (auto-layout FILL, not fixed widths)

### Code Output Quality (if generating code alongside)
- [ ] No emojis as icons (use SVG icon library)
- [ ] cursor-pointer on all interactive elements
- [ ] Hover states use color/opacity, no layout shift
- [ ] Light/dark mode contrast sufficient
- [ ] Responsive at 375px, 768px, 1024px, 1440px
- [ ] prefers-reduced-motion respected
- [ ] Form inputs have labels, images have alt text

## Tips
1. Be specific with keywords — "healthcare SaaS dashboard" > "app"
2. Search multiple times — different keywords reveal different insights
3. Combine domains — Style + Typography + Color = complete design system
4. Always check UX — search "animation", "z-index", "accessibility"
5. Use --stack flag for implementation-specific best practices
6. Iterate — if first search doesn't match, try different keywords`;
}

// ─── MCP Tool: design_workflow ─────────────────────────────────
// Exposed as a tool so AI agents using deferred-tool discovery (ToolSearch)
// can find and call it. MCP prompts are not discoverable via ToolSearch.
export const mcpTools: ToolDefinition[] = [
  {
    name: "design_workflow",
    description: "REQUIRED before creating any new design/page/screen in Figma. Returns the end-to-end AI-powered design workflow: analyze requirements → generate design system (50+ styles, 97 palettes, 57 fonts via Python script) → create Figma tokens → build layout → lint. Call this FIRST, then follow the steps it returns. Do NOT skip this and jump to create_frame/create_text directly.",
    schema: {},
    handler: async () => ({
      content: [{ type: "text" as const, text: getDesignWorkflowText() }],
    }),
  },
];

export function registerPrompts(server: McpServer) {
  server.prompt(
    "read_design_strategy",
    "Best practices for reading and understanding Figma designs efficiently",
    () => ({
      messages: [{
        role: "assistant" as const,
        content: {
          type: "text" as const,
          text: `# Read Design Strategy — Efficiently Understanding Figma Designs

## 1. Tool Selection Matrix

Pick the right tool for the job:

| Tool | Purpose | When to Use |
|------|---------|-------------|
| \`get_selection()\` | Lightweight check — IDs, names, types only | First call: see what's selected without reading the tree |
| \`read_my_design(depth)\` | Read the selected node tree with depth control | Primary reading tool after confirming selection |
| \`get_node_info(nodeIds, depth, fields)\` | Read specific nodes by ID, with optional field whitelist | Drill into known IDs; use \`fields\` to reduce context |
| \`search_nodes(query, types)\` | Find nodes by name/type on current page | Locate nodes when you don't have IDs |
| \`scan_text_nodes(items)\` | Extract all text content from a subtree | Content audit, translation, text replacement prep |
| \`get_node_css(nodeId)\` | CSS properties for dev handoff | When user needs CSS values |
| \`export_node_as_image(nodeId)\` | Visual snapshot (PNG/JPG/SVG/PDF) | Verify layout visually, share with user |

## 2. Progressive Reading (Start Shallow, Drill Deep)

Always read in layers — never request unlimited depth on large trees:

\`\`\`
Step 1: get_selection()              → See what's selected (zero tree traversal)
Step 2: read_my_design(depth: 1)     → Top-level children (names, types, IDs)
Step 3: get_node_info(nodeIds, depth: 2) → Drill into interesting subtrees
Step 4: get_node_info(nodeIds, fields: ["fills","layoutMode"]) → Targeted property extraction
\`\`\`

**Rule:** Start at depth 0-1, then increase only for sections you need. This saves token budget and avoids truncation.

## 3. Depth Parameter Guide

Both \`read_my_design\` and \`get_node_info\` accept a \`depth\` parameter:

| Depth | Behavior | Use Case |
|-------|----------|----------|
| \`0\` | Selected/target nodes only (no children) | Quick metadata check |
| \`1\` | Direct children as stubs (id, name, type) | Survey structure |
| \`2\` | Two levels deep with full properties | Inspect a component |
| \`-1\` or omit | Unlimited (all descendants) | Small subtrees only (<50 nodes) |

## 4. Budget & Truncation Recovery

The serializer has a **200-node budget** per request. When exceeded:
- Remaining nodes become stubs: \`{ id, name, type, _truncated: true }\`
- Response includes \`_truncated: true\` and a \`_notice\` field

**Recovery strategies:**
1. **Reduce depth:** Use depth 1-2 instead of unlimited
2. **Read truncated nodes individually:** \`get_node_info(nodeIds: ["<truncated-id>"], depth: 1)\`
3. **Use field whitelist:** \`get_node_info(nodeIds, fields: ["fills","characters"])\` — returns only requested properties
4. **Search instead of traverse:** \`search_nodes(query, types)\` finds nodes without tree walking

## 5. Design Token Context

Before analyzing visual properties, load the design system:

\`\`\`
get_styles()                                    → List all paint, text, effect styles
get_local_variables(includeValues: true)        → All variables with mode values
get_local_variable_collections()                → Variable collections and modes
\`\`\`

This lets you map fills/strokes to named tokens instead of raw hex values.

## 6. Visual Verification

When text descriptions are insufficient, export an image:

\`\`\`
export_node_as_image(nodeId: "<id>", format: "PNG", scale: 0.5)
\`\`\`

**Scale guidelines:**
- Single component: scale 1.0
- Section/frame: scale 0.5-0.7
- Full page: scale 0.2-0.3

Use this to verify layout, spacing, and visual hierarchy — especially after making changes.

## 7. Key Output Fields Reference

The serializer returns these properties (when present on a node):

| Field | Meaning |
|-------|---------|
| \`id\`, \`name\`, \`type\` | Identity (always present) |
| \`parentId\`, \`parentName\` | Parent info (root level only) |
| \`layoutMode\` | "VERTICAL" or "HORIZONTAL" (auto-layout frames) |
| \`itemSpacing\`, \`padding\` | Layout spacing values |
| \`fills\`, \`strokes\` | Paint arrays with color hex, opacity, gradients |
| \`characters\` | Text content (TEXT nodes) |
| \`style\` | Font family, size, style, alignment (TEXT nodes) |
| \`effects\` | Shadows, blurs with radius/color/offset/spread |
| \`cornerRadius\` | Border radius |
| \`absoluteBoundingBox\` | Position and size {x, y, width, height} |
| \`componentId\`, \`componentName\` | Source component (INSTANCE nodes) |
| \`componentProperties\` | Variant property values (INSTANCE nodes) |
| \`visible\`, \`opacity\` | Visibility state |
| \`constraints\` | Resize constraints |
| \`children\` | Child nodes (depth-dependent) |

## 8. Common Patterns

### Describe a page layout
\`\`\`
get_selection()                          → Confirm selection
read_my_design(depth: 1)                 → Top-level sections
get_node_info(nodeIds: ["<section-id>"], depth: 2) → Drill into each section
\`\`\`

### Find all colors used
\`\`\`
get_styles()                             → Named paint styles
read_my_design(depth: 2)                 → Check fills/strokes on nodes
\`\`\`

### Read a component's structure
\`\`\`
get_node_info(nodeIds: ["<id>"], depth: -1)        → Full tree (if small)
get_node_info(nodeIds: ["<id>"], depth: 2)          → Safe for large components
\`\`\`

### Find all buttons on page
\`\`\`
search_nodes(query: "Button", types: ["INSTANCE"])  → Find button instances
get_node_info(nodeIds: [...results], depth: 1)      → Inspect structure
\`\`\`

### Extract all text content
\`\`\`
scan_text_nodes(items: [{ nodeId: "<parent-id>" }]) → All text in subtree
\`\`\`

### Compare two sections
\`\`\`
get_node_info(nodeIds: ["<id-a>","<id-b>"], depth: 2, fields: ["layoutMode","fills","itemSpacing"])
\`\`\`

## Tips
- **Always start with get_selection()** — it's free and tells you if anything is selected
- **Prefer depth 1-2** over unlimited — saves budget, avoids truncation
- **Use fields whitelist** on get_node_info when you only need specific properties
- **Load styles/variables first** if analyzing design tokens or color usage
- **Export images** for visual verification — especially for layout and spacing questions`,
        },
      }],
      description: "Best practices for reading and understanding Figma designs efficiently",
    })
  );

  server.prompt(
    "text_replacement_strategy",
    "Systematic approach for replacing text in Figma designs",
    () => ({
      messages: [{
        role: "assistant" as const,
        content: {
          type: "text" as const,
          text: `# Intelligent Text Replacement Strategy

## 1. Analyze Design & Identify Structure
- Scan text nodes to understand the overall structure of the design
- Use AI pattern recognition to identify logical groupings:
  * Tables (rows, columns, headers, cells)
  * Lists (items, headers, nested lists)
  * Card groups (similar cards with recurring text fields)
  * Forms (labels, input fields, validation text)
  * Navigation (menu items, breadcrumbs)
\`\`\`
scan_text_nodes(nodeId: "node-id")
get_node_info(nodeId: "node-id")  // optional
\`\`\`

## 2. Strategic Chunking for Complex Designs
- Divide replacement tasks into logical content chunks based on design structure
- Use one of these chunking strategies that best fits the design:
  * **Structural Chunking**: Table rows/columns, list sections, card groups
  * **Spatial Chunking**: Top-to-bottom, left-to-right in screen areas
  * **Semantic Chunking**: Content related to the same topic or functionality
  * **Component-Based Chunking**: Process similar component instances together

## 3. Progressive Replacement with Verification
- Create a safe copy of the node for text replacement
- Replace text chunk by chunk with continuous progress updates
- After each chunk is processed:
  * Export that section as a small, manageable image
  * Verify text fits properly and maintain design integrity
  * Fix issues before proceeding to the next chunk

\`\`\`
// Clone the node to create a safe copy
clone_node(nodeId: "selected-node-id", x: [new-x], y: [new-y])

// Replace text chunk by chunk
set_text_content(
  items: [
    { nodeId: "node-id-1", text: "New text 1" },
    // More nodes in this chunk...
  ]
)

// Verify chunk with small, targeted image exports
export_node_as_image(nodeId: "chunk-node-id", format: "PNG", scale: 0.5)
\`\`\`

## 4. Intelligent Handling for Table Data
- For tabular content:
  * Process one row or column at a time
  * Maintain alignment and spacing between cells
  * Consider conditional formatting based on cell content
  * Preserve header/data relationships

## 5. Smart Text Adaptation
- Adaptively handle text based on container constraints:
  * Auto-detect space constraints and adjust text length
  * Apply line breaks at appropriate linguistic points
  * Maintain text hierarchy and emphasis
  * Consider font scaling for critical content that must fit

## 6. Progressive Feedback Loop
- Establish a continuous feedback loop during replacement:
  * Real-time progress updates (0-100%)
  * Small image exports after each chunk for verification
  * Issues identified early and resolved incrementally
  * Quick adjustments applied to subsequent chunks

## 7. Final Verification & Context-Aware QA
- After all chunks are processed:
  * Export the entire design at reduced scale for final verification
  * Check for cross-chunk consistency issues
  * Verify proper text flow between different sections
  * Ensure design harmony across the full composition

## 8. Chunk-Specific Export Scale Guidelines
- Scale exports appropriately based on chunk size:
  * Small chunks (1-5 elements): scale 1.0
  * Medium chunks (6-20 elements): scale 0.7
  * Large chunks (21-50 elements): scale 0.5
  * Very large chunks (50+ elements): scale 0.3
  * Full design verification: scale 0.2

## Sample Chunking Strategy for Common Design Types

### Tables
- Process by logical rows (5-10 rows per chunk)
- Alternative: Process by column for columnar analysis
- Tip: Always include header row in first chunk for reference

### Card Lists
- Group 3-5 similar cards per chunk
- Process entire cards to maintain internal consistency
- Verify text-to-image ratio within cards after each chunk

### Forms
- Group related fields (e.g., "Personal Information", "Payment Details")
- Process labels and input fields together
- Ensure validation messages and hints are updated with their fields

### Navigation & Menus
- Process hierarchical levels together (main menu, submenu)
- Respect information architecture relationships
- Verify menu fit and alignment after replacement

## Best Practices
- **Preserve Design Intent**: Always prioritize design integrity
- **Structural Consistency**: Maintain alignment, spacing, and hierarchy
- **Visual Feedback**: Verify each chunk visually before proceeding
- **Incremental Improvement**: Learn from each chunk to improve subsequent ones
- **Balance Automation & Control**: Let AI handle repetitive replacements but maintain oversight
- **Respect Content Relationships**: Keep related content consistent across chunks

Remember that text is never just text—it's a core design element that must work harmoniously with the overall composition. This chunk-based strategy allows you to methodically transform text while maintaining design integrity.`,
        },
      }],
      description: "Systematic approach for replacing text in Figma designs",
    })
  );

  server.prompt(
    "swap_overrides_instances",
    "Guide to swap instance overrides between instances",
    () => ({
      messages: [{
        role: "assistant" as const,
        content: {
          type: "text" as const,
          text: `# Swap Component Instance Overrides

## Overview
Transfer content overrides from a source instance to target instances.

## Process

### 1. Identify Instances
- Use \`get_selection()\` to identify selected instances
- Use \`search_nodes(types: ["INSTANCE"])\` to find instances on the page

### 2. Extract Source Overrides
- \`get_instance_overrides(nodeId: "source-instance-id")\`
- Returns mainComponentId and per-child override fields (characters, fills, fontSize, etc.)

### 3. Apply to Targets
- For text overrides: use \`set_text_content\` on matching child node IDs
- For style overrides: use \`set_fill_color\`, \`apply_style_to_node\`, etc.
- Match children by name path — source and target instances share the same internal structure

### 4. Verify
- \`get_node_info(nodeId, depth: 1)\` on target instances
- \`export_node_as_image\` for visual verification`,
        },
      }],
      description: "Strategy for transferring overrides between component instances in Figma",
    })
  );

  server.prompt(
    "design_workflow",
    "End-to-end Figma design creation with bundled AI design intelligence (50+ styles, 97 palettes, 57 fonts)",
    () => ({
      messages: [{
        role: "assistant" as const,
        content: {
          type: "text" as const,
          text: getDesignWorkflowText(),
        },
      }],
      description: "End-to-end Figma design creation with bundled AI design intelligence",
    })
  );

  server.prompt(
    "design_generation_strategy",
    "Speed optimization: batch operations by type, use items[] arrays, minimize round-trips",
    () => ({
      messages: [{
        role: "assistant" as const,
        content: {
          type: "text" as const,
          text: `# Design Generation Strategy — Speed Optimization

## 1. Batching Rules

Group mutations by **operation type**, not by visual section.

**Bad** (interleaved — 6 round-trips):
\`\`\`
create_frame({name: "Card1"})
set_fill_color({items: [{nodeId: "card1", color: "#FFF"}]})
create_text({text: "Title1"})
create_frame({name: "Card2"})
set_fill_color({items: [{nodeId: "card2", color: "#FFF"}]})
create_text({text: "Title2"})
\`\`\`

**Good** (grouped — 3 round-trips):
\`\`\`
create_frame({name: "Card1"})   // batch all creates
create_frame({name: "Card2"})
set_fill_color({items: [        // batch all fills
  {nodeId: "card1", color: "#FFF"},
  {nodeId: "card2", color: "#FFF"},
]})
create_text({text: "Title1"})   // batch all text
create_text({text: "Title2"})
\`\`\`

**Best** (execute_batch — 1 round-trip):
\`\`\`
execute_batch({commands: [
  {command: "create_frame", params: {name: "Card1"}},
  {command: "create_frame", params: {name: "Card2"}},
  {command: "set_fill_color", params: {items: [
    {nodeId: "$prev[0].id", color: "#FFF"},
    {nodeId: "$prev[1].id", color: "#FFF"},
  ]}},
  {command: "create_text", params: {text: "Title1", parentId: "$prev[0].id"}},
  {command: "create_text", params: {text: "Title2", parentId: "$prev[1].id"}},
]})
\`\`\`

## 2. Tools with Batch Support (items[] arrays)

Always use \`items[]\` when modifying multiple nodes:
- **Fills/Strokes**: set_fill_color, set_stroke_color, set_corner_radius, set_opacity
- **Text**: set_text_content, set_text_properties
- **Layout**: move_node, resize_node, set_constraints
- **Structure**: delete_node, clone_node, insert_child
- **Effects**: set_effects
- **Properties**: set_node_properties
- **Styles**: apply_style_to_node

## 3. Optimal Build Order

\`\`\`
1. Design tokens    → create_paint_style, create_text_style, create_variable
2. Frame structures → all create_frame calls (with auto-layout params)
3. Shape elements   → create_rectangle, create_ellipse, create_line
4. Text nodes       → all create_text calls (with textStyleName)
5. Styling          → batch set_fill_color, set_stroke_color, apply_style_to_node
6. Icons            → search_icons → create_icon
7. Lint             → lint_node per section
\`\`\`

## 4. Round-trip Minimization

- **Plan entire sections** before executing — collect all operations, then batch
- **Collect node IDs** from creation results, then batch-modify with items[]
- **Use depth: 0** or omit depth during creation for faster response
- **Only request deep snapshots** at verification points (lint, final check)
- **Use execute_batch** to send 10-50 commands in a single round-trip

## 5. Anti-patterns (Avoid)

| Anti-pattern | Fix |
|---|---|
| One tool call per node modification | Batch 5-20 items in one call |
| Requesting depth snapshot on every mutation | Omit depth during creation, snapshot at end |
| Creating then immediately modifying same node | Combine in create params (color, layout at creation) |
| Reading full tree between each operation | Only read at verification checkpoints |
| Separate calls for each section's fills | Group all fills across sections into one items[] call |
`,
        },
      }],
      description: "Speed optimization for design generation",
    })
  );
}
