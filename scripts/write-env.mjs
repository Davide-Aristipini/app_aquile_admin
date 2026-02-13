import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import dotenv from 'dotenv';

const root = process.cwd();

const skipDotenv = process.argv.includes('--skip-dotenv');

if (!skipDotenv && !process.env.SKIP_DOTENV) {
  const envPath = path.join(root, '.env');
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
  }
}

const supabaseUrl = (process.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (process.env.VITE_SUPABASE_ANON_KEY || '').trim();

const targetPath = path.join(root, 'src', 'environments', 'environment.ts');
mkdirSync(path.dirname(targetPath), { recursive: true });

const content = `export interface AppEnvironment {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export const environment: AppEnvironment = {
  supabaseUrl: ${JSON.stringify(supabaseUrl)},
  supabaseAnonKey: ${JSON.stringify(supabaseAnonKey)},
};
`;

const previous = existsSync(targetPath) ? readFileSync(targetPath, 'utf8') : '';
if (previous !== content) {
  writeFileSync(targetPath, content, 'utf8');
}

console.log(
  `[write-env] supabaseUrl=${supabaseUrl ? 'set' : 'empty'} supabaseAnonKey=${
    supabaseAnonKey ? 'set' : 'empty'
  }`
);
