function hashSeed(seed) {
  let value = 2166136261;
  for (const char of String(seed)) {
    value ^= char.charCodeAt(0);
    value = Math.imul(value, 16777619);
  }
  value >>>= 0;
  return value || 0x6d2b79f5;
}

export class SeededRng {
  constructor(seed, savedState = null) {
    this.seed = String(seed);
    this.state = savedState === null ? hashSeed(this.seed) : (savedState >>> 0) || 0x6d2b79f5;
  }

  nextUint32() {
    let x = this.state >>> 0;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.state = x >>> 0;
    return this.state;
  }

  next() {
    return this.nextUint32() / 4294967296;
  }

  int(min, maxExclusive) {
    if (!Number.isSafeInteger(min) || !Number.isSafeInteger(maxExclusive) || maxExclusive <= min) throw new RangeError('Invalid integer range');
    return min + Math.floor(this.next() * (maxExclusive - min));
  }

  chance(probability) {
    if (!Number.isFinite(probability) || probability < 0 || probability > 1) throw new RangeError('Invalid probability');
    return this.next() < probability;
  }

  pick(items) {
    if (!Array.isArray(items) || items.length === 0) throw new RangeError('Cannot pick from an empty list');
    return items[this.int(0, items.length)];
  }

  shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = this.int(0, i + 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  weighted(entries) {
    const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
    if (!(total > 0)) throw new RangeError('Weighted list must have positive weight');
    let roll = this.next() * total;
    for (const entry of entries) {
      roll -= entry.weight;
      if (roll < 0) return entry.value;
    }
    return entries.at(-1).value;
  }
}

export function createSeed() {
  const values = new Uint32Array(3);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(values);
  else {
    const now = Date.now() >>> 0;
    values.set([now, (now ^ 0xa5a5a5a5) >>> 0, (now * 2654435761) >>> 0]);
  }
  return [...values].map(value => value.toString(36).padStart(7,'0')).join('-');
}
