import { createServer } from "net";

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

/** Find first available port in range. Falls back to OS-assigned port if all occupied. */
export async function findAvailablePort(
  ports: number[] = [3055, 3056, 3057, 3058]
): Promise<number> {
  for (const port of ports) {
    if (await isPortFree(port)) return port;
  }
  // Fallback: let OS assign a free port
  const fallback = await getOsAssignedPort();
  console.error(
    `[PORT] Ports ${ports.join(", ")} all occupied. Using OS-assigned port ${fallback}. ` +
      `Update the port in the Figma plugin UI to match.`
  );
  return fallback;
}

/** Get an OS-assigned ephemeral port */
function getOsAssignedPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.once("error", reject);
    srv.once("listening", () => {
      const addr = srv.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      srv.close(() => resolve(port));
    });
    srv.listen(0, "127.0.0.1");
  });
}
