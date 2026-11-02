const KEY='castle-smasher-v1';
export class Save{
 constructor(){this.data={coins:0,unlocked:[0],weapons:[0],best:{},medals:[],settings:{quality:'auto',sound:true,music:false,shake:true,guide:true,follow:false},builds:[]};try{const d=JSON.parse(localStorage.getItem(KEY));if(d)this.data={...this.data,...d,settings:{...this.data.settings,...d.settings}};}catch{} }
 write(){try{localStorage.setItem(KEY,JSON.stringify(this.data));return true}catch{return false}}
 medal(name){if(!this.data.medals.includes(name)){this.data.medals.push(name);this.write();return true}return false}
 unlock(i){if(!this.data.unlocked.includes(i))this.data.unlocked.push(i);this.write()}
 buy(i,cost){if(this.data.weapons.includes(i))return true;if(this.data.coins<cost)return false;this.data.coins-=cost;this.data.weapons.push(i);return this.write()}
}
