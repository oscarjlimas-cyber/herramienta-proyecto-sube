/* =====================================================================
   S/E Termales 115 kV · Motor de cálculo compartido
   Lo usan index.html (herramienta de diseño) y simulador.html (patio 3D),
   para que los dos muestren siempre los mismos resultados.
   ===================================================================== */
(function(){
"use strict";
const CAT=window.SUBE_CAT||{DPS:[],AIS:[],COND:[],FUENTES:[],I_SW:[0.5,1,2]};
const f2=x=>Number(x).toFixed(2).replace(".",",");

/* ============================================================
   Datos del proyecto (valores iniciales = entregas G1/G2 + ETAP)
   ============================================================ */
const DEF={
  proy:{nombre:"S/E Termales",un:115,tens:"230 / 115 / 13,8 kV",trafo:"2 bancos 3 × 45 MVA",lugar:"Santa Rosa de Cabal",cfg:"bpt",nLin:3,nTr:2,nRes:1,icc3:30,base:true},
  g:{um:123,alt:1800,t:18},
  ais:{dist:20,mp:25,ko:0.8,kt:1.15,ke:1.4,S:1000,dpsCat:"sie-3EL2-3",dpsUr:96,npmI:0,ur:96,npr:226,npm:180,pol:"d",kd:1.1,ins:"3FL-074",extra:0,cN:"Aislador personalizado",cTipo:"pol",cFuga:3500,cLon:1400,cLiwv:750,cSml:120},
  con:{cond:"Drake",nsub:3,sep:40,d:28.1,w:1.627,rts:14292,r20:0.07,aAl:402.8,kac:1.02,Idis:2000,Ta:26,Tc:75,vv:0.61,eps:0.5,abs:0.5,Qs:1000,m:0.85,link:true,a:2.11,Ik:31.5,kip:2.6,tk:1,te:200,T:150,L:22,tubD:100,tubT:5,tubRp:160,tubB:0.73,tubL:9},
  apa:{link:true,BIL:550,hBus:7.5,k:1,hG:11,X:11,zsMode:"calc",zsMan:350,ddt:2,Lx:130,Ly:70},
  dis:{link:true,BSL:0,BIL:550,dMode:"none",dMan:0.893,fff:1.15,galibo:4,rnd:true,Es:550,kS:1.04,nExp:0.9,kVB:1.1,barra:"flex",cond:"ACSR",K:10,vano:22,fMode:"pct",pct:3,w:1.628,Fh:500,Wb:11},
  mal:{If:30.876,XR:15,Sf:0.2,tf:0.5,tc:1,rho:800,rhos:5000,hs:0.2,peso:50,Ta:18,Lx:130,Ly:70,D:4,h:0.6,size:"250",mat:"duro",conn:"exo",nR:120,LR:20,rodPos:"esq",sfMode:"man",sfN:5,sfR:1.5,sfGmr:0.6,sfSpan:300,sfRt:20}
};
const SUBE_KEY="sube-termales-web-v4";
/* Lee los datos guardados por la herramienta (o los del proyecto si no hay) */
function SUBE_load(){const S=JSON.parse(JSON.stringify(DEF));
  try{const s=JSON.parse(localStorage.getItem(SUBE_KEY)||"null");if(s&&s.v===3)for(const m of Object.keys(DEF))Object.assign(S[m],s[m]||{})}catch(e){}
  return S;}
function SUBE_save(S){try{localStorage.setItem(SUBE_KEY,JSON.stringify({v:3,...S}))}catch(e){}}
/* Utilidad de formato usada por los motores */
const roundUp=(x,s)=>Math.ceil(x/s-1e-9)*s;
const mx=(a,b)=>b==null?a:Math.max(a,b);

/* ============================================================
   Tablas normativas
   ============================================================ */
const BIL_IEC={3.6:[20,40],7.2:[40,60],12:[60,75,95],17.5:[75,95],24:[95,125,145],36:[145,170],52:[250],72.5:[325],100:[380,450],123:[450,550],145:[450,550,650],170:[550,650,750],245:[650,750,850,950,1050],300:[850,950,1050],362:[950,1050,1175],420:[1050,1175,1300,1425],550:[1175,1300,1425,1550],800:[1675,1800,1950,2100]};
/* IEC 60071-1 Tabla 3 (rango II, Um > 245 kV): impulso de maniobra fase-tierra normalizado y los BIL que se le asocian */
const SIWV_II={300:[[750,[850,950]],[850,[950,1050]]],362:[[850,[950,1050]],[950,[1050,1175]]],420:[[850,[1050,1175]],[950,[1175,1300]],[1050,[1300,1425]]],550:[[950,[1175,1300]],[1050,[1300,1425]],[1175,[1425,1550]]],800:[[1300,[1675,1800]],[1425,[1800,1950]],[1550,[1950,2100]]]};
/* IEC 60071-2 Tabla A.2: distancia mínima fase-tierra por impulso de maniobra (m): [conductor-estructura, punta-estructura] */
const CLR_SI={750:[1.6,1.9],850:[1.8,2.4],950:[2.2,2.9],1050:[2.6,3.4],1175:[3.1,4.1],1300:[3.6,4.8],1425:[4.2,5.6],1550:[4.9,6.4]};
/* Configuraciones de barras: interruptores y seccionadores (sin cuchillas de tierra) para n circuitos; extra = bahías de acople/transferencia */
const CFG={
  bs:{n:"Barra sencilla",int:n=>n,sec:n=>2*n,extra:0,sim:"bs"},
  bpt:{n:"Barra principal y transferencia (2 barras)",int:n=>n+1,sec:n=>3*n+2,extra:1,sim:"bpt"},
  db:{n:"Doble barra",int:n=>n+1,sec:n=>3*n+2,extra:1,sim:"db"},
  dbt:{n:"Doble barra + transferencia (3 barras)",int:n=>n+2,sec:n=>4*n+4,extra:2,sim:"dbt"},
  an:{n:"Anillo",int:n=>n,sec:n=>3*n,extra:0,sim:null},
  iym:{n:"Interruptor y medio",int:n=>Math.ceil(1.5*n),sec:n=>4*n,extra:0,sim:null},
  di:{n:"Doble barra con doble interruptor",int:n=>2*n,sec:n=>5*n,extra:0,sim:null}
};
/* RETIE Tabla 3.22.1.c: distancias mínimas de seguridad en subestaciones (BIL, d mín IEC, valor básico, circulación de personal, trabajo horizontal, trabajo vertical) */
const RETIE_C=[[60,0.09,0.10,null,null,null],[75,0.12,0.13,null,null,null],[95,0.16,0.18,null,null,null],[125,0.22,0.24,null,null,null],[170,0.32,0.35,null,null,null],[200,0.38,0.42,null,null,null],[250,0.48,0.53,null,null,null],[325,0.63,0.70,null,null,null],[380,0.75,0.83,3.08,null,null],[450,0.90,1.00,3.25,null,null],[550,1.10,1.21,3.46,2.96,null],[650,1.30,1.43,3.68,3.18,null],[750,1.50,1.65,3.90,3.40,2.90],[850,1.70,1.87,4.12,3.62,3.12],[950,1.90,2.09,4.34,3.84,3.34],[1050,2.10,2.31,4.56,4.06,3.56],[1175,2.35,2.59,4.84,4.34,3.84],[1300,2.60,2.86,5.11,4.61,4.11],[1425,2.85,3.02,5.27,4.77,4.27],[1550,3.10,3.29,5.54,5.04,4.54]];
const RETIE_A=[[7.2,3.0,"hasta 7,2 kV"],[17.5,3.1,"13,8 kV"],[52,3.2,"34,5 kV"],[72.5,3.5,"66 kV"],[123,4.0,"115 kV"],[245,4.7,"230 kV"],[550,5.3,"500 kV"]];
const POL={a:["a · Muy ligera",22.0],b:["b · Ligera",27.8],c:["c · Media",34.7],d:["d · Pesada (alta)",43.3],e:["e · Muy pesada",53.7]};
const AISL={};CAT.AIS.forEach(x=>AISL[x.id]=x);
const MAT={blando:{n:"Cobre recocido (blando) 100 %",ar:0.00393,K0:234,Tm:1083,rr:1.72,TC:3.42},duro:{n:"Cobre duro comercial 97 %",ar:0.00381,K0:242,Tm:1084,rr:1.78,TC:3.42},cw40:{n:"Acero recubierto de cobre 40 %",ar:0.00378,K0:245,Tm:1084,rr:4.40,TC:3.85}};
const CONN={exo:{n:"Soldadura exotérmica",lim:Infinity},fuerte:{n:"Soldadura fuerte (≤ 450 °C)",lim:450},mec:{n:"Conectores mecánicos (≤ 250 °C)",lim:250}};
const SIZES={"2/0":["2/0 AWG",67.4,10.5],"4/0":["4/0 AWG",107.2,13.3],"250":["250 kcmil",126.7,14.6],"300":["300 kcmil",152.0,16.0],"350":["350 kcmil",177.3,17.3],"500":["500 kcmil",253.0,20.6]};

/* ============================================================
   Motor 1: coordinación de aislamiento (base: calculador de Daniel)
   ============================================================ */
function dpsRow(p,g,Rn){
  const cat=CAT.DPS.find(c=>c.id===p.dpsCat);if(!cat)return null;
  const lst=cat.rows.filter(r=>r[0]>=0.72*g.um&&r[0]<=1.27*g.um);if(!lst.length)return {cat,lst,row:null};
  let row=lst.find(r=>r[0]===+p.dpsUr);if(!row)row=lst.find(r=>r[0]>=Rn)||lst[lst.length-1];
  return {cat,lst,row};
}
function calcAis(g,p){
  const o={},c=300;
  o.kmin=1+p.mp/100;
  o.COV=g.um/Math.sqrt(3);o.TOV=p.ke*o.COV;o.Ro=o.COV/p.ko;o.Re=o.TOV/p.kt;o.Rn=Math.max(o.Ro,o.Re);
  /* pararrayos: de catálogo o personalizado */
  o.dps=p.dpsCat&&p.dpsCat!=="man"?dpsRow(p,g,o.Rn):null;
  if(o.dps&&o.dps.row){const r=o.dps.row,i=Math.min(2,Math.max(0,+p.npmI||0));o.ur=r[0];o.npr=r[5];o.npm=r[1+i];o.iSw=CAT.I_SW[i];o.dpsN=`${o.dps.cat.marca} ${o.dps.cat.n.split(" · ")[0]} · Ur ${r[0]} kV`}
  else{o.ur=p.ur;o.npr=p.npr;o.npm=p.npm;o.dpsN="Pararrayos personalizado"}
  o.okUr=o.ur>=o.Rn;
  o.Ka=g.alt>1000?Math.exp((g.alt-1000)/8150):1;
  o.NPRc=o.npr*o.Ka;o.NPMc=o.npm*o.Ka;
  o.rII=g.um>245;const tII=SIWV_II[g.um]||[];
  o.filas=(BIL_IEC[g.um]||[]).map(BIL=>{const K1=BIL/o.NPRc,par=tII.find(t=>t[1].includes(BIL)),BSLa=par?par[0]:0.75*BIL,KM=BSLa/o.NPMc,KMo=0.83*BIL/o.NPMc,dmax=((BIL/o.kmin)-o.NPRc)*c/(2*p.S);
    return {BIL,K1,BSLa,rII:!!par,KM,KMo,dmax,c1:K1>=o.kmin,c2:KM>1.15,c3:dmax>=p.dist,ok:K1>=o.kmin&&KM>1.15&&dmax>=p.dist}});
  o.sel=o.filas.find(f=>f.ok)||null;
  o.BIL=o.sel?o.sel.BIL:null;
  /* fuga IEC 60815: USCD fase-tierra × Um/√3 × kd */
  o.uscd=POL[p.pol][1];o.Lcalc=o.uscd*g.um/Math.sqrt(3)*p.kd;o.Lreq=Math.ceil(o.Lcalc-1e-9);
  const A=p.ins==="custom"?{id:"custom",n:p.cN||"Aislador personalizado",tipo:p.cTipo==="disco"?"disco":"pol",fuga:+p.cFuga,lon:+p.cLon,liwv:+p.cLiwv,sml:+p.cSml}:(AISL[p.ins]||CAT.AIS[0]);o.A=A;
  if(A.tipo==="disco"){o.n=Math.ceil(o.Lreq/A.fuga)+(+p.extra||0);o.fugaTot=o.n*A.fuga;o.lon=o.n*A.lon;o.okFuga=o.fugaTot>=o.Lreq-1e-9;o.okLiwv=true}
  else{o.n=1;o.fugaTot=A.fuga;o.lon=A.lon;o.okFuga=A.fuga>=o.Lreq-1e-9;o.okLiwv=o.BIL?A.liwv>=o.BIL:false;o.okLiwvKa=o.BIL?A.liwv>=o.BIL*o.Ka:false}
  o.ok=!!o.sel&&o.okUr&&o.okFuga&&o.okLiwv;
  return o;
}

/* ============================================================
   Motor 2: distancias (motor de Óscar, sin cambios de método)
   ============================================================ */
function densidad(mode,h,t,dMan){
  if(mode==="none")return{delta:1};if(mode==="man")return{delta:dMan};
  if(mode==="baro"){const b=Math.pow(10,Math.log10(76)-h/18336);return{delta:3.92*b/(273+t),b}}
  const pk=101.3*Math.exp(-h/8150);return{delta:(pk/101.3)*(293/(273+t)),pk};
}
function retieRow(BIL){
  const ex=RETIE_C.find(r=>r[0]===BIL);if(ex)return{row:ex,exact:true};
  if(BIL<RETIE_C[0][0]||BIL>RETIE_C[RETIE_C.length-1][0])return{row:null,exact:false};
  let i=0;while(RETIE_C[i+1][0]<BIL)i++;const a=RETIE_C[i],b=RETIE_C[i+1],f=(BIL-a[0])/(b[0]-a[0]),row=[BIL];
  for(let k=1;k<6;k++)row.push(a[k]==null||b[k]==null?null:a[k]+f*(b[k]-a[k]));return{row,exact:false};
}
function retieR(Um){const ex=RETIE_A.find(r=>r[0]===Um);if(ex)return{R:ex[1],lab:ex[2]};
  if(Um<RETIE_A[0][0])return{R:RETIE_A[0][1],lab:"bajo la tabla"};if(Um>RETIE_A[RETIE_A.length-1][0])return{R:RETIE_A[RETIE_A.length-1][1],lab:"sobre la tabla"};
  let i=0;while(RETIE_A[i+1][0]<Um)i++;const a=RETIE_A[i],b=RETIE_A[i+1];return{R:a[1]+(Um-a[0])/(b[0]-a[0])*(b[1]-a[1]),lab:"interpolado"}}
function calcDis(g,p){
  const r={p,g},step=p.rnd?0.05:0,RU=x=>step?roundUp(x,step):x,RP=x=>p.rnd?roundUp(x,0.5):x,R10=x=>p.rnd?roundUp(x,0.1):x,RCM=x=>p.rnd?Math.round(x*100-1e-9)/100:x;
  Object.assign(r,densidad(p.dMode,g.alt,g.t,p.dMan));
  const ret=retieRow(p.BIL),Rw=ret.row;r.retie=ret;r.R=Rw;
  r.dft=p.kS*Math.pow(r.delta,-p.nExp)*p.BIL/p.Es;
  /* rango II: también manda el impulso de maniobra (IEC 60071-2 Tabla A.2, punta-estructura) */
  r.dSI=p.BSL>0&&CLR_SI[p.BSL]?CLR_SI[p.BSL][1]*Math.pow(r.delta,-p.nExp):null;
  r.dftBase=mx(mx(r.dft,Rw&&Rw[1]),r.dSI);r.dftA=RU(r.dftBase);
  r.dffMin=1.4*r.dftBase;r.dffMax=2*r.dftBase;r.dff=p.fff*r.dftBase;r.dffA=RU(r.dff);
  r.VB=p.kVB*r.dft;r.VBa=mx(r.VB,Rw&&Rw[2]);
  r.Dv=2.25+r.VBa;r.DvA=RU(mx(r.Dv,Rw&&Rw[3]));
  r.Dh=1.75+r.VBa;r.DhA=RU(mx(r.Dh,Rw&&Rw[4]));
  r.Dtv=1.25+r.VBa;r.DtvA=RU(mx(r.Dtv,Rw&&Rw[5]));
  r.Tveh=r.VBa+0.70;r.Hveh=r.VBa+p.galibo+0.70;r.HvehA=R10(r.Hveh);
  r.Rcer=retieR(g.um);
  r.flex=p.barra==="flex";
  r.f_m=!r.flex?0:(p.fMode==="pct"?p.pct/100*p.vano:p.vano*p.vano*p.w/(8*p.Fh));r.f_cm=r.f_m*100;
  r.Kuse=r.flex?p.K:0;r.sway=r.Kuse*Math.sqrt(r.f_cm);
  r.Sf=(r.dffA*100+r.sway)/100;r.SfA=r.flex?RCM(r.Sf):RU(r.Sf);
  r.Dfe=(r.dftA*100+r.sway)/100;r.DfeA=RU(r.Dfe);
  r.WbMin=2*r.SfA+2*r.DfeA;
  r.heqF=2.30+0.0105*g.um;r.heqA=RU(Math.max(r.heqF,r.DvA));
  r.hbF=5+0.0125*g.um;r.hbReq=Math.max(r.hbF,r.heqA+r.dffA);r.hbA=r.flex?r.hbReq:RU(r.hbReq);
  r.amarre=r.hbA+r.f_m;r.amarreA=r.flex?RP(r.amarre):r.hbA;r.hbLow=r.amarreA-r.f_m;
  r.hremF=5+0.006*g.um;r.hremA=RU(Math.max(6,r.hremF));
  r.Wb=p.Wb>0?p.Wb:r.WbMin;
  const fm=f2,ge=(a,b)=>`${f2(a)} m ${a>=b-1e-9?"≥":"<"} ${f2(b)} m`;
  r.checks=[
    ...(r.dSI?[{txt:"Fase–tierra: impulso de maniobra (rango II) frente a la fórmula de rayo",ok:r.dft>=r.dSI-1e-9,cmp:ge(r.dft,r.dSI),bad:`Rige el impulso de maniobra: ${f2(r.dftA)} m`,lvl:"info"}]:[]),
    {txt:"Fase–tierra: fórmula frente a la mínima de la tabla RETIE",ok:!Rw||r.dft>=Rw[1]-1e-9,cmp:Rw?ge(r.dft,Rw[1]):"BIL fuera de tabla",bad:`Rige la tabla RETIE: se adopta ${fm(r.dftA)} m`,lvl:"info"},
    {txt:"Altura de equipos (fórmula) frente a circulación de personal",ok:r.heqF>=r.DvA-1e-9,cmp:ge(r.heqF,r.DvA),bad:`Rige circulación de personal: ${fm(r.heqA)} m`,lvl:"info"},
    {txt:"Barras sobre equipos: separación ≥ distancia fase–fase",ok:r.hbF-r.heqA>=r.dffA-1e-9,cmp:ge(r.hbF-r.heqA,r.dffA),bad:`Se elevan las barras a ${fm(r.hbA)} m`,lvl:"info"},
    {txt:"Punto más bajo de barras frente a vehículos",ok:r.hbLow>=r.HvehA-1e-9,cmp:ge(r.hbLow,r.HvehA),bad:"No apto para vías bajo barras",lvl:"no"},
    {txt:"Remate de líneas frente a vehículos",ok:r.hremA>=r.HvehA-1e-9,cmp:ge(r.hremA,r.HvehA),bad:`Si hay vías bajo las llegadas, use ${fm(r.HvehA)} m`,lvl:"wa"},
    {txt:"Ancho de bahía de diseño frente al mínimo por fases",ok:!(p.Wb>0)||p.Wb>=r.WbMin-1e-9,cmp:p.Wb>0?ge(p.Wb,r.WbMin):"Sin ancho de diseño",bad:"Ampliar la bahía",lvl:"no"}
  ];
  return r;
}

/* ============================================================
   Motor 3: malla IEEE 80-2013 (motor de Camilo, corregido)
   ============================================================ */
function calcMal(p){
  const o={},capa=p.hs>0&&p.rhos>0,rs=capa?p.rhos:p.rho,ts=p.ts>0?p.ts:p.tf,tc=p.tc>0?p.tc:p.tf;o.capa=capa;o.ts=ts;o.tc=tc;
  o.Cs=capa?1-0.09*(1-p.rho/p.rhos)/(2*p.hs+0.09):1;
  o.kb=p.peso===50?0.116:0.157;
  o.Etouch=(1000+1.5*o.Cs*rs)*o.kb/Math.sqrt(ts);o.Estep=(1000+6*o.Cs*rs)*o.kb/Math.sqrt(ts);
  o.Tdc=p.XR/(2*Math.PI*60);
  const dfx=t=>o.Tdc>0?Math.sqrt(1+(o.Tdc/t)*(1-Math.exp(-2*t/o.Tdc))):1;
  o.Df=dfx(p.tf);o.Dfc=dfx(tc);
  const m=MAT[p.mat];o.Tm=Math.min(m.Tm,CONN[p.conn].lim);
  o.IFc=o.Dfc*p.If; /* corriente asimétrica para el conductor (toda la falla, sin Sf) */
  o.Amin=o.IFc/Math.sqrt((m.TC*1e-4/(tc*m.ar*m.rr))*Math.log((m.K0+o.Tm)/(m.K0+p.Ta)));
  const sz=SIZES[p.size];o.Asec=sz[1];o.dmm=p.dOver>0?p.dOver:sz[2];o.okCond=o.Asec>=o.Amin;
  const A=p.Lx*p.Ly;o.A=A;
  o.nY=Math.max(1,Math.round(p.Lx/p.D))+1;o.nX=Math.max(1,Math.round(p.Ly/p.D))+1;
  o.LC=o.nY*p.Ly+o.nX*p.Lx;o.Lp=2*(p.Lx+p.Ly);
  o.Deff=(p.Lx/(o.nY-1)+p.Ly/(o.nX-1))/2;
  const D=o.Deff,d=o.dmm/1000,h=p.h;
  o.LRt=p.nR*p.LR;o.LT=o.LC+o.LRt;
  o.Rg=p.rho*(1/o.LT+(1/Math.sqrt(20*A))*(1+1/(1+h*Math.sqrt(20/A))));
  o.sf=sfLadder(p,o.Rg);o.SfUse=p.sfMode==="calc"?o.sf.Sf:p.Sf;o.Ig=o.SfUse*p.If*1000;o.IG=o.Df*o.Ig;
  o.GPR=o.IG*o.Rg;
  o.na=2*o.LC/o.Lp;o.nb=Math.sqrt(o.Lp/(4*Math.sqrt(A)));o.n=o.na*o.nb;
  const esq=p.rodPos==="esq"&&p.nR>0;o.esq=esq;
  o.Kii=esq?1:1/Math.pow(2*o.n,2/o.n);o.Kh=Math.sqrt(1+h/1);
  o.Km=(1/(2*Math.PI))*(Math.log(D*D/(16*h*d)+Math.pow(D+2*h,2)/(8*D*d)-h/(4*d))+(o.Kii/o.Kh)*Math.log(8/(Math.PI*(2*o.n-1))));
  o.Ki=0.644+0.148*o.n;
  o.LM=esq?o.LC+(1.55+1.22*(p.LR/Math.sqrt(p.Lx*p.Lx+p.Ly*p.Ly)))*o.LRt:o.LC+o.LRt;
  o.Em=p.rho*o.Km*o.Ki*o.IG/o.LM;
  o.Ks=(1/Math.PI)*(1/(2*h)+1/(D+h)+(1/D)*(1-Math.pow(0.5,o.n-2)));
  o.LS=0.75*o.LC+0.85*o.LRt;o.Es=p.rho*o.Ks*o.Ki*o.IG/o.LS;
  o.safeGPR=o.GPR<=o.Etouch;o.okEm=o.Em<=o.Etouch;o.okEs=o.Es<=o.Estep;o.okMalla=o.safeGPR||(o.okEm&&o.okEs);
  o.fuera=o.n>25||o.Deff<2.5||h<0.25||h>2.5;
  o.ok=o.okCond&&o.okMalla&&!o.fuera;
  o.LMreq=p.rho*o.Km*o.Ki*o.IG/o.Etouch;
  return o;
}
/* Factor de reparto Sf: cada cable de guarda es una escalera infinita de vanos (impedancia propia con retorno por tierra, Carson)
   aterrizada en cada torre. Zeq de todos los cables queda en paralelo con la malla. Aproximación conservadora: no cuenta el acople con la fase fallada. */
function sfLadder(p,Rg){
  const f=60,De=658.5*Math.sqrt(p.rho/f),gmr=Math.max(1e-4,p.sfGmr/1000),L=p.sfSpan/1000,N=Math.max(0,Math.round(p.sfN));
  const zr=(p.sfR+0.000988*f)*L,zx=0.0028938*f*Math.log10(De/gmr)*L; /* impedancia de un vano, Ω */
  if(!N||!(L>0))return{Sf:1,Zr:Infinity,Zx:0,Zm:Infinity,zr,zx,N};
  /* Z∞ = Zs/2 + √(Zs·Rt + Zs²/4) */
  const ar=zr*p.sfRt+(zr*zr-zx*zx)/4,ai=zx*p.sfRt+zr*zx/2,mod=Math.hypot(ar,ai),sr=Math.sqrt((mod+ar)/2),si=Math.sign(ai||1)*Math.sqrt(Math.max(0,(mod-ar)/2));
  const Zr=(zr/2+sr)/N,Zx=(zx/2+si)/N;
  return{Sf:Math.hypot(Zr,Zx)/Math.hypot(Zr+Rg,Zx),Zr,Zx,Zm:Math.hypot(Zr,Zx),zr,zx,N,De};
}

/* ============================================================
   Motor 4: conductores y barrajes
   IEEE 738 (capacidad de corriente), Peek (corona), IEC 60865 (cortocircuito), flecha
   ============================================================ */
function amp738(c){
  const Tf=(c.Tc+c.Ta)/2,mu=1.458e-6*Math.pow(Tf+273,1.5)/(Tf+383.4),rho=(1.293-1.525e-4*c.He+6.379e-9*c.He*c.He)/(1+0.00367*Tf),kf=2.424e-2+7.477e-5*Tf-4.407e-9*Tf*Tf;
  const Re=c.D*rho*c.V/mu,ph=(c.phi??90)*Math.PI/180,Ka=1.194-Math.cos(ph)+0.194*Math.cos(2*ph)+0.368*Math.sin(2*ph),dT=c.Tc-c.Ta;
  const qc1=Ka*(1.01+1.35*Math.pow(Re,0.52))*kf*dT,qc2=Ka*0.754*Math.pow(Re,0.6)*kf*dT,qcn=3.645*Math.sqrt(rho)*Math.pow(c.D,0.75)*Math.pow(Math.max(0,dT),1.25);
  const qc=Math.max(qc1,qc2,qcn),qr=17.8*c.D*c.eps*(Math.pow((c.Tc+273)/100,4)-Math.pow((c.Ta+273)/100,4)),qs=c.alpha*c.Qs*c.D,I2=(qc+qr-qs)/c.R;
  return{Tf,rho,Re,qc1,qc2,qcn,qc,qr,qs,R:c.R,I:I2>0?Math.sqrt(I2):0};
}
function calcCon(g,p,ctx){
  ctx=ctx||{};const o={},C=CAT.COND.find(c=>c.id===p.cond)||null;o.cat=C;
  const d=C?C.d:p.d,w=C?C.w:p.w,rts=C?C.rts:p.rts,r20=C?C.r20:p.r20,aAl=C?C.aAl:p.aAl,n=Math.max(1,Math.round(p.nsub));
  Object.assign(o,{d,w,rts,r20,aAl,n,nombre:C?C.n:"Conductor personalizado",rig:!!ctx.rig});
  /* capacidad de corriente */
  o.RTc=r20*p.kac*(1+0.00403*(p.Tc-20))/1000; /* Ω/m a la temperatura de operación */
  o.amp=amp738({D:d/1000,R:o.RTc,Ta:p.Ta,Tc:p.Tc,V:p.vv,phi:90,He:g.alt,eps:p.eps,alpha:p.abs,Qs:p.Qs});
  o.Icap=n*o.amp.I;o.okAmp=o.Icap>=p.Idis;
  /* corona (Peek): gradiente en la superficie frente al gradiente crítico */
  const b=Math.pow(10,Math.log10(76)-g.alt/18336);o.b=b;o.delta=3.92*b/(273+g.t);
  const r=d/20,a=(p.link&&ctx.Sf>0?ctx.Sf:p.a)*100;o.a=a/100;o.r=r;
  o.Rb=n>1?p.sep/(2*Math.sin(Math.PI/n)):0;o.req=n>1?Math.pow(n*r*Math.pow(o.Rb,n-1),1/n):r;
  o.V=g.um/Math.sqrt(3);o.Emed=o.V/(n*r*Math.log(a/o.req));o.Emax=o.Emed*(n>1?1+(n-1)*r/o.Rb:1);
  o.E0=21.1*p.m*o.delta;o.Ev=o.E0*(1+0.301/Math.sqrt(o.delta*r));o.Vc=o.E0*o.V/o.Emax;o.okCor=o.Emax<=o.E0;
  /* cortocircuito: térmico (IEC 60865-1, aluminio) y fuerza entre fases */
  o.Sthr=Math.sqrt(2.1376e16*Math.log((1+0.004*(p.te-20))/(1+0.004*(p.Tc-20))))/1e6; /* A/mm² para 1 s */
  o.Ith=n*aAl*o.Sthr/Math.sqrt(p.tk)/1000;o.okTh=o.Ith>=p.Ik;
  o.ip=p.kip*p.Ik;o.Fp=2e-7*(Math.sqrt(3)/2)*Math.pow(o.ip*1e3,2)/o.a;o.F3=2e-7*0.75*Math.pow(p.Ik*1e3,2)/o.a;
  o.rr=o.F3/(n*w*9.81);o.ang=Math.atan(o.rr)*180/Math.PI;o.Fvano=o.Fp*p.L/1000;
  /* flecha del vano (parábola) con la tensión de tendido por conductor */
  o.f=w*p.L*p.L/(8*p.T);o.fPct=100*o.f/p.L;o.pctRts=100*p.T/rts;o.okT=o.pctRts<=25;
  /* barraje rígido (tubo de aluminio): esfuerzo de flexión por cortocircuito */
  const D=p.tubD,t=p.tubT,di=D-2*t;o.Z=Math.PI*(Math.pow(D,4)-Math.pow(di,4))/(32*D);
  o.Fm=o.Fp*p.tubL;o.sig=p.tubB*o.Fm*(p.tubL*1000)/(8*o.Z);const k=1-2*t/D;o.q=1.7*(1-Math.pow(k,3))/(1-Math.pow(k,4));o.sigAdm=o.q*p.tubRp;o.okTub=o.sig<=o.sigAdm;
  o.ok=o.okAmp&&o.okCor&&o.okTh&&(o.rig?o.okTub:o.okT);
  return o;
}

/* ============================================================
   Motor 5: apantallamiento (modelo electrogeométrico, IEEE Std 998)
   ============================================================ */
function calcApa(g,p,ctx){
  ctx=ctx||{};const o={},BIL=p.BIL,h=p.hBus,r=Math.max(1e-3,(ctx.req||1.4)/100);o.r=r;
  /* radio de corona: Rc·ln(2h/Rc) = Vc/E0, con E0 = 1500 kV/m */
  let Rc=0.05;for(let i=0;i<60;i++)Rc=(BIL/1500)/Math.log(2*h/Rc);o.RcCor=Rc;o.Rc=Math.max(Rc,r);
  o.ZsCalc=60*Math.sqrt(Math.log(2*h/o.Rc)*Math.log(2*h/r));o.Zs=p.zsMode==="man"?p.zsMan:o.ZsCalc;
  o.Is=2.2*BIL/o.Zs;o.S=8*p.k*Math.pow(o.Is,0.65);
  const S=o.S,dh=p.hG-h;o.dh=dh;
  o.hMid=p.X/2<S?p.hG-(S-Math.sqrt(S*S-p.X*p.X/4)):-Infinity;o.okMid=dh>0&&o.hMid>=h;
  o.Xmax=dh>0?(dh>=S?2*S:2*Math.sqrt(S*S-(S-dh)*(S-dh))):0;
  o.hGmin=p.X/2<S?h+S-Math.sqrt(S*S-p.X*p.X/4):Infinity;
  const reach=y=>y>=S?S:Math.sqrt(S*S-(S-y)*(S-y));o.dLat=Math.max(0,reach(p.hG)-reach(h));
  o.ang=dh>0?Math.atan((p.X/2)/dh)*180/Math.PI:90;
  o.area=p.Lx*p.Ly;o.Nd=p.ddt*o.area/1e6;o.anios=o.Nd>0?1/o.Nd:Infinity;
  o.ok=o.okMid;
  return o;
}

/* ============================================================
   Validación: el mismo motor reproduce ejemplos publicados
   ============================================================ */
function validar(){
  const V=[],it=(n,pub,calc,u,d=1)=>({n,pub,calc,u,d});
  const b1=calcMal({If:3.18,XR:0,Sf:0.6,tf:0.5,tc:0.5,rho:400,rhos:2500,hs:0.102,peso:70,Ta:40,Lx:70,Ly:70,D:7,h:0.5,size:"2/0",dOver:10,mat:"duro",conn:"exo",nR:0,LR:0,rodPos:"no",sfMode:"man",sfN:0,sfR:1,sfGmr:1,sfSpan:300,sfRt:15});
  V.push({mod:"Malla de tierra",caso:"IEEE Std 80-2013, Anexo B, ejemplo 1: malla cuadrada de 70 × 70 m sin varillas",items:[it("Toque tolerable (70 kg)",838.2,b1.Etouch,"V"),it("Paso tolerable (70 kg)",2686.6,b1.Estep,"V"),it("Resistencia Rg",2.78,b1.Rg,"Ω",2),it("Elevación de potencial",5304,b1.GPR,"V",0),it("Km",0.89,b1.Km,"",2),it("Ki",2.272,b1.Ki,"",3),it("Tensión de malla Em",1002.1,b1.Em,"V")]});
  const b2=calcMal({If:3.18,XR:0,Sf:0.6,tf:0.5,tc:0.5,rho:400,rhos:2500,hs:0.102,peso:70,Ta:40,Lx:70,Ly:70,D:7,h:0.5,size:"2/0",dOver:10,mat:"duro",conn:"exo",nR:20,LR:7.5,rodPos:"esq",sfMode:"man",sfN:0,sfR:1,sfGmr:1,sfSpan:300,sfRt:15});
  V.push({mod:"Malla de tierra",caso:"IEEE Std 80-2013, Anexo B, ejemplo 2: la misma malla con 20 varillas de 7,5 m",items:[it("Resistencia Rg",2.75,b2.Rg,"Ω",2),it("Elevación de potencial",5247,b2.GPR,"V",0),it("Km",0.77,b2.Km,"",2),it("Tensión de malla Em",747.4,b2.Em,"V"),it("Ks",0.406,b2.Ks,"",3),it("Tensión de paso Es",548.9,b2.Es,"V")]});
  const dk=(e)=>amp738({D:0.02814,R:9.390e-5,Ta:40,Tc:100,V:0.61,phi:90,He:0,eps:e,alpha:e,Qs:996.9});
  const a12=dk(0.8),a06=dk(0.5);
  V.push({mod:"Conductores",caso:"IEEE Std 738, ejemplo de cálculo: ACSR Drake a 100 °C, ambiente 40 °C, viento 0,61 m/s, a nivel del mar",items:[it("Convección forzada qc",81.93,a12.qc,"W/m",2),it("Radiación qr (ε = 0,8)",39.1,a12.qr,"W/m"),it("Capacidad (edición 2012, ε = α = 0,8)",1025,a12.I,"A",0),it("Capacidad (edición 2006, ε = α = 0,5)",994,a06.I,"A",0)]});
  const dn=calcDis({um:245,alt:1000,t:20},{link:false,BSL:0,BIL:950,dMode:"man",dMan:0.893,fff:1.4,galibo:4,rnd:false,Es:550,kS:1.04,nExp:0.9,kVB:1.1,barra:"rig",cond:"ACSR",K:10,vano:22,fMode:"pct",pct:3,w:1,Fh:500,Wb:0});
  V.push({mod:"Distancias",caso:"Apuntes del curso Subestaciones (ECI): distancia fase-tierra con BIL 950 kV y δ = 0,893",items:[it("Distancia fase-tierra",1.9889,dn.dft,"m",4)]});
  const dt=calcDis(DEF.g,DEF.dis);
  V.push({mod:"Distancias",caso:"Entrega 2 del proyecto S/E Termales (Grupo 2), Tabla 5",items:[it("Fase-tierra",1.10,dt.dftA,"m",2),it("Fase-fase",1.30,dt.dffA,"m",2),it("Circulación de personal",3.50,dt.DvA,"m",2),it("Separación entre fases",2.11,dt.SfA,"m",2),it("Altura de equipos",3.60,dt.heqA,"m",2),it("Amarre de barras",7.50,dt.amarreA,"m",2)]});
  const at=calcAis(DEF.g,DEF.ais);
  V.push({mod:"Aislamiento",caso:"Entrega 1 del proyecto S/E Termales (Grupo 1): pararrayos Siemens 3EL2 096-2PJ3",items:[it("Tensión mínima del pararrayos",88.77,at.Rn,"kV",2),it("Factor de altitud Ka",1.1031,at.Ka,"",4),it("NPR corregido",249.3,at.NPRc,"kV"),it("BIL seleccionado",550,at.BIL,"kV",0),it("Distancia máx. pararrayos-equipo",28.6,at.sel?at.sel.dmax:NaN,"m"),it("Fuga mínima",3383,at.Lreq,"mm",0)]});
  V.forEach(c=>c.items.forEach(i=>{i.err=100*(i.calc-i.pub)/i.pub;i.ok=Math.abs(i.err)<=1}));
  return V;
}
window.SUBE={DEF,KEY:SUBE_KEY,load:SUBE_load,save:SUBE_save,CAT,CFG,BIL_IEC,SIWV_II,CLR_SI,RETIE_C,RETIE_A,POL,AISL,MAT,CONN,SIZES,calcAis,calcDis,calcMal,calcCon,calcApa,sfLadder,amp738,validar};
})();
