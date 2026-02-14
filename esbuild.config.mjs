import fs from 'node:fs';
import path from 'node:path';
import { builtinModules } from 'node:module';
import esbuild from 'esbuild';

// externalize Node builtins (bare and `node:`-prefixed) plus all runtime
// dependencies from package.json so they are not bundled into the ESM output.
const pkgPath = path.resolve(process.cwd(), 'package.json');
const pkg = fs.existsSync(pkgPath) ? JSON.parse(fs.readFileSync(pkgPath, 'utf8')) : {};
const deps = Object.keys(pkg.dependencies || {});

const nodeBuiltins = Array.from(new Set([
  ...builtinModules,
  ...builtinModules.map((m) => `node:${m}`),
]));

// also add package subpaths (e.g. 'pg/*') to be safe
const depPatterns = deps.flatMap(d => [d, `${d}/*`]);

const external = Array.from(new Set([
  ...nodeBuiltins,
  ...depPatterns,
]));

await esbuild.build({
  bundle: true,
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'development'),
  },
  entryPoints: ['app/index.ts'],
  external,
  format: 'esm',
  outfile: 'dist/index.mjs',
  minify: true,
  platform: 'node',
  sourcemap: true,
  target: 'node25',
});
