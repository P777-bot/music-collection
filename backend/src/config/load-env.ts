import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** Loads the ignored local .env file without ever logging its contents. */
export function loadProjectEnvironment(): void {
  let contents: string;
  try {
    contents = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
  } catch {
    return;
  }

  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}
