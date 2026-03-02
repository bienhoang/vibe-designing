import { z } from "zod";
import { execFile } from "child_process";
import { join } from "path";
import { homedir } from "os";
import { existsSync } from "fs";
import type { ToolDefinition } from "./types";

// ─── Path Detection ────────────────────────────────────────────

const SEARCH_SCRIPT_PATHS = [
  process.env.UI_UX_PROMAX_PATH
    ? join(process.env.UI_UX_PROMAX_PATH, "scripts", "search.py")
    : null,
  join(homedir(), ".claude", "skills", "ui-ux-pro-max", "scripts", "search.py"),
].filter(Boolean) as string[];

function findSearchScript(): string | null {
  for (const p of SEARCH_SCRIPT_PATHS) {
    if (existsSync(p)) return p;
  }
  return null;
}

// Try python3 first (macOS/Linux preferred), then python (Windows fallback)
async function findPython(): Promise<string | null> {
  for (const bin of ["python3", "python"]) {
    try {
      const stdout = await execPython(bin, ["--version"]);
      if (stdout.includes("Python 3")) return bin;
    } catch { /* try next candidate */ }
  }
  return null;
}

// ─── Exec Helper ───────────────────────────────────────────────

function execPython(python: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(python, args, { timeout: 15_000, maxBuffer: 1024 * 512 }, (err, stdout, stderr) => {
      if (err) {
        const msg = stderr?.trim() || err.message;
        reject(new Error(`Python error: ${msg}`));
        return;
      }
      resolve(stdout);
    });
  });
}

// ─── Error Helpers ─────────────────────────────────────────────

function notInstalled(dep: string) {
  const instructions: Record<string, string> = {
    "Python 3": "Install Python 3: https://www.python.org/downloads/\nMost macOS/Linux systems have it pre-installed. Verify with: python3 --version",
    "ui-ux-pro-max": [
      "ui-ux-pro-max not found. Install it for AI design recommendations:",
      "  git clone https://github.com/bienhoang/ui-ux-pro-max.git ~/.claude/skills/ui-ux-pro-max",
      "",
      "Or set a custom path:",
      "  export UI_UX_PROMAX_PATH=/path/to/ui-ux-pro-max",
      "",
      "Without it, you can still provide design specs manually to create Figma designs.",
    ].join("\n"),
  };

  return {
    content: [{ type: "text" as const, text: instructions[dep] || `Missing dependency: ${dep}` }],
  };
}

// ─── Tool Handler ──────────────────────────────────────────────

async function recommendDesign(params: { query: string; project_name?: string }) {
  const { query, project_name } = params;

  const python = await findPython();
  if (!python) return notInstalled("Python 3");

  const script = findSearchScript();
  if (!script) return notInstalled("ui-ux-pro-max");

  const args = [script, query, "--design-system", "-f", "markdown"];
  if (project_name) args.push("-p", project_name);

  const output = await execPython(python, args);
  return { content: [{ type: "text" as const, text: output }] };
}

// ─── Exports ───────────────────────────────────────────────────

export const mcpTools: ToolDefinition[] = [
  {
    name: "recommend_design",
    description:
      "Get AI-powered design system recommendations (colors, typography, UI style, layout patterns) from ui-ux-pro-max. " +
      "Returns a complete design system based on the query. Requires Python 3 and ui-ux-pro-max installed at " +
      "~/.claude/skills/ui-ux-pro-max/ (or set UI_UX_PROMAX_PATH env var). " +
      "Returns installation instructions if dependencies are missing.",
    schema: {
      query: z.string().max(500).describe("Design query describing the project style, e.g. 'luxury spa wellness elegant landing page'"),
      project_name: z.string().optional().describe("Optional project name for the design system output"),
    },
    handler: recommendDesign,
  },
];

export const figmaHandlers: Record<string, (params: any) => Promise<any>> = {};
