import { PRODUCT_BY_ID } from './config.js';
import { freeCapacity } from './state.js';
import { addEvent, formatMoney, isWholePositive, safeAdd, safeMultiply } from './utils.js';

export function maxBuyable(state, productId) {
  const row = state.market?.rows?.[productId];
  if (!row?.available || !Number.isSafeInteger(row.price) || row.price <= 0 || state.ended) return 0;
  return Math.max(0,Math.min(Math.floor(state.cash / row.price), freeCapacity(state)));
}

export function maxSellable(state, productId) {
  const row = state.market?.rows?.[productId];
  if (!row?.available || state.ended) return 0;
  return Math.max(0,state.inventory?.[productId] ?? 0);
}

function reject(reason) { return { ok:false, reason }; }

export function buyProduct(state, productId, quantity) {
  if (state.ended) return reject('This run is already over.');
  if (!PRODUCT_BY_ID[productId]) return reject('Unknown product.');
  if (!isWholePositive(quantity)) return reject('Enter a whole quantity above zero.');
  const row = state.market?.rows?.[productId];
  if (!row?.available) return reject('That product is unavailable here.');
  const maximum = maxBuyable(state,productId);
  if (quantity > maximum) return reject(maximum === 0 ? 'Not enough cash or free capacity.' : `Maximum purchase is ${maximum}.`);
  const cost = safeMultiply(quantity,row.price);
  if (cost > state.cash || quantity > freeCapacity(state)) return reject('Transaction no longer fits your cash or coat.');
  state.cash -= cost;
  state.inventory[productId] += quantity;
  state.costBasis[productId] = safeAdd(state.costBasis[productId],cost);
  state.stats.unitsBought += quantity;
  state.stats.totalSpent = safeAdd(state.stats.totalSpent,cost);
  state.stats.transactions += 1;
  const message = `Bought ${quantity} ${PRODUCT_BY_ID[productId].name} for ${formatMoney(cost)}.`;
  addEvent(state,message,'buy');
  return { ok:true, quantity, unitPrice:row.price, total:cost, message };
}

export function sellProduct(state, productId, quantity) {
  if (state.ended) return reject('This run is already over.');
  if (!PRODUCT_BY_ID[productId]) return reject('Unknown product.');
  if (!isWholePositive(quantity)) return reject('Enter a whole quantity above zero.');
  const row = state.market?.rows?.[productId];
  if (!row?.available) return reject('That product is unavailable here.');
  const ownedBefore = state.inventory[productId] ?? 0;
  if (quantity > ownedBefore) return reject(`You only own ${ownedBefore}.`);
  const proceeds = safeMultiply(quantity,row.price);
  const unitBasis = ownedBefore > 0 ? Math.floor((state.costBasis[productId] ?? 0) / ownedBefore) : 0;
  const basisSold = Math.min(state.costBasis[productId] ?? 0,safeMultiply(quantity,unitBasis));
  const profit = proceeds - basisSold;
  state.cash = safeAdd(state.cash,proceeds);
  state.inventory[productId] -= quantity;
  state.costBasis[productId] = state.inventory[productId] === 0 ? 0 : Math.max(0,state.costBasis[productId] - basisSold);
  state.stats.unitsSold += quantity;
  state.stats.totalEarned = safeAdd(state.stats.totalEarned,proceeds);
  state.stats.transactions += 1;
  const trade = { productId, productName:PRODUCT_BY_ID[productId].name, quantity, unitPrice:row.price, proceeds, estimatedProfit:profit };
  if (!state.stats.bestTrade || profit > state.stats.bestTrade.estimatedProfit) state.stats.bestTrade = trade;
  if (!state.stats.worstTrade || profit < state.stats.worstTrade.estimatedProfit) state.stats.worstTrade = trade;
  const message = `Sold ${quantity} ${PRODUCT_BY_ID[productId].name} for ${formatMoney(proceeds)}.`;
  addEvent(state,message,'sell');
  return { ok:true, quantity, unitPrice:row.price, total:proceeds, profit, message };
}
