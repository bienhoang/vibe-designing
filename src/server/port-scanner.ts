import { createServer } from "net";
import { execSync } from "child_process";

/** Default port range — must match plugin manifest.json networkAccess.allowedDomains */
export const ALLOWED_PORTS = [3055, 3056, 3057, 3058];

/** Probe a single port. Resolves true if available, false if occupied. */
function isPortFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const srv = createServer();
    srv.once("error", () => resolve(false));
    srv.once("listening", () => {
      srv.close();
      resolve(true);
    });
    srv.listen(port, "127.0.0.1");
  });
}

/** Kill the process occupying a port. Returns true if killed successfully. */
function killPortHolder(port: number): boolean {
  try {
    const pid = execSync(`lsof -ti:${port}`, { encoding: "utf8" }).trim();
    if (!pid) return false;
    // Only kill if it's a vibe-designing/mcp process (avoid killing unrelated services)
    const cmdline = execSync(`ps -p ${pid.split("\n")[0]} -o command=`, { encoding: "utf8" }).trim();
    if (!cmdline.includes("mcp") && !cmdline.includes("vibe-designing") && !cmdline.includes("tunnel")) {
      console.error(`[PORT] Port ${port} held by non-MCP process (pid ${pid.split("\n")[0]}), skipping`);
      return false;
    }
    execSync(`kill ${pid.split("\n")[0]}`);
    console.error(`[PORT] Killed stale MCP process on port ${port} (pid ${pid.split("\n")[0]})`);
    return true;
  } catch {
    return false;
  }
}

/** Find first available port in the allowed range. Auto-kills stale MCP processes if needed. */
export async function findAvailablePort(
  ports: number[] = ALLOWED_PORTS
): Promise<number> {
  // First pass: find a free port
  for (const port of ports) {
    if (await isPortFree(port)) return port;
  }

  // Second pass: kill stale MCP processes and retry
  console.error(`[PORT] All ports (${ports.join(", ")}) occupied. Attempting to reclaim...`);
  for (const port of ports) {
    if (killPortHolder(port)) {
      // Brief delay for OS to release the port
      await new Promise((r) => setTimeout(r, 300));
      if (await isPortFree(port)) return port;
    }
  }

  throw new Error(
    `All ports (${ports.join(", ")}) are occupied by non-MCP processes. ` +
      `Free a port manually or use --port=<port>.`
  );
}
