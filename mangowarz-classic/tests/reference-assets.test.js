import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const manifestPath=path.join(root,'assets','classic-ui','asset-manifest.json');
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));

test('reference-style public asset set is complete, local, and internally consistent',()=>{
  assert.equal(manifest.style,'MangoWarz 1985 Pixel');
  assert.equal(manifest.assets.length,28);
  assert.match(manifest.provenance,/Original deterministic coded SVG pixel art/);
  const ids=new Set();
  const paths=new Set();
  for(const asset of manifest.assets){
    assert.equal(ids.has(asset.id),false,`duplicate ID ${asset.id}`);
    assert.equal(paths.has(asset.path),false,`duplicate path ${asset.path}`);
    ids.add(asset.id);paths.add(asset.path);
    const file=path.join(root,asset.path);
    assert.equal(fs.existsSync(file),true,`missing ${asset.path}`);
    const source=fs.readFileSync(file,'utf8');
    assert.match(source,new RegExp(`viewBox="0 0 ${asset.width} ${asset.height}"`));
    assert.match(source,/shape-rendering="crispEdges"/);
    assert.match(source,/id="scan"/);
    assert.match(source,/id="vignette"/);
    assert.doesNotMatch(source,/<text\b|<image\b|(?:href|src)="https?:\/\/|data:/i);
  }
  for(const id of ['acid','cocaine','hashish','heroin','ludes','mda','opium','pcp','peyote','shrooms','speed','weed'])assert.equal(ids.has(`product-${id}`),true);
  for(const id of ['bronx','ghetto','central-park','manhattan','coney-island','brooklyn'])assert.equal(ids.has(`location-${id}`),true);
  for(const id of ['market','travel','bank','loan','clinic','stats','log','options'])assert.equal(ids.has(`icon-${id}`),true);
});
