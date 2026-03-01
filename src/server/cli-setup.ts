import { get } from "https";
import { createWriteStream, mkdirSync, rmSync } from "fs";
import { join } from "path";
import { homedir, tmpdir } from "os";
import { spawnSync } from "child_process";

const GITHUB_API = "https://api.github.com/repos/bienhoang/vibe-designing/releases/latest";
const PLUGIN_DIR = join(homedir(), ".vibe-designing", "plugin");
const ASSET_PATTERN = /vibe-designing-plugin.*\.zip$/i;
const MAX_REDIRECTS = 5;
const SAFE_HOSTS = ["github.com", "githubusercontent.com", "objects.githubusercontent.com"];

function isSafeRedirect(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && SAFE_HOSTS.some((h) => parsed.hostname === h || parsed.hostname.endsWith("." + h));
  } catch { return false; }
}

/** Fetch JSON from HTTPS URL (follows redirects with safety limits) */
function fetchJson(url: string, remaining = MAX_REDIRECTS): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = get(url, { headers: { "User-Agent": "vibe-designing-cli" } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        const location = res.headers.location!;
        if (remaining <= 0) return reject(new Error("Too many redirects"));
        if (!isSafeRedirect(location)) return reject(new Error(`Unsafe redirect target: ${location}`));
        return fetchJson(location, remaining - 1).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`GitHub API returned ${res.statusCode}`));
      }
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error("Invalid JSON from GitHub API")); }
      });
    });
    req.on("error", reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error("GitHub API request timed out")); });
  });
}

/** Download file from URL to local path (follows redirects with safety limits) */
function downloadFile(url: string, dest: string, remaining = MAX_REDIRECTS): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest);
    const req = get(url, { headers: { "User-Agent": "vibe-designing-cli" } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        const location = res.headers.location!;
        if (remaining <= 0) return reject(new Error("Too many redirects"));
        if (!isSafeRedirect(location)) return reject(new Error(`Unsafe redirect target: ${location}`));
        return downloadFile(location, dest, remaining - 1).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        return reject(new Error(`Download failed: HTTP ${res.statusCode}`));
      }
      res.pipe(file);
      file.on("finish", () => { file.close(); resolve(); });
    });
    req.on("error", (e) => { file.close(); reject(e); });
    req.setTimeout(30000, () => { req.destroy(); reject(new Error("Download timed out")); });
  });
}

export async function runSetup(): Promise<void> {
  console.log("Fetching latest release from GitHub...");

  let release: any;
  try {
    release = await fetchJson(GITHUB_API);
  } catch (e) {
    console.error(`Failed to fetch release info: ${e instanceof Error ? e.message : e}`);
    console.error(`Manual download: https://github.com/bienhoang/vibe-designing/releases/latest`);
    process.exit(1);
  }

  const asset = release.assets?.find((a: any) => ASSET_PATTERN.test(a.name));
  if (!asset) {
    console.error(`No plugin asset found in release ${release.tag_name}.`);
    console.error(`Manual download: https://github.com/bienhoang/vibe-designing/releases/latest`);
    process.exit(1);
  }

  console.log(`Found: ${asset.name} (${(asset.size / 1024).toFixed(0)} KB)`);

  const tmpZip = join(tmpdir(), `vibe-designing-plugin-${Date.now()}.zip`);
  try {
    await downloadFile(asset.browser_download_url, tmpZip);
  } catch (e) {
    console.error(`Download failed: ${e instanceof Error ? e.message : e}`);
    console.error(`Manual download: ${asset.browser_download_url}`);
    process.exit(1);
  }

  try {
    mkdirSync(PLUGIN_DIR, { recursive: true });
    const result = spawnSync("unzip", ["-o", tmpZip, "-d", PLUGIN_DIR], { stdio: "pipe" });
    if (result.status !== 0) throw new Error("unzip failed");
  } catch {
    console.error(`Extraction failed. Is 'unzip' installed?`);
    console.error(`On macOS: unzip is built-in. On Ubuntu: sudo apt install unzip`);
    console.error(`Or manually unzip: ${tmpZip}`);
    process.exit(1);
  } finally {
    try { rmSync(tmpZip); } catch {}
  }

  console.log("");
  console.log(`Plugin installed to: ${PLUGIN_DIR}`);
  console.log("");
  console.log("Next steps:");
  console.log("  1. In Figma: Plugins > Development > Import plugin from manifest...");
  console.log(`  2. Select: ${join(PLUGIN_DIR, "manifest.json")}`);
  console.log("  3. Run the plugin from the Plugins menu");
  console.log("");
  console.log(`Version: ${release.tag_name}`);
}
