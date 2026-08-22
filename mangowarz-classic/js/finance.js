import { EXTENDED_BY_ID } from './config.js';
import { freeCapacity, totalCapacity, usedCapacity } from './state.js';
import { addEvent, formatMoney, isWholePositive, safeAdd, safeMultiply, safePercentFloor } from './utils.js';

const reject = reason => ({ok:false,reason});

export function applyTripInterest(state) {
  const oldDebt = state.debt;
  const oldBank = state.bank;
  state.debt = safePercentFloor(oldDebt,110);
  state.bank = safePercentFloor(oldBank,105);
  const debtGain = state.debt - oldDebt;
  const bankGain = state.bank - oldBank;
  addEvent(state,`Trip interest: debt +${formatMoney(debtGain)}, bank +${formatMoney(bankGain)}.`,'interest');
  return {oldDebt,oldBank,newDebt:state.debt,newBank:state.bank,debtGain,bankGain};
}

export function repayDebt(state, amount) {
  if (state.ended) return reject('This run is over.');
  if (state.location !== 'bronx') return reject('The loan shark is only available in the Bronx.');
  if (!isWholePositive(amount)) return reject('Enter a whole-dollar amount above zero.');
  if (amount > state.cash) return reject('You do not have that much carried cash.');
  if (amount > state.debt) return reject('That exceeds the debt balance.');
  state.cash -= amount;
  state.debt -= amount;
  const message = `Repaid ${formatMoney(amount)}. Debt is now ${formatMoney(state.debt)}.`;
  addEvent(state,message,'debt');
  return {ok:true,amount,message};
}

export function deposit(state, amount) {
  if (state.ended) return reject('This run is over.');
  if (state.location !== 'manhattan') return reject('The bank is only available in Manhattan.');
  if (!isWholePositive(amount)) return reject('Enter a whole-dollar amount above zero.');
  if (amount > state.cash) return reject('Deposit exceeds carried cash.');
  state.cash -= amount;
  state.bank = safeAdd(state.bank,amount);
  const message = `Deposited ${formatMoney(amount)}.`;
  addEvent(state,message,'bank');
  return {ok:true,amount,message};
}

export function withdraw(state, amount) {
  if (state.ended) return reject('This run is over.');
  if (state.location !== 'manhattan') return reject('The bank is only available in Manhattan.');
  if (!isWholePositive(amount)) return reject('Enter a whole-dollar amount above zero.');
  if (amount > state.bank) return reject('Withdrawal exceeds bank balance.');
  state.bank -= amount;
  state.cash = safeAdd(state.cash,amount);
  const message = `Withdrew ${formatMoney(amount)}.`;
  addEvent(state,message,'bank');
  return {ok:true,amount,message};
}

export function treatmentQuote(state) {
  const missing = 100 - state.health;
  const healing = Math.min(35,missing);
  return { healing, cost:healing * 18 };
}

export function buyTreatment(state) {
  const quote = treatmentQuote(state);
  if (state.ended) return reject('This run is over.');
  if (quote.healing <= 0) return reject('You are already at full health.');
  if (state.cash < quote.cost) return reject('Not enough carried cash for treatment.');
  state.cash -= quote.cost;
  state.health = Math.min(100,state.health + quote.healing);
  const message = `Treatment restored ${quote.healing} health for ${formatMoney(quote.cost)}.`;
  addEvent(state,message,'health');
  return {ok:true,...quote,message};
}

export function purchaseExtendedAsset(state, assetId) {
  if (state.mode !== 'extended') return reject('Extended assets are not part of Classic Mode.');
  if (state.ended) return reject('This run is over.');
  const asset = EXTENDED_BY_ID[assetId];
  if (!asset) return reject('Unknown asset.');
  if (state.cash < asset.price) return reject('Not enough carried cash.');
  state.cash -= asset.price;
  state.ownedAssets[assetId] = (state.ownedAssets[assetId] ?? 0) + 1;
  addEvent(state,`Purchased ${asset.name} for ${formatMoney(asset.price)}.`,'asset');
  return {ok:true,asset};
}

export function sellExtendedAsset(state, assetId) {
  if (state.mode !== 'extended') return reject('Extended assets are not part of Classic Mode.');
  const asset = EXTENDED_BY_ID[assetId];
  if (!asset || (state.ownedAssets?.[assetId] ?? 0) <= 0) return reject('You do not own that asset.');
  if ((asset.capacityBonus ?? 0) > 0 && usedCapacity(state) > totalCapacity(state) - asset.capacityBonus) return reject(`Selling this would overfill your coat by ${usedCapacity(state) - (totalCapacity(state)-asset.capacityBonus)} spaces.`);
  const resale = safePercentFloor(asset.price,Math.round(asset.resaleFactor * 100));
  state.ownedAssets[assetId] -= 1;
  state.cash = safeAdd(state.cash,resale);
  addEvent(state,`Sold ${asset.name} for ${formatMoney(resale)}.`,'asset');
  return {ok:true,asset,resale,freeCapacity:freeCapacity(state)};
}
