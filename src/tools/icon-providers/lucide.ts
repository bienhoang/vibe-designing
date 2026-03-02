import type { IconProvider, IconMeta } from "./types";

const BASE_URL = "https://cdn.jsdelivr.net/npm/lucide-static@latest";

export class LucideProvider implements IconProvider {
  readonly id = "lucide";
  readonly name = "Lucide Icons";
  readonly license = "ISC";

  private iconIndex = new Map<string, string[]>();
  private svgCache = new Map<string, string>();
  private ready = false;
  private initPromise: Promise<void> | null = null;

  isReady() { return this.ready; }
  count() { return this.iconIndex.size; }

  async initialize(): Promise<void> {
    // Deduplicate concurrent init calls
    if (this.initPromise) return this.initPromise;
    this.initPromise = this._doInit();
    return this.initPromise;
  }

  private async _doInit(): Promise<void> {
    const res = await fetch(`${BASE_URL}/tags.json`);
    if (!res.ok) throw new Error(`Failed to fetch Lucide icon index: ${res.status}`);
    const data = (await res.json()) as Record<string, string[]>;
    // Validate non-empty (known bug in v0.518.0)
    if (Object.keys(data).length === 0) throw new Error("Lucide tags.json is empty");
    for (const [name, tags] of Object.entries(data)) {
      this.iconIndex.set(name, tags);
    }
    this.ready = true;
  }

  async search(query: string, limit = 20): Promise<IconMeta[]> {
    if (!this.ready) await this.initialize();
    const q = query.toLowerCase();
    const results: { meta: IconMeta; score: number }[] = [];

    for (const [name, tags] of this.iconIndex) {
      let score = 0;
      if (name === q) score = 100;
      else if (name.startsWith(q)) score = 80;
      else if (name.includes(q)) score = 60;
      else if (tags.some(t => t === q)) score = 50;
      else if (tags.some(t => t.includes(q))) score = 30;
      else continue;

      results.push({ meta: { name, tags }, score });
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(r => r.meta);
  }

  async getSvg(name: string): Promise<string> {
    if (!/^[a-z0-9-]+$/.test(name)) throw new Error(`Invalid icon name: ${name}`);
    const cached = this.svgCache.get(name);
    if (cached) return cached;

    const res = await fetch(`${BASE_URL}/icons/${name}.svg`);
    if (!res.ok) throw new Error(`Icon '${name}' not found (HTTP ${res.status})`);
    const svg = await res.text();
    this.svgCache.set(name, svg);
    return svg;
  }
}
