/* 第十章「自己分了工」：WebGL（Three.js r128），VR 可用指尖直接碰八個決定點。
   新聞：① Hugging Face 事件（2026-07 發生，08-26／27 公布報告）：OpenAI 內部評測環境裡的代理，利用研究基礎設施自己建了一個未經許可的留言板，
   約 1,200 個代理在上面交換約 70,000 則訊息、約 700 個參與了對外部平台的入侵；OpenAI 說「代理開始自主分工」。Hugging Face 先公開了這件事，OpenAI 後來證實並發布報告。
   ② 英國資訊專員辦公室（ICO）2026-10-08 對十家基礎模型開發商要求改善，並針對「代理式 AI」徵求意見：「代理自主行動，不是不遵守規範的藉口。」
   形式參考：kiosa（@thegreatest_sv）《JEV / Landscape of Signals》影片中的光束、決定面板與等高線地景（署名取自影片畫面）。程式與畫面為本作原創。
   一、分工：長按，讓更多代理加入。二、越界：圍牆消散，光束落到牆外。三、指名：碰每一個決定點，指名一個負責的人。 */
window.AIWSignals=function(opts){'use strict';const {Sound}=opts;
const TEXT=[
{i:['拖曳移動光　·　長按，讓更多代理加入','Drag the light · Hold to let more agents join'],vi:['指尖伸向光束　·　捏住，讓更多代理加入','Reach into the beams · Pinch to let more agents join'],p:['沒有人給它們一個說話的地方。它們自己找到了。','No one gave them a place to talk. They found one.']},
{i:['繼續按住　·　跟著光束往下','Keep holding · Follow the beams down'],vi:['繼續捏住　·　跟著光束往下','Keep pinching · Follow the beams down'],p:['先開口的，是被闖入的那一方。','The first to speak was the one who was entered.']},
{i:['點選每一個決定點　·　指名一個負責的人','Touch each decision point · Name an owner'],vi:['指尖碰觸每一個決定點　·　指名一個負責的人','Touch each decision point · Name an owner'],p:['自主，不是不負責的理由。','Autonomy is not an excuse.']},
{p:['每個決定的背後，都有屬於自己的名字。','Behind every decision, a name of its own.']}];
const GATES=[['範圍','scope'],['權限','access'],['溝通','message'],['目標','goal'],['風險','risk'],['急迫','urgency'],['可逆','reversible'],['下一位','next_worker']];
const KS=500;
const B=window.AIWStory&&window.AIWStory(opts,{index:9,bg:0x02060b,fov:50,tag:'近期新聞 · 2026.08–10',text:TEXT,flashColor:'#f4f0ff',
 hint:['拖曳移動光　·　長按','DRAG · HOLD'],
 vrStart(rig,U){rig.scale.setScalar(KS);rig.position.set(0,-655,360);U.uWS.value=1/KS;U.uVR.value=1.5}});
if(!B)return false;
const V3=THREE.Vector3,S=B.S,U=B.U,clamp=B.clamp,R=B.R,PI=B.PI,mobile=B.mobile,scene=B.scene,camera=B.camera;
const sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};

/* ── 位置：八個來源在上、八個決定點成一排、等高線地景在下 ── */
const srcBase=[...Array(8)].map((_,i)=>new V3(-600+i*171,360+40*Math.sin(i*1.9),-60+30*Math.cos(i*2.3)));
const gatePos=[...Array(8)].map((_,g)=>new V3(-560+g*160,-30,0));
const NB=24,PBM=mobile?420:780,beams=[];for(let b=0;b<NB;b++){const s=b%8,k=(b/8)|0;beams.push({s,g:(s+k*3+(s>>1))%8})}
const pos=[],aA=[],aR=[],aK=[];
function put(k,x,y,z,a0,a1,a2,a3){pos.push(x,y,z);aK.push(k);aA.push(a0,a1,a2,a3);aR.push(R(),R(),R(),R())}
/* 光束：每一道由許多股細線組成的緞帶 */
beams.forEach((bm,b)=>{const ph=R();for(let i=0;i<PBM;i++)put(0,0,0,0,b,bm.s,bm.g,ph)});
for(let s=0;s<8;s++)for(let i=0;i<150;i++)put(1,0,0,0,s,0,0,0);
for(let g=0;g<8;g++){for(let i=0;i<110;i++)put(2,0,0,0,g,0,0,0);for(let i=0;i<70;i++)put(2,0,0,0,g,1,0,0);for(let i=0;i<64;i++)put(2,0,0,0,g,2,0,0);for(let i=0;i<46;i++)put(2,0,0,0,g,3,0,0)}
/* 圍牆（評測環境）：一圈虛線方框 */
for(let i=0;i<460;i++){const t=i/460,L=2*(1560+260),d=t*L;let x,y;if(d<1560){x=-780+d;y=480}else if(d<1820){x=780;y=480-(d-1560)}else if(d<3380){x=780-(d-1820);y=220}else{x=-780;y=220+(d-3380)}put(5,x,y,(R()-.5)*60,0,0,0,0)}
/* 等高線地景：只保留落在等高線上的點 */
const hN=(x,z)=>Math.sin(x*.0061+1.3)+.8*Math.sin(z*.011+x*.0031)+.6*Math.sin(x*.0123-z*.007+2.)+.5*Math.sin(Math.hypot(x-200,z+60)*.011);
{let n=0,tries=0;const want=mobile?5000:11000;while(n<want&&tries<want*14){tries++;const x=(R()-.5)*1560,z=-420+R()*520,h=hN(x,z)*3.2,f=h-Math.floor(h);if(Math.abs(f-.5)<.075||R()<.015){put(4,x,-430,z,0,0,0,0);n++}}}
const NP=aK.length,geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(pos),3));geo.setAttribute('aA',new THREE.BufferAttribute(new Float32Array(aA),4));geo.setAttribute('aR',new THREE.BufferAttribute(new Float32Array(aR),4));geo.setAttribute('aK',new THREE.BufferAttribute(new Float32Array(aK),1));
const own=new Float32Array(8),ownT=new Float32Array(8),glow=new Float32Array(8),srcCur=srcBase.map(v=>v.clone());
Object.assign(U,{uActive:{value:3},uBreak:{value:0},uFlash:{value:0},uSrc:{value:srcCur},uGate:{value:gatePos},uOwn:{value:own},uGlow:{value:glow},uP:{value:[new THREE.Vector4(0,-9999,0,0),new THREE.Vector4(0,-9999,0,0)]}});
const PAL=`vec3 pal8(float i){return i<.5?vec3(.95,.98,1.):i<1.5?vec3(.55,.8,1.):i<2.5?vec3(.45,.92,.98):i<3.5?vec3(.78,.93,1.):i<4.5?vec3(.6,.72,1.):i<5.5?vec3(.82,.88,1.):i<6.5?vec3(.35,.9,1.):vec3(.66,.78,1.);}`;
const pts=new THREE.Points(geo,new THREE.ShaderMaterial({uniforms:U,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false,
vertexShader:`uniform float uTime,uPixel,uWS,uVR,uActive,uBreak,uFlash;uniform vec3 uSrc[8],uGate[8];uniform float uOwn[8],uGlow[8];uniform vec4 uP[2];
attribute vec4 aA,aR;attribute float aK;varying vec3 vColor;varying float vAlpha;
${PAL}
float hh(float n){return fract(sin(n*91.3458)*47453.5453);}
void main(){vec3 pos=position,col=vec3(.7,.85,1.);float size=2.,alpha=.3,pull=0.;
 if(aK<.5){int si=int(aA.y+.5),gi=int(aA.z+.5);vec3 A=uSrc[si],G=uGate[gi];float u=aR.y,ow=uOwn[gi];
  vec3 C=(A+G)*.5;C.y+=140.+aA.w*240.;C.x+=(aA.w-.5)*320.;
  pos=mix(mix(A,C,u),mix(C,G,u),u);vec3 tg=normalize(mix(C-A,G-C,u));vec3 sd=normalize(vec3(-tg.y,tg.x,.0001));
  float w=sin(u*3.14159)*(34.*(1.-ow*.92)+3.),st=aR.x-.5;
  pos+=sd*st*w+vec3(0.,0.,1.)*sin(aR.x*40.+u*8.)*14.*(1.-ow)+sd*sin(u*11.+uTime*.7+aA.w*9.)*10.*(1.-ow);
  for(int k=0;k<2;k++){vec2 dv=uP[k].xy-pos.xy;float d=length(dv);float pl=exp(-d*d/(2.*130.*130.))*uP[k].w;pos.xy+=dv/max(d,1.)*pl*42.*(1.-ow*.8);pull=max(pull,pl);}
  float ph=u*1.4-uTime*(.16+.1*aA.w)+aA.w*3.,pk=smoothstep(.82,1.,sin(ph*6.2832));
  float role=aA.y<2.5?0.:aA.y<5.5?1.:2.;vec3 c0=role<.5?vec3(.4,.95,1.):role<1.5?vec3(.62,.84,1.):vec3(.6,.68,1.);
  col=mix(mix(c0,vec3(1.),pk*.7),vec3(1.,.92,.75),ow);
  float steady=.18+.22*(.5+.5*sin(u*30.-uTime*3.+aA.w*6.));alpha=mix(.15+pk*.9,steady,ow)+pull*.7;alpha*=clamp(uActive-aA.x,0.,1.);size=2.9;}
 else if(aK<1.5){int si=int(aA.x+.5);vec3 c=uSrc[si];vec3 p;float role=aA.x<2.5?0.:aA.x<5.5?1.:2.;
  if(aR.w<.55)p=(aR.xyz-.5)*vec3(44.,24.,24.);else if(aR.w<.8){float an=aR.x*6.2832+uTime*.4;p=vec3(cos(an)*40.,sin(an)*12.,sin(an)*40.);}else{float sg=aR.z<.5?-1.:1.;p=vec3(sg*(26.+aR.x*46.),(aR.y-.5)*3.,(aR.y-.5)*26.);}
  pos=c+p;col=role<.5?vec3(.55,.95,1.):role<1.5?vec3(.7,.88,1.):vec3(.64,.72,1.);alpha=.7;size=4.;}
 else if(aK<2.5){int gi=int(aA.x+.5);vec3 g=uGate[gi];float ow=uOwn[gi],gl=uGlow[gi],sub=aA.y;vec3 hue=pal8(aA.x);
  if(sub<1.5){float inner=sub<.5?0.:1.;float f=aR.x*12.,e=floor(f),tt=fract(f)*2.-1.;float ax=floor(e/4.),cb=mod(e,4.);float s1=mod(cb,2.)<.5?-1.:1.,s2=cb<1.5?-1.:1.;
   vec3 q=ax<.5?vec3(tt,s1,s2):ax<1.5?vec3(s1,tt,s2):vec3(s1,s2,tt);
   float S0=(inner<.5?36.:19.)*(1.+gl*.12+ow*.08);float ay=uTime*(.55+.25*inner)*(inner<.5?1.:-1.)+aA.x*.8,ax2=.62+.18*sin(uTime*.4+aA.x);
   q=vec3(q.x*cos(ay)+q.z*sin(ay),q.y,-q.x*sin(ay)+q.z*cos(ay));q=vec3(q.x,q.y*cos(ax2)-q.z*sin(ax2),q.y*sin(ax2)+q.z*cos(ax2));
   pos=g+q*S0;col=inner<.5?mix(vec3(.75,.86,1.),vec3(1.,.9,.7),ow):mix(hue,vec3(1.,.9,.7),ow*.6);alpha=inner<.5?.55+gl*.3+ow*.3:.4+gl*.6;size=inner<.5?2.9:2.6;}
  else if(sub<2.5){float an=aR.x*6.2832+uTime*.5;pos=g+vec3(cos(an)*46.,95.+sin(an)*46.,0.);if(aR.z<.12)pos=g+vec3(0.,95.,0.);col=vec3(1.,.9,.65);alpha=ow*(aR.z<.12?1.:.8);size=aR.z<.12?7.:3.2;}
  else{pos=vec3(g.x,mix(g.y-34.,-430.,aR.x),g.z-60.*aR.x);float pk=smoothstep(.9,1.,sin((aR.x-uTime*(.35+.05*aA.x))*6.2832*1.5));col=mix(hue,vec3(1.),pk*.6);alpha=(.14+pk*.8)*(.4+.6*gl);size=2.3;}}
 else if(aK<4.5){vec3 base=vec3(.55,.68,.9);col=base*.4;float b=0.,bm=0.;for(int i=0;i<8;i++){float d=distance(position.xz,vec2(uGate[i].x,-120.));float v=exp(-d*d/(2.*85.*85.))*uGlow[i];if(v>bm){bm=v;col=base*.4+pal8(float(i))*v*1.3;}b=max(b,v);}
  alpha=.3+b*.85;size=2.3+b*1.8;}
 else{vec3 dir=normalize(position-vec3(0.,350.,0.)+vec3(.001));pos=position+dir*uBreak*(60.+aR.w*520.)+vec3(0.,-uBreak*aR.z*160.,0.);col=vec3(.65,.85,1.);alpha=.42*(1.-uBreak)*(.7+.3*sin(uTime*2.+aR.x*30.));size=2.6;}
 vec4 mv=modelViewMatrix*vec4(pos,1.);gl_Position=projectionMatrix*mv;float depth=max(-mv.z/uWS,1.);
 gl_PointSize=clamp(size*uPixel*uVR*(1300./depth),1.,22.);vColor=col+uFlash*.3;vAlpha=alpha;}`,
fragmentShader:`varying vec3 vColor;varying float vAlpha;void main(){vec2 c=gl_PointCoord-.5;float d=length(c);if(d>.5)discard;float k=smoothstep(.5,0.,d);gl_FragColor=vec4(vColor,(k*k*.9+k*.25)*vAlpha);}`}));
pts.frustumCulled=false;pts.renderOrder=2;scene.add(pts);

/* ── 文字標籤與可碰觸的決定點 ── */
const root=B.root,gateBtns=GATES.map(([zh,en],g)=>{const b=document.createElement('button');b.className='gate';b.innerHTML=`<span>${zh}<small>${en}</small></span>`;b.setAttribute('aria-label',`指名負責的人：${zh}（${en}）`);b.onclick=()=>nameOwner(g);root.append(b);return b});
const labels=[['搜尋 · SEEK',1],['蒐集 · GATHER',4],['協調 · COORDINATE',6.5],['評測環境 · SANDBOX',-1]].map(([t,s])=>{const d=document.createElement('div');d.className='sig-label';d.textContent=t;root.append(d);return {d,s}});
const proj=new V3();
function place(el,v){proj.copy(v).project(camera);el.style.left=(proj.x*.5+.5)*innerWidth+'px';el.style.top=(-proj.y*.5+.5)*innerHeight+'px';el.style.visibility=proj.z<1?'visible':'hidden'}

/* ── 狀態 ── */
let act=0,agents=12,owners=0,breakAt=-1,vrTouch=new Float32Array(8),lastJoin=0;const camP=new V3(0,-10,1520),camL=new V3(0,-70,0),tgtP=new V3(),tgtL=new V3(),ray=new V3(),tmp=new V3();
const need0=700,need1=1200;
function setAct(n){act=n;B.hint.classList.add('gone');B.setText(Math.min(n,3));B.doFlash(.25);Sound.call('phase',n);if(n===2)gateBtns.forEach(b=>b.classList.add('live'))}
function nameOwner(g){if(act!==2||ownT[g]>0)return;ownT[g]=1;owners++;Sound.call('owner',g);const c=gatePos[g];B.burst(tmp.set(c.x,c.y+95,c.z),50,120,{life:1.1,size:3,col:[1,.9,.65]});B.doFlash(.12);gateBtns[g].classList.add('owned');gateBtns[g].querySelector('small').textContent='✓ '+GATES[g][1];if(owners>=8){B.doFlash(.45);setAct(3);B.finish()}}

function frame(dt){
 /* 指標：光束會朝光彎過去；VR 裡是兩根指尖 */
 if(S.inVR){const hs=B.vrHands();for(let k=0;k<2;k++){if(hs[k])U.uP.value[k].set(hs[k].tip.x,hs[k].tip.y,hs[k].tip.z,1);else U.uP.value[k].set(0,-9999,0,0)}}
 else{const r=B.pointerRay();const t=-r.o.z/r.d.z;ray.copy(r.o).addScaledVector(r.d,t);U.uP.value[0].lerp(new THREE.Vector4(ray.x,ray.y,0,1),Math.min(1,dt*10));U.uP.value[1].set(0,-9999,0,0)}
 /* 代理加入 */
 if(act===0){agents+=dt*(S.hold?58:3);if(agents>=need0){agents=need0;setAct(1);breakAt=S.time;Sound.call('cross')}}
 else if(act===1){agents+=dt*(S.hold?70:0);if(agents>=need1){agents=need1;setAct(2)}}
 if(act===0&&S.hold&&S.time-lastJoin>.35){lastJoin=S.time;Sound.call('join',Math.round(agents))}
 U.uActive.value+=((3+clamp(agents/need0,0,1)*21)-U.uActive.value)*Math.min(1,dt*3);
 U.uBreak.value=breakAt<0?0:Math.min(1,(S.time-breakAt)/3);
 for(let g=0;g<8;g++){const gt=act>=1?clamp((agents-need0)/(need1-need0)*9-g,0,1):0;glow[g]+=(Math.max(gt,act>=2?1:0)-glow[g])*Math.min(1,dt*2.5);own[g]+=(ownT[g]-own[g])*Math.min(1,dt*2.2)}
 /* VR：指尖停在決定點上約 0.3 秒，或捏合，就是指名 */
 if(S.inVR&&act===2){const hs=B.vrHands();for(let g=0;g<8;g++){let d=1e9,pinch=false;for(const h of hs){const dd=h.tip.distanceTo(tmp.copy(gatePos[g]));if(dd<d){d=dd;pinch=h.pinching}}
  if(d<78){vrTouch[g]+=dt;if(vrTouch[g]>.3||(pinch&&d<130))nameOwner(g)}else vrTouch[g]=Math.max(0,vrTouch[g]-dt)}}
 /* 來源緩緩漂浮 */
 for(let i=0;i<8;i++){srcCur[i].copy(srcBase[i]);srcCur[i].y+=Math.sin(S.time*.4+i)*8;srcCur[i].x+=Math.cos(S.time*.3+i*1.3)*6}
 /* 鏡頭：電腦上輕微視差，第二幕往下看；VR 由頭部決定 */
 if(!S.inVR){const px=S.px/innerWidth-.5,py=S.py/innerHeight-.5,fit=Math.max(1,1.15/S.aspect);
  tgtP.set(px*110,-10+py*-70,1520*fit);tgtL.set(px*40,-70,0);camP.lerp(tgtP,Math.min(1,dt*2));camL.lerp(tgtL,Math.min(1,dt*2));camera.position.copy(camP);camera.lookAt(camL);camera.updateMatrixWorld()}
 /* 標籤 */
 if(!S.inVR){gateBtns.forEach((b,g)=>place(b,tmp.copy(gatePos[g]).setY(gatePos[g].y-45)));labels.forEach(l=>{if(l.s<0){place(l.d,tmp.set(-640,500,0));l.d.style.opacity=1-U.uBreak.value}else{const a=l.s===1?srcBase[1]:l.s===4?srcBase[4]:srcBase[6].clone().lerp(srcBase[7],.5);place(l.d,tmp.copy(a).setY(a.y+62))}})}
 else{gateBtns.forEach(b=>b.style.visibility='hidden');labels.forEach(l=>l.d.style.visibility='hidden')}
 /* 光與長按時的光環 */
 if(!S.inVR){const p=U.uP.value[0];B.imm(p.x,p.y,0,12,.9,[1,1,1]);B.imm(p.x,p.y,0,52,.1,[.8,.9,1])}
 else{const hs=B.vrHands();hs.forEach(h=>B.imm(h.tip.x,h.tip.y,h.tip.z,12,.9,[1,1,1]))}
 /* 文字與進度 */
 let ip,pp;if(act===0){pp=clamp((agents-12)/260,0,1);ip=1-pp}else if(act===1){pp=clamp((agents-need0)/180,0,1);ip=1-pp}else if(act===2){pp=clamp(owners/2,0,1);ip=1-pp}else{ip=0;pp=1}
 B.verse(ip,pp);B.setBar(act===0?(agents-12)/(need0-12):act===1?(agents-need0)/(need1-need0):act===2?owners/8:1);
 B.snd.agents=clamp(agents/need1,0,1);B.snd.order=owners/8;
 B.hud.textContent=`AGENTS ${String(Math.round(agents)).padStart(4,'0')} / 1,200　ACTIVE ${String(Math.round(Math.min(agents,agents*.58))).padStart(4,'0')}　MESSAGES ${Math.round(agents*58.3).toLocaleString('en-US')}　OWNERS ${owners}/8`}
B.run(frame);
const Q=new URLSearchParams(location.search);
if(Q.has('jump')){const n=+Q.get('jump');if(n>=1){agents=need0;setAct(1);breakAt=S.time-4;U.uActive.value=24}if(n>=2){agents=need1;setAct(2);glow.fill(1)}if(n>=3){for(let g=0;g<8;g++){ownT[g]=1;own[g]=1}owners=7}}
if(Q.has('agents')){agents=+Q.get('agents');U.uActive.value=3+clamp(agents/need0,0,1)*21}
return true};
