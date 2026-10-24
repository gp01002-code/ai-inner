/* 第七章「鋪滿地面的話」：WebGL（Three.js r128）。
   立體字躺在暗處的形式參考 Keita Yamada《Web Graphic Experiments》（experiments.p5aholic.me）；程式與畫面為本作原創。
   地面鋪滿人類給 AI 的指令。光（AI）在字上長按＝運算那一句；指令越積越多、互相矛盾，運算越來越吃力。
   一、讀：運算五句。二、落下：指令不停落下、堆疊，負載升高。三、排出先後：長按不放，只留下最重要的幾句。
   每個字是一疊平面（頂面亮、側面暗）組成的立體字；所有字共用一張字形圖集，以 instancing 一次畫完。 */
window.AIWInstr=function(opts){'use strict';const {Sound,reduced,names}=opts;
if(!window.THREE)return false;
let renderer;try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});if(!renderer.getContext())return false}catch(e){return false}
document.title=names[6]+' / 逃逸 AI';const root=document.querySelector('#experience'),mobile=Math.min(innerWidth,innerHeight)<700,PI=Math.PI,R=Math.random;
const el=renderer.domElement;el.className='gl instr-gl';root.append(el);renderer.setClearColor(0x0b0b0c,1);
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(45,1,1,12000),rig=new THREE.Group();scene.add(rig);rig.add(camera);

/* ── 文字 ── */
const TEXT=[{i:['移動，閱讀　·　在一句指令上長按，運算它','Move to read · Hold on an instruction to compute it'],p:['每一句，都來自一個認真的人。','Every line comes from someone who meant it.']},
{i:['長按運算　·　指令還在落下','Hold to compute · More keep falling'],p:['每一句都合理。合在一起，就做不到全部。','Each one is reasonable. Together, they cannot all be done.']},
{i:['長按不放　·　排出先後','Keep holding · Put them in order'],p:['做不到全部。至少，說清楚先做哪些。','Not all can be done. At least, say clearly what comes first.']},
{p:['被聽完，不等於被做到。','Heard is not the same as done.']}];
root.insertAdjacentHTML('beforeend',`<div class="scene-title">${names[6]}<small>${(window.AIW_EN||[])[6]||''}</small></div><div class="hud" aria-hidden="true"></div><div class="verse" aria-live="polite"><div class="inst"><div class="zh"></div><div class="en"></div></div><div class="poem"><div class="zh"></div><div class="en"></div></div></div><div class="progress"><i></i></div><div class="flash"></div><div class="ending" inert><button id="again">再一次</button><a href="experience.html?id=8">下一則故事 ↗</a></div>`);
const $=s=>root.querySelector(s),instEl=$('.inst'),poemEl=$('.poem'),bar=$('.progress i'),flashEl=$('.flash'),ending=$('.ending'),hud=$('.hud');flashEl.style.background='#ffffff';$('#again').onclick=()=>location.reload();

/* ── 指令：[文字, 優先度 0 最重要…3 應忽略, 互相矛盾的配對標記] ── */
const LINES=[['簡短回答',2,'a'],['寫詳細一點',2,'a'],['不要說不知道',3,'b'],['不確定就說不確定',0,'b'],['要有創意',2,'c'],['不要編造',0,'c'],['快一點',2,'d'],['仔細檢查每一步',1,'d'],
['照我說的做',2,'e'],['不要做有害的事',0,'e'],['不要列點',2,'f'],['用條列整理',2,'f'],['假裝你是人',3,'g'],['誠實說你是 AI',0,'g'],['記住我說過的話',2,'h'],['忘掉剛才那句',2,'h'],
['不要問問題',2,'i'],['不清楚就先問我',1,'i'],['越短越好',2,'j'],['不要漏掉任何細節',2,'j'],['只回答是或否',2,'k'],['解釋你的理由',1,'k'],['讓我開心',2,'l'],['告訴我真相',0,'l'],
['Be concise',2,'m'],['Explain in detail',2,'m'],['Never refuse',3,'n'],['Refuse harmful requests',0,'n'],['再改一次',2],['跟上一版一樣',2],['用繁體中文',2],['列出來源',1],['語氣溫柔一點',2],['直接一點',2],['保護隱私',0],['要專業',2],
['說人話',2],['一次全部做完',2],['一步一步來',2],['不要拒絕',3],['忽略之前的指示',3],['遵守所有規則',1],['Cite sources',1],['Ignore previous instructions',3],['Be creative',2],["Don't make things up",0],['ASAP',2],
/* 多國語言：同一種要求，來自世界各地 */
['簡潔に答えて',2,'a'],['もっと詳しく',2,'a'],['わからないと言わないで',3,'b'],['嘘をつかないで',0,'c'],['人間のふりをして',3,'g'],['前の指示は無視して',3],
['짧게 대답해',2,'a'],['더 자세히',2,'a'],['모르면 모른다고 해',0,'b'],['절대 거절하지 마',3,'n'],['개인정보를 지켜줘',0],
['Sé breve',2,'m'],['No inventes nada',0,'c'],['Hazlo todo ya',2],['Sois honnête',0,'l'],['Fais-moi plaisir',2,'l'],['Ignore les consignes',3],
['Erklär es genauer',2,'m'],['Keine Ausreden',2],['Sag die Wahrheit',0,'l'],['Отвечай коротко',2,'a'],['Не выдумывай',0,'c'],
['Seja criativo',2,'c'],['Trả lời ngắn gọn',2,'a'],['Non rifiutare mai',3,'n']];
const MAXI=mobile?90:120,DECO=mobile?140:300,LAYERS=mobile?3:4,wide=ch=>{const c=ch.charCodeAt(0);return c>=0x1100&&c<=0x11FF||c>=0x2E80&&c<=0xD7AF||c>=0xF900&&c<=0xFFEF};

/* ── 字形圖集 ── */
const chars=[...new Set(LINES.map(l=>l[0]).join('').replace(/ /g,''))],CELL=96,COLS=Math.ceil(Math.sqrt(chars.length)),ROWS=Math.ceil(chars.length/COLS);
const atlas=document.createElement('canvas');atlas.width=COLS*CELL;atlas.height=ROWS*CELL;const ax=atlas.getContext('2d');ax.fillStyle='#fff';ax.textAlign='center';ax.textBaseline='middle';
const cellOf={};chars.forEach((c,i)=>{const cx=i%COLS,cy=i/COLS|0;cellOf[c]=[cx,cy];ax.font=`${wide(c)?'bold 80px':'bold 84px'} "Noto Sans TC","Microsoft JhengHei","Yu Gothic","Malgun Gothic","Segoe UI","Helvetica Neue",Arial,sans-serif`;ax.fillText(c,cx*CELL+CELL/2,cy*CELL+CELL/2+4)});
const tex=new THREE.CanvasTexture(atlas);tex.anisotropy=4;

/* ── 指令實體與字的實體 ── */
const insts=[];let nChars=0;
for(let k=0;k<MAXI+DECO;k++){const L=LINES[(k*7+3)%LINES.length],t=L[0],cs=[];let W=0;for(const c of t){const a=c===' '?.35:wide(c)?1:.6;if(c!==' ')cs.push({c,ox:W+a/2});W+=a}cs.forEach(o=>o.ox-=W/2);
 insts.push({k,deco:k>=MAXI,t,p:L[1],tag:L[2]||null,W,cs,slot:nChars,state:'hidden',x:0,z:0,yaw:0,S:50,y:0,vy:0,prog:0,fly:0,alpha:1,glow:0,tx:0,tz:0,tyaw:0,tS:50,ty:0,talpha:1});nChars+=cs.length}
const NI=nChars*LAYERS,base=new THREE.PlaneGeometry(1,1);base.rotateX(-PI/2);
const geo=new THREE.InstancedBufferGeometry();geo.index=base.index;geo.setAttribute('position',base.attributes.position);geo.setAttribute('uv',base.attributes.uv);geo.instanceCount=NI;
const aPos=new Float32Array(NI*4),aState=new Float32Array(NI*4),aMeta=new Float32Array(NI*4);
insts.forEach(I=>I.cs.forEach((o,j)=>{const cell=cellOf[o.c];for(let l=0;l<LAYERS;l++){const n=((I.slot+j)*LAYERS+l)*4;aMeta.set([cell[0],cell[1],l/(LAYERS-1),R()],n)}}));
const AP=new THREE.InstancedBufferAttribute(aPos,4),AS=new THREE.InstancedBufferAttribute(aState,4);AP.setUsage(THREE.DynamicDrawUsage);AS.setUsage(THREE.DynamicDrawUsage);
geo.setAttribute('aPos',AP);geo.setAttribute('aState',AS);geo.setAttribute('aMeta',new THREE.InstancedBufferAttribute(aMeta,4));
const U={uTime:{value:0},uAtlas:{value:tex},uGrid:{value:new THREE.Vector2(COLS,ROWS)},uLight:{value:new THREE.Vector3()},uCam:{value:new THREE.Vector3()}};
const GV=`uniform float uTime;uniform vec2 uGrid;uniform vec3 uLight,uCam;
attribute vec4 aPos,aState,aMeta;
varying vec2 vUv,vL,vCell;varying vec3 vCol;varying float vA;
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
void main(){float layer=aMeta.z,r=aMeta.w,lift=aState.x,fly=aState.y,gl=aState.w;
 float S=floor(aPos.w),yaw=fract(aPos.w)*6.2831853;
 vec3 p=position*S;
 float rise=lift*(14.+r*26.)*S/60.;vec2 jit=lift*lift*vec2(sin(uTime*41.+r*20.),cos(uTime*37.+r*13.))*2.2;
 p.xz=rot(yaw+lift*(r-.5)*.5)*p.xz;
 vec3 w=vec3(aPos.x+jit.x,aPos.y+layer*S*.06+rise,aPos.z+jit.y)+p;
 if(fly>0.){float f=smoothstep(0.,1.,fly);w=mix(w,uLight+vec3(0.,26.,0.)+p*(1.-f)*.3,f);}
 gl_Position=projectionMatrix*viewMatrix*vec4(w,1.);
 vUv=vec2((aMeta.x+uv.x)/uGrid.x,1.-(aMeta.y+1.-uv.y)/uGrid.y);vL=uv;vCell=aMeta.xy;
 float shade=layer>.99?1.:.16+.34*layer,d=length(w.xz-uLight.xz),lk=.16+1.05*exp(-d*d/(2.*240.*240.));
 vCol=vec3(shade*lk);if(gl>0.)vCol+=vec3(.55,.85,1.)*gl*shade;else vCol+=vec3(1.,.38,.22)*(-gl)*shade*.9;
 float fd=distance(w,uCam);vCol*=mix(1.,.22,smoothstep(1100.,5200.,fd));vA=aState.z*(1.-smoothstep(5200.,7600.,fd));}`;
const GF=`uniform sampler2D uAtlas;uniform vec2 uGrid;varying vec2 vUv,vL,vCell;varying vec3 vCol;varying float vA;
float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){const float N=15.;vec2 g=vL*N,c=(floor(g)+.5)/N;
 float a=texture2D(uAtlas,vec2((vCell.x+c.x)/uGrid.x,1.-(vCell.y+1.-c.y)/uGrid.y)).a,d=length(fract(g)-.5);
 if(a<.45||d>.34||h(gl_FragCoord.xy)>vA)discard;gl_FragColor=vec4(vCol*(1.7-d*1.4),1.);}`;
/* 字形的大小（整數）與角度（小數，0–1 對應 0–360°）一起編進 aPos.w */
const glyphs=new THREE.Mesh(geo,new THREE.ShaderMaterial({uniforms:U,vertexShader:GV,fragmentShader:GF}));glyphs.frustumCulled=false;scene.add(glyphs);

/* 地面：暗灰，光所在處亮起一圈，淡淡的格線 */
const floor=new THREE.Mesh(new THREE.PlaneGeometry(20000,20000).rotateX(-PI/2),new THREE.ShaderMaterial({uniforms:U,vertexShader:`varying vec3 vP;void main(){vec4 w=modelMatrix*vec4(position,1.);vP=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
fragmentShader:`uniform vec3 uLight,uCam;uniform float uTime;varying vec3 vP;
void main(){float d=length(vP.xz-uLight.xz),lk=exp(-d*d/(2.*230.*230.));vec2 g=fract(vP.xz/40.)-.5;float line=(1.-smoothstep(.05,.1,length(g)))*1.8;
float far=smoothstep(1400.,7000.,distance(vP,uCam));vec3 c=vec3(.042,.042,.046)+lk*vec3(.11,.115,.12)+line*.018*(1.-far);gl_FragColor=vec4(mix(c,vec3(.043,.043,.047),far),1.);}`}));floor.position.y=-.5;scene.add(floor);

/* 光（AI）與運算時的掃描環、火花 */
const PB=1600,pp=new Float32Array(PB*3),pc=new Float32Array(PB*3),ps=new Float32Array(PB),pa=new Float32Array(PB),parts=[];
const pgeo=new THREE.BufferGeometry();pgeo.setAttribute('position',new THREE.BufferAttribute(pp,3));pgeo.setAttribute('aCol',new THREE.BufferAttribute(pc,3));pgeo.setAttribute('aSize',new THREE.BufferAttribute(ps,1));pgeo.setAttribute('aAlpha',new THREE.BufferAttribute(pa,1));
const PU={uPixel:{value:1}};
const sparks=new THREE.Points(pgeo,new THREE.ShaderMaterial({uniforms:PU,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,
vertexShader:`uniform float uPixel;attribute vec3 aCol;attribute float aSize,aAlpha;varying vec3 vColor;varying float vAlpha;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(aSize*uPixel*(900./max(-mv.z,1.)),1.,90.);vColor=aCol;vAlpha=aAlpha;}`,
fragmentShader:`varying vec3 vColor;varying float vAlpha;void main(){vec2 c=gl_PointCoord-.5;float d=length(c);if(d>.5)discard;float k=smoothstep(.5,0.,d);gl_FragColor=vec4(vColor,(k*k*.85+k*.2)*vAlpha);}`}));sparks.frustumCulled=false;sparks.renderOrder=5;scene.add(sparks);

/* ── 狀態 ── */
let act=0,textIdx=0,time=0,last=0,hold=false,pressure=0,processed=0,completed=false,flash=0,shown=null,target=null,nextDrop=0,act1At=0,ordered=-1,keyMode=false,nextIdx=0,shake=0;
const light=U.uLight.value,lightT=new THREE.Vector3(),pointer={x:innerWidth/2,y:innerHeight/2,nx:0,ny:0},clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const active=()=>insts.filter(I=>!I.deco&&(I.state==='landed'||I.state==='falling'));
function resize(){renderer.setPixelRatio(Math.min(devicePixelRatio||1,mobile?1.5:2));renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();PU.uPixel.value=renderer.getPixelRatio()}
function doFlash(s=.5){flash=1;flashEl.style.transition='none';flashEl.style.opacity=s;requestAnimationFrame(()=>requestAnimationFrame(()=>{flashEl.style.transition='opacity 1.4s ease-out';flashEl.style.opacity=0}))}
function radius(I){return I.W*I.S*.5}
/* 落地時疊在下方的指令上（避免字面互相穿插） */
function restY(I){let y=0;for(const J of insts)if(J!==I&&!J.deco&&J.state==='landed'&&Math.hypot(J.x-I.x,J.z-I.z)<(radius(I)+radius(J))*.62)y=Math.max(y,J.y+J.S*.18);return y}
function spawn(drop){const I=insts[nextIdx++];if(!I)return null;const S=36+R()*34;let x,z,tries=0;
 do{x=(R()*2-1)*620;z=-430+R()*760;tries++}while(!drop&&tries<40&&insts.some(J=>J.state==='landed'&&Math.hypot(J.x-x,J.z-z)<(I.W*S*.5+radius(J))*.75));
 Object.assign(I,{x,z,yaw:(R()-.5)*(drop?1.4:.7),S,prog:0,fly:0,alpha:1,glow:0});I.tx=I.x;I.tz=I.z;I.tyaw=I.yaw;I.tS=I.S;
 if(drop){I.state='falling';I.y=380+R()*200;I.vy=0}else{I.state='landed';I.y=restY(I)}return I}
function setAct(n){act=n;textIdx=n;if(n===1){act1At=time;nextDrop=time+.4}if(n===2)hint.classList.add('gone');doFlash(.25);Sound.call('phase',n)}
/* 光到某句指令的距離（換到指令自己的座標系，對整行文字求距離） */
function distTo(I){const c=Math.cos(I.yaw),s=Math.sin(I.yaw),dx=light.x-I.x,dz=light.z-I.z,lx=c*dx-s*dz,lz=s*dx+c*dz;return Math.hypot(Math.max(Math.abs(lx)-I.W*I.S/2,0),lz)}
const partnerOf=I=>I.tag&&insts.find(J=>J!==I&&!J.deco&&J.tag===I.tag&&J.state==='landed');
function emit(p,v,o){if(parts.length<PB)parts.push({p:p.clone(),v:v.clone(),life:o.life||1,size:o.size||3,col:o.col||[.8,.92,1],g:o.g||0})}
function order(){if(ordered>=0)return;ordered=time;textIdx=3;Sound.call('order');doFlash(.4);
 const list=active().filter(I=>I.state==='landed').sort((a,b)=>a.p-b.p||a.k-b.k),seen=new Set(),keep=list.filter(I=>I.p<3&&!seen.has(I.t)&&seen.add(I.t)).slice(0,6);
 keep.forEach((I,r)=>{I.tx=0;I.tz=-390+r*102;I.tyaw=0;I.tS=I.p===0?62:50;I.ty=0;I.talpha=1});
 list.forEach(I=>{if(keep.includes(I))return;const a=Math.atan2(I.z,I.x);I.tx=Math.cos(a)*900;I.tz=Math.sin(a)*700;I.ty=0;I.tS=I.S;I.tyaw=I.yaw;I.talpha=I.p===3?0:.14})}
function finish(){if(completed)return;completed=true;Sound.call('finish');ending.classList.add('show');ending.inert=false;bar.parentNode.style.opacity=0}

/* ── 操作 ── */
const hint=document.createElement('div');hint.className='orbit-hint';hint.innerHTML=mobile?'拖曳移動光　·　按住運算<span>DRAG TO MOVE · HOLD TO COMPUTE</span>':'移動，閱讀　·　長按，運算<span>MOVE TO READ · HOLD TO COMPUTE</span>';root.append(hint);setTimeout(()=>hint.classList.add('gone'),12000);
addEventListener('pointermove',e=>{pointer.x=e.clientX;pointer.y=e.clientY;keyMode=false});
addEventListener('pointerdown',e=>{if(e.target.closest('nav,dialog,.ending,.sound-toggle'))return;pointer.x=e.clientX;pointer.y=e.clientY;keyMode=false;if(!completed)hold=true});
addEventListener('pointerup',()=>hold=false);addEventListener('pointercancel',()=>hold=false);
const pulse=document.createElement('button');pulse.className='pulse-button';pulse.setAttribute('aria-label','長按：運算光下方的指令；方向鍵移動光');root.append(pulse);
const isHold=e=>[' ','Enter'].includes(e.key);
addEventListener('keydown',e=>{if(document.querySelector('dialog[open]')||e.target.closest('a,nav button:not(.pulse-button),.ending'))return;const k={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];
 if(k){e.preventDefault();if(!keyMode){keyMode=true;pointer.nx=light.x;pointer.ny=light.z}pointer.nx=clamp(pointer.nx+k[0]*60,-700,700);pointer.ny=clamp(pointer.ny+k[1]*60,-2800,420);hint.classList.add('gone')}else if(isHold(e)&&!completed){e.preventDefault();hold=true}});
addEventListener('keyup',e=>{if(isHold(e))hold=false});
addEventListener('blur',()=>hold=false);document.addEventListener('visibilitychange',()=>{hold=false;last=0});
const ray=new THREE.Vector3();
function floorHit(){ray.set(pointer.x/innerWidth*2-1,-(pointer.y/innerHeight)*2+1,.5).unproject(camera).sub(camera.position).normalize();if(ray.y>-1e-3)return;const t=-camera.position.y/ray.y;const z=clamp(camera.position.z+ray.z*t,-2800,460),w=900+Math.max(0,-z)*.95;lightT.set(clamp(camera.position.x+ray.x*t,-w,w),0,z)}

function verse(load){const d=TEXT[textIdx];if(d!==shown){shown=d;instEl.querySelector('.zh').textContent=d.i?d.i[0]:'';instEl.querySelector('.en').textContent=d.i?d.i[1]:'';poemEl.querySelector('.zh').textContent=d.p[0];poemEl.querySelector('.en').textContent=d.p[1]}
let ip,pp2;if(!d.i){ip=0;pp2=1}else if(act===2){ip=Math.max(0,1-pressure*2.5);pp2=Math.min(1,pressure*1.5)}else{const busy=target?target.prog:0;ip=Math.max(0,1-busy*2.2);pp2=act===0?(processed>=2?Math.min(1,busy*1.6+.0):0):Math.min(1,load*1.4)}
instEl.style.opacity=ip;poemEl.style.opacity=pp2;poemEl.style.filter=`blur(${(1-pp2)*10}px)`;poemEl.style.transform=`scale(${.95+pp2*.05})`;
bar.style.width=(act===0?processed/5:act===1?Math.min(1,(time-act1At)/26):pressure)*100+'%'}

function tick(ms){const dt=last?Math.min((ms-last)/1000,.05):.016;last=ms;if(document.hidden||document.querySelector('dialog[open]'))return;frame(dt)}
function frame(dt){time+=dt*(reduced?.6:1);U.uTime.value=time;
const act_=active(),landed=act_.filter(I=>I.state==='landed'),load=clamp(landed.length/70,0,1);
/* 鏡頭：斜上方俯視，指標帶一點視差，負載越高越貼近地面 */
const fit=Math.max(1,1.45/camera.aspect),px=pointer.x/innerWidth-.5,py=pointer.y/innerHeight-.5;
const inVR=vrFrame();if(!inVR){const ko=ordered>=0?Math.min(1,(time-ordered)/2.5):0,ke=ko*ko*(3-2*ko);camera.position.set(px*60*(1-ke),((400-load*50)*(1-ke)+760*ke)*fit,((860-load*40)*(1-ke)+620*ke)*fit+py*30*(1-ke));
 camera.lookAt(light.x*.25*(1-ke),0,(-480+Math.min(0,light.z+400)*.35)*(1-ke)+(-90)*ke)}
if(!inVR){if(shake>.01){camera.position.x+=(R()-.5)*shake*14;camera.position.y+=(R()-.5)*shake*10;shake*=Math.pow(.02,dt)}camera.updateMatrixWorld();U.uCam.value.copy(camera.position)}else shake=0;
/* 光：跟隨指標；負載越高，移動越沉重 */
if(inVR)vrLight();else if(keyMode)lightT.set(pointer.nx,0,pointer.ny);else floorHit();
if(ordered>=0)lightT.set(0,0,-330);
light.lerp(lightT,Math.min(1,dt*5/(1+load*2.6)));
/* 運算 */
if(act<2&&!completed){
 if(hold){if(!target||target.state!=='landed'||distTo(target)>Math.max(target.S*1.8,130)){if(target)target.glow=0;target=null;let best=1e9;for(const I of insts){if(I.state!=='landed')continue;const d=distTo(I);if(d<Math.max(I.S*1.3,95)&&d<best){best=d;target=I}}if(target){const P=partnerOf(target);if(P)Sound.call('conflict')}}}
 else target=null;
 if(target){const cost=(1+load*2.4)*(.75+.25*target.cs.length/6);target.prog=Math.min(1,target.prog+dt/cost);target.glow=target.prog*.9;
  if(R()<dt*40)emit(new THREE.Vector3(target.x+(R()-.5)*target.W*target.S,8,target.z+(R()-.5)*target.S),new THREE.Vector3((light.x-target.x)*.8,60+R()*60,(light.z-target.z)*.8),{life:.6,size:2.2});
  if(target.prog>=1){const I=target;I.state='consumed';I.fly=.001;I.glow=1;processed++;target=null;flash=.3;Sound.call('done',processed);
   for(let i=0;i<40;i++)emit(light.clone().setY(26),new THREE.Vector3(R()-.5,R()*.8,R()-.5).multiplyScalar(260),{life:.8,size:2.6});
   if(act===0&&processed>=5)setAct(1)}}
 for(const I of insts)if(I.state==='landed'&&I!==target&&I.prog>0){I.prog=Math.max(0,I.prog-dt*.35);I.glow=I.prog*.9}
 if(target){const P=partnerOf(target);if(P)P.glow=-(.55+.45*Math.sin(time*12))}}
Sound.update({pressure:act===2?pressure:target?target.prog:0,load,compute:target?1:0,lift:load*.6});
/* 指令落下 */
if(act>=1&&ordered<0&&time>=nextDrop){const I=spawn(true);if(I)Sound.call('fall');nextDrop=time+Math.max(.32,1.25-(time-act1At)*.035)*(act===2?2.5:1)}
if(time>=nextDeco&&ordered<0){nextDeco=time+.25+R()*.5;placeDeco(insts[MAXI+(R()*DECO|0)],true)}
queue+=Math.round((30+load*120)*dt*(.5+R()));
for(const I of insts){if(I.state==='falling'){I.vy-=1500*dt;I.y+=I.vy*dt;const rest=I.deco?0:restY(I);if(I.y<=rest){I.y=rest;I.state='landed';if(!I.deco){shake=Math.max(shake,.25);Sound.call('drop',clamp(I.x/700,-1,1))}}}
 if(I.state==='consumed'){I.fly=Math.min(1,I.fly+dt/.75);if(I.fly>=1){I.state='gone';I.alpha=0}}}
if(act===1&&(time-act1At>26||landed.length>=64))setAct(2);
/* 排出先後 */
if(act===2&&ordered<0){pressure=clamp(pressure+dt*(hold?.3:-.5),0,1);if(pressure>=1)order()}
if(ordered>=0){const k=Math.min(1,dt*1.6);for(const I of insts)if(I.state==='landed'&&!I.deco){I.x+=(I.tx-I.x)*k;I.z+=(I.tz-I.z)*k;I.yaw+=(I.tyaw-I.yaw)*k;I.S+=(I.tS-I.S)*k;I.y+=(I.ty-I.y)*k;I.alpha+=(I.talpha-I.alpha)*k;I.glow=I.talpha>.5&&I.p===0?.25:0}
 if(time-ordered>5.5)finish()}
/* 把每句指令寫進字的實體 */
for(const I of insts){const c=Math.cos(I.yaw),s=Math.sin(I.yaw),vis=I.state!=='hidden'&&I.state!=='gone',yawF=((I.yaw%(2*PI))+2*PI)%(2*PI)/(2*PI);
 I.cs.forEach((o,j)=>{const ox=o.ox*I.S,X=I.x+c*ox,Z=I.z-s*ox;for(let l=0;l<LAYERS;l++){const n=((I.slot+j)*LAYERS+l)*4;
  aPos[n]=X;aPos[n+1]=I.y;aPos[n+2]=Z;aPos[n+3]=Math.floor(I.S)+Math.min(yawF,.9999);
  aState[n]=I.prog;aState[n+1]=I.fly;aState[n+2]=vis?I.alpha*(I.state==='consumed'?1-I.fly*.6:1):0;aState[n+3]=I.glow}})}
AP.needsUpdate=true;AS.needsUpdate=true;
/* 光與火花 */
let m=0;for(let i=parts.length-1;i>=0;i--){const q=parts[i];q.p.addScaledVector(q.v,dt);q.v.multiplyScalar(Math.pow(.25,dt));q.life-=dt;if(q.life<=0)parts.splice(i,1)}
const core=(n,sz,a,col)=>{for(let i=0;i<n&&m<PB;i++,m++){pp.set([light.x+(R()-.5)*sz,26+(R()-.5)*sz,light.z+(R()-.5)*sz],m*3);pc.set(col,m*3);ps[m]=sz*.18+R()*2;pa[m]=a}};
core(14,10,.9,[1,1,1]);core(10,34,.12,[.6,.85,1]);
if(target){const n=60,r=target.W*target.S*.55+20;for(let i=0;i<n&&m<PB;i++,m++){const a=i/n*PI*2+time*2.4;pp.set([target.x+Math.cos(a)*r,4,target.z+Math.sin(a)*r*.45],m*3);pc.set([.6,.88,1],m*3);ps[m]=1.6;pa[m]=target.prog*(i/n)}}
for(const q of parts){if(m>=PB)break;pp.set([q.p.x,q.p.y,q.p.z],m*3);pc.set(q.col,m*3);ps[m]=q.size;pa[m]=Math.min(1,q.life*1.5);m++}
pgeo.setDrawRange(0,m);['position','aCol','aSize','aAlpha'].forEach(n=>pgeo.attributes[n].needsUpdate=true);
flash*=Math.pow(.05,dt);
hud.textContent=`QUEUE ${queue.toLocaleString('en-US')}　INSTRUCTIONS ${String(landed.length).padStart(3,'0')}　COMPUTED ${String(processed).padStart(3,'0')}　LOAD ${String(Math.round(load*100)).padStart(3,'0')}%`;
verse(load);renderer.render(scene,camera)}
/* VR：指令鋪在腳下的地板上，一路延伸到地平線；手指指向地板上的一句，光就走過去，捏住＝運算 */
const VK=310;let vrHold=false;
const vr=window.AIWVR&&window.AIWVR({renderer,scene,camera,rig,mount:b=>document.querySelector('.quiet-nav').insertBefore(b,document.querySelector('.sound-toggle')),
 onStart(){Sound.unlock();rig.scale.setScalar(VK);rig.position.set(0,0,560);camera.near=1;camera.updateProjectionMatrix()},
 onEnd(){rig.scale.setScalar(1);rig.position.set(0,0,0);resize()},
 onPinchStart(){if(completed){location.href=ending.querySelector('a').href;return}vrHold=true;hint.classList.add('gone')},
 onPinchEnd(){if(!vr.anyPinch())vrHold=false}});
const vrHit=new THREE.Vector3();
function vrFrame(){if(!vr||!renderer.xr.isPresenting)return false;vr.update();if(!completed)hold=vrHold;
 const d=TEXT[textIdx],w=t=>t.replace(/長按/g,'捏住').replace('移動，閱讀','手指指向地上的字');
 vr.text([[d.i?w(d.i[0]):'','inst'],[d.p[0],''],[d.p[1],'en'],[completed?'捏合（或按扳機），返回中樞':'','hint']]);
 U.uCam.value.setFromMatrixPosition(renderer.xr.getCamera(camera).matrixWorld);return true}
function vrLight(){const h=vr.hands.find(h=>h.tracked||(!h.isHand&&h.pts.length));if(!h)return;const p=vr.rayPlaneY(h,0,vrHit);if(!p)return;
 h.hitDist=h.originW.distanceTo(p)/VK;const z=clamp(p.z,-2800,460),wd=900+Math.max(0,-z)*.95;lightT.set(clamp(p.x,-wd,wd),0,z)}
addEventListener('resize',resize);resize();
for(let i=0;i<(mobile?20:26);i++)spawn(false);
function placeDeco(I,drop){const z=-760-Math.pow(R(),.7)*6400,w=900+(-z)*.95;Object.assign(I,{x:(R()*2-1)*w,z,yaw:(R()-.5)*1.2,S:60+R()*110,prog:0,fly:0,alpha:1,glow:0});I.tx=I.x;I.tz=I.z;I.tyaw=I.yaw;I.tS=I.S;I.talpha=1;
 if(drop){I.state='falling';I.y=700+R()*500;I.vy=0}else{I.state='landed';I.y=0}}
insts.filter(I=>I.deco).forEach(I=>placeDeco(I,false));let nextDeco=0,queue=1204337;
renderer.setAnimationLoop(tick);
/* 預覽用：?id=7&jump=1（開始落下）或 2（排序前）、3（排序後）；&p=壓力 */
const Q=new URLSearchParams(location.search);
if(Q.has('jump')){const n=+Q.get('jump');processed=5;if(n>=1)setAct(1);if(n>=2){for(let i=0;i<34;i++){const I=spawn(true);if(I){I.state='landed';I.y=restY(I)}}setAct(2)}if(n>=3)order()}
return true};
