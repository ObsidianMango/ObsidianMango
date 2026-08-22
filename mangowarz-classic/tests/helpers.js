import { createInitialState } from '../js/state.js';
import { initializeMarket } from '../js/travel.js';

export function game(seed='test-seed',options={}) {
  const state=createInitialState({mode:'classic',seed,...options});
  initializeMarket(state);
  return state;
}

export class MemoryStorage {
  constructor(){this.map=new Map();}
  getItem(key){return this.map.has(key)?this.map.get(key):null;}
  setItem(key,value){this.map.set(key,String(value));}
  removeItem(key){this.map.delete(key);}
  key(index){return [...this.map.keys()][index]??null;}
  get length(){return this.map.size;}
}
