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

/** Find first available port in range. Throws if all occupied. */
export async function findAvailablePort(
  ports: number[] = [3055, 3056, 3057, 3058]
): Promise<number> {
  for (const port of ports) {
    if (await isPortFree(port)) return port;
  }
  throw new Error(
    `All ports ${ports.join(", ")} are occupied. ` +
      `Free one or specify --port=XXXX.`
  );
}
