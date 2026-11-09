/* Original synthesized audio: no external audio files required. */
const AudioEngine = (() => {
  let ctx=null, master=null, musicGain=null, sfxGain=null, musicOn=true, sfxOn=true, musicVol=.35, sfxVol=.65, timer=null, scene="menu", step=0;
  const scales={menu:[261.63,329.63,392,523.25],world:[293.66,349.23,440,587.33],home:[220,261.63,329.63,392],activity:[329.63,392,493.88,659.25]};
  function init(){if(ctx)return;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;ctx=new AC();master=ctx.createGain();musicGain=ctx.createGain();sfxGain=ctx.createGain();musicGain.gain.value=musicOn?musicVol:0;sfxGain.gain.value=sfxOn?sfxVol:0;musicGain.connect(master);sfxGain.connect(master);master.gain.value=.8;master.connect(ctx.destination);}
  async function resume(){init();if(ctx&&ctx.state==="suspended")await ctx.resume();}
  function tone(freq,duration=.18,type="sine",volume=.15,when=0){if(!ctx)return;const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,ctx.currentTime+when);g.gain.setValueAtTime(.0001,ctx.currentTime+when);g.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),ctx.currentTime+when+.025);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+when+duration);o.connect(g);g.connect(sfxGain);o.start(ctx.currentTime+when);o.stop(ctx.currentTime+when+duration+.04);}
  function effect(name="click"){resume();if(!ctx||!sfxOn)return;const sounds={
  click:[[520,.07,"sine",.07]],

  coin:[
    [660,.1,"sine",.12],
    [880,.16,"sine",.1,.08]
  ],

  meow:[
    [480,.12,"triangle",.08],
    [390,.2,"triangle",.07,.1]
  ],

  purr:[
    [110,.25,"sawtooth",.035],
    [132,.25,"sawtooth",.025,.2]
  ],

  success:[
    [523,.13,"sine",.1],
    [659,.13,"sine",.1,.12],
    [784,.24,"sine",.1,.24]
  ],

  feed:[
    [330,.09,"sine",.07],
    [440,.12,"sine",.06,.1]
  ],

  pop:[
    [740,.08,"sine",.07],
    [990,.12,"sine",.05,.05]
  ],

  start:[
    [392,.12,"sine",.09],
    [523,.14,"sine",.1,.12],
    [659,.2,"sine",.11,.25]
  ],

  jump:[
    [420,.09,"triangle",.09],
    [680,.13,"sine",.08,.07],
    [880,.1,"sine",.045,.13]
  ],

  gameover:[
    [520,.16,"triangle",.1],
    [390,.2,"triangle",.09,.16],
    [290,.32,"sine",.1,.36]
  ]
};(sounds[name]||sounds.click).forEach(a=>tone(...a));}
  function musicNote(freq,dur=.8,delay=0){if(!ctx||!musicOn)return;const o=ctx.createOscillator(),g=ctx.createGain(),f=ctx.createBiquadFilter();o.type="sine";o.frequency.value=freq;f.type="lowpass";f.frequency.value=1300;g.gain.setValueAtTime(.0001,ctx.currentTime+delay);g.gain.exponentialRampToValueAtTime(.035,ctx.currentTime+delay+.12);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+delay+dur);o.connect(f);f.connect(g);g.connect(musicGain);o.start(ctx.currentTime+delay);o.stop(ctx.currentTime+delay+dur+.05);}
  function playScene(next){scene=next;if(!ctx||!musicOn)return;clearInterval(timer);const notes=scales[scene]||scales.menu;step=0;const loop=()=>{if(!ctx||!musicOn)return;const n=notes[step%notes.length];musicNote(n,1.25);if(step%4===0)musicNote(n/2,1.8,.02);step++;};loop();timer=setInterval(loop,1250);}
  function setMusic(v){musicOn=v;if(musicGain)musicGain.gain.setTargetAtTime(v?musicVol:0,ctx.currentTime,.08);if(v&&ctx)playScene(scene);else clearInterval(timer);}
  function setSfx(v){sfxOn=v;if(sfxGain&&ctx)sfxGain.gain.setTargetAtTime(v?sfxVol:0,ctx.currentTime,.08);}
  function setMusicVolume(v){musicVol=v;if(musicGain&&ctx)musicGain.gain.setTargetAtTime(musicOn?v:0,ctx.currentTime,.08);}
  function setSfxVolume(v){sfxVol=v;if(sfxGain&&ctx)sfxGain.gain.setTargetAtTime(sfxOn?v:0,ctx.currentTime,.08);}
  return {resume,effect,playScene,setMusic,setSfx,setMusicVolume,setSfxVolume};
})();

window.AudioEngine = AudioEngine;