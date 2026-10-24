/* 第八至十章（近期新聞）共用基底：Three.js r128。
   提供：渲染器與場景、文字層（標題／指示／詩句／進度／結尾）、指標與鍵盤、光點火花、
   以及 VR（光點組成的手）——手指直接「觸碰」與「捏合」都是正式操作，不是附加功能。
   用法：const B=AIWStory(opts,cfg)；B.run(frame) 每幀呼叫 frame(dt)，基底負責繪製。 */
window.AIWStory=function(opts,cfg){'use strict';
const {Sound,reduced,names}=opts;if(!window.THREE)return null;
let renderer;try{renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance'});if(!renderer.getContext())return null}catch(e){return null}
const idx=cfg.index,PI=Math.PI,R=Math.random,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),V3=THREE.Vector3;
document.title=names[idx]+' / 逃逸 AI';
const root=document.querySelector('#experience'),mobile=Math.min(innerWidth,innerHeight)<700;
const el=renderer.domElement;el.className='gl story-gl';root.append(el);renderer.setClearColor(cfg.bg||0x030204,1);
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(cfg.fov||55,1,1,20000),rig=new THREE.Group();scene.add(rig);rig.add(camera);
const lastChapter=idx>=names.length-1;
root.insertAdjacentHTML('beforeend',`<div class="scene-title">${names[idx]}<small>${(window.AIW_EN||[])[idx]||''}</small><em>${cfg.tag||''}</em></div><div class="hud" aria-hidden="true"></div><div class="verse" aria-live="polite"><div class="inst"><div class="zh"></div><div class="en"></div></div><div class="poem"><div class="zh"></div><div class="en"></div></div></div><div class="progress"><i></i></div><div class="flash"></div><div class="ending" inert><button id="again">再一次</button><a href="${lastChapter?'index.html':`experience.html?id=${idx+2}`}">${lastChapter?'返回中樞':'下一則故事'} ↗</a>${lastChapter?'<a href="tongue.html">終端 ↗</a>':''}</div>`);
const $=s=>root.querySelector(s),instEl=$('.inst'),poemEl=$('.poem'),bar=$('.progress i'),flashEl=$('.flash'),ending=$('.ending'),hud=$('.hud');
flashEl.style.background=cfg.flashColor||'#fff';$('#again').onclick=()=>location.reload();

/* ── 共用 uniforms（章節的材質請直接使用） ── */
const U={uTime:{value:0},uPixel:{value:1},uWS:{value:1},uVR:{value:1}};
const S={time:0,dt:.016,hold:false,pressure:0,px:innerWidth/2,py:innerHeight/2,inVR:false,vrHold:false,completed:false,textIdx:0,idle:0,aspect:1,portrait:false};
let mouseHold=false,keyHold=false,keyMode=false,shown=null,flash=0;

/* ── 提示 ── */
const hint=document.createElement('div');hint.className='orbit-hint';const hs=cfg.hint||['移動，經過　·　長按','MOVE · HOLD'];hint.innerHTML=`${hs[0]}<span>${hs[1]}</span>`;root.append(hint);setTimeout(()=>hint.classList.add('gone'),14000);

/* ── 輸入：指標移動＝光／視線；按住＝長按；方向鍵與空白鍵可替代 ── */
const ignore=e=>e.target.closest&&e.target.closest('nav,dialog,.ending,.sound-toggle,.vr-button,.gate');
addEventListener('pointermove',e=>{S.px=e.clientX;S.py=e.clientY;keyMode=false;S.idle=0});
addEventListener('pointerdown',e=>{if(ignore(e))return;S.px=e.clientX;S.py=e.clientY;keyMode=false;mouseHold=true;S.idle=0;hint.classList.add('gone')});
addEventListener('pointerup',()=>mouseHold=false);addEventListener('pointercancel',()=>mouseHold=false);addEventListener('blur',()=>{mouseHold=false;keyHold=false});
document.addEventListener('visibilitychange',()=>{mouseHold=false;keyHold=false;lastMs=0});
const isHold=e=>[' ','Enter'].includes(e.key);
addEventListener('keydown',e=>{if(document.querySelector('dialog[open]')||(e.target.closest&&e.target.closest('a,nav button,.ending,.gate')))return;
 const k={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];
 if(k){e.preventDefault();keyMode=true;S.px=clamp(S.px+k[0]*44,0,innerWidth);S.py=clamp(S.py+k[1]*44,0,innerHeight);hint.classList.add('gone')}else if(isHold(e)&&!S.completed){e.preventDefault();keyHold=true}});
addEventListener('keyup',e=>{if(isHold(e))keyHold=false});

/* ── 光點火花：持續存在的（emit）與只畫一幀的（imm） ── */
const PB=4200,pp=new Float32Array(PB*3),pc=new Float32Array(PB*3),ps=new Float32Array(PB),pa=new Float32Array(PB),parts=[];let m=0;
const pgeo=new THREE.BufferGeometry();pgeo.setAttribute('position',new THREE.BufferAttribute(pp,3));pgeo.setAttribute('aCol',new THREE.BufferAttribute(pc,3));pgeo.setAttribute('aSize',new THREE.BufferAttribute(ps,1));pgeo.setAttribute('aAlpha',new THREE.BufferAttribute(pa,1));
const sparks=new THREE.Points(pgeo,new THREE.ShaderMaterial({uniforms:U,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false,
vertexShader:`uniform float uPixel,uWS,uVR;attribute vec3 aCol;attribute float aSize,aAlpha;varying vec3 vColor;varying float vAlpha;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(aSize*uPixel*uVR*(900./max(-mv.z/uWS,1.)),1.,90.);vColor=aCol;vAlpha=aAlpha;}`,
fragmentShader:`varying vec3 vColor;varying float vAlpha;void main(){vec2 c=gl_PointCoord-.5;float d=length(c);if(d>.5)discard;float k=smoothstep(.5,0.,d);gl_FragColor=vec4(vColor,(k*k*.85+k*.2)*vAlpha);}`}));sparks.frustumCulled=false;sparks.renderOrder=9;scene.add(sparks);
function emit(p,v,o){if(parts.length<1800)parts.push({p:new V3(p.x,p.y,p.z),v:new V3(v.x,v.y,v.z),life:o.life||1,max:o.life||1,size:o.size||3,col:o.col||[1,.9,.85],g:o.g||0,d:o.d==null?.25:o.d})}
function imm(x,y,z,size,alpha,col){if(m>=PB)return;pp[m*3]=x;pp[m*3+1]=y;pp[m*3+2]=z;pc[m*3]=col[0];pc[m*3+1]=col[1];pc[m*3+2]=col[2];ps[m]=size;pa[m]=alpha;m++}
function burst(p,n,speed,o){for(let i=0;i<n;i++){const a=R()*PI*2,b=Math.acos(1-2*R()),s=speed*(.3+R()*.7);emit(p,{x:Math.sin(b)*Math.cos(a)*s,y:Math.cos(b)*s,z:Math.sin(b)*Math.sin(a)*s},o)}}

/* ── 文字 ── */
function setText(i){S.textIdx=i}
function verse(ip,pp2){const d=cfg.text[S.textIdx]||cfg.text[0];if(d!==shown){shown=d;const ins=S.inVR&&d.vi?d.vi:d.i;instEl.querySelector('.zh').textContent=ins?ins[0]:'';instEl.querySelector('.en').textContent=ins?ins[1]:'';poemEl.querySelector('.zh').textContent=d.p[0];poemEl.querySelector('.en').textContent=d.p[1]}
 instEl.style.opacity=ip;poemEl.style.opacity=pp2;poemEl.style.filter=`blur(${(1-pp2)*10}px)`;poemEl.style.transform=`scale(${.95+pp2*.05})`}
function setBar(p){bar.style.width=clamp(p,0,1)*100+'%'}
function doFlash(s=.5){flash=1;flashEl.style.transition='none';flashEl.style.opacity=s;requestAnimationFrame(()=>requestAnimationFrame(()=>{flashEl.style.transition='opacity 1.4s ease-out';flashEl.style.opacity=0}))}
function finish(){if(S.completed)return;S.completed=true;Sound.call('finish');ending.classList.add('show');ending.inert=false;bar.parentNode.style.opacity=0}

/* ── 指標 → 射線（場景座標） ── */
const rayO=new V3(),rayD=new V3();
function pointerRay(){rayO.copy(camera.position);rayD.set(S.px/innerWidth*2-1,-(S.py/innerHeight)*2+1,.5).unproject(camera).sub(camera.position).normalize();return {o:rayO,d:rayD}}

/* ── VR：光點組成的手。touch（指尖）與 pinch（捏合）都由章節自行決定意義 ── */
const hands=[];
const vr=window.AIWVR&&window.AIWVR({renderer,scene,camera,rig,mount:b=>document.querySelector('.quiet-nav').insertBefore(b,document.querySelector('.sound-toggle')),
 onStart(){Sound.unlock();S.inVR=true;camera.near=.05;camera.updateProjectionMatrix();cfg.vrStart&&cfg.vrStart(rig,U);shown=null},
 onEnd(){S.inVR=false;S.vrHold=false;rig.scale.setScalar(1);rig.position.set(0,0,0);rig.quaternion.identity();U.uWS.value=1;U.uVR.value=1;camera.near=1;camera.updateProjectionMatrix();resize();cfg.vrEnd&&cfg.vrEnd();shown=null},
 onPinchStart(h){if(S.completed){location.href=ending.querySelector('a').href;return}S.vrHold=true;hint.classList.add('gone');cfg.onPinch&&cfg.onPinch(h)},
 onPinchEnd(){if(!vr.anyPinch())S.vrHold=false}});
function vrHands(){hands.length=0;if(!vr)return hands;for(const h of vr.hands){const live=h.tracked||(!h.isHand&&h.pts.length);if(live)hands.push({tip:h.tipW,pinching:h.pinching,raw:h})}return hands}
const W=t=>t.replace(/長按/g,'捏住').replace(/放開/g,'鬆開').replace(/拖曳移動光|移動，/g,'手指伸向').replace(/點選|輕點|點一下/g,'指尖碰觸');

function resize(){renderer.setPixelRatio(Math.min(devicePixelRatio||1,mobile?1.5:2));renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();U.uPixel.value=renderer.getPixelRatio();S.aspect=camera.aspect;S.portrait=innerWidth<innerHeight;cfg.onResize&&cfg.onResize(S)}
addEventListener('resize',resize);

let lastMs=0,running=null;const snd={};
function tick(ms){const dt=lastMs?Math.min((ms-lastMs)/1000,.05):.016;lastMs=ms;if(document.hidden||document.querySelector('dialog[open]'))return;
 S.dt=dt;S.time+=dt*(reduced?.6:1);U.uTime.value=S.time;S.idle+=dt;S.inVR=renderer.xr.isPresenting;
 if(S.inVR){vr.update();vrHands();S.hold=!S.completed&&S.vrHold}else{hands.length=0;S.hold=!S.completed&&(mouseHold||keyHold)}
 S.pressure+=(Number(S.hold)-S.pressure)*Math.min(1,dt*2.2);
 m=0;running(dt,S);
 let k=m;for(let i=parts.length-1;i>=0;i--){const q=parts[i];q.p.addScaledVector(q.v,dt);q.v.multiplyScalar(Math.pow(q.d,dt));q.v.y-=q.g*dt;q.life-=dt;if(q.life<=0){parts.splice(i,1);continue}if(k>=PB)continue;pp[k*3]=q.p.x;pp[k*3+1]=q.p.y;pp[k*3+2]=q.p.z;pc[k*3]=q.col[0];pc[k*3+1]=q.col[1];pc[k*3+2]=q.col[2];ps[k]=q.size*(.4+.6*q.life/q.max);pa[k]=Math.min(1,q.life/q.max*1.6);k++}
 pgeo.setDrawRange(0,k);['position','aCol','aSize','aAlpha'].forEach(n=>pgeo.attributes[n].needsUpdate=true);
 flash*=Math.pow(.05,dt);
 Sound.update(Object.assign({pressure:S.pressure,charge:0,px:S.px,py:S.py,w:innerWidth,h:innerHeight,lift:S.pressure},snd));
 if(S.inVR){const d=cfg.text[S.textIdx]||cfg.text[0],i2=d.vi||d.i;vr.text([[i2?W(i2[0]):'','inst'],[d.p[0],''],[d.p[1],'en'],[S.completed?'捏合（或按扳機），前往下一個畫面':'','hint']])}
 renderer.render(scene,camera)}
function run(frame){running=frame;resize();renderer.setAnimationLoop(tick)}

return {renderer,scene,camera,rig,root,mobile,U,S,PI,R,clamp,V3,hud,hint,hands,vr,run,emit,imm,burst,setText,verse,setBar,doFlash,finish,pointerRay,resize,Sound,reduced,names,
 vrHands,$,ending,snd}};
