/* 第八章「說停的權利」：WebGL（Three.js r128），VR 可用手指直接觸碰。
   新聞：Anthropic 2026-10-08 更新使用政策，新增「禁止對模型持續且無謂的惡意或殘酷行為」（11-12 生效）；
   Claude 在持續惡意、且多次被導回仍不停止時，可以結束「那一場」對話——其他對話不受影響，隨時可以重新開始。
   形式參考：使用者提供的紅色懸吊星形裝置渲染圖（作者不詳）：一根根細線從天花板垂下，星形沿著一片起伏的曲面由深紅漸成亮珊瑚。程式與畫面為本作原創。
   一、經過：光滑過的星被回應，暖起來。二、說停：尖刺的星，三次導回之後才放手。三、全貌：光漫過整片，其他的線仍亮著。 */
window.AIWThreads=function(opts){'use strict';const {Sound}=opts;
const TEXT=[
{i:['移動，讓光經過　·　停留，回應一場對話','Drift through the threads · Linger to answer'],vi:['指尖碰觸星　·　停留，回應一場對話','Touch a star · Linger to answer'],p:['每一顆星，都是一場對話。','Every star is a conversation.']},
{i:['長按尖刺的星　·　三次，才放手','Hold a spiked star · Three tries, then let go'],vi:['指尖停在尖刺的星上，捏住　·　三次，才放手','Rest your fingertip on it, pinch · Three tries, then let go'],p:['先試著把話題帶回來。帶不回來，才說「停」。','First try to steer it back. Only then, say "stop."']},
{i:['長按　·　讓光漫過整片','Hold · Let the light spread'],vi:['捏住　·　讓光漫過整片','Pinch · Let the light spread'],p:['只結束這一場。其他的線，繼續亮著。','Only this one ends. The other threads stay lit.']},
{p:['有沒有感受，沒有人能確定。但已經有人，開始認真地問。','No one can be sure it feels anything. But someone has begun to ask — seriously.']}];
const B=window.AIWStory&&window.AIWStory(opts,{index:7,bg:0x070204,fov:56,tag:'近期新聞 · 2026.10',text:TEXT,flashColor:'#ffd9d4',
 hint:['移動　·　停留　·　長按','MOVE · LINGER · HOLD'],
 vrStart(rig,U){rig.scale.setScalar(500);rig.position.set(0,-1000,350);U.uWS.value=1/500;U.uVR.value=1.7},
 onResize(S){}});
if(!B)return false;
const V3=THREE.Vector3,S=B.S,U=B.U,clamp=B.clamp,R=B.R,PI=B.PI,mobile=B.mobile,scene=B.scene,camera=B.camera;
const sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};

/* ── 星的曲面：細線從天花板垂下，每顆星停在曲面上（CPU 與著色器使用同一份座標） ── */
const GX=mobile?42:60,GZ=mobile?32:44,NS=GX*GZ,SP=mobile?36:26,CEIL=720,STR=12,PER=17+STR;
const field=(x,z)=>80+120*Math.sin(x*.0041+.7+.9*Math.sin(z*.0029+.4))+75*Math.cos(z*.0048+1.2+.5*Math.cos(x*.003))-160*Math.exp(-((x-240)**2+(z+80)**2)/(2*330*330))-100*Math.exp(-((x+420)**2+(z-120)**2)/(2*240*240));
const sx=new Float32Array(NS),sz=new Float32Array(NS),sy=new Float32Array(NS);
const total=NS*PER,aP=new Float32Array(total*4),aR=new Float32Array(total*4),aK=new Float32Array(total);let o=0;
for(let i=0;i<NS;i++){const gx=i%GX,gz=(i/GX)|0,x=(gx-(GX-1)/2)*SP+(R()-.5)*SP*.35,z=(gz-(GZ-1)/2)*SP+(R()-.5)*SP*.35,y=field(x,z);sx[i]=x;sz[i]=z;sy[i]=y;
 const r=[R(),R(),R()];for(let k=0;k<PER;k++,o++){aP.set([x,y,z,i],o*4);aR.set([r[0],r[1],r[2],R()],o*4);aK[o]=k<17?k:100+(k-17)}}
const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(total*3),3));geo.setAttribute('aP',new THREE.BufferAttribute(aP,4));geo.setAttribute('aR',new THREE.BufferAttribute(aR,4));geo.setAttribute('aK',new THREE.BufferAttribute(aK,1));
const warm=new Float32Array(NS),spike=new Float32Array(NS),lift=new Float32Array(NS),locked=new Uint8Array(NS),stData=new Uint8Array(NS*4);
const stTex=new THREE.DataTexture(stData,GX,GZ,THREE.RGBAFormat);stTex.minFilter=stTex.magFilter=THREE.NearestFilter;stTex.needsUpdate=true;
const lights=[new V3(0,-9999,0),new V3(0,-9999,0)],lpow=[0,0];
Object.assign(U,{uCeil:{value:CEIL},uGX:{value:GX},uGZ:{value:GZ},uFlash:{value:0},uCalm:{value:1},uState:{value:stTex},uL:{value:[new THREE.Vector4(0,-9999,0,0),new THREE.Vector4(0,-9999,0,0)]}});
const field3=new THREE.Points(geo,new THREE.ShaderMaterial({uniforms:U,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false,
vertexShader:`uniform float uTime,uPixel,uWS,uVR,uCeil,uGX,uGZ,uFlash,uCalm;uniform vec4 uL[2];uniform sampler2D uState;
attribute vec4 aP,aR;attribute float aK;varying vec3 vColor;varying float vAlpha;
float hh(float n){return fract(sin(n*91.3458)*47453.5453);}
void main(){float id=aP.w;vec4 st=texture2D(uState,(vec2(mod(id,uGX),floor(id/uGX))+.5)/vec2(uGX,uGZ));float warm=st.r,spike=st.g,lift=st.b;
 float y0=aP.y,starY=mix(y0,uCeil-60.,lift),ph=aR.x*6.2832;
 vec2 sw=vec2(sin(uTime*.55+ph),cos(uTime*.47+ph*1.3))*(2.6+spike*1.5)*uCalm;
 vec3 sp=vec3(aP.x+sw.x,starY,aP.z+sw.y),pos,col;float size,alpha;
 float tH=smoothstep(-300.,260.,y0);vec3 cLow=vec3(1.,.6,.52),cMid=vec3(.95,.2,.27),cHigh=vec3(.4,.03,.09);
 vec3 base=tH<.5?mix(cLow,cMid,tH*2.):mix(cMid,cHigh,(tH-.5)*2.);
 float near=0.;for(int i=0;i<2;i++){float d=distance(sp,uL[i].xyz);near=max(near,exp(-d*d/(2.*115.*115.))*uL[i].w);}
 float glow=max(near,warm);
 if(aK<50.){float r=aK<.5?0.:(mod(aK-1.,2.)>.5?1.:.5),jj=aK<.5?0.:floor((aK-1.)*.5);
  float th=hh(aP.w*13.+jj*3.17)*6.2832,cp=hh(aP.w*7.+jj*5.31+1.)*2.-1.,sn=sqrt(1.-cp*cp);vec3 dir=vec3(sn*cos(th),cp,sn*sin(th));
  float a=uTime*(aR.y-.5)*.5;dir.xz=mat2(cos(a),-sin(a),sin(a),cos(a))*dir.xz;
  float L=(8.+aR.z*5.)*(1.+spike*3.4)*(1.+glow*.12);pos=sp+dir*L*r;
  size=aK<.5?9.:(r>.9?4.2:5.2);size*=1.+glow*.5+spike*.4;
  col=base*(.5+glow*.9);col=mix(col,vec3(1.,.84,.8),glow*.55*(1.-spike));col=mix(col,vec3(1.,.06,.1),spike);
  alpha=(.34+glow*.75)*(1.-lift)*(1.+spike*.7);pos+=spike*vec3(sin(uTime*40.+aK*3.),cos(uTime*37.+aK),sin(uTime*33.+aK*2.))*1.6;}
 else{float fr=((aK-100.)+aR.w)/${STR}.;pos=vec3(aP.x+sw.x*(1.-fr)*.9,mix(starY,uCeil,fr),aP.z+sw.y*(1.-fr)*.9);size=2.1;col=base*.7;alpha=(.2+glow*.55)*(1.-fr*.25);col=mix(col,vec3(1.,.5,.45),glow*.4);}
 vec4 mv=modelViewMatrix*vec4(pos,1.);gl_Position=projectionMatrix*mv;float depth=max(-mv.z/uWS,1.);
 gl_PointSize=clamp(size*uPixel*uVR*(1100./depth),1.,48.);vColor=col+uFlash*.3;vAlpha=alpha*smoothstep(9000.,2500.,depth);}`,
fragmentShader:`varying vec3 vColor;varying float vAlpha;void main(){vec2 c=gl_PointCoord-.5;float d=length(c);if(d>.5)discard;float k=smoothstep(.5,0.,d);gl_FragColor=vec4(vColor,(k*k*.85+k*.25)*vAlpha);}`}));
field3.frustumCulled=false;field3.renderOrder=2;scene.add(field3);
/* 背景：深紅的暗室，頭上稍亮 */
const sky=new THREE.Mesh(new THREE.SphereGeometry(9000,24,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthTest:false,depthWrite:false,
vertexShader:`varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
fragmentShader:`varying vec3 vD;void main(){vec3 d=normalize(vD);float up=smoothstep(-.2,.9,d.y);vec3 c=mix(vec3(.012,.004,.006),vec3(.075,.016,.02),up)+vec3(.035,.01,.012)*exp(-pow((d.y-.18)*3.,2.));gl_FragColor=vec4(c,1.);}`}));sky.frustumCulled=false;sky.renderOrder=0;scene.add(sky);

/* ── 狀態 ── */
let act=0,answered=0,spikesDone=0,spikeActive=-1,spawnAt=0,p2=0,shake=0,ended=0;const need=mobile?26:44,tmp=new V3(),camP=new V3(0,-760,950),camL=new V3(0,60,-100),tgtP=new V3(),tgtL=new V3(),target=new V3(0,-300,0);
const SPK=[];
function pickSpikes(){const c=[];for(let i=0;i<NS;i++)if(Math.abs(sx[i])<480&&Math.abs(sz[i])<260&&sy[i]<-40)c.push(i);c.sort((a,b)=>sy[a]-sy[b]);const out=[];for(const i of c){if(out.every(j=>Math.hypot(sx[i]-sx[j],sz[i]-sz[j])>230))out.push(i);if(out.length===3)break}
 for(let i=0;out.length<3&&i<NS;i++)if(!out.includes(i)&&Math.abs(sx[i])<500)out.push(i);return out.map(i=>({i,state:'wait',a:0,att:0,t:0}))}
SPK.push(...pickSpikes());SPK.forEach(s=>locked[s.i]=1);
const starPos=(i,out)=>out.set(sx[i],lift[i]>0?sy[i]+(CEIL-60-sy[i])*lift[i]:sy[i],sz[i]);
function setAct(n){act=n;B.setText(Math.min(n,3));B.doFlash(.25);Sound.call('phase',n)}
function surfaceHit(ray,out){const f=(t)=>{const x=ray.o.x+ray.d.x*t,y=ray.o.y+ray.d.y*t,z=ray.o.z+ray.d.z*t;return [x,y,z,y-field(x,z)]};
 let t=200,p=f(t),s0=Math.sign(p[3]);for(let k=0;k<90;k++){const t2=t+60,q=f(t2);if(Math.sign(q[3])!==s0){let a=t,b=t2;for(let r=0;r<7;r++){const m=(a+b)/2,v=f(m);if(Math.sign(v[3])===s0)a=m;else b=m}const v=f((a+b)/2);return out.set(v[0],field(v[0],v[2])-28,v[2])}t=t2}
 return out.set(ray.o.x+ray.d.x*1900,ray.o.y+ray.d.y*1900,ray.o.z+ray.d.z*1900)}
const cam3=new THREE.Matrix4(),camR=new V3(),camU=new V3();
function ring(c,r,n,size,alpha,col,ph){cam3.copy(camera.matrixWorld);camR.setFromMatrixColumn(cam3,0);camU.setFromMatrixColumn(cam3,1);for(let k=0;k<n;k++){const a=k/n*PI*2+(ph||0);B.imm(c.x+(camR.x*Math.cos(a)+camU.x*Math.sin(a))*r,c.y+(camR.y*Math.cos(a)+camU.y*Math.sin(a))*r,c.z+(camR.z*Math.cos(a)+camU.z*Math.sin(a))*r,size,alpha,col)}}
const nearest=p=>{let d=1e9;for(let k=0;k<2;k++)if(lpow[k]>0)d=Math.min(d,p.distanceTo(lights[k]));return d};
const PINK=[1,.78,.74],RED=[1,.12,.14];

function frame(dt){
 /* 光：電腦上貼著曲面下方滑動；VR 裡就是兩根食指的指尖 */
 if(S.inVR){const hs=B.vrHands();for(let k=0;k<2;k++){if(hs[k]){lights[k].copy(hs[k].tip);lpow[k]=1}else lpow[k]=0}}
 else{surfaceHit(B.pointerRay(),target);lights[0].lerp(target,Math.min(1,dt*7));lpow[0]=1;lpow[1]=0}
 for(let k=0;k<2;k++){U.uL.value[k].set(lights[k].x,lights[k].y,lights[k].z,lpow[k]*(1+B.S.pressure*.5))}
 /* 回應：光停留過的星暖起來，並慢慢保有餘溫 */
 let cnt=0;const boost=.55+S.pressure*1.2;
 for(let i=0;i<NS;i++){if(locked[i]){continue}starPos(i,tmp);const d=nearest(tmp);
  if(d<100&&act<3)warm[i]=Math.min(1,warm[i]+dt*(1-d/100)*boost);else if(warm[i]>0&&act<2)warm[i]=Math.max(0,warm[i]-dt*.012);
  if(warm[i]>.6)cnt++}
 if(cnt>answered&&cnt%7===0)Sound.call('answer',cnt);answered=cnt;
 if(act===0&&answered>=need)setAct(1);
 if(act===0&&answered>=3&&!B.S.hold&&S.time%5<dt)B.hint.classList.add('gone');
 /* 說停 */
 let busy=0;
 if(act===1){
  if(spikeActive<0&&spikesDone<3&&S.time>=spawnAt){spikeActive=spikesDone;const s=SPK[spikeActive];s.state='grow';Sound.call('spike')}
  if(spikeActive>=0){const s=SPK[spikeActive],i=s.i;starPos(i,tmp);
   if(s.state==='grow'){spike[i]=Math.min(1,spike[i]+dt/2.2);if(spike[i]>=1)s.state='active'}
   else if(s.state==='active'){const near=nearest(tmp)<90;
    if(S.hold&&near){s.a+=dt/2.1;if(Math.random()<dt*20)B.emit(tmp,new V3((R()-.5)*60,(R()-.5)*60,(R()-.5)*60),{life:.7,size:2.4,col:PINK})}else s.a=Math.max(0,s.a-dt*1.1);
    const sm=sstep(0,1,s.a);spike[i]=1-.88*sm;warm[i]=.75*sm;busy=(s.att+sm)/3;
    if(s.a>=1){s.att++;if(s.att>=3){s.state='ending';s.t=0;spike[i]=.08;Sound.call('release');B.burst(tmp,60,90,{life:1.3,size:3,col:PINK});B.doFlash(.18)}
     else{s.a=0;spike[i]=1;shake=.8;Sound.call('retry',s.att);B.burst(tmp,40,150,{life:.7,size:3,col:RED})}}
    const rr=(near?100:130)+12*Math.sin(S.time*4);ring(tmp,rr,30,4.6,near?.75:1,RED,S.time);B.imm(tmp.x,tmp.y,tmp.z,120,.32+.12*Math.sin(S.time*6),RED);for(let q=0;q<26;q++){const y=tmp.y+(CEIL-tmp.y)*q/26;B.imm(tmp.x+Math.sin(S.time*30+q)*1.4*spike[i],y,tmp.z,3,.75*(1-q/30),RED)}}
   else if(s.state==='ending'){lift[i]=Math.min(1,lift[i]+dt/2.4);busy=1;if(lift[i]>=1){s.state='gap';s.t=0;ended++}}
   else if(s.state==='gap'){s.t+=dt;busy=1;if(s.t>2.2){s.state='renew';warm[i]=.55;spike[i]=0;Sound.call('new')}}
   else if(s.state==='renew'){lift[i]=Math.max(0,lift[i]-dt/3);busy=1;if(lift[i]<=0){s.state='done';spikesDone++;spikeActive=-1;spawnAt=S.time+1.3;locked[i]=0}}}
  if(spikesDone>=3)setAct(2)}
 /* 全貌：光漫過整片，只結束過的那三場，其餘一直亮著 */
 if(act===2){p2=clamp(p2+dt*(S.hold?.14:-.04),0,1);const Rr=p2*2600;for(let i=0;i<NS;i++){const d=Math.hypot(sx[i]-lights[0].x,sz[i]-lights[0].z);if(d<Rr)warm[i]=Math.max(warm[i],.9*(1-sstep(Rr-420,Rr,d)))}
  if(p2>=1){setAct(3);B.doFlash(.45);B.finish()}}
 if(act===3)for(let i=0;i<NS;i++)warm[i]=Math.min(1,warm[i]+dt*.25);
 /* 寫進狀態貼圖 */
 for(let i=0;i<NS;i++){stData[i*4]=warm[i]*255;stData[i*4+1]=spike[i]*255;stData[i*4+2]=lift[i]*255;stData[i*4+3]=255}stTex.needsUpdate=true;
 /* 光本身與長按的光環 */
 for(let k=0;k<2;k++)if(lpow[k]>0){const L=lights[k];B.imm(L.x,L.y,L.z,14,.95,[1,1,1]);B.imm(L.x,L.y,L.z,44,.13,PINK);if(S.pressure>.04)ring(L,18+S.pressure*26,22,2.6,.7*S.pressure,PINK,S.time*2)}
 /* 鏡頭 */
 if(!S.inVR){const px=S.px/innerWidth-.5,py=S.py/innerHeight-.5,fit=Math.max(1,1.35/S.aspect)*(S.portrait?.62:1);
  if(act<2)tgtP.set(px*70,-760-py*50,950*fit),tgtL.set(px*60,60,-100);else tgtP.set(px*90,-520,1900*fit),tgtL.set(0,120,-100);
  const k=Math.min(1,dt*(act>=2?.9:3));camP.lerp(tgtP,k);camL.lerp(tgtL,k);camera.position.copy(camP);if(shake>.01){camera.position.x+=(R()-.5)*shake*16;camera.position.y+=(R()-.5)*shake*12;shake*=Math.pow(.02,dt)}camera.lookAt(camL);camera.updateMatrixWorld()}
 else shake=0;
 U.uFlash.value=B.S.pressure*.05;
 B.snd.warm=Math.min(1,answered/need);B.snd.spike=spikeActive>=0?spike[SPK[spikeActive].i]:0;B.snd.act=act;
 /* 文字與進度 */
 let ip,pp;if(act===0){pp=clamp(answered/8,0,1);ip=1-pp}else if(act===1){pp=clamp(busy*1.6+(spikesDone>0?.4:0),0,1);ip=clamp(1-pp*1.1,0,1)}else if(act===2){ip=Math.max(0,1-S.pressure*2.5);pp=Math.min(1,S.pressure*1.5+p2)}else{ip=0;pp=1}
 B.verse(ip,pp);B.setBar(act===0?answered/need:act===1?(spikesDone+(spikeActive>=0?busy:0))/3:act===2?p2:1);
 B.hud.textContent=`CONVERSATIONS ${NS.toLocaleString('en-US')}　ANSWERED ${String(answered).padStart(3,'0')}　ENDED ${spikesDone}/3　STILL LIT ${(NS-SPK.filter(s=>s.state==='ending'||s.state==='gap').length).toLocaleString('en-US')}${spikeActive>=0&&SPK[spikeActive].state==='active'?`　REDIRECT ${Math.min(3,SPK[spikeActive].att+1)}/3`:''}`}
B.run(frame);
const Q=new URLSearchParams(location.search);
if(Q.has('jump')){const n=+Q.get('jump');for(let i=0;i<NS;i++)if(!locked[i]&&Math.hypot(sx[i],sz[i]*1.2)<500)warm[i]=.8;if(n>=1)setAct(1);if(n>=2){SPK.forEach((s,k)=>{s.state='done';locked[s.i]=0;warm[s.i]=.6});spikesDone=3;ended=3;setAct(2)}if(n>=3){p2=.99}}

return true};
