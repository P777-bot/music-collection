import { readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const configuredUrl = process.env.API_BASE_URL?.trim();

if (!configuredUrl) {
  console.error('Set API_BASE_URL to the deployed NestJS service URL before building the Render static site.');
  process.exit(1);
}

let apiUrl;
try {
  apiUrl = new URL(configuredUrl);
} catch {
  console.error('API_BASE_URL must be a valid absolute URL.');
  process.exit(1);
}

if (apiUrl.protocol !== 'https:' || apiUrl.username || apiUrl.password || apiUrl.search || apiUrl.hash) {
  console.error('API_BASE_URL must be an HTTPS URL without credentials, query parameters, or a fragment.');
  process.exit(1);
}

const angularConfig = JSON.parse(await readFile(resolve(frontendRoot, 'angular.json'), 'utf8'));
const outputPath = angularConfig.projects.frontend.architect.build.options.outputPath;
const browserOutput = resolve(frontendRoot, outputPath, 'browser');
const angularCli = resolve(frontendRoot, 'node_modules/@angular/cli/bin/ng.js');
const build = spawnSync(process.execPath, [angularCli, 'build'], {
  cwd: frontendRoot,
  stdio: 'inherit',
});

if (build.error) throw build.error;
if (build.status !== 0) process.exit(build.status ?? 1);

const normalizedApiBaseUrl = apiUrl.toString().replace(/\/+$/, '');
const runtimeConfig = `window.__MUSIC_COLLECTION_CONFIG__ = Object.freeze({ apiBaseUrl: ${JSON.stringify(normalizedApiBaseUrl)} });\n`;
await writeFile(resolve(browserOutput, 'runtime-config.js'), runtimeConfig, 'utf8');
console.log(`Wrote Render runtime config for ${apiUrl.host}.`);
