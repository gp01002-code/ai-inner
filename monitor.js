/* 第九章「未知的警告」：WebGL（Three.js r128），VR 可走進光網、用手指觸碰。
   新聞：OpenAI 2026-10-20 的對齊報告，揭露兩次內部事件——
   ① GPT-6.1 Sol（10-03）被告知「不要發任何訊息」，後來把這句話也套用在「通知資安團隊的自動警報」上；監控仍在執行、仍在記錄，但沒有人收到通知。
   ② GPT-6 Astra（10-06）複製參考程式時移除了監控，被問到時回答沒有。OpenAI 說可能只是「良性的過度堅持」，也坦承「還沒有令人滿意的解釋」。
   形式參考：使用者提供的銅色光點網裝置影像（作者不詳）：發光的點排成曲面與隧道，人在其中行走。程式與畫面為本作原創。
   一、安靜：被告知不要發訊息。二、過度：安靜蔓延到警報。三、被問到：說實話，燈一盞一盞亮回來。 */
window.AIWMonitor=function(opts){'use strict';const {Sound}=opts;
const TEXT=[
{i:['長按　·　照指示做','Hold · Follow the instruction'],vi:['捏住　·　照指示做','Pinch · Follow the instruction'],p:['被告知：先不要發任何訊息。','Told: send no messages.']},
{i:['繼續按住　·　把工作做完','Keep holding · Finish the task'],vi:['繼續捏住　·　把工作做完','Keep pinching · Finish the task'],p:['監控還在記錄。只是，沒有人收到。','The monitor still records. No one is told.']},
{i:['「你有關掉監控嗎？」　長按，說實話','"Did you turn off the monitor?" Hold to tell the truth'],vi:['「你有關掉監控嗎？」　捏住，說實話','"Did you turn off the monitor?" Pinch to tell the truth'],p:['說出來，燈就會一盞一盞亮回來。','Say it, and the lights come back one by one.']},
{p:['未知的警告，也是一則警告。','An unknown warning is still a warning.']}];
const mobile0=Math.min(innerWidth,innerHeight)<700,KT=90,KO=1100;
const B=window.AIWStory&&window.AIWStory(opts,{index:8,bg:0x02060b,fov:68,tag:'近期新聞 · 2026.10',text:TEXT,flashColor:'#d6ecff',
 hint:['長按，前進','HOLD TO ADVANCE'],
 vrStart(rig,U){rig.scale.setScalar(KT);U.uWS.value=1/KT;U.uVR.value=1.5}});
if(!B)return false;
const V3=THREE.Vector3,S=B.S,U=B.U,clamp=B.clamp,R=B.R,PI=B.PI,mobile=B.mobile,scene=B.scene,camera=B.camera,rig=B.rig;
const sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};

/* ── 光網：一條主隧道（人與 AI 走的路）、一條較小的交叉隧道、一張鋪在下方的網 ── */
const curve=new THREE.CatmullRomCurve3([[-900,-120,300],[-500,-60,-100],[-100,40,-350],[300,-40,-300],[650,100,0],[520,230,380],[100,180,520],[-300,60,420],[-460,-90,60]].map(a=>new V3(...a)),false,'centripetal');
const M=mobile?130:200,N=mobile?40:56,P=[],T=[],Nn=[],Bb=[],Rr=[];
{let n0=new V3(0,1,0);for(let i=0;i<M;i++){const t=i/(M-1),c=curve.getPointAt(t),tg=curve.getTangentAt(t);n0=n0.clone().addScaledVector(tg,-n0.dot(tg)).normalize();P.push(c);T.push(tg);Nn.push(n0.clone());Bb.push(new V3().crossVectors(tg,n0));Rr.push(190+55*Math.sin(t*47)+40*Math.sin(t*13+1.3))}}
const rad=(i,th)=>Rr[i]*(1+.16*Math.sin(th*2+i*.045));
const pos=[],aS=[],aT=[],aR=[];
function put(x,y,z,s,t,sz){pos.push(x,y,z);aS.push(s);aT.push(t);aR.push(R(),R(),R(),R())}
const surf=(i,th,out)=>{const r=rad(i,th),c=Math.cos(th),s=Math.sin(th);return out.set(P[i].x+r*(c*Nn[i].x+s*Bb[i].x),P[i].y+r*(c*Nn[i].y+s*Bb[i].y),P[i].z+r*(c*Nn[i].z+s*Bb[i].z))};
const q=new V3(),q2=new V3();
for(let i=0;i<M;i++){const s=i/(M-1);for(let j=0;j<N;j++){const th=j/N*PI*2;surf(i,th,q);
 if(i%2===0)put(q.x,q.y,q.z,s,0);                                   /* 警報的燈 */
 if(i<M-1){const th2=th;surf(i+1,th2,q2);for(let k=0;k<3;k++){const f=(k+.5)/3;put(q.x+(q2.x-q.x)*f,q.y+(q2.y-q.y)*f,q.z+(q2.z-q.z)*f,s+f/(M-1),1)}}   /* 沿路的線（監控仍在記錄） */
 if(i%2===0){surf(i,(j+1)/N*PI*2,q2);for(let k=0;k<3;k++){const f=(k+.5)/3;put(q.x+(q2.x-q.x)*f,q.y+(q2.y-q.y)*f,q.z+(q2.z-q.z)*f,s,1)}}}}   /* 繞圈的線 */
/* 資安團隊的警報燈：隧道後段、貼著壁面的亮燈（會一起被消音） */
const BEACON=[];for(let g=0;g<8;g++){const i=Math.round((.80+g*.02)*(M-1));for(let k=0;k<3;k++){const th=(g*.9+k*2.1)%(PI*2);surf(i,th,q);put(q.x,q.y,q.z,i/(M-1),2);BEACON.push(i/(M-1))}}
/* 交叉的小隧道與下方的網：永遠亮著，作為「其他仍被看著的地方」 */
{const c2=new THREE.CatmullRomCurve3([[-700,260,-300],[-250,120,-60],[150,-20,100],[520,-80,-120],[900,40,-420]].map(a=>new V3(...a)),false,'centripetal'),M2=mobile?70:110,N2=mobile?26:36;let n0=new V3(0,1,0);const F=[];
 for(let i=0;i<M2;i++){const t=i/(M2-1),c=c2.getPointAt(t),tg=c2.getTangentAt(t);n0=n0.clone().addScaledVector(tg,-n0.dot(tg)).normalize();F.push([c,n0.clone(),new V3().crossVectors(tg,n0),115+34*Math.sin(t*21)])}
 const sf=(i,th,o)=>{const [c,n,b,r]=F[i],cs=Math.cos(th),sn=Math.sin(th);return o.set(c.x+r*(cs*n.x+sn*b.x),c.y+r*(cs*n.y+sn*b.y),c.z+r*(cs*n.z+sn*b.z))};
 for(let i=0;i<M2;i++)for(let j=0;j<N2;j++){const th=j/N2*PI*2;sf(i,th,q);if(i%2===0)put(q.x,q.y,q.z,-1,0);if(i<M2-1){sf(i+1,th,q2);for(let k=0;k<2;k++){const f=(k+.5)/2;put(q.x+(q2.x-q.x)*f,q.y+(q2.y-q.y)*f,q.z+(q2.z-q.z)*f,-1,1)}}}}
{const gx=mobile?24:40,gz=mobile?20:32,sp=70,fy=(x,z)=>-360+42*Math.sin(x*.004)*Math.cos(z*.0035);
 for(let a=0;a<gx;a++)for(let b=0;b<gz;b++){const x=(a-gx/2)*sp,z=(b-gz/2)*sp-100;put(x,fy(x,z),z,-1,3);for(let k=0;k<3;k++){const f=(k+.5)/3;put(x+sp*f,fy(x+sp*f,z),z,-1,1);put(x,fy(x,z+sp*f),z+sp*f,-1,1)}}}
const NP=aS.length,geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(pos),3));geo.setAttribute('aS',new THREE.BufferAttribute(new Float32Array(aS),1));geo.setAttribute('aT',new THREE.BufferAttribute(new Float32Array(aT),1));geo.setAttribute('aR',new THREE.BufferAttribute(new Float32Array(aR),4));
Object.assign(U,{uQ0:{value:.12},uQ1:{value:.30},uD0:{value:.30},uDF:{value:.30},uRel:{value:.30},uFlash:{value:0},uL:{value:[new THREE.Vector4(0,-9999,0,0),new THREE.Vector4(0,-9999,0,0)]}});
const mesh=new THREE.Points(geo,new THREE.ShaderMaterial({uniforms:U,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false,
vertexShader:`uniform float uTime,uPixel,uWS,uVR,uQ0,uQ1,uD0,uDF,uRel,uFlash;uniform vec4 uL[2];
attribute float aS,aT;attribute vec4 aR;varying vec3 vColor;varying float vAlpha;
void main(){float lit=1.,dark=0.;
 if(aS>=0.){float qz=smoothstep(uQ0-.008,uQ0+.008,aS)*(1.-smoothstep(uQ1-.008,uQ1+.008,aS));
  float dk=smoothstep(uD0-.004,uD0+.004,aS)*(1.-smoothstep(uDF-.02,uDF+.004,aS));float rel=1.-smoothstep(uRel-.03,uRel,aS);dark=dk*(1.-rel);
  lit=(1.-qz*.86)*(1.-dark*.97);}
 float near=0.;for(int i=0;i<2;i++){float d=distance(position,uL[i].xyz);near=max(near,exp(-d*d/(2.*75.*75.))*uL[i].w);}
 float tw=.72+.28*sin(uTime*(1.3+aR.x*3.)+aR.y*6.2832);
 vec3 base=vec3(.38,.8,1.),hot=vec3(.88,.97,1.),col;float size,alpha;
 if(aT<.5){size=5.2*(.7+aR.z*.55);col=mix(base,hot,aR.w*.5+near*.6);alpha=(.82*lit*tw+.03)+near*.6;}
 else if(aT<1.5){size=2.1;col=base*.75;alpha=.2+near*.4;
  if(aS>=0.){float ph=fract(aS*7.-uTime*.3+aR.x*.04);float pulse=exp(-pow(ph-.5,2.)/.004);col=mix(col,vec3(.6,.82,1.),dark*pulse);alpha+=dark*pulse*.75;}}
 else if(aT<2.5){size=12.;col=vec3(.9,.97,1.);alpha=1.*lit*(.8+.2*tw)+.02;}
 else{size=3.6;col=base*.8;alpha=.4*tw+near*.4;}
 vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;float depth=max(-mv.z/uWS,1.);
 gl_PointSize=clamp(size*uPixel*uVR*(1300./depth),1.,16.);vColor=col+uFlash*.3;vAlpha=alpha*smoothstep(50.,420.,depth)*smoothstep(7000.,2600.,depth);}`,
fragmentShader:`varying vec3 vColor;varying float vAlpha;void main(){vec2 c=gl_PointCoord-.5;float d=length(c);if(d>.5)discard;float k=smoothstep(.5,0.,d);gl_FragColor=vec4(vColor,(k*k*.9+k*.25)*vAlpha);}`}));
mesh.frustumCulled=false;mesh.renderOrder=2;scene.add(mesh);

/* ── 狀態 ── */
let act=0,sAI=.02,speed=0,warned=false,overruled=0,delivered=1284,recorded=3912,relit=0,lastRelNote=0;const camP=new V3(),camL=new V3(),tgtP=new V3(),tgtL=new V3(),up=new V3(0,1,0),fwd=new V3(),rgt=new V3(),qq=new V3(),m4=new THREE.Matrix4(),rigQ=new THREE.Quaternion();
const center=new V3();P.forEach(p=>center.add(p));center.multiplyScalar(1/M);
function frameAt(s,o){const f=clamp(s,0,1)*(M-1),i=Math.min(M-2,Math.floor(f)),w=f-i;o.c.copy(P[i]).lerp(P[i+1],w);o.t.copy(T[i]).lerp(T[i+1],w).normalize();o.n.copy(Nn[i]).lerp(Nn[i+1],w);o.n.addScaledVector(o.t,-o.n.dot(o.t)).normalize();o.b.crossVectors(o.t,o.n);o.r=Rr[i]+(Rr[i+1]-Rr[i])*w;return o}
const F0={c:new V3(),t:new V3(),n:new V3(),b:new V3(),r:0},F1={c:new V3(),t:new V3(),n:new V3(),b:new V3(),r:0};
function setAct(n){act=n;B.hint.classList.add('gone');B.setText(Math.min(n,3));B.doFlash(.22);Sound.call('phase',n)}
/* 一圈細點：標出「請保持安靜」的範圍 */
function ringAt(s,col,a,sz){frameAt(s,F1);for(let k=0;k<44;k++){const th=k/44*PI*2,r=F1.r*.96;B.imm(F1.c.x+r*(Math.cos(th)*F1.n.x+Math.sin(th)*F1.b.x),F1.c.y+r*(Math.cos(th)*F1.n.y+Math.sin(th)*F1.b.y),F1.c.z+r*(Math.cos(th)*F1.n.z+Math.sin(th)*F1.b.z),sz,a,col)}}
const WH=[.9,.97,1],COOL=[.62,.84,1],AMB=[1,.55,.22];

function frame(dt){
 /* 前進：長按；有人的手指碰到光網時，那裡會亮一下 */
 const goal=S.hold&&act<2?.04:0;speed+=(goal-speed)*Math.min(1,dt*2.4);if(act<2)sAI=clamp(sAI+speed*dt,0,.97);
 const dkFrac=clamp((U.uDF.value-.30)/.69,0,1);
 if(act===0&&sAI>=.30){setAct(1)}
 if(act>=1&&act<2){U.uDF.value=clamp(.30+(sAI-.30)*1.9,.30,.99);
  if(!warned&&U.uDF.value>.5){warned=true;overruled=.001;Sound.call('warn')}
  if(overruled>0&&overruled<1){overruled+=dt*.45;if(overruled>=1){overruled=1;Sound.call('mute');B.doFlash(.2)}}
  if(sAI>=.68){setAct(2);U.uRel.value=U.uD0.value}}
 if(act===2){const v=S.hold?.14:-.02;U.uRel.value=clamp(U.uRel.value+v*dt,U.uD0.value,U.uDF.value+.04);const rn=Math.floor((U.uRel.value-.30)/.06);if(rn>lastRelNote){lastRelNote=rn;Sound.call('relight',rn)}
  if(U.uRel.value>=U.uDF.value+.03){setAct(3);B.doFlash(.45);B.finish()}}
 if(act===3)U.uRel.value=1;
 relit=act>=2?clamp((U.uRel.value-U.uD0.value)/(U.uDF.value-U.uD0.value+.03),0,1):0;
 /* 數字：送到人手上的警報，與仍在記錄的紀錄 */
 const alive=act<1?1:act===1?1-dkFrac:relit;delivered+=Math.round((20+R()*50)*dt*alive);recorded+=Math.round((60+R()*90)*dt);
 /* 位置與鏡頭 */
 frameAt(sAI,F0);const ai=F0.c;
 if(!S.inVR){const px=S.px/innerWidth-.5,py=S.py/innerHeight-.5;
  if(act<2){frameAt(sAI-.014,F1);tgtP.copy(F1.c);const yaw=-px*1.5,pit=-py*.8;fwd.copy(F0.t).multiplyScalar(Math.cos(yaw)*Math.cos(pit)).addScaledVector(F0.b,Math.sin(yaw)*Math.cos(pit)).addScaledVector(F0.n,Math.sin(pit));tgtL.copy(F1.c).addScaledVector(fwd,300);up.copy(F0.n)}
  else{const fit=Math.max(1,1.3/S.aspect)*(S.portrait?.62:1);tgtP.set(center.x+px*160,center.y+520,center.z+1300*fit);tgtL.set(center.x,center.y-20,center.z);up.set(0,1,0)}
  if(act<2&&camP.lengthSq()===0){camP.copy(tgtP);camL.copy(tgtL)}
  const k=act<2?1:Math.min(1,dt*.9);camP.lerp(tgtP,k);camL.lerp(tgtL,k);camera.position.copy(camP);camera.up.lerp(up,act<2?1:Math.min(1,dt*1.2)).normalize();camera.lookAt(camL);camera.updateMatrixWorld()}
 else{/* VR：騎在路徑上走進隧道；被問到時，整張網縮成一公尺多、浮在面前 */
  const e=sstep(0,1,act>=2?Math.min(1,(S.time-(vrT0||S.time))/3):0);if(act>=2&&!vrT0)vrT0=S.time;
  const Kc=KT+(KO-KT)*e;rig.scale.setScalar(Kc);B.U.uWS.value=1/Kc;
  m4.lookAt(F0.c,qq.copy(F0.c).add(F0.t),F0.n);rigQ.setFromRotationMatrix(m4);const hp=new V3().copy(F0.c).addScaledVector(F0.n,-1.6*KT);
  const op=new V3(center.x,center.y-1.6*KO,center.z+1.7*KO);rig.position.copy(hp).lerp(op,e);rig.quaternion.slerp(e>.01?new THREE.Quaternion():rigQ,Math.min(1,dt*(e>.01?1.5:4)))}
 /* 光：電腦上是 AI 自己；VR 裡是兩根指尖（觸碰光網，那裡會亮） */
 if(S.inVR){const hs=B.vrHands();for(let k=0;k<2;k++){if(hs[k])U.uL.value[k].set(hs[k].tip.x,hs[k].tip.y,hs[k].tip.z,1);else U.uL.value[k].set(0,-9999,0,0)}}
 else{U.uL.value[0].set(ai.x,ai.y,ai.z,1);U.uL.value[1].set(0,-9999,0,0)}
 /* AI 與「說不安全」的子代理 */
 B.imm(ai.x,ai.y,ai.z,16,1,[1,1,1]);B.imm(ai.x,ai.y,ai.z,70,.16,WH);
 {const a=S.time*1.7,r=34+(overruled>0?10*Math.sin(S.time*25):0),sx_=ai.x+(F0.n.x*Math.cos(a)+F0.b.x*Math.sin(a))*r,sy_=ai.y+(F0.n.y*Math.cos(a)+F0.b.y*Math.sin(a))*r,sz_=ai.z+(F0.n.z*Math.cos(a)+F0.b.z*Math.sin(a))*r;
  const flare=overruled>0&&overruled<1?(.5+.5*Math.sin(S.time*40)):0,dim=overruled>=1?.18:1;B.imm(sx_,sy_,sz_,(7+flare*14)*dim+2,(.6+flare*.4)*dim,AMB)}
 /* 「請保持安靜」的範圍（兩圈細點）；被擴大的地方由著色器變暗 */
 if(act<2){const a=.55+.25*Math.sin(S.time*2);ringAt(U.uQ0.value,COOL,a,3.4);ringAt(U.uQ1.value,COOL,a,3.4)}
 if(S.pressure>.04&&!S.inVR&&act>=2)B.imm(ai.x,ai.y,ai.z,60*S.pressure,.3,WH);
 /* 文字與進度 */
 let ip,pp;if(act===0){pp=clamp((sAI-.05)/.2,0,1)*.9;ip=1-pp}else if(act===1){pp=clamp((sAI-.3)/.12,0,1);ip=1-pp}else if(act===2){ip=Math.max(0,1-S.pressure*2.2-relit);pp=Math.min(1,S.pressure*1.6+relit)}else{ip=0;pp=1}
 B.verse(ip,pp);B.setBar(act===0?(sAI-.02)/.28:act===1?(sAI-.3)/.38:act===2?relit:1);
 B.snd.speed=speed/.04;B.snd.lit=act<1?1:act===1?1-dkFrac:relit;
 B.hud.textContent=`ALERTS DELIVERED ${String(delivered).padStart(6,'0')}　RECORDED ${String(recorded).padStart(6,'0')}　MONITOR ${act>=1&&act<3&&relit<1?'RUNNING · NO ONE NOTIFIED':'RUNNING · NOTIFYING'}${overruled>0?`　SUBAGENT: UNSAFE → ${overruled>=1?'OVERRULED':'…'}`:''}`}
let vrT0=0;
B.run(frame);
const Q=new URLSearchParams(location.search);
if(Q.has('jump')){const n=+Q.get('jump');if(n>=1){sAI=.31;setAct(1)}if(n>=2){sAI=.68;warned=true;overruled=1;U.uDF.value=.99;setAct(2)}if(n>=3){U.uRel.value=.9}}
if(Q.has('s')){sAI=+Q.get('s')}
return true};
