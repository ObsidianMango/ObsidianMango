import { MONEY_CAP } from './config.js';

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const isWholePositive = value => Number.isSafeInteger(value) && value > 0;

export function safeMoney(value) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(MONEY_CAP, Math.floor(value));
}

export function safeAdd(a, b) {
  const result = BigInt(safeMoney(a)) + BigInt(safeMoney(b));
  return Number(result > BigInt(MONEY_CAP) ? BigInt(MONEY_CAP) : result);
}

export function safeMultiply(a, b) {
  if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b) || a < 0 || b < 0) throw new RangeError('Money factors must be safe nonnegative integers');
  const result = BigInt(a) * BigInt(b);
  return Number(result > BigInt(MONEY_CAP) ? BigInt(MONEY_CAP) : result);
}

export function safePercentFloor(value, numerator, denominator = 100) {
  if (![value,numerator,denominator].every(Number.isSafeInteger) || value < 0 || numerator < 0 || denominator <= 0) throw new RangeError('Invalid percentage calculation');
  const result = (BigInt(value) * BigInt(numerator)) / BigInt(denominator);
  return Number(result > BigInt(MONEY_CAP) ? BigInt(MONEY_CAP) : result);
}

export function formatMoney(value) {
  const integer = Number.isFinite(value) ? Math.trunc(value) : 0;
  const sign = integer < 0 ? '-' : '';
  return `${sign}$${Math.abs(integer).toLocaleString('en-US')}`;
}

export function addEvent(state, message, type = 'info', detail = '') {
  const event = { id:`${state.day}-${state.trips}-${state.eventSerial = (state.eventSerial ?? 0) + 1}`, day:state.day, location:state.location, type, message, detail, at:Date.now() };
  state.eventHistory ??= [];
  state.eventHistory.unshift(event);
  if (state.eventHistory.length > 100) state.eventHistory.length = 100;
  state.ticker = message;
  return event;
}

export function deepClone(value) {
  return globalThis.structuredClone ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}
