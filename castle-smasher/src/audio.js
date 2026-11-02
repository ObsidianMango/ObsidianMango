export class AudioSystem{
 constructor(settings){this.settings=settings;this.ctx=null;this.musicClock=0;this.note=0}
 start(){if(!this.ctx)this.ctx=new(window.AudioContext||window.webkitAudioContext)();this.ctx.resume()}
 tone(freq=100,duration=.15,volume=.08,type='sine',end=35){if(!this.settings.sound||!this.ctx)return;const c=this.ctx,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,c.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(12,end),c.currentTime+duration);g.gain.setValueAtTime(volume,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+duration);o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+duration)}
 noise(duration=.3,volume=.15,cutoff=600){if(!this.settings.sound||!this.ctx)return;const c=this.ctx,b=c.createBuffer(1,c.sampleRate*duration,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length)**2;const n=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();n.buffer=b;f.type='lowpass';f.frequency.value=cutoff;g.gain.value=volume;n.connect(f).connect(g).connect(c.destination);n.start()}
 fire(type){this.noise(.35,.25,1500);this.tone(type==='duck'?600:95,.35,.16,'triangle',type==='duck'?300:25);if(type==='sheep')this.tone(420,.5,.1,'sawtooth',260)}
 impact(mat='stone',strength=1,speed=1){if(speed<.2)return;this.noise(.15+strength*.15,.08*Math.min(3,strength),mat==='wood'?2000:700);this.tone(mat==='glass'?1800:mat==='iron'?380:70,.2,.06,'triangle',mat==='glass'?700:30)}
 win(){[261,329,392,523].forEach((n,i)=>setTimeout(()=>this.tone(n,.4,.1,'triangle',n),i*140))}
 update(dt){if(!this.settings.music||!this.settings.sound)return;this.musicClock+=dt;if(this.musicClock>.45){this.musicClock=0;const n=[146,220,293,220,174,220,261,220][this.note++%8];this.tone(n,.38,.016,'triangle',n)}}
}
