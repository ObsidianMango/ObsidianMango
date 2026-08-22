export function announce(message,assertive=false) {
  const region = document.getElementById(assertive?'assertive-live':'polite-live');
  if (!region) return;
  region.textContent='';
  requestAnimationFrame(()=>{ region.textContent=message; });
}

export function applyMotionPreference(forceReduced = null) {
  const reduced = forceReduced ?? globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  document.documentElement.dataset.motion = reduced ? 'reduced' : 'full';
  return reduced;
}

export function trapDialogFocus(dialog) {
  const focusable = () => [...dialog.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])')];
  const handler = event => {
    if (event.key !== 'Tab') return;
    const nodes = focusable();
    if (!nodes.length) { event.preventDefault(); return; }
    const first=nodes[0], last=nodes.at(-1);
    if (event.shiftKey && document.activeElement===first) {event.preventDefault();last.focus();}
    else if (!event.shiftKey && document.activeElement===last) {event.preventDefault();first.focus();}
  };
  dialog.addEventListener('keydown',handler);
  return ()=>dialog.removeEventListener('keydown',handler);
}
