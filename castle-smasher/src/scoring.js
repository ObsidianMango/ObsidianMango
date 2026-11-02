export class Scoring{
 constructor(save,notify){this.save=save;this.notify=notify;this.reset()}
 reset(){this.score=0;this.combo=0;this.last=-10;this.shots=0;this.towers=0;this.explosions=0;this.bonus=false;this.earned=[];this.lastAward=-1;this.bonusTags=new Set();}
 medal(name){if(this.earned.includes(name))return;this.earned.push(name);const fresh=this.save.medal(name);this.notify(name,fresh?'NEW MEDAL':'MEDAL')}
 event(e,level){if(e.type==='break'){this.combo=e.t-this.last<1.5?this.combo+1:1;this.last=e.t;this.score+=Math.round(e.value*Math.min(6,1+Math.floor(this.combo/8)*.5));if(this.combo>=20)this.medal('Stone Smasher');if(this.combo>=40)this.medal('Chain Reaction King');if(e.tag==='wall'||e.tag==='gate')this.bonusTags.add(e.tag);if(e.tag===level.target&&level.target!=='tower')this.bonus=true;if(this.combo>=12&&e.tag==='wall')this.medal('Wall Breaker');}
 if(e.type==='collapse'){this.towers++;this.score+=Math.round(e.value);this.medal('Tower Toppler');if(this.towers>=2)this.medal('Demolition Genius');if(level.target==='tower'&&this.towers>=2)this.bonus=true}
 if(e.type==='explosion'||e.type==='fire'){this.explosions++;if(level.target==='barrel')this.bonus=true;this.score+=Math.round(e.value*.3);}
 if(e.type==='secret'){this.score+=e.value;if((level.target==='treasure'&&e.secret==='Royal treasury')||(level.target==='secret'&&e.secret!=='Royal treasury'))this.bonus=true;this.notify(e.secret,'SECRET FOUND')}
 }
 victory(percent,ammo){if(this.shots===1)this.medal('One-Shot Wonder');if(percent>=90)this.medal('Total Annihilation');if(this.score>=30000)this.medal('Medieval Menace');this.score+=Math.max(0,ammo)*600+(this.bonus?1500:0);const coins=120+Math.round(this.score/250)+(this.bonus?80:0);this.save.data.coins+=coins;this.save.write();return coins}
}
