import { defineConfig } from 'tsup';
import { copyFileSync, readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

export default defineConfig([
  // MCP Server → dist/mcp.{cjs,js}
  {
    entry: ['src/server/mcp.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    outDir: 'dist',
    target: 'node18',
    sourcemap: true,
    minify: false,
    splitting: false,
    bundle: true,
    // Bundle all deps so the release zip works without npm install
    noExternal: [/.*/],
    // Inject version at build time so it works without package.json
    define: { 'process.env.VIBE_DESIGNING_VERSION': JSON.stringify(pkg.version) },
  },
  // Standalone Tunnel → dist/tunnel.js (for Docker)
  {
    entry: { tunnel: 'src/server/tunnel-standalone.ts' },
    format: ['esm'],
    outDir: 'dist',
    target: 'node18',
    sourcemap: true,
    minify: false,
    splitting: false,
    bundle: true,
    // Bundle all deps so the release zip works without npm install
    noExternal: [/.*/],
  },
  // Figma Plugin → plugin/code.js (IIFE for Figma sandbox)
  {
    entry: ['src/plugin/code.ts'],
    format: ['iife'],
    outDir: 'plugin',
    outExtension: () => ({ js: '.js' }),
    target: 'es2015',
    sourcemap: false,
    minify: false,
    splitting: false,
    bundle: true,
    // Figma plugin sandbox provides `figma` and `__html__` globals
    globalName: undefined,
    noExternal: [/.*/],
    async onSuccess() {
      copyFileSync('src/plugin/manifest.json', 'plugin/manifest.json');
      copyFileSync('src/plugin/ui.html', 'plugin/ui.html');
    },
  },
]);
