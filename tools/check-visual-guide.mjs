import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const guide = path.join(root, 'visual-lab');
const read = relative => JSON.parse(fs.readFileSync(path.join(guide, relative), 'utf8'));
const heroes = read('content/heroes.json'), project = read('content/project.json');
const manifest = read('archive/sites-v8/manifest.json');
const pages = ['index.html','personagens/index.html','universo/index.html','producao/index.html',...heroes.map(hero => `heroes/${hero.slug}/index.html`)];
const hash = buffer => createHash('sha256').update(buffer).digest('hex');

for (const entry of manifest.files) {
  const file = path.join(guide, entry.path);
  assert.ok(fs.existsSync(file), `Arquivo original perdido: ${entry.source}`);
  assert.equal(hash(fs.readFileSync(file)), entry.sha256, `Snapshot alterado: ${entry.source}`);
}

const ids = new Set(project.tasks.map(task => task.id));
assert.equal(ids.size, project.tasks.length, 'IDs de tarefas duplicados');
const visited = new Set(), visiting = new Set();
function walk(id) {
  assert.ok(ids.has(id), `Dependência inexistente: ${id}`);
  assert.ok(!visiting.has(id), `Ciclo na fila: ${id}`);
  if (visited.has(id)) return;
  visiting.add(id); project.tasks.find(task => task.id === id).depends.forEach(walk);
  visiting.delete(id); visited.add(id);
}
project.tasks.forEach(task => walk(task.id));
for (const hero of heroes) {
  assert.equal(hero.stages.length, 5, `Pipeline divergente: ${hero.name}`);
  for (const image of [hero.thumbnail,...hero.assets,...hero.stages.map(stage => stage.image)].filter(Boolean)) {
    assert.ok(fs.existsSync(path.join(guide, 'public', image)), `Imagem ausente: ${image}`);
  }
  for (const stage of hero.stages) if (stage.status === 'APROVADO') assert.ok(stage.image, `Aprovação sem asset: ${hero.name} ${stage.id}`);
}
const entities = text => text.replaceAll('&amp;','&').replaceAll('&#39;',"'").replaceAll('&quot;','"');
let links = 0;
for (const page of pages) {
  const location = path.join(guide, page), html = fs.readFileSync(location, 'utf8');
  assert.ok(html.includes('name="viewport"'), `Viewport ausente: ${page}`);
  assert.ok(!html.includes('href="#"'), `Link vazio: ${page}`);
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const url = entities(match[1]);
    if (/^(https?:|data:|mailto:)/.test(url)) continue;
    const [fileQuery, fragment] = url.split('#'), file = fileQuery.split('?')[0];
    let resolved = file ? path.resolve(path.dirname(location), decodeURIComponent(file)) : location;
    assert.ok((resolved === root || resolved.startsWith(root + '/')), `Link escapa do projeto: ${page} ${url}`);
    assert.ok(fs.existsSync(resolved), `Link/asset quebrado: ${page} ${url}`);
    if (fs.statSync(resolved).isDirectory()) resolved = path.join(resolved, 'index.html');
    assert.ok(fs.existsSync(resolved), `Sem index: ${page} ${url}`);
    if (fragment && resolved.endsWith('.html')) {
      const target = fs.readFileSync(resolved, 'utf8');
      assert.ok(target.includes(`id="${fragment}"`), `Âncora ausente: ${page} ${url}`);
    }
    links++;
  }
}
const css = fs.readFileSync(path.join(guide, 'ui/guide.css'), 'utf8');
for (const match of css.matchAll(/url\(['"]?([^'"\)]+)['"]?\)/g)) {
  assert.ok(fs.existsSync(path.resolve(guide, 'ui', match[1])), `Fonte ausente: ${match[1]}`);
}
console.log(`OK: ${manifest.files.length} arquivos originais com SHA-256 idêntico; ${pages.length} páginas; ${links} links/assets; pipeline sem ciclos.`);
