/** Metadata for a single icon (search result) */
export interface IconMeta {
  name: string;      // kebab-case: "arrow-right"
  tags: string[];    // searchable keywords: ["arrow", "direction"]
}

/** Contract all icon providers must implement */
export interface IconProvider {
  /** Unique provider ID: "lucide", "material", "tabler" */
  readonly id: string;
  /** Human-readable name: "Lucide Icons" */
  readonly name: string;
  /** License: "ISC", "MIT", "Apache-2.0" */
  readonly license: string;

  /** Fetch icon index from CDN, cache in memory. Called once on first use. */
  initialize(): Promise<void>;
  /** Whether initialize() has completed */
  isReady(): boolean;

  /** Search icons by query string (fuzzy match on name + tags) */
  search(query: string, limit?: number): Promise<IconMeta[]>;
  /** Fetch SVG markup for a specific icon by name */
  getSvg(name: string): Promise<string>;
  /** Return total count of available icons */
  count(): number;
}
