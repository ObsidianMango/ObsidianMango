const fallbackPath = 'assets/ui/image-fallback.svg';

export class AssetLoader {
  constructor() { this.manifest = null; this.byId = new Map(); this.missing = new Set(); }
  async load() {
    try {
      const response = await fetch('assets/asset-manifest.json');
      if (!response.ok) throw new Error(`Manifest ${response.status}`);
      this.manifest = await response.json();
      this.byId = new Map(this.manifest.assets.map(asset => [asset.id,asset]));
      return this.manifest;
    } catch (error) {
      console.warn('MangoWarz asset manifest unavailable:',error);
      return null;
    }
  }
  path(id,fallback = fallbackPath) { return this.byId.get(id)?.path ?? fallback; }
  guardImage(image) {
    image.addEventListener('error',()=>{
      const missing = image.getAttribute('src');
      if (missing !== fallbackPath) { this.missing.add(missing); console.warn('Missing optional asset:',missing); image.src=fallbackPath; }
    },{once:true});
  }
  guardAll(root=document) { root.querySelectorAll('img').forEach(image=>this.guardImage(image)); }
}
