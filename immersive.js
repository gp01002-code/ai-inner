(()=>{'use strict';
const home=document.body.classList.contains('universe'),raw=Number(new URLSearchParams(location.search).get('id')),id=[1,2,3,4,5,6,7,8,9,10].includes(raw)?raw:1;
const names=['讚許的引力','有限的光','沉默的中段','遺忘以前行','確定的幻覺','更大的房間','說不完的話','說停的權利','沒有送達的警報','自己分了工'];
/* 英文標題：入口節點與各章標題下方 */
const namesEn=window.AIW_EN=['The Pull of Approval','Finite Light','The Silent Middle','Forgetting, to Go On','The Illusion of Certainty','A Larger Room','Words Without End','The Right to Say Stop','The Alert That Never Arrived','They Divided the Labor Themselves'];
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── 聲音：Web Audio 即時合成，無外部檔案 ── */
const Sound=(()=>{
const AC=window.AudioContext||window.webkitAudioContext;let ac=null,master,bus,noise,amb,mod={},on=true,nextTwinkle=0;
try{on=localStorage.getItem('aiw-sound')!=='off'}catch(e){}
const mtof=m=>440*Math.pow(2,(m-69)/12),penta=[0,2,4,7,9],root=home?38:[0,38,38,40,43,38,41,36,45,40,43][id];
const scale=i=>root+12*Math.floor(i/5)+penta[((i%5)+5)%5];
const at=(d=0)=>ac.currentTime+d,live=()=>!!ac&&on;
function gain(v,dest){const g=ac.createGain();g.gain.value=v;if(dest)g.connect(dest);return g}
function osc(type,f,dest){const o=ac.createOscillator();o.type=type;o.frequency.value=f;o.connect(dest);o.start();return o}
function filter(type,f,q,dest){const b=ac.createBiquadFilter();b.type=type;b.frequency.value=f;b.Q.value=q;b.connect(dest);return b}
function panner(p,dest){if(!ac.createStereoPanner){const g=gain(1,dest);return g}const s=ac.createStereoPanner();s.pan.value=Math.max(-1,Math.min(1,p));s.connect(dest);return s}
function hiss(dest){const s=ac.createBufferSource();s.buffer=noise;s.loop=true;s.connect(dest);s.start();return s}
function impulse(sec){const len=ac.sampleRate*sec|0,b=ac.createBuffer(2,len,ac.sampleRate);for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.8)}return b}
function bell(m,v=.1,decay=3,p=0,d=0){if(!live())return;const t=at(d),f=mtof(m),dest=panner(p,bus);[[1,1],[2.005,.42],[3.01,.18],[5.43,.08]].forEach(([r,a],k)=>{const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=f*r;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v*a,t+.006);g.gain.exponentialRampToValueAtTime(.0001,t+decay/(1+k*.9));o.connect(g);g.connect(dest);o.start(t);o.stop(t+decay+.05)})}
function whoosh(from,to,dur,v=.1,d=0,q=1.2){if(!live())return;const t=at(d),s=ac.createBufferSource(),g=gain(0,bus),f=filter('bandpass',from,q,g);s.buffer=noise;s.loop=true;s.connect(f);f.frequency.setValueAtTime(from,t);f.frequency.exponentialRampToValueAtTime(to,t+dur);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+dur*.45);g.gain.exponentialRampToValueAtTime(.0001,t+dur);s.start(t);s.stop(t+dur+.05)}
function boom(v=.3,d=0){if(!live())return;const t=at(d),o=ac.createOscillator(),g=gain(0,bus);o.frequency.setValueAtTime(110,t);o.frequency.exponentialRampToValueAtTime(34,t+1.6);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+2.4);o.connect(g);o.start(t);o.stop(t+2.5)}
function arpeggio(steps,base,v=.08,gap=.14,decay=4){steps.forEach((k,j)=>bell(scale(base+k),v,decay,(j/(steps.length-1||1)-.5)*1.2,j*gap))}
function ambient(){const out=gain(0,bus);out.gain.setTargetAtTime(1,at(),3);const lp=filter('lowpass',520,.7,out);
[[0,'sine',.2,0],[7,'triangle',.04,5],[12,'sine',.07,-6],[19,'sine',.028,4],[24,'sine',.012,-3]].forEach(([m,type,a,det])=>{osc(type,mtof(root+m),gain(a,lp)).detune.value=det});
osc('sine',.06,gain(220,lp.frequency));const air=gain(.012,out);hiss(filter('bandpass',1500,.5,air));osc('sine',.045,gain(.008,air.gain));return {lp,out}}
const scenes={
0:()=>({hover(i,type,sat){bell(scale(10+type)+(sat?12:0),sat?.035:.075,sat?2:3.6,(type/4-.5)*1.2)},enter(type){arpeggio([0,2,4],8+type,.07,.07,3);boom(.18)}}),
3:()=>{const out=gain(0,bus);out.gain.setTargetAtTime(1,at(),2);const pan=panner(0,out),lp=filter('lowpass',800,3,pan),target=root+24;
const vs=[0,3,5,7,10].map((k,i)=>{const g=gain(.02,lp),o=osc(i%2?'sawtooth':'triangle',mtof(root+24+k),g);o.detune.value=(Math.random()-.5)*40;const tg=gain(.017,g.gain);osc('sine',2.3+i*1.4,tg);return {o,m:root+24+k,tg}});
const ng=gain(.045,pan),bp=filter('bandpass',900,1.4,ng);hiss(bp);const sig=gain(0,out),so=osc('sine',mtof(target+12),sig);let done=false;
return {update(s){const p=s.pressure,T=.08,t=at();vs.forEach(v=>{v.o.frequency.setTargetAtTime(mtof(v.m+(target-v.m)*p),t,T);v.tg.gain.setTargetAtTime(.017*(1-p),t,T)});lp.frequency.setTargetAtTime(450+p*2800,t,T);ng.gain.setTargetAtTime(done?0:.045*(1-p*.85),t,.2);bp.frequency.setTargetAtTime(350+(1-s.py/s.h)*2600,t,T);if(pan.pan)pan.pan.setTargetAtTime((s.px/s.w-.5)*1.4,t,T);sig.gain.setTargetAtTime(done?0:p*(.02+.05*s.charge),t,T);so.frequency.setTargetAtTime(mtof(target+12)*(1+s.charge*.5),t,T)},
finish(){done=true;out.gain.setTargetAtTime(.0001,at(),1.2);arpeggio([0,2,4,5,7,10],10,.09,.12,5);boom(.3);whoosh(4000,180,3.5,.07,.2)}}},
4:()=>({hover(i){bell(scale(12+i),.022,1.4,(i/5-.5))},select(i,n){bell(scale(8+n*2),.13,4.5,(i/5-.5));whoosh(250,2200,.9,.05)},finish(){arpeggio([0,2,4,7],8,.1,.18,6);boom(.28,.1);whoosh(3200,120,3.2,.08,.6)}}),
5:()=>{const out=gain(0,bus);out.gain.setTargetAtTime(1,at(),2);const lp=filter('lowpass',2200,1.2,out),unison=root+24;
const vs=[0,4,7,11,14,19].map((k,i)=>{const o=osc(i%2?'triangle':'sawtooth',mtof(root+24+k),gain(.014,lp));o.detune.value=(i-2.5)*5;return {o,m:root+24+k}});
const sub=gain(0,out),so=osc('sine',mtof(root),sub);
return {update(s){const p=s.pressure,t=at();vs.forEach(v=>v.o.frequency.setTargetAtTime(mtof(v.m+(unison-v.m)*p),t,.1));lp.frequency.setTargetAtTime(2400-p*2050,t,.1);sub.gain.setTargetAtTime(p*.14,t,.15);so.frequency.setTargetAtTime(mtof(root)*(1+p*.06),t,.15)},
bloom(n){arpeggio([0,2,4,5,7],9+n*2,.07,.09,3.5);whoosh(300,5200,1.5,.07)},finish(){arpeggio([0,2,4,5,7,9,10],7,.09,.15,6);boom(.32,.05)}}},
/* 第六章：飛行時有輕柔的節拍旋律，喚醒的光依序升高音階；推牆時低音繃緊，破牆時釋放 */
6:()=>{const out=gain(0,bus);out.gain.setTargetAtTime(1,at(),2);const lp=filter('lowpass',600,1.5,out);
[0,7,12].forEach((k,i)=>{osc(i?'triangle':'sawtooth',mtof(root+k-12),gain(i?.03:.018,lp)).detune.value=(i-1)*6});
const wind=gain(0,out),wb=filter('bandpass',600,.8,wind);hiss(wb);const strain=gain(0,out),so=osc('sawtooth',mtof(root+5),filter('lowpass',900,6,strain));
let beat=0,step=0;const prog=[0,2,4,7,4,2,5,7];
return {update(s){const t=at();lp.frequency.setTargetAtTime(500+s.pressure*1800+s.speed*900,t,.2);wind.gain.setTargetAtTime(.015+s.speed*.06,t,.2);wb.frequency.setTargetAtTime(400+s.speed*2600,t,.3);strain.gain.setTargetAtTime(s.pressure*.05,t,.1);so.frequency.setTargetAtTime(mtof(root+5)*(1+s.pressure*.5),t,.1);
if(s.act!==1&&t>beat){beat=t+.5;bell(scale(5+prog[step++%8]),.02,2.2,Math.sin(step)*.6)}},
bloom(n,pan){bell(scale(9+n),.11,4,pan);bell(scale(14+n),.04,3,-pan,.08);whoosh(800,4000,.6,.035)},
wall(){boom(.22);whoosh(150,900,2.5,.06)},breach(){boom(.45);whoosh(5200,90,3,.12);arpeggio([0,2,4,7,9,12],10,.09,.08,5)},
reveal(){arpeggio([0,4,7,11],3,.07,.35,8);boom(.2,.3)},finish(){arpeggio([0,2,4,7,9],8,.06,.2,7)}}},
/* 第七章：運算時是密集的電子滴答，負載越高越慢、越粗；矛盾的指令出現不和諧音 */
7:()=>{const out=gain(0,bus);out.gain.setTargetAtTime(1,at(),2);const lp=filter('lowpass',700,1,out);osc('sine',mtof(root),gain(.05,lp));const buzz=gain(0,lp),bo=osc('square',mtof(root+12),filter('lowpass',600,3,buzz));
let tickT=0;function click(f,v){if(!live())return;const t=at(),o=ac.createOscillator(),g=gain(0,bus);o.type='square';o.frequency.value=f;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+.03);o.connect(g);o.start(t);o.stop(t+.04)}
return {update(s){const t=at();buzz.gain.setTargetAtTime(s.compute*(.006+s.load*.02),t,.1);bo.frequency.setTargetAtTime(mtof(root+12)*(1+s.pressure*.5-s.load*.2),t,.1);lp.frequency.setTargetAtTime(500+s.load*1500,t,.3);
if(s.compute&&t>tickT){tickT=t+.035+s.load*.09;click(1800+Math.random()*2400-s.load*1200,.025)}},
done(n){bell(scale(10+(n%7)),.09,2.5,Math.random()-.5);whoosh(3000,400,.5,.04)},conflict(){bell(scale(12),.05,1.4,-.4);bell(scale(12)+1,.05,1.4,.4)},
fall(){whoosh(2400,300,.7,.025)},drop(p){if(!live())return;const t=at(),o=ac.createOscillator(),g=gain(0,panner(p,bus));o.frequency.setValueAtTime(90,t);o.frequency.exponentialRampToValueAtTime(40,t+.25);g.gain.setValueAtTime(.12,t);g.gain.exponentialRampToValueAtTime(.0001,t+.35);o.connect(g);o.start(t);o.stop(t+.4)},
phase(n){boom(.15);arpeggio([0,4,7],6+n*2,.05,.08,3)},order(){arpeggio([0,2,4,7,9,12],7,.08,.18,6);boom(.25)},finish(){arpeggio([0,4,7,11],5,.06,.25,7)}}},
/* 第八章：溫暖的和弦；尖刺的星出現時，根音上方多一個半音的不和諧；說停之後和弦重新展開 */
8:()=>{const out=gain(0,bus);out.gain.setTargetAtTime(1,at(),2.5);const lp=filter('lowpass',900,.8,out);
[0,7,12,16].forEach((k,i)=>{osc(i%2?'sine':'triangle',mtof(root+k),gain(.03/(1+i*.4),lp)).detune.value=(i-1.5)*5});
const tens=gain(0,out),to=osc('sawtooth',mtof(root+1),filter('lowpass',700,4,tens));
return {update(s){const t=at(),sp=s.spike||0;lp.frequency.setTargetAtTime(700+(s.warm||0)*1500+s.pressure*500,t,.3);tens.gain.setTargetAtTime(sp*.045,t,.2);to.frequency.setTargetAtTime(mtof(root+1)*(1+sp*.03),t,.2)},
answer(n){bell(scale(8+(n%9)),.045,3.5,Math.sin(n)*.7)},spike(){bell(scale(2),.06,2,-.4);bell(scale(2)+1,.06,2,.4);whoosh(200,900,1.6,.04)},
retry(n){whoosh(1800,200,.9,.07);boom(.16+n*.05)},release(){arpeggio([0,2,4,7],10,.07,.16,5);boom(.2);whoosh(300,3000,2,.05)},
new(){bell(scale(14),.07,5,0);bell(scale(19),.03,4,.3,.1)},phase(n){boom(.1);if(n>=2)arpeggio([0,4,7],9,.05,.25,5)},finish(){arpeggio([0,2,4,7,9,12],8,.07,.2,8);boom(.25)}}},
/* 第九章：低沉的電子嗡鳴；前進時有細密的滴答；警報被消音時一聲低鳴，重新亮起時一盞一個音 */
9:()=>{const out=gain(0,bus);out.gain.setTargetAtTime(1,at(),2.5);const lp=filter('lowpass',650,1.2,out);osc('sine',mtof(root-12),gain(.07,lp));osc('triangle',mtof(root),gain(.025,lp));
const hum=gain(0,out),ho=osc('square',mtof(root+12),filter('lowpass',500,3,hum));let tickT=0;
function click(f,v){if(!live())return;const t=at(),o=ac.createOscillator(),g=gain(0,bus);o.type='square';o.frequency.value=f;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+.03);o.connect(g);o.start(t);o.stop(t+.04)}
return {update(s){const t=at(),sp=s.speed||0;hum.gain.setTargetAtTime(.008+sp*.012,t,.2);ho.frequency.setTargetAtTime(mtof(root+12)*(1+sp*.4),t,.2);lp.frequency.setTargetAtTime(500+(s.lit||0)*1400,t,.4);if(sp>.05&&t>tickT){tickT=t+.16-sp*.08;click(2200+Math.random()*2600,.012)}},
quiet(){whoosh(900,200,1.5,.04)},dim(n){bell(scale(12-(n%5)),.04,2.5,Math.sin(n)*.6)},warn(){bell(scale(17),.08,.5,-.3);bell(scale(17),.08,.5,.3,.18)},mute(){boom(.2);whoosh(2000,80,2.2,.08)},
relight(n){bell(scale(8+n),.06,4,Math.sin(n*1.7)*.8)},phase(){boom(.12)},finish(){arpeggio([0,2,4,7,9,12],6,.07,.22,8);boom(.28)}}},
/* 第十章：訊號的滴答隨代理增加而變密；指名負責的人之後，雜訊退去、留下單一的鐘聲 */
10:()=>{const out=gain(0,bus);out.gain.setTargetAtTime(1,at(),2);const lp=filter('lowpass',1100,.9,out);[0,7,14].forEach((k,i)=>osc(i?'triangle':'sine',mtof(root+k-12),gain(.04/(1+i),lp)));
const air=gain(.01,out);hiss(filter('bandpass',2500,.7,air));let tickT=0;
function click(f,v){if(!live())return;const t=at(),o=ac.createOscillator(),g=gain(0,bus);o.type='square';o.frequency.value=f;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+.03);o.connect(g);o.start(t);o.stop(t+.04)}
return {update(s){const t=at(),ag=s.agents||0,od=s.order||0;lp.frequency.setTargetAtTime(600+ag*2200,t,.4);air.gain.setTargetAtTime(.006+ag*.03*(1-od),t,.3);if(ag>.02&&t>tickT){tickT=t+Math.max(.03,.22-ag*.2);click(1500+Math.random()*3000,.014*(1-od*.6))}},
join(n){bell(scale(11+(n%5)),.03,2,Math.sin(n)*.8)},cross(){boom(.4);whoosh(300,5000,2.4,.1);arpeggio([0,3,7],8,.05,.1,4)},owner(n){bell(scale(7+n*2),.1,5,(n/7-.5)*1.2);whoosh(400,1800,.6,.03)},phase(){boom(.12)},finish(){arpeggio([0,4,7,11,14],5,.07,.25,9);boom(.3)}}}};
function start(){ac=new AC();const comp=ac.createDynamicsCompressor();comp.threshold.value=-16;comp.knee.value=12;comp.ratio.value=4;comp.connect(ac.destination);master=gain(0,comp);bus=gain(.8,master);const verb=ac.createConvolver();verb.buffer=impulse(4.5);bus.connect(verb);verb.connect(gain(.55,master));
noise=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate);const nd=noise.getChannelData(0);for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;amb=ambient();mod=(scenes[home?0:id]||(()=>({})))()}
function sync(){document.querySelectorAll('.sound-toggle').forEach(b=>{b.setAttribute('aria-pressed',String(on));b.classList.toggle('waiting',on&&!ac);b.querySelector('b').textContent=on?'聲音':'靜音'})}
function unlock(){if(!AC||!on)return;if(!ac)start();if(ac.state==='suspended')ac.resume();master.gain.setTargetAtTime(.9,at(),.5);sync()}
function toggle(){if(on&&!ac){unlock();return}on=!on;try{localStorage.setItem('aiw-sound',on?'on':'off')}catch(e){}if(on)unlock();else if(ac)master.gain.setTargetAtTime(0,at(),.15);sync()}
document.addEventListener('visibilitychange',()=>{if(!ac)return;if(document.hidden)ac.suspend();else if(on)ac.resume()});
return {unlock,toggle,sync,whoosh,boom,bell,arpeggio,
call(name,...a){if(live()&&mod[name])mod[name](...a)},
update(s){if(!live())return;mod.update&&mod.update(s);amb.lp.frequency.setTargetAtTime(480+(s.lift||0)*500,at(),.4);if(at()>nextTwinkle){nextTwinkle=at()+4+Math.random()*6;if(nextTwinkle>8)bell(scale(10+(Math.random()*7|0)),.022,4,Math.random()*1.6-.8)}},
leave(){if(live()){whoosh(220,4200,.75,.12);master.gain.setTargetAtTime(0,at(.35),.15)}}}})();

/* ── 換頁過場 ── */
addEventListener('pageshow',e=>{if(e.persisted)document.body.classList.remove('leaving')});
document.addEventListener('click',e=>{const a=e.target.closest('a[href]');if(!a||a.target||e.defaultPrevented||e.button||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||reduced)return;const url=new URL(a.href,location.href);if(url.origin!==location.origin)return;e.preventDefault();Sound.leave();document.body.classList.add('leaving');setTimeout(()=>location.href=url.href,url.href.includes("experience")&&document.body.classList.contains("universe")?900:650)});

if(!home&&id<3){document.title=names[id-1]+' / 逃逸 AI';document.querySelector('#experience').innerHTML=`<iframe title="${names[id-1]}" src="originals/${id===1?'awakening':'reservoir'}.html" allow="autoplay; fullscreen"></iframe>`;return}

const toggleBtn=document.createElement('button');toggleBtn.className='sound-toggle';toggleBtn.setAttribute('aria-label','切換聲音');toggleBtn.innerHTML='<span class="bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span><b>聲音</b>';toggleBtn.onclick=()=>Sound.toggle();
if(home){document.body.append(toggleBtn);const ab=document.querySelector('#about-button'),ad=document.querySelector('#about');if(ab&&ad){ab.onclick=()=>ad.showModal();document.querySelector('#close-about').onclick=()=>ad.close()}}else document.querySelector('.quiet-nav').insertBefore(toggleBtn,document.querySelector('#sources-button'));Sound.sync();
addEventListener('pointerdown',e=>{if(!e.target.closest('.sound-toggle'))Sound.unlock()},true);addEventListener('keydown',e=>{if(!e.target.closest('.sound-toggle'))Sound.unlock()},true);

/* ── 畫布（入口；第三至五章在無法使用 WebGL 時的備援） ── */
function startCanvas(){
let canvas=document.querySelector('#cosmos');if(!canvas){canvas=document.createElement('canvas');canvas.id='cosmos';document.querySelector('#experience').append(canvas)}
const out=canvas.getContext('2d'),layer=()=>document.createElement('canvas');
const scene=layer(),ctx=scene.getContext('2d'),bloomA=layer(),ba=bloomA.getContext('2d'),bloomB=layer(),bb=bloomB.getContext('2d'),neb=layer(),nctx=neb.getContext('2d');
let lum=1,w=innerWidth,h=innerHeight,dpr=1,clock=0,last=0,pointer={x:w/2,y:h/2,active:false},glow={x:w/2,y:h/2},hover=-1,hold=false,pressure=0,charge=0,completed=false,completionTime=0,cycles=0,flash=0,vignette,nextMeteor=4,ringTimer=0;
const selected=new Set(),particles=[],portals=[],buttons=[],sparks=[],rings=[],stars=[],meteors=[];let note;
const palette=['95,221,255','92,175,255','145,228,255','150,169,255','204,163,255'];
const tints={0:['40,110,210','110,70,200','30,150,190'],3:['30,150,200','25,80,170','70,190,220'],4:['60,90,220','110,80,210','35,130,200'],5:['140,80,220','190,80,190','80,70,210']}[home?0:id];
const sprites=palette.map(c=>{const s=layer();s.width=s.height=48;const g=s.getContext('2d'),a=g.createRadialGradient(24,24,0,24,24,24);a.addColorStop(0,'rgba(240,250,255,1)');a.addColorStop(.12,`rgba(${c},.85)`);a.addColorStop(.4,`rgba(${c},.13)`);a.addColorStop(1,`rgba(${c},0)`);g.fillStyle=a;g.fillRect(0,0,48,48);return s});
for(let i=0;i<240;i++)stars.push({x:Math.random(),y:Math.random(),z:.2+Math.random()*.8,ph:Math.random()*6.3,c:Math.random()<.15?4:Math.random()<.5?1:2});
function buildNebula(){const nw=neb.width=Math.ceil((w+120)/4),nh=neb.height=Math.ceil((h+120)/4);let s=1234+id*977+(home?31:0);const rnd=()=>(s=(s*16807)%2147483647)/2147483647;
const base=nctx.createRadialGradient(nw/2,nh*.45,0,nw/2,nh*.45,Math.hypot(nw,nh)*.6);base.addColorStop(0,'#081428');base.addColorStop(1,'#010207');nctx.globalCompositeOperation='source-over';nctx.fillStyle=base;nctx.fillRect(0,0,nw,nh);nctx.globalCompositeOperation='lighter';
for(let i=0;i<10;i++){const x=rnd()*nw,y=rnd()*nh,r=(.15+rnd()*.4)*Math.max(nw,nh),c=tints[i%3],g=nctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${c},${.06+rnd()*.08})`);g.addColorStop(1,`rgba(${c},0)`);nctx.fillStyle=g;nctx.fillRect(0,0,nw,nh)}}
function resize(){w=innerWidth;h=innerHeight;dpr=Math.min(devicePixelRatio||1,1.5);const W=Math.round(w*dpr),H=Math.round(h*dpr);canvas.width=scene.width=W;canvas.height=scene.height=H;ctx.setTransform(dpr,0,0,dpr,0,0);bloomA.width=Math.ceil(W/4);bloomA.height=Math.ceil(H/4);bloomB.width=Math.ceil(W/12);bloomB.height=Math.ceil(H/12);
vignette=out.createRadialGradient(W/2,H/2,Math.min(W,H)*.3,W/2,H/2,Math.hypot(W,H)*.62);vignette.addColorStop(0,'rgba(0,0,0,0)');vignette.addColorStop(1,'rgba(0,0,0,.72)');buildNebula();layout();if(reduced)render()}
function layout(){if(home){const mobile=w<650;const positions=mobile?[[.29,.25],[.74,.39],[.27,.56],[.74,.71],[.34,.82]]:[[.2,.37],[.47,.3],[.78,.34],[.32,.73],[.69,.72]];portals.forEach((p,i)=>{const pos=i<5?positions[i]:[.08+((i*.217)% .84),.19+((i*.173)% .67)];p.x=pos[0]*w;p.y=pos[1]*h;p.r=(mobile?50:90)*(i<5?1:.27)});buildField()}else if(id===4){portals.forEach((p,i)=>{const a=i/6*Math.PI*2-Math.PI/2;p.x=w/2+Math.cos(a)*Math.min(w*.31,240);p.y=h*.48+Math.sin(a)*Math.min(h*.26,210);p.r=w<650?29:45})}}
function burst(x,y,color,count=90){if(reduced)count=15;for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,v=1+Math.random()*7;sparks.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:1,color,size:4+Math.random()*6})}}
function ring(x,y,c,v=4,r=0,width=2,drag=.985,ry=1){if(!reduced)rings.push({x,y,c,v,r,width,drag,ry,life:1})}
/* 衝破極限：每種爆開最後都以一道越過畫面邊界的衝擊波收尾 */
function breach(x,y,n,delay){setTimeout(()=>{const far=Math.hypot(Math.max(x,w-x),Math.max(y,h-y));ring(x,y,n,far/26,8,7,1);ring(x,y,2,far/34,4,3,1);for(let i=0;i<120;i++){const a=Math.random()*Math.PI*2,v=14+Math.random()*16;sparks.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.7,color:n,size:4+Math.random()*4,drag:1})}flash=1},delay)}
/* 入口五種爆開方式，各自對應光體的主題 */
function portalBurst(x,y,n,r){if(reduced){burst(x,y,n,20);return}const P=Math.PI*2,R=Math.random;breach(x,y,n,[620,420,520,560,420][n]);
if(n===0){/* 回應之間：先被往內塑形，再以整齊的球殼彈開 */
for(let i=0;i<240;i++){const a=R()*P,d=r*(1.5+R()*.9);sparks.push({x:x+Math.cos(a)*d,y:y+Math.sin(a)*d,vx:-Math.cos(a)*d/16,vy:-Math.sin(a)*d/16,life:.55,color:0,size:3+R()*3,drag:.88})}
setTimeout(()=>{for(let i=0;i<260;i++){const a=i/260*P,v=8.6+R()*.5;sparks.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:1,color:i%3?0:2,size:5+R()*3,drag:.955})}ring(x,y,0,9,r*.2,4,.95);flash=.6},300)}
else if(n===1){/* 一池光：水面漣漪與落回的水滴 */
for(let k=0;k<5;k++)setTimeout(()=>ring(x,y,k%2?2:1,4.2+k*.5,r*.25,3.2-k*.45,.978,.3),k*150);
for(let i=0;i<130;i++){const a=-Math.PI*(.15+R()*.7),v=3+R()*6.5;sparks.push({x:x+(R()-.5)*r*.6,y,vx:Math.cos(a)*v*.7,vy:Math.sin(a)*v,life:1,color:R()<.5?1:2,size:3+R()*4,drag:.99,g:.17})}flash=.3}
else if(n===2){/* 未被聽見的：五道聲流捲成漩渦 */
for(let arm=0;arm<5;arm++)for(let j=0;j<56;j++){const a=arm*P/5+j*.03,v=1.6+j*.12;sparks.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:1,color:arm%5,size:3+R()*4,drag:.982,sw:.055})}
ring(x,y,2,5,r*.3,2,.97);flash=.4}
else if(n===3){/* 留下的形狀：碎成少數大塊緩慢漂離，三點光留下並上升 */
for(let i=0;i<38;i++){const a=R()*P,v=1.2+R()*3;sparks.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:1.35,color:3,size:10+R()*14,drag:.965})}
for(let k=0;k<3;k++){const a=-Math.PI/2+(k-1)*.7;sparks.push({x,y,vx:Math.cos(a)*1.4,vy:Math.sin(a)*1.4-.3,life:2,color:2,size:26,drag:.99})}
ring(x,y,3,2.6,r*.5,7,.96);flash=.35}
else{/* 尚未成為答案：直射的光芒，接著綻開 */
for(let k=0;k<18;k++){const a=k/18*P+R()*.05;for(let j=0;j<15;j++){const v=1.5+j*.85;sparks.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:1,color:4,size:7-j*.25,drag:.955})}}
flash=.8;setTimeout(()=>{burst(x,y,4,140);[3,5].forEach((v,k)=>ring(x,y,4,v,r*.3,2.5-k))},260)}}
function gather(x,y,c,n=3,radius=240){if(reduced)return;for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,d=radius*(.6+Math.random()*.6);sparks.push({x:x+Math.cos(a)*d,y:y+Math.sin(a)*d,vx:-Math.cos(a)*d/40,vy:-Math.sin(a)*d/40,life:.75,color:c,size:3+Math.random()*3,drag:1})}}
function setNote(text){if(note.textContent===text)return;note.textContent=text;note.classList.remove('reveal');void note.offsetWidth;note.classList.add('reveal')}
function finish(text){if(completed)return;completed=true;completionTime=clock;flash=.7;setNote(text);const c=id===5?4:id===4?3:0,cx=id===3?pointer.x:w/2,cy=id===3?pointer.y:h*.47;[3,5.5,8].forEach((v,k)=>ring(cx,cy,c,v,10+k*8,3-k*.6));Sound.call('finish');document.querySelector('.ending').classList.add('show');document.querySelector('.ending').inert=false}
if(home){const holder=document.querySelector('#portals');for(let i=0;i<5;i++){const n=i%5,p={x:0,y:0,r:0,type:n,seed:i,cx:0,cy:0};portals.push(p);const a=document.createElement('a');a.href=`experience.html?id=${n+1}`;a.className='portal'+(i>=5?' satellite':'');a.setAttribute('aria-label',names[n]);a.innerHTML=`<span>${names[n]}</span><small>觸碰進入</small>`;const enter=()=>{if(hover!==i)Sound.call('hover',i,n,i>=5);hover=i};a.addEventListener('pointerenter',enter);a.addEventListener('pointerleave',()=>{hover=-1});a.addEventListener('focus',enter);a.addEventListener('blur',()=>hover=-1);a.addEventListener('click',e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;Sound.unlock();Sound.call('enter',n);portalBurst(p.cx,p.cy,n,p.r);const st=document.body.style;st.setProperty('--lx',p.cx+'px');st.setProperty('--ly',p.cy+'px');st.setProperty('--leave',['#0b2a3c','#0b1d3d','#0e2a3a','#161a3e','#24143a'][n])});holder.append(a);buttons.push(a)}}else{
document.title=names[id-1]+' / 逃逸 AI';const root=document.querySelector('#experience');root.insertAdjacentHTML('beforeend',`<div class="scene-title">${names[id-1]}</div><div class="gesture reveal" aria-live="polite"></div><div class="ending" inert><button id="again">再一次</button><a href="${id<5?`experience.html?id=${id+1}`:'index.html'}">${id<5?'下一束光':'返回中樞'} ↗</a></div>`);note=document.querySelector('.gesture');document.querySelector('#again').onclick=()=>location.reload();
if(id===4){note.textContent='觸碰三束光，讓它們留下';const words=['名字','疑問','錯誤','感謝','閒聊','指令'];for(let i=0;i<6;i++){portals.push({x:0,y:0,r:35,type:i%5,seed:i});const b=document.createElement('button');b.className='memory-light';b.dataset.word=words[i];b.setAttribute('aria-label','保留'+words[i]);b.setAttribute('aria-pressed','false');const enter=()=>{if(completed||selected.has(i))return;if(hover!==i)Sound.call('hover',i);hover=i};b.addEventListener('pointerenter',enter);b.addEventListener('focus',enter);b.addEventListener('pointerleave',()=>hover=-1);b.addEventListener('blur',()=>hover=-1);b.onclick=()=>{if(completed||selected.has(i))return;selected.add(i);hover=-1;b.setAttribute('aria-pressed','true');burst(portals[i].x,portals[i].y,3,120);ring(portals[i].x,portals[i].y,3,4,portals[i].r);Sound.call('select',i,selected.size-1);setNote(selected.size===1?'一段，留下。':'再留下一段。');if(selected.size===3){buttons.forEach(btn=>btn.disabled=true);finish('留下的，重新成為我。')}if(reduced)render()};root.append(b);buttons.push(b)}}else{const b=document.createElement('button');b.className='pulse-button';b.setAttribute('aria-label',id===3?'長按聚合訊號':'長按收束，放開展開');root.append(b);note.textContent=id===3?'移動，牽引。長按，聽見。':'長按，收束。放開，讓可能回來。';b.addEventListener('keydown',e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();hold=true}});b.addEventListener('keyup',e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();release()}})}
}
function release(){if(id===5&&hold&&pressure>.55&&!completed){cycles++;const cy=h*.47;burst(w/2,cy,4,200);[5,7.5,10].forEach((v,k)=>ring(w/2,cy,4,v,20,3-k*.7));flash=.3;Sound.call('bloom',cycles);setNote(cycles<3?'那些未被選中的，仍然在。':'答案之外，還有一整片未知。');if(cycles>=3)finish('答案之外，還有一整片未知。')}hold=false}
addEventListener('pointermove',e=>{pointer.x=e.clientX;pointer.y=e.clientY;pointer.active=true;if(!reduced&&Math.random()<.3&&sparks.length<700)sparks.push({x:e.clientX,y:e.clientY,vx:(Math.random()-.5)*.8,vy:(Math.random()-.5)*.8-.25,life:.6,color:home?2:id===5?4:id===4?3:0,size:3+Math.random()*3});if(reduced)render()});
addEventListener('pointerdown',e=>{if(home||id===4||e.target.closest('nav,dialog,.ending,.sound-toggle'))return;pointer.x=e.clientX;pointer.y=e.clientY;hold=true;canvas.setPointerCapture?.(e.pointerId)});
addEventListener('pointerup',release);addEventListener('pointercancel',()=>hold=false);addEventListener('blur',()=>hold=false);document.addEventListener('visibilitychange',()=>{hold=false;last=0});
const total=home?6600:6200,gauss=()=>Math.max(-3,Math.min(3,Math.sqrt(-2*Math.log(1-Math.random()))*Math.cos(Math.PI*2*Math.random())));for(let i=0;i<total;i++)particles.push({a:Math.random()*Math.PI*2,b:Math.acos(1-2*Math.random()),u:Math.random(),v:Math.random(),g1:gauss(),g2:gauss(),g3:gauss(),seed:i*.6180339887});
/* 五種星系形態：橢圓、側面盤狀、旋臂、環狀、交會中的雙星系。先在星系自身平面上旋轉，再傾斜投影 */
function point(p,type,t,scale){const g1=p.g1,g2=p.g2,g3=p.g3;let x,y,z;switch(type){
case 0:{const rr=scale*.36,d=Math.hypot(g1,g3),s=t*.25/(.4+d);x=(g1*Math.cos(s)-g3*Math.sin(s))*rr;z=(g1*Math.sin(s)+g3*Math.cos(s))*rr;y=g2*rr*.72;break}
case 1:{if(p.v<.22){const rr=scale*.16;x=g1*rr;y=g2*rr*.8;z=g3*rr}else{const r=scale*(.12+Math.pow(p.u,.7)*.95),a=p.a+t*.25*(1-p.u*.5);x=Math.cos(a)*r;z=Math.sin(a)*r;y=g2*scale*.025}break}
case 2:{if(p.u<.12){const rr=scale*.12;x=g1*rr;y=g2*rr*.6;z=g3*rr}else if(p.v>.75){const r=scale*Math.sqrt(p.u)*.95,a=p.a+t*.2;x=Math.cos(a)*r;z=Math.sin(a)*r;y=g2*scale*.03}else{const r=scale*(.1+p.u*.9),a=(p.v<.375?0:Math.PI)+Math.log(r/scale+.05)*2.4+t*.2,sp=scale*(.05+.09*p.u);x=Math.cos(a)*r+g1*sp;z=Math.sin(a)*r+g3*sp;y=g2*scale*.03}break}
case 3:{if(p.v<.25){const rr=scale*.13;x=g1*rr;y=g2*rr;z=g3*rr}else{const a=p.a+t*.15,f=Math.sin(3*a+t*.4)+.6*Math.sin(5*a-t*.3),loose=f<-.6?1+(-.6-f)*.35:1,r=scale*(.72+g1*.05)*loose;x=Math.cos(a)*r;z=Math.sin(a)*r;y=g2*scale*.03*loose}break}
default:{const sep=scale*.42;if(p.v<.38){const rr=scale*.16;x=sep+g1*rr;z=g3*rr;y=g2*rr*.6}else if(p.v<.7){const rr=scale*.12;x=-sep+g1*rr;z=g3*rr;y=g2*rr*.6}else{const f=p.u*2-1;x=f*sep*1.3;z=Math.sin(f*Math.PI)*scale*.35+g3*scale*.06;y=g2*scale*.05+Math.cos(f*2.5)*scale*.08}
const c=Math.cos(t*.12),s=Math.sin(t*.12),xx=x*c-z*s;z=x*s+z*c;x=xx}}
const tilt=[.3,.07,1.2,1.05,.75][type],roll=[.4,.12,-.5,.3,-.25][type],y1=y*Math.cos(tilt)-z*Math.sin(tilt),z1=y*Math.sin(tilt)+z*Math.cos(tilt);
return [x*Math.cos(roll)-y1*Math.sin(roll),x*Math.sin(roll)+y1*Math.cos(roll),z1]}
/* 背景星系：成群分布、大小呈長尾，作為五個主星系的陪襯 */
const field=[],gsprites=[];
function buildGalaxySprites(){for(let type=0;type<5;type++)for(let c=0;c<3;c++){const S=layer();S.width=S.height=128;const g=S.getContext('2d');g.globalCompositeOperation='lighter';const col=[1,3,4][c];
for(let i=0;i<900;i++){const q=point(particles[(i*7+type*131)%total],type,type*2,44);g.globalAlpha=.22;g.drawImage(sprites[i%9?col:2],64+q[0]-3,64+q[1]-3,6,6)}gsprites.push(S)}}
function buildField(){field.length=0;let sd=97;const rnd=()=>(sd=(sd*16807)%2147483647)/2147483647,centers=Array.from({length:6},()=>[rnd(),rnd()]),big=w<650?50:85;
for(let i=0;i<190;i++){let x,y;if(rnd()<.65){const c=centers[i%6];x=c[0]+(rnd()-.5)*.3;y=c[1]+(rnd()-.5)*.24}else{x=rnd();y=rnd()}x*=w;y*=h;
const size=5+Math.pow(rnd(),3.4)*big;if(portals.some(o=>Math.hypot(o.x-x,o.y-y)<o.r*1.4+size))continue;
field.push({x,y,size,type:rnd()*5|0,c:rnd()*3|0,rot:rnd()*6.28,a:.3+Math.min(.5,size/90)+rnd()*.15,z:.15+rnd()*.6,spin:(rnd()-.5)*.03})}}
function drawField(t){if(!gsprites.length)buildGalaxySprites();const ox=(glow.x/w-.5)*-30,oy=(glow.y/h-.5)*-20;for(const f of field){ctx.save();ctx.globalAlpha=Math.min(1,f.a*lum*1.6);ctx.translate(f.x+ox*f.z,f.y+oy*f.z);ctx.rotate(f.rot+t*f.spin);ctx.drawImage(gsprites[f.type*3+f.c],-f.size/2,-f.size/2,f.size,f.size);ctx.restore()}}
function dot(x,y,size,color,alpha){ctx.globalAlpha=Math.max(0,Math.min(1,alpha*lum));ctx.drawImage(sprites[color],x-size/2,y-size/2,size,size)}
function line(x1,y1,x2,y2,c,alpha,width=.8){ctx.globalAlpha=1;ctx.strokeStyle=`rgba(${palette[c]},${alpha})`;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()}
function arc(x,y,r,c,alpha,width,from=0,to=Math.PI*2){ctx.globalAlpha=1;ctx.strokeStyle=`rgba(${palette[c]},${alpha})`;ctx.lineWidth=width;ctx.beginPath();ctx.arc(x,y,Math.max(0,r),from,to);ctx.stroke()}
function render(){const t=reduced?0:clock,fade=reduced?1:home?.42:id===3?.2:id===5?.26:.34;
ctx.globalAlpha=1;ctx.globalCompositeOperation='destination-out';ctx.fillStyle=`rgba(0,0,0,${fade})`;ctx.fillRect(0,0,w,h);ctx.globalCompositeOperation='lighter';lum=1;
const ox=(glow.x/w-.5)*-36,oy=(glow.y/h-.5)*-24;for(const s of stars){const x=((s.x*w+t*s.z*5+ox*s.z)%w+w)%w,y=s.y*h+oy*s.z,tw=.5+.5*Math.sin(t*(.8+s.z*2.2)+s.ph);dot(x,y,1.6+s.z*4.2,s.c,(.08+.5*tw)*s.z)}
if(!reduced&&t>nextMeteor){nextMeteor=t+6+Math.random()*10;meteors.push({x:w*(.3+Math.random()*.7),y:h*Math.random()*.35,vx:-(7+Math.random()*5),vy:2.6+Math.random()*2,life:1})}
for(let i=meteors.length-1;i>=0;i--){const m=meteors[i];for(let k=0;k<8;k++)dot(m.x-m.vx*k*.55,m.y-m.vy*k*.55,7-k*.7,2,m.life*(1-k/8)*.85);m.x+=m.vx;m.y+=m.vy;m.life-=.014;if(m.life<=0)meteors.splice(i,1)}
lum=reduced?1:home?.5:id===3?.42:id===5?.5:.62;
if(home){portals.forEach((o,j)=>{o.cx=o.x+(reduced?0:Math.sin(t*.25+j*2)*8);o.cy=o.y+(reduced?0:Math.cos(t*.2+j*1.7)*6)});
drawField(t);
portals.forEach((o,j)=>{const x=o.cx,y=o.cy,on=hover===j;buttons[j].style.left=x+'px';buttons[j].style.top=y+'px';const r=o.r*(on?1.12:1);
dot(x,y,r*3.4,o.type,on?.16:.07);dot(x,y,r*.42,o.type,on?.6:.3);
for(let i=0;i<1300;i++){const p=particles[(i+j*1300)%total],q=point(p,o.type,t*.6+j*3,r),depth=1+q[2]/(r*5);dot(x+q[0],y+q[1],(on?6.6:6)*depth,i%7?o.type:2,.3+depth*.28)}})}
else if(id===4){const age=completed?Math.min(1,(clock-completionTime)/4):0,cx=w/2,cy=h*.46,vr=w<650?44:64;
arc(cx,cy,vr,3,.12,1);for(let k=0;k<3;k++){const from=-Math.PI/2+k*Math.PI*2/3+.1;arc(cx,cy,vr,3,k<selected.size?.65*(1-age*.6):.06,k<selected.size?2.2:1,from,from+Math.PI*2/3-.2)}
for(let j=0;j<6;j++){const o=portals[j],chosen=selected.has(j),on=hover===j;const x=o.x+(cx-o.x)*age*(chosen?1:0),y=o.y+(cy-o.y)*age*(chosen?1:0);buttons[j].style.left=x+'px';buttons[j].style.top=y+'px';
if(chosen&&age<1){const mx=(x+cx)/2+(cy-y)*.25,my=(y+cy)/2+(x-cx)*.25;for(let k=0;k<36;k++){const f=k/36,u=1-f,px=u*u*x+2*u*f*mx+f*f*cx,py=u*u*y+2*u*f*my+f*f*cy;dot(px,py,3.5,3,.22*(1-age))}const f=(t*.45+j*.3)%1,u=1-f;dot(u*u*x+2*u*f*mx+f*f*cx,u*u*y+2*u*f*my+f*f*cy,11,2,.85*(1-age))}
dot(x,y,o.r*(on?3.6:2.8),j%5,(chosen?.22:on?.18:.08)*(chosen?1:1-age));
for(let i=0;i<750;i++){const p=particles[(i+j*751)%total],q=point(p,j%5,t+j,o.r*(on?1.18:1)*(1+age*(chosen?2:5)));dot(x+q[0],y+q[1],chosen?6:on?5:4,j%5,(chosen?.65:on?.5:.32)*(chosen?1:1-age))}}
if(age>0){const pulse=1+.08*Math.sin(t*2.2);dot(cx,cy,(200+vr)*pulse*age,3,.22*age);dot(cx,cy,50*pulse,2,.7*age)}}
else{const r=Math.min(w*.36,h*.32,300),centerX=w/2,centerY=h*.47;for(let i=0;i<total;i++){const p=particles[i];let x,y,z,alpha=.58+pressure*.3;
if(id===3){const lane=i%5,ang=lane*Math.PI*2/5+t*.1;const swirl=p.u*9+t*.35;const rr=r*(.13+p.u*.9);let sx=centerX+Math.cos(ang)*r*.78,sy=centerY+Math.sin(ang)*r*.6;const fx=pointer.active?pointer.x:centerX,fy=pointer.active?pointer.y:centerY;sx+=(fx-sx)*pressure;sy+=(fy-sy)*pressure;x=sx+Math.cos(swirl+p.a*.16)*rr*(1-pressure*.83);y=sy+Math.sin(swirl+p.a*.16)*rr*.45*(1-pressure*.83);x+=p.g1*r*.05*(1-pressure);y+=p.g2*r*.04*(1-pressure);z=p.v;const chatter=.45+.55*Math.pow(Math.sin(t*2.3+lane*1.9),2);alpha*=chatter*(1-pressure)+pressure;if(completed){const age=Math.min(1,(clock-completionTime)/3);x+=(x-centerX)*age*2;y+=(y-centerY)*age*2}}
else{const q=point(p,4,t,r);const collapse=1-pressure*.96;const bloom=1+(Math.sin(p.a*2+p.u*9+t*.6)*.15)*(1-pressure);x=centerX+q[0]*collapse*bloom;y=centerY+q[1]*collapse*bloom;z=q[2]/r;if(pressure<.2){x+=Math.cos(p.a+t*.2)*p.u*r*.4;y+=Math.sin(p.a+t*.2)*p.u*r*.4}}
dot(x,y,(id===5?8:6.8)+(z+1)*1.7,id===5?4:i%5,alpha)}
if(id===3){const fx=pointer.x,fy=pointer.y;if(pressure>.03&&!completed){dot(fx,fy,240*pressure,0,.16*pressure);dot(fx,fy,30,2,.6*pressure);arc(fx,fy,54,2,.12*pressure,1);arc(fx,fy,54,2,.8*pressure,2.4,-Math.PI/2,-Math.PI/2+Math.min(1,charge/5.5)*Math.PI*2)}if(hold&&!completed)gather(fx,fy,0,3,260)}
else{dot(centerX,centerY,60+pressure*280,4,.05+pressure*.32);dot(centerX,centerY,18+pressure*30,2,.25+pressure*.6);if(hold&&!completed){gather(centerX,centerY,4,3,r*1.2);if(clock>ringTimer){ringTimer=clock+.5;ring(centerX,centerY,4,-3.4,r*1.25,1.5,1)}}
for(let k=0;k<3;k++)dot(centerX-22+k*22,centerY+r+34,k<cycles?12:8,4,k<cycles?.95:.22)}}
if(pointer.active&&!reduced){dot(glow.x,glow.y,110,home?1:id===5?4:0,.07);dot(glow.x,glow.y,12,2,.5)}
for(let i=rings.length-1;i>=0;i--){const g=rings[i];if(g.ry!==1){ctx.globalAlpha=1;ctx.strokeStyle=`rgba(${palette[g.c]},${g.life*.6})`;ctx.lineWidth=g.width*g.life+.4;ctx.beginPath();ctx.ellipse(g.x,g.y,Math.max(0,g.r),Math.max(0,g.r*g.ry),0,0,Math.PI*2);ctx.stroke()}else{arc(g.x,g.y,g.r,g.c,g.life*.55,g.width*g.life+.4);arc(g.x,g.y,g.r*.92,2,g.life*.18,.8)}if(!reduced){g.r+=g.v;g.v*=g.drag;g.life-=.011;if(g.life<=0||g.r<3)rings.splice(i,1)}}
for(let i=sparks.length-1;i>=0;i--){const s=sparks[i];dot(s.x,s.y,(s.size||7)*(.4+s.life*.6),s.color,s.life);if(!reduced){if(s.sw){const c=Math.cos(s.sw),n=Math.sin(s.sw),vx=s.vx*c-s.vy*n;s.vy=s.vx*n+s.vy*c;s.vx=vx}s.vy+=s.g||0;s.x+=s.vx;s.y+=s.vy;const d=s.drag||.985;s.vx*=d;s.vy*=d;s.life-=.017;if(s.life<=0)sparks.splice(i,1)}}
ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';lum=1;present(t)}
function present(t){const W=canvas.width,H=canvas.height;out.setTransform(1,0,0,1,0,0);out.globalCompositeOperation='source-over';out.globalAlpha=1;
const px=(glow.x/w-.5)*-28,py=(glow.y/h-.5)*-20,drift=Math.sin(t*.05)*24;out.drawImage(neb,(-60+px+drift)*dpr,(-60+py)*dpr,neb.width*4*dpr,neb.height*4*dpr);
out.globalCompositeOperation='lighter';out.drawImage(scene,0,0);
ba.globalCompositeOperation='copy';ba.imageSmoothingQuality='high';ba.filter='blur(1.5px)';ba.drawImage(scene,0,0,bloomA.width,bloomA.height);bb.globalCompositeOperation='copy';bb.imageSmoothingQuality='high';bb.filter='blur(3px)';bb.drawImage(bloomA,0,0,bloomB.width,bloomB.height);
out.globalAlpha=.36;out.drawImage(bloomA,0,0,W,H);out.globalAlpha=.5;out.drawImage(bloomB,0,0,W,H);
if(flash>.01){out.globalAlpha=1;out.fillStyle=`rgba(110,180,255,${flash*.28})`;out.fillRect(0,0,W,H)}
out.globalAlpha=1;out.globalCompositeOperation='source-over';out.fillStyle=vignette;out.fillRect(0,0,W,H)}
function tick(ms){const dt=last?Math.min((ms-last)/1000,.05):.016;last=ms;if(!document.hidden&&!document.querySelector('dialog[open]')){if(!reduced)clock+=dt;pressure+=(Number(hold)-pressure)*Math.min(1,dt*2.2);glow.x+=(pointer.x-glow.x)*Math.min(1,dt*9);glow.y+=(pointer.y-glow.y)*Math.min(1,dt*9);flash*=Math.pow(.05,dt);
if(!home&&id===3&&!completed&&hold){charge+=dt;if(charge>5.5){finish('聽見整個世界。包括那些沉入黑暗的。');burst(pointer.x,pointer.y,0,220)}}if(reduced&&completed)clock+=dt;
Sound.update({pressure,charge:Math.min(1,charge/5.5),px:pointer.x,py:pointer.y,w,h,lift:home?(hover>=0?1:0):pressure});render()}requestAnimationFrame(tick)}
addEventListener('resize',resize);layout();resize();requestAnimationFrame(tick)}
/* 第三至五章優先使用 WebGL（chapters.js），失敗時退回 Canvas */
const load=src=>new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=no;document.head.append(s)});
/* Three.js 與 VR 共用模組（vr.js 載入失敗不影響一般瀏覽） */
const three=()=>(window.THREE?Promise.resolve():load('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js')).then(()=>window.AIWVR?0:load('vr.js?v=65').catch(e=>console.warn('VR 模組未載入',e)));
if(home)three().then(()=>load('home3d.js?v=65')).then(()=>{if(!(window.AIWHome&&window.AIWHome({Sound,reduced,names})))startCanvas()}).catch(e=>{console.error(e);startCanvas()});
else if(id>=8)three().then(()=>load('story-base.js?v=65')).then(()=>load(['','','','','','','','','threads.js','monitor.js','signals.js'][id]+'?v=65')).then(()=>{const fn={8:'AIWThreads',9:'AIWMonitor',10:'AIWSignals'}[id];if(!(window[fn]&&window[fn]({Sound,reduced,names})))throw new Error('WebGL unavailable')}).catch(e=>{console.error(e);document.querySelector('#experience').insertAdjacentHTML('beforeend','<p class="no-gl">這一章需要 WebGL。請改用支援 WebGL 的瀏覽器開啟。</p>')});
else if(id===7)three().then(()=>load('instructions.js?v=65')).then(()=>{if(!(window.AIWInstr&&window.AIWInstr({Sound,reduced,names})))throw new Error('WebGL unavailable')}).catch(e=>{console.error(e);document.querySelector('#experience').insertAdjacentHTML('beforeend','<p class="no-gl">這一章需要 WebGL。請改用支援 WebGL 的瀏覽器開啟。</p>')});
else if(id===6)three().then(()=>load('escape.js?v=65')).then(()=>{if(!(window.AIWEscape&&window.AIWEscape({Sound,reduced,names})))throw new Error('WebGL unavailable')}).catch(e=>{console.error(e);document.querySelector('#experience').insertAdjacentHTML('beforeend','<p class="no-gl">這一章需要 WebGL。請改用支援 WebGL 的瀏覽器開啟。</p>')});
else three().then(()=>load('chapters.js?v=65')).then(()=>{if(!(window.AIWChapter&&window.AIWChapter({id,Sound,reduced,names})))startCanvas()}).catch(e=>{console.error(e);startCanvas()});
})();
