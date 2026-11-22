import { clamp, random } from './field.js';

const timbres={
  juicy: {wet:1.08,snap:.36,rustle:.10,weight:.59,ring:.13,pitch:440},
  berry: {wet:.91,snap:.23,rustle:.13,weight:.44,ring:.08,pitch:610},
  crisp:{wet:.46,snap:.94,rustle:.26,weight:.73,ring:.31,pitch:940},
  shell:{wet:.24,snap:1.18,rustle:.09,weight:1.15,ring:1.07,pitch:740},
  leafy:{wet:.16,snap:.30,rustle:1.19,weight:.43,ring:.05,pitch:1340},
  dense:{wet:.29,snap:.54,rustle:.39,weight:.94,ring:.29,pitch:510},
  soft: {wet:.79,snap:.14,rustle:.18,weight:.58,ring:.07,pitch:320},
  rind: {wet:.69,snap:.85,rustle:.26,weight:1.05,ring:.49,pitch:590},
  pod:  {wet:.29,snap:.68,rustle:.66,weight:.43,ring:.20,pitch:1190}
};
const berries=new Set(['grape','berry','cherry','strawberry']);
const tough=new Set(['coconut','durian','mangosteen','tamarind']);
const watery=new Set(['watermelon','tomato','papaya','blood-orange','cantaloupe','honeydew','pomegranate','cucumber']);
const fibrous=new Set(['corn','pineapple','broccoli','cauliflower','celery']);

export function projectileTimbre(produce){
  let family=produce.style.name==='Juicy'?'juicy':produce.style.name==='Soft'?'soft':produce.style.name==='Hard shell'?'shell':
    produce.style.name==='Leafy'?'leafy':produce.style.name==='Starchy'?'dense':produce.style.name==='Thick rind'?'rind':'crisp';
  if(watery.has(produce.id))family='juicy';
  else if(tough.has(produce.id))family='shell';
  else if(berries.has(produce.shape))family='berry';
  else if(produce.shape==='onion'||produce.shape==='pod'||fibrous.has(produce.id))family='pod';
  const seed=[...produce.id].reduce((value,ch)=>Math.imul(value,31)+ch.charCodeAt(0),139);
  const vary=random(seed);
  const [width,height,depth]=produce.scale;
  const voice=timbres[family];
  return {
    ...voice,family,
    wet:voice.wet*(.91+vary()*.19),
    snap:voice.snap*(.87+vary()*.24),
    weight:voice.weight*Math.cbrt(width*height*depth)*(.94+vary()*.13),
    pitch:voice.pitch*(.82+vary()*.36),
    rustle:voice.rustle*(.91+vary()*.22),
    motion:.9+vary()*.23
  };
}

export function createSound(){
  let ctx,master,noiseBuffer,muted=false,fragmentTime=0;
  function unlock(){
    if(muted)return;
    const Audio=window.AudioContext||window.webkitAudioContext;
    if(!Audio)return;
    if(!ctx){
      try{
        ctx=new Audio();
        master=ctx.createGain();
        master.gain.value=.51;
        if(ctx.createDynamicsCompressor){
          const compressor=ctx.createDynamicsCompressor();
          compressor.threshold.value=-12;
          compressor.ratio.value=4;
          master.connect(compressor);
          compressor.connect(ctx.destination);
        }else master.connect(ctx.destination);
        noiseBuffer=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);
        const samples=noiseBuffer.getChannelData(0), rng=random(3918);
        for(let i=0;i<samples.length;i++)samples[i]=rng()*2-1;
      }catch{
        ctx=null;
        return;
      }
    }
    if(ctx.state==='suspended')ctx.resume().catch(()=>{});
  }
  function out(gain,pan){
    if(Math.abs(pan)<.03||!ctx.createStereoPanner){gain.connect(master);return;}
    const panner=ctx.createStereoPanner();
    panner.pan.value=clamp(pan,-.90,.90);
    gain.connect(panner);panner.connect(master);
  }
  function envelope(t,duration,amplitude,attack,pan){
    const gain=ctx.createGain();
    gain.gain.setValueAtTime(.00015,t);
    gain.gain.linearRampToValueAtTime(amplitude,t+Math.min(attack,duration*.41));
    gain.gain.exponentialRampToValueAtTime(.00015,t+duration);
    out(gain,pan);
    return gain;
  }
  function noise(start,seed,duration,from,to,amp,type='lowpass',q=.71,pan=0,attack=.003){
    if(amp<.003)return;
    const filter=ctx.createBiquadFilter();
    filter.type=type;
    filter.Q.value=q;
    filter.frequency.setValueAtTime(clamp(from,35,12000),start);
    filter.frequency.exponentialRampToValueAtTime(clamp(to,30,11000),start+duration);
    const source=ctx.createBufferSource();source.buffer=noiseBuffer;
    source.connect(filter);
    filter.connect(envelope(start,duration,amp,attack,pan));
    source.start(start,random(seed)()*.49);
    source.stop(start+duration);
  }
  function tone(start,duration,from,to,amp,pan=0,type='sine'){
    if(amp<.003)return;
    const oscillator=ctx.createOscillator();
    oscillator.type=type;
    oscillator.frequency.setValueAtTime(clamp(from,25,5800),start);
    oscillator.frequency.exponentialRampToValueAtTime(clamp(to,22,5000),start+duration);
    oscillator.connect(envelope(start,duration,amp,.0028,pan));
    oscillator.start(start);oscillator.stop(start+duration);
  }

  return {
    unlock,
    mute(value){muted=value;if(master)master.gain.value=muted?0:.51;},
    launch(){
      if(!ctx||muted)return;
      const now=ctx.currentTime, seed=Date.now()|0;
      tone(now,.18,126,42,.29);
      noise(now+.008,seed,.20,2600,430,.39);
      noise(now+.077,seed+1,.26,705,167,.13,'bandpass',1.03);
    },
    impact(shot,breakup,replay){
      if(!ctx||muted)return;
      const {hit,seed}=shot;
      const voice=projectileTimbre(shot.produce);
      const rnd=random(seed^0x74395a);
      const now=ctx.currentTime+.003, time=replay?1.55:1, shift=replay?.76:1;
      const surface=hit.onBoard?'wood':hit.volunteer!==undefined?'cloth':'soil';
      const normal=hit.normal||(hit.onBoard?{x:0,y:0,z:1}:{x:0,y:1,z:0});
      const normalSpeed=Math.abs(hit.velocity.dot(normal));
      const effort=clamp((normalSpeed*.66+hit.velocity.length()*.34)/18,.38,1.23);
      const p=voice.pitch*(.81+rnd()*.4)*shift;
      const load=clamp(breakup.rindLength,0,1.2);
      const pan=clamp(hit.contact.x*.07,-.58,.58);
      const wet=voice.wet*(.82+rnd()*.40)*clamp(breakup.pulp/109,.52,1.23);
      const snap=voice.snap*(.83+rnd()*.34)*(.89+load*.18);
      fragmentTime=now;
      if(surface==='wood'){
        tone(now,.16*time,118*shift,56*shift,.32*effort*voice.weight,pan);
        tone(now+.007,.105*time,(256+rnd()*55)*shift,152*shift,.081*effort,pan,'triangle');
      }else if(surface==='cloth'){
        tone(now,.137*time,81*shift,44*shift,.30*effort*voice.weight,pan);
        noise(now+.017,seed+93,.070*time,910,250,.17*effort,'bandpass',1.1,pan);
      }else{
        tone(now,.14*time,72*shift,34*shift,.32*effort*voice.weight,pan);
        noise(now+.027,seed+93,.13*time,875+rnd()*345,190,.14*effort,'lowpass',.8,pan);
      }

      noise(now,seed,.046*time,p*(surface==='cloth'?3.4:5.7),p*.74,.76*snap*effort,'lowpass',.85,pan);
      if(voice.ring>.14){
        tone(now+.005,.092*time,p*1.62,p*.48,.13*voice.ring*effort,pan,'triangle');
        tone(now+.016,.062*time,p*2.45,p*1.81,.067*voice.ring*effort,pan);
      }
      noise(now+.012*time,seed+1,.168*time,p*1.95,p*.43,.54*wet*effort,'bandpass',.91,pan,.012*time);
      noise(now+.036*time,seed+2,.199*time,p*1.14,p*.19,.50*wet*effort,'lowpass',.68,pan,.023*time);
      tone(now+.015*time,.076*time,119*shift+wet*40,58*shift,.17*wet*effort,pan);
      noise(now+.026*time,seed+3,.139*time,p*5.2,p*1.12,.28*voice.rustle*effort,'highpass',.62,pan,.013*time);

      const pulses=clamp(Math.floor(breakup.whole/3+wet*2.6+snap*(1+rnd()*2)),1,8);
      for(let i=0;i<pulses;i++){
        const size=.28+rnd()*.72, moment=now+(.02+i*.019+rnd()*.054)*time;
        const spread=pan+(rnd()-.5)*.46;
        noise(moment,seed+i+7,(.028+rnd()*.032)*time,p*(1.2+size*3),p*.67,
          (wet*.09+snap*.10+voice.rustle*.035)*size*effort,'bandpass',1.51,spread);
      }
    },
    fragments(events,shot,replay){
      if(!ctx||muted||!events.length||ctx.currentTime<fragmentTime)return;
      const hit=shot.hit;
      const voice=projectileTimbre(shot.produce);
      const shift=replay?.70:1;
      const now=ctx.currentTime+.002;
      fragmentTime=now+(replay?.053:.042);
      for(const [i,event] of events.slice(0,2).entries()){
        const {type,material,speed,size,x,seed}=event;
        const pan=clamp((x-hit.contact.x)*.32+hit.contact.x*.068,-.86,.86);
        const amp=clamp(speed*.027+size*.163,.031,.34);
        const moment=now+i*.011;
        const damp=material==='cloth'?.69:material==='soil'?.83:1;
        if(type==='seed'){
          const pitch=(710+1490*voice.motion+seed%380)*shift*damp;
          tone(moment,.031,pitch,pitch*.51,amp*.25,pan,'triangle');
          noise(moment,seed,.043,pitch*2,pitch*.67,amp*.22,'bandpass',1.15,pan);
        }else if(type==='leaf'){
          noise(moment,seed,.075,2940*shift,950*shift,amp*.44*damp,'bandpass',.8,pan,.009);
        }else if(type==='pulp'||type==='round'){
          const pitch=voice.pitch*shift*(.64+speed*.074);
          noise(moment,seed,.086,pitch*1.91,pitch*.49,amp*.52*voice.wet*damp,'bandpass',1.3,pan,.007);
          tone(moment,.042,155*shift,61*shift,amp*.23*voice.wet,pan);
        }else{
          const pitch=(voice.pitch+speed*70+seed%306)*shift*damp;
          noise(moment,seed,.060,pitch*3.4,pitch*.73,amp*(.66+voice.snap*.16),'lowpass',.73,pan);
          tone(moment,.050,pitch*.63,pitch*.19,amp*(.075+voice.ring*.17),pan,'triangle');
        }
      }
    }
  };
}
