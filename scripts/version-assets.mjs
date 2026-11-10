import fs from 'node:fs';
import { createHash } from 'node:crypto';

const index = new URL('../dist/index.html', import.meta.url);
let html = fs.readFileSync(index, 'utf8');
for (const name of ['style.css', 'deck.js']) {
  const bytes = fs.readFileSync(new URL(`../dist/${name}`, import.meta.url));
  const version = createHash('sha256').update(bytes).digest('hex').slice(0, 12);
  const attribute = name.endsWith('.css') ? 'href' : 'src';
  const pattern = new RegExp(`${attribute}="${name.replace('.', '\\.')}[^\"]*"`);
  if (!pattern.test(html)) throw new Error(`Missing asset reference: ${name}`);
  html = html.replace(pattern, `${attribute}="${name}?v=${version}"`);
}
fs.writeFileSync(index, html);
