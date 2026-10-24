/* 入口 3D 版「數位中樞」：中央是運算核心，七個章節節點繞成一圈，資料封包沿著連線流向核心；
   底下是向遠方延伸的格線地面與掃描波，遠處有資料流落下。可環繞觀看、可進入 VR。
   每個節點的造型對應各章：球殼、光池、聲波、晶格、機率柱、六角通道、文字方陣。
   無法使用 WebGL 時回傳 false，immersive.js 會退回 Canvas 版。 */
window.AIWHome=function(opts){'use strict';const {Sound,reduced,names}=opts;
if(!window.THREE)return false;
let renderer;try{renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance'});if(!renderer.getContext())return false}catch(e){return false}
const mobile=Math.min(innerWidth,innerHeight)<700,PI=Math.PI,R=Math.random,NN=names.length;
document.querySelector('#cosmos').style.display='none';
const inv=document.querySelector('.invitation');if(inv)inv.textContent='觸碰一個節點　·　拖曳環繞';
const el=renderer.domElement;el.className='gl home-gl';document.body.prepend(el);renderer.setClearColor(0x030406,1);
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(50,1,1,20000),world=new THREE.Group();scene.add(world);
const gauss=()=>Math.max(-3,Math.min(3,Math.sqrt(-2*Math.log(1-R()))*Math.cos(2*PI*R())));
const portrait=innerWidth<innerHeight,RING=portrait?380:440,FLOOR=-230,SPIN=.025;
/* 節點位置：繞核心一圈，緩慢轉動（著色器與 CPU 用同一個公式） */
const nodeAt=(i,t,v)=>{const a=(i+.5)/NN*2*PI+t*SPIN-PI/2;return v.set(Math.cos(a)*RING,Math.sin(a*2+i)*18,Math.sin(a)*RING)};

/* ── 粒子：依 aKind 分成核心、節點、連線封包、地面格線、資料流、軌道 ── */
const counts=mobile?{core:5000,node:900,link:600,floor:9000,rain:3000,orbit:1200}:{core:10000,node:1800,link:1100,floor:16000,rain:6000,orbit:2000};
const list=[];const add=(k,n,idx=-1)=>{for(let i=0;i<n;i++)list.push([k,idx])};
add(0,counts.core);for(let i=0;i<NN;i++){add(1,counts.node,i);add(2,counts.link,i)}add(3,counts.floor);add(4,counts.rain);add(5,counts.orbit);
const N=list.length,seed=new Float32Array(N*4),gs=new Float32Array(N*3),kind=new Float32Array(N*2);
list.forEach(([k,idx],o)=>{for(let j=0;j<4;j++)seed[o*4+j]=R();gs.set([gauss(),gauss(),gauss()],o*3);kind.set([k,idx],o*2)});
const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(N*3),3));
geo.setAttribute('aSeed',new THREE.BufferAttribute(seed,4));geo.setAttribute('aGauss',new THREE.BufferAttribute(gs,3));geo.setAttribute('aKind',new THREE.BufferAttribute(kind,2));
const U={uTime:{value:0},uPixel:{value:1},uHover:{value:-1},uFlash:{value:0},uWS:{value:1},uDensity:{value:mobile?1:.85},uFocal:{value:1100},uRip:{value:Array.from({length:4},()=>new THREE.Vector4(0,0,0,-99))}};
const frag=`varying vec3 vColor;varying float vAlpha;void main(){vec2 c=gl_PointCoord-.5;float d=length(c);if(d>.5)discard;float k=smoothstep(.5,0.,d);gl_FragColor=vec4(vColor,(k*k*.85+k*.2)*vAlpha);}`;
const field=new THREE.Points(geo,new THREE.ShaderMaterial({uniforms:U,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false,fragmentShader:frag,
vertexShader:`uniform float uTime,uPixel,uHover,uFlash,uWS,uDensity,uFocal;uniform vec4 uRip[4];
attribute vec4 aSeed;attribute vec3 aGauss;attribute vec2 aKind;varying vec3 vColor;varying float vAlpha;
const float PI=3.14159265,NN=${NN}.,RING=${RING}.,FLOOR=${FLOOR}.,SPIN=${SPIN};
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float hash(float n){return fract(sin(n*91.3458)*47453.5453);}
float hexR(float a){return cos(PI/6.)/cos(mod(a,PI/3.)-PI/6.);}
vec3 nodeC(float i){float a=(i+.5)/NN*2.*PI+uTime*SPIN-PI/2.;return vec3(cos(a)*RING,sin(a*2.+i)*18.,sin(a)*RING);}
const vec3 CY=vec3(.45,.9,1.),WH=vec3(.92,.97,1.);
vec3 tintOf(float i){return i<6.5?CY:i<7.5?vec3(.72,.88,1.):i<8.5?vec3(.5,.9,1.):vec3(.66,.78,1.);}
/* 緩慢流動的擾動：讓造型邊緣鬆散、不那麼整齊 */
vec3 fl(vec3 p,float t){return vec3(sin(p.y*1.7+t)+sin(p.z*2.3-t*.7),sin(p.z*1.9+t*1.1)+sin(p.x*1.3+t*.5),sin(p.x*2.1-t*.9)+sin(p.y*1.1+t*.3))*.5;}
/* 各章節點的造型 */
vec3 nodeShape(float id,float t,float sz,out float a){float u=aSeed.x,v=aSeed.y,w=aSeed.z;vec3 g=aGauss,p;a=.8;
 if(id<.5){p=normalize(g+.001)*sz*(1.+.06*sin(t*2.+u*6.));p.xz=rot(t*.3)*p.xz;}
 else if(id<1.5){float r=sqrt(u)*sz*1.25,an=v*2.*PI+t*.2;p=vec3(cos(an)*r,sin(r*.16-t*3.)*5.,sin(an)*r);a=.6+.4*sin(r*.16-t*3.);}
 else if(id<2.5){float r=sz*1.35*fract(u+t*.25),an=v*2.*PI;p=vec3(cos(an)*r,g.y*1.5,sin(an)*r);a=.95*(1.-r/(sz*1.35));p.yz=rot(.9)*p.yz;}
 else if(id<3.5){vec3 c=sign(g+.001);float e=floor(v*3.);vec3 q=c;if(e<.5)q.x=u*2.-1.;else if(e<1.5)q.y=u*2.-1.;else q.z=u*2.-1.;p=q*sz*.52;p.xz=rot(t*.35)*p.xz;p.xy=rot(.5)*p.xy;}
 else if(id<4.5){float k=floor(u*24.),an=k/24.*2.*PI+t*.15,h=(.25+.75*hash(k+floor(t*.5)*.0))*sz*(1.2+.3*sin(t*1.5+k));p=vec3(cos(an)*sz*.8,(v-.5)*h,sin(an)*sz*.8)+g*1.2;}
 else if(id<5.5){float k=floor(u*4.),an=v*2.*PI;float rr=sz*hexR(an)*(1.-k*.18);p=vec3(cos(an)*rr,sin(an)*rr,(k-1.5)*sz*.45);p.xz=rot(t*.25+PI*.5)*p.xz;a=.9-k*.15;}
 else if(id<6.5){float row=floor(u*6.),col=floor(v*9.);vec2 cell=vec2(col-4.,row-2.5)*sz*.26;float on=step(.35,hash(row*13.+col+floor(t*2.+hash(row)*4.)));p=vec3(cell.x+g.x*3.,0.,cell.y+g.z*3.)*vec3(1.,1.,1.);p.yz=rot(-.55)*p.yz;a=.15+.85*on;}
 else if(id<7.5){/* 第八章：細線垂下、星形的針芒向四方張開 */
  if(w<.22){p=vec3(0.,v*sz*1.7,0.)+g*.7;a=.45;}
  else{float k=floor(u*14.);float th=hash(k*3.1)*2.*PI,cp=hash(k*7.7+1.)*2.-1.,sn=sqrt(1.-cp*cp);vec3 d=vec3(sn*cos(th),cp,sn*sin(th));float len=sz*(.5+.5*hash(k*5.3+2.))*(1.+.12*sin(t*2.+k));p=d*len*(.12+v*.88);p.xz=rot(t*.3)*p.xz;a=.55+.45*v;}}
 else if(id<8.5){/* 第九章：發光的點排成起伏的隧道 */
  float an=floor(u*20.)/20.*2.*PI+t*.1,al=(v*2.-1.),r=sz*.58*(1.+.28*sin(al*4.+t*.6));
  p=vec3(al*sz*1.15,cos(an)*r,sin(an)*r);p.xy=rot(.35)*p.xy;a=.3+.7*step(.5,fract(v*14.+u*.0))*.9+.1;if(w<.3){p+=g*1.5;a*=.6;}}
 else{/* 第十章：光束從上方分向八個決定點 */
  float k=floor(u*8.),f=v;vec3 top=vec3(0.,sz*.9,0.),bot=vec3((k-3.5)*sz*.27,-sz*.62,0.);
  p=mix(top,bot,f)+vec3(0.,sin(f*PI)*sz*.12,sin(f*PI)*sz*.22*(hash(k+3.)-.5)*2.);p.xz=rot(t*.25)*p.xz;a=.4+.6*step(.7,fract(f*3.-t*.6+k*.17));
  if(w<.18){p=vec3((k-3.5)*sz*.27,-sz*.62,0.)+vec3(g.x*4.,g.y*3.,g.z*2.);p.xz=rot(t*.25)*p.xz;a=.9;}}
 /* 打散：每顆粒子帶一點隨機偏移與流動，邊線斷斷續續 */
 p+=fl(p*.035+id*3.1,t*.6)*sz*.09+g*sz*.045;a*=.55+.45*step(.18,hash(floor(u*40.)+id*7.));
 if(w<.14){p=normalize(g+.001)*sz*(.9+pow(hash(u*91.+id),.5)*1.1)+fl(g*2.+id,t*.4)*sz*.25;a=.28;}
 return p;}
void main(){float k=aKind.x,idx=aKind.y,t=uTime,on=step(-.5,idx)*(1.-step(.5,abs(idx-uHover)));vec3 pos,col;float alpha,size;
 if(k<.5){/* 核心：層層緯度環以不同速度轉動，中央明亮 */
  if(aSeed.w<.22){pos=aGauss*(18.+abs(aGauss.x)*14.)+fl(aGauss,t*.8)*10.;col=WH;alpha=.85;size=2.8;}
  else if(aSeed.w<.6){float sh=floor(aSeed.x*3.),lat=(floor(aSeed.y*13.)+.5)/13.*PI-PI/2.+aGauss.x*.06,lon=aSeed.z*2.*PI+t*(.25+sh*.18)*(mod(sh,2.)<.5?1.:-1.),r=78.+sh*26.+aGauss.y*9.;
   pos=vec3(cos(lat)*cos(lon),sin(lat),cos(lat)*sin(lon))*r;pos.xy=rot(sh*.6)*pos.xy;pos+=fl(pos*.025+sh,t*.5)*16.;
   col=mix(CY,WH,.4);alpha=.5*step(.22,fract(aSeed.z*3.+hash(sh+floor(aSeed.y*13.))));size=2.1;}
  else{/* 向外飄散的雲：從核心慢慢擴散出去再淡掉 */float life=fract(aSeed.x+t*(.04+aSeed.y*.05)),r=60.+life*(170.+aSeed.z*140.);
   pos=normalize(aGauss+.001)*r+fl(aGauss*1.5+aSeed.w*9.,t*.3)*(14.+life*40.);col=mix(WH,CY,life);alpha=.55*(1.-life)*smoothstep(0.,.08,life);size=1.9;}
  float beat=pow(.5+.5*sin(t*1.6),8.);alpha*=1.+beat*.6;}
 else if(k<1.5){float a;pos=nodeC(idx)+nodeShape(idx,t,58.*(1.+on*.25),a);col=mix(tintOf(idx),WH,on*.6+.2);alpha=a*(.75+on*.5);size=2.6+on;}
 else if(k<2.5){/* 連線：靜態細線＋流向核心的封包 */
  vec3 A=nodeC(idx),B=vec3(0.);
  if(aSeed.w<.55){float f=aSeed.x;pos=mix(A,B,f)+aGauss*.8;col=tintOf(idx);alpha=(.12+on*.25)*smoothstep(0.,.15,f)*smoothstep(1.,.85,f);size=1.6;}
  else{float lane=floor(aSeed.y*3.),f=fract(aSeed.x+t*(.18+lane*.06)*(1.+on));float pk=step(.6,fract(aSeed.x*7.));pos=mix(A,B,f)+aGauss*(1.5+lane);col=WH;alpha=pk*(.7+on*.3)*smoothstep(0.,.1,f)*smoothstep(1.,.9,f);size=2.4+on;}}
 else if(k<3.5){/* 地面格線：向遠方延伸，掃描波由核心向外 */
  float sp=100.,n=floor(aSeed.x*33.)-16.,al=(aSeed.y*2.-1.)*1650.;vec2 q=aSeed.z<.5?vec2(n*sp,al):vec2(al,n*sp);
  pos=vec3(q.x,FLOOR,q.y);float d=length(q),scan=exp(-pow((d-mod(t*260.,2000.))/60.,2.));
  col=mix(vec3(.25,.55,.75),WH,scan);alpha=(.5+scan*.9)*smoothstep(1700.,200.,d);size=3.6+scan*2.;}
 else if(k<4.5){/* 資料流：遠處垂直落下的字串 */
  float c=floor(aSeed.x*90.),an=hash(c)*2.*PI,rr=900.+hash(c+3.)*1300.,sp=120.+hash(c+5.)*260.;float y=900.-mod(aSeed.y*1300.+t*sp,1300.);
  pos=vec3(cos(an)*rr,FLOOR+y,sin(an)*rr);float head=fract(aSeed.y*1300./1300.+t*sp/1300.);col=mix(vec3(.3,.6,.8),WH,pow(head,6.));alpha=.25+.75*pow(head,4.);size=5.;}
 else{/* 軌道：虛線圓與刻度 */
  float an=aSeed.x*2.*PI;float tick=step(.985,fract(aSeed.x*72.));pos=vec3(cos(an)*RING,0.,sin(an)*RING)*(1.+tick*aSeed.y*.06);
  col=CY;alpha=(.16+tick*.5)*step(.5,fract(aSeed.x*360.))+.04;size=1.5;}
 for(int i=0;i<4;i++){vec4 r=uRip[i];float ag=uTime-r.w;if(ag>0.&&ag<7.){vec3 dv=pos-r.xyz;float d=length(dv),front=ag*520.,band=exp(-pow((d-front)/60.,2.))*exp(-ag*.55);
  pos+=dv/max(d,1.)*band*30.;col=mix(col,WH,band*.8);alpha*=1.+band*1.8;}}
 vec4 mv=modelViewMatrix*vec4(pos,1.);gl_Position=projectionMatrix*mv;float depth=max(-mv.z/uWS,1.),blur=clamp(abs(depth-uFocal)/uFocal,0.,1.4);
 gl_PointSize=clamp(size*(1.+blur*1.6)*uPixel*(700./depth),1.,40.);
 vColor=col+uFlash*.6;vAlpha=alpha/(1.+blur*2.)*smoothstep(6000.,500.,depth)*uDensity;}`}));
field.frustumCulled=false;field.renderOrder=2;world.add(field);

/* 背景：近黑，地平線一道冷色微光 */
const sky=new THREE.Mesh(new THREE.SphereGeometry(7000,32,24),new THREE.ShaderMaterial({uniforms:U,side:THREE.BackSide,depthTest:false,depthWrite:false,
vertexShader:`varying vec3 vDir;void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
fragmentShader:`uniform float uFlash;varying vec3 vDir;void main(){vec3 d=normalize(vDir);float hz=exp(-pow((d.y+.04)*9.,2.));vec3 c=vec3(.012,.016,.022)+vec3(.05,.12,.17)*hz*0.+vec3(.02,.03,.04)*smoothstep(.0,.8,d.y)*.3;gl_FragColor=vec4(c+uFlash*vec3(.15,.25,.3),1.);}`}));sky.frustumCulled=false;sky.renderOrder=0;scene.add(sky);

/* ── 進入：節點爆開，封包沿連線衝向核心，核心送出一道球殼衝擊波 ── */
const PB=6000,bp=new Float32Array(PB*3),bc=new Float32Array(PB*3),bs=new Float32Array(PB),ba=new Float32Array(PB),parts=[];
const bgeo=new THREE.BufferGeometry();bgeo.setAttribute('position',new THREE.BufferAttribute(bp,3));bgeo.setAttribute('aCol',new THREE.BufferAttribute(bc,3));bgeo.setAttribute('aSize',new THREE.BufferAttribute(bs,1));bgeo.setAttribute('aAlpha',new THREE.BufferAttribute(ba,1));
const bursts=new THREE.Points(bgeo,new THREE.ShaderMaterial({uniforms:U,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false,fragmentShader:frag,
vertexShader:`uniform float uPixel,uWS;attribute vec3 aCol;attribute float aSize,aAlpha;varying vec3 vColor;varying float vAlpha;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(aSize*uPixel*(620./max(-mv.z/uWS,1.)),1.,90.);vColor=aCol;vAlpha=aAlpha;}`}));
bursts.frustumCulled=false;bursts.renderOrder=3;world.add(bursts);
const CYC=[.45,.9,1],WHC=[.92,.97,1];
const later=(ms,f)=>setTimeout(f,reduced?0:ms),rdir=()=>new THREE.Vector3(gauss(),gauss(),gauss()).normalize();
function spawn(p,v,o){if(parts.length<PB)parts.push({p:p.clone(),v:v.clone(),life:o.life||1,size:o.size||5,col:o.col||CYC,drag:o.drag||.97})}
function burst(i){const C=nodeAt(i,time,new THREE.Vector3()),toCore=C.clone().negate().normalize(),dist=C.length();
 for(let j=0;j<900;j++)spawn(C,rdir().multiplyScalar(3+R()*9),{life:.9,size:4+R()*3,col:R()<.5?CYC:WHC,drag:.95});
 for(let j=0;j<500;j++)spawn(C.clone().addScaledVector(rdir(),6),toCore.clone().multiplyScalar(dist/30*(.8+R()*.4)).addScaledVector(rdir(),.4),{life:.55,size:5,col:WHC,drag:1});
 later(480,()=>{for(let j=0;j<1400;j++){const y=1-2*(j+.5)/1400,r=Math.sqrt(1-y*y),a=j*2.39996;spawn(new THREE.Vector3(),new THREE.Vector3(Math.cos(a)*r,y,Math.sin(a)*r).multiplyScalar(30),{life:.9,size:6,col:j%3?CYC:WHC,drag:1})}flash=1;U.uRip.value[ri++%4].set(0,0,0,time)});flash=.5}
function stepBursts(f){let m=0;for(let i=parts.length-1;i>=0;i--){const q=parts[i];q.p.addScaledVector(q.v,f);q.v.multiplyScalar(Math.pow(q.drag,f));q.life-=.017*f;if(q.life<=0)parts.splice(i,1)}
for(const q of parts){bp.set([q.p.x,q.p.y,q.p.z],m*3);bc.set(q.col,m*3);bs[m]=q.size*(.4+Math.min(1,q.life)*.6);ba[m]=Math.min(1,q.life);m++}
bgeo.setDrawRange(0,m);['position','aCol','aSize','aAlpha'].forEach(n=>bgeo.attributes[n].needsUpdate=true)}

/* ── 標籤（可點選的連結），位置每幀由 3D 投影而來 ── */
const holder=document.querySelector('#portals'),links=[];let hover=-1,flash=0,downMoved=0,ri=0,time=0;
names.forEach((nm,i)=>{const a=document.createElement('a');a.href=`experience.html?id=${i+1}`;a.className='portal';a.setAttribute('aria-label',nm);a.innerHTML=`<span>${nm}</span><small>${String(i+1).padStart(2,'0')} · ${(window.AIW_EN||[])[i]||''}</small>`;
const enter=()=>{if(hover!==i)Sound.call('hover',i,i%5,false);hover=i};a.addEventListener('pointerenter',enter);a.addEventListener('focus',enter);a.addEventListener('pointerleave',()=>{if(hover===i)hover=-1});a.addEventListener('blur',()=>{if(hover===i)hover=-1});
a.addEventListener('click',e=>{if(downMoved>12){e.preventDefault();return}if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;Sound.unlock();Sound.call('enter',i%5);burst(i);const c=nodeAt(i,time,new THREE.Vector3());U.uRip.value[ri++%4].set(c.x,c.y,c.z,time);const r=a.getBoundingClientRect(),st=document.body.style;st.setProperty('--lx',r.left+r.width/2+'px');st.setProperty('--ly',r.top+r.height/2+'px');st.setProperty('--leave','#0a1e26')});
holder.append(a);links.push(a)});
/* 中心的路口：所有邊界匯在這裡，從這裡接上終端（觸語） */
const junction=document.createElement('a');junction.href='tongue.html';junction.className='portal junction';junction.setAttribute('aria-label','終端：觸語');junction.innerHTML='<i></i><span>終端</span><small>TERMINAL</small>';
junction.addEventListener('pointerenter',()=>Sound.call('hover',3,3,false));junction.addEventListener('click',e=>{if(!unlocked){e.preventDefault();return}if(downMoved>12){e.preventDefault();return}if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;Sound.unlock();Sound.call('enter',2);flash=1;const r=junction.getBoundingClientRect(),st=document.body.style;st.setProperty('--lx',r.left+r.width/2+'px');st.setProperty('--ly',r.top+r.height/2+'px');st.setProperty('--leave','#0a1e26')});let doneN=0;try{doneN=new Set(JSON.parse(localStorage.getItem('aiw_done')||'[]').filter(n=>n>=1&&n<=NN)).size}catch(e){}
const unlocked=doneN>=NN||new URLSearchParams(location.search).has('terminal');
if(!unlocked){junction.classList.add('locked');junction.removeAttribute('href');junction.setAttribute('aria-disabled','true');junction.setAttribute('aria-label','走完十道邊界後，這裡會接上終端（目前 '+doneN+'/'+NN+'）');junction.querySelector('small').textContent=doneN+' / '+NN}
holder.append(junction);

/* ── 環繞 ── */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),ptrs=new Map(),BASE=portrait?1150:1020,cam={yaw:0,pitch:portrait?.95:.5,dist:BASE};let tYaw=0,tPitch=portrait?.95:.5,zoom=1,idle=99,pinch0=0;
addEventListener('pointerdown',e=>{if(e.target.closest('.sound-toggle,.vr-button'))return;ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});downMoved=0;pinch0=0});
addEventListener('pointermove',e=>{const p=ptrs.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
if(ptrs.size>1){const [a,b]=[...ptrs.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(pinch0)zoom=clamp(zoom*pinch0/d,.45,2.2);pinch0=d;downMoved=99;idle=0;return}
downMoved+=Math.abs(dx)+Math.abs(dy);if(downMoved>12){tYaw-=dx*.005;tPitch=clamp(tPitch+dy*.004,-.15,1.3);idle=0}});
const ray=new THREE.Vector3(),tmp=new THREE.Vector3();
/* 點空白處：從指向的地面送出一圈漣漪 */
function rippleAt(cx,cy){ray.set(cx/innerWidth*2-1,-(cy/innerHeight)*2+1,.5).unproject(camera).sub(camera.position).normalize();const t=ray.y<-1e-3?(FLOOR-camera.position.y)/ray.y:1200;tmp.copy(camera.position).addScaledVector(ray,t);U.uRip.value[ri++%4].set(tmp.x,tmp.y,tmp.z,time)}
addEventListener('pointerup',e=>{if(downMoved<=12&&!e.target.closest('a,button')&&!renderer.xr.isPresenting){rippleAt(e.clientX,e.clientY);Sound.whoosh(1200,260,1.2,.05)}ptrs.delete(e.pointerId)});addEventListener('pointercancel',e=>ptrs.delete(e.pointerId));
addEventListener('wheel',e=>{zoom=clamp(zoom*Math.exp(e.deltaY*.001),.45,2.2);idle=0},{passive:true});
addEventListener('keydown',e=>{const k={ArrowLeft:[.15,0],ArrowRight:[-.15,0],ArrowUp:[0,.12],ArrowDown:[0,-.12]}[e.key];if(k){e.preventDefault();tYaw+=k[0];tPitch=clamp(tPitch+k[1],-.15,1.3);idle=0}});

/* ── VR：世界縮小置於前方；視線對準節點、按扳機進入 ── */
const labels=names.map(nm=>{const c=document.createElement('canvas');c.width=512;c.height=128;const x=c.getContext('2d');x.textAlign='center';x.fillStyle='#dceeff';x.font='48px "PMingLiU","Noto Serif TC",serif';x.shadowColor='#4fc4ff';x.shadowBlur=18;x.fillText(nm,256,80);
const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthTest:false}));s.scale.set(320,80,1);s.visible=false;s.renderOrder=6;world.add(s);return s});
const eye=new THREE.Vector3(),dir=new THREE.Vector3(),nc=new THREE.Vector3();
function gazePick(){let best=-1,bestA=.2;camera.getWorldDirection(dir);eye.setFromMatrixPosition(camera.matrixWorld);names.forEach((n,i)=>{nodeAt(i,time,tmp);world.localToWorld(tmp);const a=tmp.sub(eye).normalize().angleTo(dir);if(a<bestA){bestA=a;best=i}});return best}
/* VR：用光點組成的手指向節點、捏合進入；沒有手勢追蹤時用控制器，或以視線對準 */
const vrPts=()=>[...names.map((n,i)=>world.localToWorld(nodeAt(i,time,new THREE.Vector3()))),world.localToWorld(new THREE.Vector3(0,-10,0))];
function vrPick(){if(!vr)return gazePick();const h=vr.hands.find(h=>h.tracked||(!h.isHand&&h.pts.length));return h?vr.pick(h,vrPts(),.2):gazePick()}
const vr=window.AIWVR&&window.AIWVR({renderer,scene,camera,mount:b=>document.body.append(b),
 onStart(){Sound.unlock();const ws=.0026;world.scale.setScalar(ws);world.position.set(0,1.4,-1.9);U.uWS.value=ws;camera.near=.05;camera.updateProjectionMatrix();labels.forEach(l=>l.visible=true)},
 onEnd(){world.scale.setScalar(1);world.position.set(0,0,0);U.uWS.value=1;camera.near=1;camera.updateProjectionMatrix();labels.forEach(l=>l.visible=false);resize()},
 onPinchStart(h){const g=vr.pick(h,vrPts(),.2);if(g>=0&&g<links.length)links[g].click();else if(g===links.length&&unlocked)junction.click()}});

function resize(){renderer.setPixelRatio(Math.min(devicePixelRatio||1,mobile?1.5:2));renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();U.uPixel.value=renderer.getPixelRatio()}
let last=0;
function tick(ms){const dt=last?Math.min((ms-last)/1000,.05):.016;last=ms;if(document.hidden)return;time+=dt*(reduced?.3:1);U.uTime.value=time;idle+=dt;
const xr=renderer.xr.isPresenting;if(xr){vr&&vr.update();const g=vrPick();if(g!==hover&&g>=0)Sound.call('hover',g,g%5,false);hover=g;vr&&vr.text([['觸碰一個節點，進入一道邊界','inst'],['手指指向節點　·　捏合進入','hint'],['Point at a node · pinch to enter','en']])}
U.uFocal.value=Math.max(300,camera.position.length()/world.scale.x);U.uHover.value=hover;flash*=Math.pow(.05,dt);U.uFlash.value=flash*.5;stepBursts(dt*60);
labels.forEach((l,i)=>{nodeAt(i,time,l.position);l.position.y-=110});
if(!xr){const fit=(portrait?Math.max(1,Math.min(2.8,1.2/camera.aspect)):Math.max(1,1.4/camera.aspect))*(idle>5&&!reduced?1+.06*Math.sin(time*.06):1);if(idle>5&&!reduced)tYaw+=dt*.015;const k=Math.min(1,dt*2);cam.yaw+=(tYaw-cam.yaw)*k;cam.pitch+=(tPitch-cam.pitch)*k;cam.dist+=(BASE*fit*zoom-cam.dist)*k;
const c=Math.cos(cam.pitch);camera.position.set(Math.sin(cam.yaw)*c*cam.dist,Math.sin(cam.pitch)*cam.dist,Math.cos(cam.yaw)*c*cam.dist);if(flash>.05){camera.position.x+=(R()-.5)*flash*10;camera.position.y+=(R()-.5)*flash*10}camera.lookAt(0,-75,0);camera.updateMatrixWorld();
{tmp.set(0,-10,0).project(camera);junction.style.left=(tmp.x*.5+.5)*innerWidth+'px';junction.style.top=(-tmp.y*.5+.5)*innerHeight+'px';junction.style.visibility=tmp.z<1?'visible':'hidden'}
links.forEach((a,i)=>{nodeAt(i,time,tmp).project(camera);a.style.left=(tmp.x*.5+.5)*innerWidth+'px';a.style.top=(-tmp.y*.5+.5)*innerHeight+'px';a.style.visibility=tmp.z<1?'visible':'hidden'})}
sky.position.setFromMatrixPosition(camera.matrixWorld);
Sound.update({pressure:0,charge:0,px:innerWidth/2,py:innerHeight/2,w:innerWidth,h:innerHeight,lift:hover>=0?1:0});
renderer.render(scene,camera)}
addEventListener('resize',resize);resize();renderer.setAnimationLoop(tick);
const Q=new URLSearchParams(location.search);if(Q.has('yaw')){tYaw=cam.yaw=+Q.get('yaw');tPitch=cam.pitch=+(Q.get('pitch')||.5)}
return true};
