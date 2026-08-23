import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const sharp = require('sharp');

const root = path.resolve(import.meta.dirname, '..');
const asset = (...parts) => path.join(root, 'assets', ...parts);

await sharp(asset('branding','app-icon.svg')).resize(192,192).png({compressionLevel:9}).toFile(asset('branding','icon-192.png'));
await sharp(asset('branding','app-icon.svg')).resize(512,512).png({compressionLevel:9}).toFile(asset('branding','icon-512.png'));
await sharp(asset('branding','maskable-icon.svg')).resize(512,512).png({compressionLevel:9}).toFile(asset('branding','maskable-512.png'));
await sharp(asset('branding','social-preview.svg')).resize(1200,630,{fit:'cover',position:'centre'}).png({compressionLevel:9}).toFile(asset('branding','social-preview.png'));

console.log('Rendered PNG compatibility exports from coded SVG masters.');
