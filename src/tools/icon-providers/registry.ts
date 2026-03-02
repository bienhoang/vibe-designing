import type { IconProvider } from "./types";
import { LucideProvider } from "./lucide";

class IconRegistry {
  private providers = new Map<string, IconProvider>();
  private defaultId = "lucide";

  register(provider: IconProvider) {
    this.providers.set(provider.id, provider);
  }

  async get(id?: string): Promise<IconProvider> {
    const pid = id || this.defaultId;
    const provider = this.providers.get(pid);
    if (!provider) {
      throw new Error(`Icon provider '${pid}' not found. Available: ${[...this.providers.keys()].join(", ")}`);
    }
    if (!provider.isReady()) await provider.initialize();
    return provider;
  }

  list() {
    return [...this.providers.values()].map(p => ({
      id: p.id,
      name: p.name,
      license: p.license,
      count: p.isReady() ? p.count() : null,
      ready: p.isReady(),
    }));
  }
}

// Singleton with Lucide pre-registered
export const iconRegistry = new IconRegistry();
iconRegistry.register(new LucideProvider());
