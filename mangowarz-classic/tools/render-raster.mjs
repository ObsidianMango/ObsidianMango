import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const sharp = require('sharp');

const root = path.resolve(import.meta.dirname, '..');
const asset = (...parts) => path.join(root, 'assets', ...parts);

await sharp(asset('branding','app-icon.svg')).resize(192,192).png({compressionLevel:9}).toFile(asset('branding','icon-192.png'));
await sharp(asset('branding','app-icon.svg')).resize(512,512).png({compressionLevel:9}).toFile(asset('branding','icon-512.png'));
await sharp(asset('branding','maskable-icon.svg')).resize(512,512).png({compressionLevel:9}).toFile(asset('branding','maskable-512.png'));
await sharp(asset('branding','social-preview.svg')).resize(1200,630,{fit:'cover',position:'centre'}).webp({quality:82}).toFile(asset('branding','social-preview.webp'));
await sharp(asset('branding','splash.svg')).resize(1280,720,{fit:'cover',position:'centre'}).webp({quality:82}).toFile(asset('branding','splash.webp'));

const bronx = asset('locations','bronx-night.webp');
const bronxMeta=await sharp(bronx).metadata();
if(bronxMeta.width!==960||bronxMeta.height!==540){
  const resized = asset('locations','bronx-night-rendered.webp');
  await sharp(bronx).resize(960,540,{fit:'cover',position:'centre'}).webp({quality:82}).toFile(resized);
  fs.renameSync(resized,bronx);
}

const anchor=asset('branding','style-anchor.png');
const anchorMeta=await sharp(anchor).metadata();
if(anchorMeta.width!==512||anchorMeta.height!==512){
  const optimizedAnchor=asset('branding','style-anchor-optimized.png');
  await sharp(anchor).resize(512,512).png({palette:true,colours:256,compressionLevel:9}).toFile(optimizedAnchor);
  fs.renameSync(optimizedAnchor,anchor);
}

console.log('Rendered PNG and WebP delivery assets.');
