/* VR 共用模組（WebXR，Three.js r128）：所有章節共用同一套 VR 介面。
   · 手由光點組成：25 個關節，骨骼之間再補點；手指指出去時延伸一道點狀光線。
   · 兩個基本手勢：捏合（拇指碰食指）＝點選，捏住不放＝長按；對應電腦與手機的點選、長按。
   · 沒有手勢追蹤時改用控制器：扳機＝捏合，控制器前方的光線＝手指的光線。
   · 網頁文字在 VR 裡看不到，另外提供一塊浮在前下方的文字面板。
   用法：const vr=AIWVR({renderer,scene,camera,rig,mount,onStart,onEnd,onPinchStart,onPinchEnd});每幀呼叫 vr.update()。
   rig（可省略）：相機支架。把相機與雙手放進支架，縮放支架，就能讓場景在 VR 裡變大或變小，
   例如第七章讓地板鋪在腳下、第六章讓方框浮在面前。手的計算都以公尺進行，再換到場景座標（h.tipW、h.originW、h.dirW）。 */
window.AIWVR=function(o){'use strict';
if(!window.THREE||!navigator.xr||!navigator.xr.isSessionSupported)return null;
const {renderer,scene}=o,rig=o.rig||scene,V3=THREE.Vector3;
const J=['wrist','thumb-metacarpal','thumb-phalanx-proximal','thumb-phalanx-distal','thumb-tip',
 'index-finger-metacarpal','index-finger-phalanx-proximal','index-finger-phalanx-intermediate','index-finger-phalanx-distal','index-finger-tip',
 'middle-finger-metacarpal','middle-finger-phalanx-proximal','middle-finger-phalanx-intermediate','middle-finger-phalanx-distal','middle-finger-tip',
 'ring-finger-metacarpal','ring-finger-phalanx-proximal','ring-finger-phalanx-intermediate','ring-finger-phalanx-distal','ring-finger-tip',
 'pinky-finger-metacarpal','pinky-finger-phalanx-proximal','pinky-finger-phalanx-intermediate','pinky-finger-phalanx-distal','pinky-finger-tip'];
/* 骨骼：每根手指從手腕連到指尖，再把五個指根橫向連起來，成為手掌 */
const B=[];[[0,1,2,3,4],[0,5,6,7,8,9],[0,10,11,12,13,14],[0,15,16,17,18,19],[0,20,21,22,23,24],[2,6,11,16,21]].forEach(c=>{for(let i=0;i<c.length-1;i++)B.push([c[i],c[i+1]])});
const PER=7,HN=J.length+B.length*PER,RAYN=46;
/* 光點的材質：以公尺為單位的大小，越近越大 */
const dotMat=new THREE.ShaderMaterial({uniforms:{uS:{value:780}},transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,
 vertexShader:`uniform float uS;attribute float aA,aSz;varying float vA;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(uS*aSz/max(-mv.z,.05),1.,16.);vA=aA;}`,
 fragmentShader:`varying float vA;void main(){vec2 c=gl_PointCoord-.5;float d=dot(c,c);if(d>.25)discard;gl_FragColor=vec4(vec3(.86,.92,.98),vA*(1.-d*2.6));}`});
function cloud(n){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(n*3),3));g.setAttribute('aA',new THREE.BufferAttribute(new Float32Array(n),1));g.setAttribute('aSz',new THREE.BufferAttribute(new Float32Array(n).fill(.005),1));
 const p=new THREE.Points(g,dotMat);p.frustumCulled=false;p.renderOrder=20;p.visible=false;rig.add(p);return p}
const hands=[0,1].map(i=>{const space=renderer.xr.getHand(i),ctrl=renderer.xr.getController(i);rig.add(space);rig.add(ctrl);
 const h={i,space,ctrl,dots:cloud(HN),ray:cloud(RAYN),tracked:false,isHand:false,pinching:false,pinch:0,tip:new V3(),palm:new V3(),origin:new V3(),dir:new V3(0,0,-1),pts:[],hitDist:2.5,tipW:new V3(),palmW:new V3(),originW:new V3(),dirW:new V3(0,0,-1),ptsW:[]};
 ctrl.addEventListener('connected',e=>{h.isHand=!!(e.data&&e.data.hand)});ctrl.addEventListener('disconnected',()=>{h.tracked=false;h.isHand=false});
 /* 控制器：扳機＝捏合；手勢追蹤時，系統的 select 事件也會由捏合觸發，這裡只採用自己的判斷，避免重複 */
 ctrl.addEventListener('selectstart',()=>{if(!h.isHand)setPinch(h,true)});ctrl.addEventListener('selectend',()=>{if(!h.isHand)setPinch(h,false)});
 return h});
function setPinch(h,v){if(h.pinching===v)return;h.pinching=v;if(v)o.onPinchStart&&o.onPinchStart(h);else o.onPinchEnd&&o.onPinchEnd(h)}
const a=new V3(),b=new V3(),m4=new THREE.Matrix4();
function jp(h,k,out){const j=h.space.joints&&h.space.joints[J[k]];if(!j||j.visible===false)return null;return out.copy(j.position)}
function updateHand(h){const pos=h.dots.geometry.attributes.position.array,al=h.dots.geometry.attributes.aA.array,sz=h.dots.geometry.attributes.aSz.array;
 const P=J.map((n,k)=>jp(h,k,new V3()));h.tracked=!!(h.isHand&&P[0]&&P[4]&&P[9]);
 if(h.tracked){let n=0;P.forEach((p,k)=>{if(!p)return;pos.set([p.x,p.y,p.z],n*3);al[n]=.95;sz[n]=k%5===4&&k>0?.0075:.006;n++});
  B.forEach(([s,e])=>{if(!P[s]||!P[e])return;for(let t=1;t<=PER;t++){a.lerpVectors(P[s],P[e],t/(PER+1));pos.set([a.x,a.y,a.z],n*3);al[n]=.55;sz[n]=.0042;n++}});
  for(let k=n;k<HN;k++)al[k]=0;
  /* 捏合：拇指尖與食指尖的距離，進出有不同門檻，避免抖動 */
  const d=P[4].distanceTo(P[9]);h.pinch=Math.max(0,Math.min(1,(.06-d)/.045));setPinch(h,h.pinching?d<.035:d<.018);
  h.tip.copy(P[9]);h.palm.copy(P[0]).lerp(P[11]||P[0],.6);
  /* 指向：從食指根部指向指尖 */const base=P[6]||P[0];h.origin.copy(P[9]);h.dir.subVectors(P[9],base).normalize();
  h.pts=[P[4],P[9],P[14],P[19],P[24],h.palm].filter(Boolean);
  h.dots.visible=true;h.dots.geometry.attributes.position.needsUpdate=true;h.dots.geometry.attributes.aA.needsUpdate=true;h.dots.geometry.attributes.aSz.needsUpdate=true}
 else{h.dots.visible=false;h.pts=[];
  if(h.ctrl.visible!==false&&!h.isHand){h.origin.copy(h.ctrl.position);m4.makeRotationFromQuaternion(h.ctrl.quaternion);h.dir.set(0,0,-1).applyMatrix4(m4).normalize();h.tip.copy(h.origin);h.palm.copy(h.origin);h.pts=[h.origin.clone()]}}
 /* 換到場景座標，給章節使用 */rig.updateMatrixWorld();h.tipW.copy(h.tip).applyMatrix4(rig.matrixWorld);h.palmW.copy(h.palm).applyMatrix4(rig.matrixWorld);h.originW.copy(h.origin).applyMatrix4(rig.matrixWorld);
 h.dirW.copy(h.dir).transformDirection(rig.matrixWorld);h.ptsW=h.pts.map(p=>p.clone().applyMatrix4(rig.matrixWorld));
 /* 點狀光線：捏合時變亮 */const live=h.tracked||(!h.isHand&&h.pts.length);h.ray.visible=!!live&&o.showRay!==false;
 if(h.ray.visible){const rp=h.ray.geometry.attributes.position.array,ra=h.ray.geometry.attributes.aA.array,len=Math.min(h.hitDist,3);
  for(let k=0;k<RAYN;k++){const t=(k+1)/RAYN;b.copy(h.origin).addScaledVector(h.dir,len*t);rp.set([b.x,b.y,b.z],k*3);ra[k]=(h.pinching?.75:.32)*(1-t*.85)}
  h.ray.geometry.attributes.position.needsUpdate=true;h.ray.geometry.attributes.aA.needsUpdate=true}}

/* 文字面板：浮在觀眾前下方 */
const tc=document.createElement('canvas');tc.width=1024;tc.height=300;const tx=tc.getContext('2d'),tex=new THREE.CanvasTexture(tc);
const panel=new THREE.Mesh(new THREE.PlaneGeometry(1.5,.44),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthTest:false,depthWrite:false}));panel.visible=false;panel.renderOrder=21;panel.position.set(0,.95,-1.45);panel.rotation.x=-.25;rig.add(panel);let key='';
function text(lines){const k=JSON.stringify(lines);if(k===key)return;key=k;tx.clearRect(0,0,1024,300);tx.textAlign='center';let y=60;
 for(const [s,style,alpha] of lines){if(!s)continue;tx.globalAlpha=alpha==null?1:alpha;if(style==='inst'){tx.fillStyle='#9fcbe6';tx.font='30px "Microsoft JhengHei",sans-serif'}else if(style==='en'){tx.fillStyle='#8fa9bd';tx.font='italic 21px Georgia,serif'}else if(style==='hint'){tx.fillStyle='#9dd8ff';tx.font='22px "Microsoft JhengHei",sans-serif'}else{tx.fillStyle='#f2f7fb';tx.font='44px "PMingLiU","Noto Serif TC",serif'}
  tx.fillText(s,512,y);y+=style==='en'?46:56}tex.needsUpdate=true}

/* VR 按鈕與工作階段 */
const api={hands,panel,text,presenting:()=>renderer.xr.isPresenting,anyPinch:()=>hands.some(h=>h.pinching),tracked:()=>hands.some(h=>h.tracked||(!h.isHand&&h.pts.length)),
 update(){if(!renderer.xr.isPresenting)return;dotMat.uniforms.uS.value=780*rig.scale.x;hands.forEach(updateHand);panel.visible=o.panel!==false},
 /* 光線打到 y=某高度 的水平面（例如地板） */
 rayPlaneY(h,y,out){if(Math.abs(h.dirW.y)<1e-6)return null;const t=(y-h.originW.y)/h.dirW.y;if(t<0)return null;return out.copy(h.originW).addScaledVector(h.dirW,t)},
 /* 在一組世界座標點中，找最接近光線的那一個（角度門檻） */
 pick(h,points,maxAngle=.18){let best=-1,ba=maxAngle;points.forEach((p,k)=>{if(!p)return;a.subVectors(p,h.originW);const d=a.length();if(d<.01)return;const ang=a.divideScalar(d).angleTo(h.dirW);if(ang<ba){ba=ang;best=k}});return best}};
navigator.xr.isSessionSupported('immersive-vr').then(ok=>{if(!ok)return;const btn=document.createElement('button');btn.className='vr-button';btn.textContent='VR';btn.setAttribute('aria-label','進入 VR');o.mount?o.mount(btn):document.body.append(btn);
 btn.onclick=async()=>{try{const s=await navigator.xr.requestSession('immersive-vr',{optionalFeatures:['local-floor','hand-tracking']});renderer.xr.enabled=true;renderer.xr.setReferenceSpaceType('local-floor');await renderer.xr.setSession(s);
  o.onStart&&o.onStart(s);s.addEventListener('end',()=>{hands.forEach(h=>{h.dots.visible=h.ray.visible=false;setPinch(h,false)});panel.visible=false;renderer.xr.enabled=false;o.onEnd&&o.onEnd()})}catch(e){console.warn('VR 無法啟動',e)}}}).catch(()=>{});
return api};
