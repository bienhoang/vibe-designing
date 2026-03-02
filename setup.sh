#!/usr/bin/env bash
# Vibe Designing — one-line installer
# Usage: curl -fsSL https://raw.githubusercontent.com/bienhoang/vibe-designing/main/setup.sh | bash
set -euo pipefail

REPO="bienhoang/vibe-designing"
INSTALL_DIR="$HOME/vibe-designing"
API_URL="https://api.github.com/repos/$REPO/releases/latest"
MCP_ENTRY="{\"command\":\"node\",\"args\":[\"$INSTALL_DIR/dist/mcp.cjs\"]}"

# --- Step 1: Download release ---
echo "Fetching latest release..."
RELEASE_JSON=$(curl -fsSL -H "User-Agent: vibe-designing-setup" "$API_URL")

ZIP_URL=$(echo "$RELEASE_JSON" | grep -o '"browser_download_url":\s*"[^"]*\.zip"' | head -1 | grep -o 'https://[^"]*')
TAG=$(echo "$RELEASE_JSON" | grep -o '"tag_name":\s*"[^"]*"' | head -1 | grep -o '"[^"]*"$' | tr -d '"')

if [ -z "$ZIP_URL" ]; then
  echo "Error: No zip found in release $TAG"
  echo "Manual download: https://github.com/$REPO/releases/latest"
  exit 1
fi

echo "Downloading ($TAG)..."
TMP_ZIP=$(mktemp /tmp/vibe-designing-XXXXXX.zip)
curl -fsSL -o "$TMP_ZIP" "$ZIP_URL"

mkdir -p "$INSTALL_DIR"
unzip -o "$TMP_ZIP" -d "$INSTALL_DIR" > /dev/null
rm -f "$TMP_ZIP"

echo "Installed to: $INSTALL_DIR"

# --- Step 2: Configure MCP for AI tools ---
# Inject MCP server config into detected AI tools using python3 for JSON manipulation.
configure_mcp() {
  local config_file="$1"
  local display_name="$2"

  # Create config file if it doesn't exist
  if [ ! -f "$config_file" ]; then
    mkdir -p "$(dirname "$config_file")"
    echo '{}' > "$config_file"
  fi

  # Always update MCP entry to ensure correct path
  if python3 -c "
import json
with open('$config_file') as f: d = json.load(f)
if 'mcpServers' not in d: d['mcpServers'] = {}
d['mcpServers']['Vibe Designing'] = $MCP_ENTRY
with open('$config_file', 'w') as f: json.dump(d, f, indent=2)
" 2>/dev/null; then
    echo "  $display_name: configured"
  else
    echo "  $display_name: failed (update manually)"
  fi
}

echo ""
echo "Configuring MCP server..."

# Claude Code — write to both config locations for full compatibility
configure_mcp "$HOME/.claude.json" "Claude Code (~/.claude.json)"
if [ -d "$HOME/.claude" ]; then
  configure_mcp "$HOME/.claude/settings.json" "Claude Code (~/.claude/settings.json)"
fi

# Cursor (global config)
CURSOR_CONFIG="$HOME/.cursor/mcp.json"
if command -v cursor &>/dev/null || [ -d "$HOME/.cursor" ]; then
  configure_mcp "$CURSOR_CONFIG" "Cursor"
fi

# Windsurf
WINDSURF_CONFIG="$HOME/.codeium/windsurf/mcp_config.json"
if [ -d "$HOME/.codeium/windsurf" ]; then
  configure_mcp "$WINDSURF_CONFIG" "Windsurf"
fi

# --- Step 3: Install Claude Code instructions for tool discovery ---
# Deferred tools require ToolSearch — this instruction ensures the model discovers them.
if [ -d "$HOME/.claude" ]; then
  mkdir -p "$HOME/.claude/rules"
  cat > "$HOME/.claude/rules/vibe-designing.md" << 'INSTRUCTIONS'
# Vibe Designing — Figma MCP Tools

When the user asks to design anything in Figma, you MUST use Vibe Designing MCP tools directly.

## CRITICAL — Do NOT Do These

- Do NOT spawn ANY Agent (no ui-ux-designer, no general-purpose, no subagents) — agents cannot access MCP tools. YOU must call MCP tools directly in the main conversation.
- Do NOT call `Skill(ui-ux-pro-max)` — design intelligence is already bundled inside Vibe Designing
- Do NOT use `listMcpResources` — it cannot discover deferred tools
- Do NOT run Python scripts from `~/.claude/skills/ui-ux-pro-max/` — use the MCP `design_workflow` tool instead

## Workflow

### Step 1: Load tools via ToolSearch (REQUIRED — all tools are deferred)
- `ToolSearch` query: `"select:mcp__Vibe_Designing__ping"` → call `ping` to verify Figma connection
- `ToolSearch` query: `"select:mcp__Vibe_Designing__design_workflow"` → load design intelligence

### Step 2: Get design recommendations
- Call `design_workflow` with the design brief — it runs bundled Python scripts and returns style, colors, typography, and layout recommendations
- Use these recommendations for the design

### Step 3: Load creation tools and build in Figma
- `ToolSearch` query: `"+Vibe_Designing create"` → load creation tools
- `ToolSearch` query: `"+Vibe_Designing set"` → load modification tools
- Call MCP tools directly: `create_frame`, `create_text`, `set_fill_color`, etc.
- Load more tools as needed with ToolSearch

### Step 4: Load query tools if needed
- `ToolSearch` query: `"+Vibe_Designing get"` → load query tools
- Use `get_node_info`, `get_selection` to inspect the canvas

## All Tools (53)

**Connection (4):** `ping`, `join_channel`, `channel_info`, `reset_tunnel`
**Intelligence (1):** `design_workflow` — AI design system generator (bundled Python)
**Create (12):** `create_frame`, `create_auto_layout`, `create_text`, `create_rectangle`, `create_ellipse`, `create_line`, `create_section`, `create_node_from_svg`, `create_boolean_operation`, `create_component`, `create_component_from_node`, `create_instance_from_local`
**Modify (9):** `move_node`, `resize_node`, `delete_node`, `clone_node`, `insert_child`, `set_fill_color`, `set_stroke_color`, `set_corner_radius`, `set_opacity`
**Text (3):** `set_text_content`, `set_text_properties`, `scan_text_nodes`
**Effects (4):** `set_effects`, `set_constraints`, `set_export_settings`, `set_node_properties`
**Layout (2):** `update_frame`, `set_image_fill`
**Styles (9):** `get_styles`, `get_style_by_id`, `remove_style`, `create_paint_style`, `create_text_style`, `create_effect_style`, `apply_style_to_node`, `update_paint_style`, `update_text_style`
**Variables (12):** `create_variable_collection`, `create_variable`, `set_variable_value`, `get_local_variables`, `get_local_variable_collections`, `get_variable_by_id`, `get_variable_collection_by_id`, `set_variable_binding`, `add_mode`, `rename_mode`, `remove_mode`, `set_explicit_variable_mode`, `get_node_variables`
**Icons (3):** `search_icons`, `list_icon_sets`, `create_icon`
**Query (6):** `get_node_info`, `get_node_css`, `search_nodes`, `export_node_as_image`, `get_selection`, `read_my_design`
**Document (5):** `get_document_info`, `get_current_page`, `get_pages`, `set_current_page`, `create_page`, `rename_page`
**Components (4):** `add_component_property`, `combine_as_variants`, `get_component_by_id`, `get_instance_overrides`, `set_instance_properties`
**Selection (3):** `set_selection`, `zoom_into_view`, `set_viewport`
**Quality (3):** `lint_node`, `lint_fix_autolayout`, `lint_fix_replace_shape_with_frame`
**Fonts (1):** `get_available_fonts`
INSTRUCTIONS
  echo "  Claude Code instructions: installed"
fi

# --- Done ---
echo ""
echo "Setup complete! ($TAG)"
echo ""
echo "Next steps:"
echo "  1. In Figma: Plugins > Development > Import plugin from manifest..."
echo "  2. Select: $INSTALL_DIR/plugin/manifest.json"
echo "  3. Open your AI tool and start designing"
echo ""
echo "Test connection:"
echo '  Ask your AI: "Use the join_channel tool, then use the ping tool"'
echo '  You should get back "pong" with your Figma document name.'
