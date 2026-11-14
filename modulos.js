"use strict";
/* ============================================================
   SUBE · módulos añadidos sobre la base común (calculos.js):
   proyecto, conductores y barrajes, apantallamiento,
   configuraciones, validación, catálogos y resumen.
   Usa las utilidades y el estado S definidos en index.html.
   ============================================================ */
let RC,RP;
const txt=(mod,k,label,opt={})=>({mod,k,label,type:"txt",...opt});
const clone=o=>JSON.parse(JSON.stringify(o));
const pill=(c,t)=>`<span class="pill ${c}">${t}</span>`;
const okp=(b,t1="Cumple",t0="No cumple")=>pill(b?"ok":"no",b?t1:t0);
const nCirc=()=>Math.max(1,Math.round((+S.proy.nLin||0)+(+S.proy.nTr||0)));
const nRes=()=>Math.max(0,Math.round(+S.proy.nRes||0));
const cfgOf=()=>CFG[S.proy.cfg]||CFG.dbt;
const EXTRA={bpt:"transferencia",db:"acople",dbt:"acople y transferencia"};

/* ---------- Formularios de los módulos nuevos ---------- */
Object.assign(FORMS,{
  fProy:[txt("proy","nombre","Nombre de la subestación",{wide:true}),num("proy","un","Tensión nominal de barras","kV"),txt("proy","tens","Niveles de tensión"),txt("proy","trafo","Transformación"),txt("proy","lugar","Ubicación"),
    sel("proy","cfg","Configuración de barras",Object.entries(CFG).map(([k,v])=>[k,v.n]),{wide:true,hint:"Se comparan en la pestaña Configuraciones."}),
    num("proy","nLin","Circuitos de línea","",{step:1}),num("proy","nTr","Circuitos de transformador","",{step:1}),num("proy","nRes","Circuitos de reserva","",{step:1,hint:"Previstos pero sin equipar."}),num("proy","icc3","Cortocircuito trifásico en barras","kA")],
  fMalSf:[sel("mal","sfMode","Cómo se obtiene",[["man","Valor asumido"],["calc","Calculado con los cables de guarda"]],{wide:true}),
    num("mal","Sf","Factor de reparto Sf","",{step:0.05,hint:"Parte de la falla que entra al suelo por la malla.",show:()=>S.mal.sfMode!=="calc"}),
    num("mal","sfN","Cables de guarda que llegan","",{step:1,hint:"Uno por cada línea con cable de guarda o neutro."}),num("mal","sfRt","Resistencia de pie de torre","Ω"),num("mal","sfSpan","Vano medio de las líneas","m"),
    num("mal","sfR","Resistencia del cable de guarda","Ω/km",{hint:"Acero 3/8\": 3,5 a 4. OPGW o ACSR: 0,3 a 1,5."}),num("mal","sfGmr","Radio medio geométrico","mm")],
  fConCon:[sel("con","cond","Conductor",()=>[["custom","Personalizado (datos de la ficha técnica)"],{g:"ACSR · Prysmian / Procables (Colombia)",o:CAT.COND.map(c=>[c.id,c.n])}],{wide:true}),
    num("con","d","Diámetro","mm",{show:()=>S.con.cond==="custom"}),num("con","w","Peso","kg/m",{show:()=>S.con.cond==="custom"}),num("con","rts","Carga de rotura","kgf",{show:()=>S.con.cond==="custom"}),
    num("con","r20","Resistencia c.c. a 20 °C","Ω/km",{show:()=>S.con.cond==="custom"}),num("con","aAl","Sección de aluminio","mm²",{show:()=>S.con.cond==="custom"}),
    num("con","nsub","Subconductores por fase","",{step:1}),num("con","sep","Separación del haz","cm",{hint:"Solo cuenta si hay más de un subconductor."})],
  fConAmp:[num("con","Idis","Corriente de diseño","A",{hint:"La mayor corriente que deben llevar las barras."}),num("con","Ta","Temperatura ambiente máxima","°C"),num("con","Tc","Temperatura máxima del conductor","°C",{hint:"75 °C es el límite habitual del ACSR."})],
  fConAdv:[num("con","vv","Viento","m/s",{hint:"0,61 m/s: viento mínimo de referencia."}),num("con","eps","Emisividad","",{step:0.05}),num("con","abs","Absortividad solar","",{step:0.05}),num("con","Qs","Radiación solar","W/m²"),num("con","kac","Factor de resistencia en c.a.","",{step:0.01}),num("con","m","Factor de superficie m","",{step:0.01,hint:"Corona: 0,85 para cable trenzado."})],
  fConCc:[chk("con","link","Usar la separación entre fases del módulo de distancias",{wide:true}),num("con","a","Separación entre fases","m",{show:()=>!S.con.link}),
    num("con","Ik","Cortocircuito de diseño","kA",{hint:"Corriente de corta duración de los equipos."}),num("con","kip","Factor de pico ip / Ik","",{hint:"2,5 a 50 Hz · 2,6 a 60 Hz"}),num("con","tk","Duración del cortocircuito","s"),num("con","te","Temperatura final admisible","°C",{hint:"ACSR: 200 °C (IEC 60865-1)."})],
  fConMec:[num("con","L","Vano de las barras","m",{step:0.5}),num("con","T","Tensión de tendido por conductor","kgf",{step:10,show:()=>S.dis.barra!=="rig"}),
    num("con","tubD","Tubo: diámetro exterior","mm",{show:()=>S.dis.barra==="rig"}),num("con","tubT","Tubo: espesor","mm",{show:()=>S.dis.barra==="rig"}),num("con","tubL","Distancia entre soportes","m",{show:()=>S.dis.barra==="rig"}),
    num("con","tubRp","Límite elástico Rp0,2","MPa",{show:()=>S.dis.barra==="rig",hint:"Aluminio 6063-T6: 160 a 170 MPa."}),num("con","tubB","Factor de apoyo β","",{show:()=>S.dis.barra==="rig",hint:"0,73 tubo continuo sobre varios apoyos · 1,0 apoyo simple"})],
  fApaBase:[chk("apa","link","Tomar BIL, altura de barras y área del patio de los otros módulos",{wide:true}),num("apa","BIL","BIL","kV",{show:()=>!S.apa.link}),num("apa","hBus","Altura de las barras más altas","m",{show:()=>!S.apa.link}),
    sel("apa","zsMode","Impedancia característica Zs",[["calc","Calculada con el efecto corona"],["man","Valor manual"]],{wide:true}),num("apa","zsMan","Zs manual","Ω",{show:()=>S.apa.zsMode==="man"})],
  fApaGeo:[num("apa","hG","Altura de los cables de guarda","m",{step:0.5}),num("apa","X","Separación entre cables de guarda","m",{step:0.5,hint:"Ancho del pórtico o de la bahía."}),
    sel("apa","k","Elemento de protección",[["1","Cable de guarda (k = 1,0)"],["1.2","Punta o mástil (k = 1,2)"]],{wide:true})],
  fApaExp:[num("apa","ddt","Densidad de descargas a tierra","rayos/km²·año",{wide:true,hint:"Dato del sitio (NTC 4552 o mapa de rayos)."}),num("apa","Lx","Largo del patio","m",{show:()=>!S.apa.link}),num("apa","Ly","Ancho del patio","m",{show:()=>!S.apa.link})]
});

/* Al cambiar la tensión máxima: pararrayos y aislador de catálogo que correspondan a esa Um */
function autoUm(){normalize();const a=calcAis(S.g,S.ais),cur=CAT.AIS.find(x=>x.id===S.ais.ins);
  if(cur&&cur.tipo==="pol"&&cur.um!==S.g.um){const c=CAT.AIS.find(x=>x.tipo==="pol"&&x.um===S.g.um&&x.fuga>=a.Lreq&&(!a.BIL||x.liwv>=a.BIL));S.ais.ins=c?c.id:"disco-u120bp"}}

/* ============================================================
   Encabezado y proyecto
   ============================================================ */
function camposTxt(){const p=S.proy,c=cfgOf(),n=nCirc(),r=nRes();
  return `${n+c.extra} equipados${r?` + ${r} de reserva`:""}`}
function renderHdr(){
  const p=S.proy,c=cfgOf();
  document.title=`${p.nombre} ${fmU(+p.un)} kV · Diseño de subestaciones`;
  $("hT").innerHTML=`${esc(p.nombre)} <em>${fmU(+p.un)} kV</em>`;
  $("ficha").innerHTML=[["Tensiones",esc(p.tens)],["Tensión máxima Um",fmU(S.g.um)+" kV"],[`Configuración ${fmU(+p.un)} kV`,c.n],["Campos",camposTxt()],["Transformación",esc(p.trafo)],["Ubicación",`${esc(p.lugar)} · ${fm(S.g.alt,0)} msnm`],["Cortocircuito en barras",`3F ${fm(+p.icc3,1)} kA · 1F ${fm(S.mal.If,1)} kA`],["Normas base","RETIE · IEC · IEEE"]]
    .map(([a,b])=>`<div><span>${a}</span><b>${b}</b></div>`).join("");
  $("proyHint").textContent=p.base?"caso base del curso":"proyecto libre";
}
function setState(ns,msg){S=ns;save();buildForms();renderAll();if(msg)toast(msg)}
$("btnNew").addEventListener("click",()=>{const n=clone(DEF);Object.assign(n.proy,{nombre:"Nueva subestación",tens:`${fmU(n.proy.un)} kV`,trafo:"Por definir",lugar:"Sitio del proyecto",base:false});
  setState(n,"Proyecto nuevo. Los valores iniciales son típicos de 115 kV: cámbielos por los suyos.");$("proyCard").open=true;const i=document.querySelector('#fProy input[type="text"]');if(i){i.focus();i.select()}});
$("btnSave").addEventListener("click",()=>{const blob=new Blob([JSON.stringify({app:"sube-web",v:3,fecha:new Date().toISOString(),...S},null,1)],{type:"application/json"}),a=document.createElement("a");
  a.href=URL.createObjectURL(blob);a.download=(String(S.proy.nombre).normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^A-Za-z0-9]+/g,"-").replace(/^-|-$/g,"")||"subestacion")+".json";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000);toast("Proyecto guardado en un archivo .json.")});
$("btnOpen").addEventListener("click",()=>$("fileOpen").click());
$("fileOpen").addEventListener("change",e=>{const f=e.target.files[0];if(!f)return;const rd=new FileReader();
  rd.onload=()=>{try{const s=JSON.parse(rd.result);if(!s||typeof s!=="object"||!s.g||!s.ais||!s.dis||!s.mal)throw 0;const n=clone(DEF);
      for(const m of Object.keys(DEF))if(s[m]&&typeof s[m]==="object")for(const k of Object.keys(DEF[m]))if(k in s[m]&&typeof s[m][k]===typeof DEF[m][k])n[m][k]=s[m][k];
      if(!s.proy)n.proy.base=false;setState(n,`Proyecto «${n.proy.nombre}» abierto.`)}catch(x){toast("Ese archivo no es un proyecto de esta herramienta.")}e.target.value=""};
  rd.readAsText(f)});

/* ============================================================
   Conductores y barrajes
   ============================================================ */
function renderCon(){
  const g=S.g,p=S.con,rig=S.dis.barra==="rig",o=RC=calcCon(g,p,{Sf:RD?RD.SfA:0,rig});
  const fails=[];if(!o.okAmp)fails.push("no lleva la corriente de diseño");if(!o.okCor)fails.push("hay efecto corona");if(!o.okTh)fails.push("no aguanta térmicamente el cortocircuito");if(rig?!o.okTub:!o.okT)fails.push(rig?"el tubo se pasa de esfuerzo en cortocircuito":"la tensión de tendido supera el 25 % de la rotura");
  const nom=`${o.n>1?o.n+" × ":""}${o.nombre.replace(/ · \d+\/\d+$/,"")}${o.n>1?" por fase":""}`;
  $("vCon").innerHTML=o.ok?verdict("ok",`${nom}: cumple`,`Lleva ${fm(o.Icap,0)} A a ${fm(p.Tc,0)} °C (se piden ${fm(p.Idis,0)} A), no hay corona y aguanta ${fm(o.Ith,1)} kA durante ${fm(p.tk,1)} s.`)
    :verdict("no",`${nom}: no cumple todavía`,"Motivo: "+fails.join("; ")+". Pruebe un conductor más grueso o más subconductores por fase.");
  $("kCon").innerHTML=kpi("Capacidad de la fase",fm(o.Icap,0),"A",`${o.n} × ${fm(o.amp.I,0)} A · diseño ${fm(p.Idis,0)} A`,o.okAmp?"hl":"bad")+kpi("Gradiente en la superficie",fm(o.Emax,2),"kV/cm",`crítico ${fm(o.E0,2)} kV/cm`,o.okCor?"hl":"bad")+
    kpi("Tensión crítica de corona",fm(o.Vc,0),"kV",`fase–tierra de operación ${fm(o.V,1)} kV`)+kpi("Cortocircuito admisible",fm(o.Ith,1),"kA",`${fm(p.tk,1)} s · se piden ${fm(p.Ik,1)} kA`,o.okTh?"hl":"bad")+
    kpi("Fuerza pico entre fases",fm(o.Fp,0),"N/m",`ip ${fm(o.ip,1)} kA · fases a ${fm(o.a,2)} m`)+
    (rig?kpi("Esfuerzo en el tubo",fm(o.sig,0),"MPa",`admisible ${fm(o.sigAdm,0)} MPa`,o.okTub?"hl":"bad"):kpi("Flecha del vano",fm(o.f,2),"m",`${fm(o.fPct,1)} % de ${fm(p.L,1)} m`,"hl")+kpi("Tensión de tendido",fm(o.pctRts,1),"% rotura",`${fm(p.T,0)} de ${fm(o.rts,0)} kgf`,o.okT?"":"bad"));
  $("tCon").innerHTML=`<tr><th class="l">Criterio</th><th>Calculado</th><th>Límite</th><th class="l">Estado</th></tr>
   <tr><td class="l">Capacidad de corriente (IEEE 738)</td><td>${fm(o.Icap,0)} A</td><td>≥ ${fm(p.Idis,0)} A</td><td class="l">${okp(o.okAmp)}</td></tr>
   <tr><td class="l">Efecto corona: gradiente en la superficie (Peek)</td><td>${fm(o.Emax,2)} kV/cm</td><td>≤ ${fm(o.E0,2)} kV/cm</td><td class="l">${okp(o.okCor)}</td></tr>
   <tr><td class="l">Cortocircuito térmico (IEC 60865-1)</td><td>${fm(o.Ith,1)} kA</td><td>≥ ${fm(p.Ik,1)} kA</td><td class="l">${okp(o.okTh)}</td></tr>`+
   (rig?`<tr><td class="l">Tubo: esfuerzo de flexión en cortocircuito</td><td>${fm(o.sig,0)} MPa</td><td>≤ ${fm(o.sigAdm,0)} MPa</td><td class="l">${okp(o.okTub)}</td></tr>`
       :`<tr><td class="l">Tensión de tendido</td><td>${fm(o.pctRts,1)} % de la rotura</td><td>≤ 25 %</td><td class="l">${okp(o.okT)}</td></tr>
   <tr><td class="l">Balanceo de los cables en cortocircuito</td><td>${fm(o.ang,0)}°</td><td class="l mut" colspan="2" style="white-space:normal">Informativo: el módulo de distancias ya suma el acercamiento K·√f a la separación entre fases.</td></tr>`)+
   (o.cat?`<tr><td class="l">Comprobación con el catálogo</td><td>${fm(SUBE.amp738({D:o.d/1000,R:o.r20*p.kac*(1+0.00403*55)/1000,Ta:25,Tc:75,V:0.61,phi:90,He:0,eps:0.5,alpha:0.5,Qs:1000}).I,0)} A</td><td>${fm(o.cat.amp,0)} A de catálogo</td><td class="l mut" style="white-space:normal">A 75 °C, ambiente 25 °C, viento 0,61 m/s, a nivel del mar.</td></tr>`:"");
  $("chCon").innerHTML=chartCon(g,p,rig);
  memo("memoCon",memoCon(o,g,p,rig));
  setSt("st-con",o.ok?"ok":"no");
}
function chartCon(g,p,rig){
  const Ts=[];for(let T=Math.max(40,Math.ceil((p.Ta+5)/5)*5);T<=100;T+=5)Ts.push(T);
  const pts=Ts.map(T=>({T,I:calcCon(g,{...p,Tc:T},{rig}).Icap})),W=520,H=240,pl=50,pr=14,pt=12,pb=36,maxY=Math.max(p.Idis,...pts.map(q=>q.I))*1.1||1,t0=Ts[0],t1=100;
  const X=t=>pl+(W-pl-pr)*(t-t0)/Math.max(1,t1-t0),Y=v=>pt+(H-pt-pb)*(1-v/maxY);let s="";
  const step=maxY>4000?1000:maxY>2000?500:maxY>800?250:100;
  for(let v=0;v<=maxY;v+=step)s+=`<line x1="${pl}" y1="${Y(v)}" x2="${W-pr}" y2="${Y(v)}" stroke="var(--line)"/><text x="${pl-6}" y="${Y(v)+4}" font-size="11" text-anchor="end" fill="var(--muted)">${v}</text>`;
  Ts.filter(t=>t%10===0).forEach(t=>s+=`<text x="${X(t)}" y="${H-pb+16}" font-size="11" text-anchor="middle" fill="var(--muted)">${t}</text>`);
  s+=`<text x="${(pl+W-pr)/2}" y="${H-4}" font-size="11" text-anchor="middle" fill="var(--muted)">Temperatura del conductor (°C) · corriente en A</text>`;
  s+=`<line x1="${pl}" y1="${Y(p.Idis)}" x2="${W-pr}" y2="${Y(p.Idis)}" stroke="var(--no)" stroke-width="1.5" stroke-dasharray="5 4"/><text x="${W-pr}" y="${Y(p.Idis)-5}" font-size="11" text-anchor="end" fill="var(--no)" font-weight="600">diseño ${fm(p.Idis,0)} A</text>`;
  s+=`<polyline points="${pts.map(q=>`${X(q.T)},${Y(q.I)}`).join(" ")}" fill="none" stroke="var(--chart1)" stroke-width="2.2"/>`+pts.map(q=>`<circle cx="${X(q.T)}" cy="${Y(q.I)}" r="${q.T===p.Tc?5:3}" fill="var(--chart1)"/>`).join("");
  if(p.Tc>=t0&&p.Tc<=t1)s+=`<line x1="${X(p.Tc)}" y1="${pt}" x2="${X(p.Tc)}" y2="${H-pb}" stroke="var(--ink)" stroke-opacity=".35" stroke-dasharray="2 3"/>`;
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Capacidad de corriente de la fase según la temperatura del conductor">${s}</svg>`;
}
function memoCon(o,g,p,rig){
  const st=[],add=(sec,t,q,eqs,norma)=>st.push({sec,t,q,eqs,norma}),A=o.amp,hz=o.n>1;
  add("Capacidad de corriente","Resistencia a la temperatura de operación",`${o.nombre}: ${fm(o.d,1)} mm de diámetro y ${fm(o.r20,4)} Ω/km a 20 °C. Al calentarse, el aluminio conduce peor; el factor ${fm(p.kac,2)} agrega el efecto de la corriente alterna.`,
    [`${Sb(I("R"),"Tc")} = ${Sb(I("R"),"20")}·${Sb(I("k"),"ca")}·[1 + 0,00403·(${Sb(I("T"),"c")} − 20)] = ${fm(o.r20,4)}·${fm(p.kac,2)}·[1 + 0,00403·(${fm(p.Tc,0)} − 20)] = ${R(fm(o.RTc*1000,4)+" Ω/km")}`],"IEEE 738 · catálogo del fabricante");
  add("Capacidad de corriente","Balance térmico del conductor",`El conductor se calienta por la corriente y por el sol, y se enfría por el viento y por radiación. La capacidad es la corriente que lo deja justo en ${fm(p.Tc,0)} °C con ${fm(p.Ta,0)} °C de ambiente, viento de ${fm(p.vv,2)} m/s y ${fm(g.alt,0)} msnm (a más altura el aire enfría menos).`,
    [`${Sb(I("q"),"c")} = ${R(fm(A.qc,1)+" W/m")} ${MU("convección: la mayor de viento bajo, viento alto y aire quieto")} ; ${Sb(I("q"),"r")} = ${R(fm(A.qr,1)+" W/m")} ; ${Sb(I("q"),"s")} = ${R(fm(A.qs,1)+" W/m")}`,
     `${I("I")} = ${Q(F(Sb(I("q"),"c")+" + "+Sb(I("q"),"r")+" − "+Sb(I("q"),"s"),Sb(I("R"),"Tc")))} = ${Q(F(fm(A.qc,1)+" + "+fm(A.qr,1)+" − "+fm(A.qs,1),fm(o.RTc*1e6,2)+"·10<sup>−6</sup>"))} = ${R(fm(A.I,0)+" A")}`,
     `${Sb(I("I"),"fase")} = ${o.n}·${fm(A.I,0)} = ${R(fm(o.Icap,0)+" A")} ${o.okAmp?AD("≥ "+fm(p.Idis,0)+" A"):BD("< "+fm(p.Idis,0)+" A")}`],"IEEE Std 738");
  add("Efecto corona","Gradiente en la superficie",`Si el campo eléctrico en la superficie del conductor supera el que el aire aguanta, el aire se ioniza: hay pérdidas, ruido e interferencia. ${hz?`Con ${o.n} subconductores separados ${fm(p.sep,0)} cm el haz se comporta como un conductor más grueso.`:""}`,
    [`δ = ${F("3,92·"+I("b"),"273 + "+I("t"))} = ${F("3,92·"+fm(o.b,1),"273 + "+fm(g.t,0))} = ${R(fm(o.delta,3))} ; ${Sb(I("E"),"0")} = 21,1·${I("m")}·δ = 21,1·${fm(p.m,2)}·${fm(o.delta,3)} = ${R(fm(o.E0,2)+" kV/cm")}`,
     (hz?`${Sb(I("r"),"eq")} = ${R(fm(o.req,2)+" cm")} ; `:"")+`${Sb(I("E"),"máx")} = ${F(Sb(I("U"),"m")+"/√3",(hz?I("n")+"·":"")+I("r")+"·ln("+I("a")+"/"+Sb(I("r"),hz?"eq":"")+")")}${hz?"·(1 + (n−1)·r/R)":""} = ${R(fm(o.Emax,2)+" kV/cm")} ${o.okCor?AD("≤ "+fm(o.E0,2)+" kV/cm: sin corona"):BD("> "+fm(o.E0,2)+" kV/cm: hay corona")}`,
     `${Sb(I("U"),"c")} = ${R(fm(o.Vc,0)+" kV")} ${MU("tensión fase–tierra a la que empezaría la corona; la de operación es "+fm(o.V,1)+" kV")}`],"Peek · fases a "+fm(o.a,2)+" m");
  add("Cortocircuito","Calentamiento durante la falla",`El aluminio puede pasar de ${fm(p.Tc,0)} °C a ${fm(p.te,0)} °C mientras dura la falla sin dañarse. Eso equivale a una densidad de corriente admisible durante 1 s.`,
    [`${Sb(I("S"),"thr")} = ${R(fm(o.Sthr,1)+" A/mm²")} ${MU("aluminio, 1 s")} ; ${Sb(I("I"),"th")} = ${F(I("n")+"·"+I("A")+"·"+Sb(I("S"),"thr"),Q(Sb(I("t"),"k")))} = ${F(o.n+"·"+fm(o.aAl,1)+"·"+fm(o.Sthr,1),Q(fm(p.tk,1)))} = ${R(fm(o.Ith,1)+" kA")} ${o.okTh?AD("≥ "+fm(p.Ik,1)+" kA"):BD("< "+fm(p.Ik,1)+" kA")}`],"IEC 60865-1");
  add("Cortocircuito","Fuerza entre fases",`Durante la falla las fases se atraen y se repelen con una fuerza que depende del pico de la corriente y de la separación entre fases. Es la carga con la que se diseñan aisladores, soportes y pórticos.`,
    [`${Sb(I("i"),"p")} = ${fm(p.kip,2)}·${fm(p.Ik,1)} = ${R(fm(o.ip,1)+" kA")} ; ${I("F")} = ${F(Sb("μ","0"),"2π")}·${F("√3","2")}·${F(Sb(I("i"),"p")+"²",I("a"))} = 2·10<sup>−7</sup>·0,866·${F("("+fm(o.ip,1)+"·10³)²",fm(o.a,2))} = ${R(fm(o.Fp,0)+" N/m")}`,
     `${Sb(I("F"),"vano")} = ${fm(o.Fp,0)}·${fm(p.L,1)} = ${R(fm(o.Fvano,1)+" kN")} ${MU("fuerza pico sobre un vano de "+fm(p.L,1)+" m")}`],"IEC 60865-1");
  if(rig)add("Barraje rígido","Esfuerzo en el tubo",`Tubo de ${fm(p.tubD,0)} × ${fm(p.tubT,1)} mm apoyado cada ${fm(p.tubL,1)} m. Se compara el esfuerzo de flexión con el límite elástico multiplicado por el factor de plasticidad q del tubo.`,
    [`${I("Z")} = ${F("π·("+I("D")+"⁴ − "+I("d")+"⁴)","32·"+I("D"))} = ${R(fm(o.Z/1000,1)+" cm³")} ; σ = β·${F(I("F")+"·"+I("l")+"²","8·"+I("Z"))} = ${R(fm(o.sig,0)+" MPa")}`,
     `${Sb("σ","adm")} = ${I("q")}·${Sb(I("R"),"p0,2")} = ${fm(o.q,2)}·${fm(p.tubRp,0)} = ${R(fm(o.sigAdm,0)+" MPa")} ${o.okTub?AD("cumple"):BD("no cumple")}`],"IEC 60865-1");
  else add("Tendido","Flecha del vano",`La flecha es lo que cuelga el cable en la mitad del vano. Con más tensión cuelga menos, pero el cable y los pórticos trabajan más; por eso la tensión no debe pasar del 25 % de la carga de rotura.`,
    [`${I("f")} = ${F(I("w")+"·"+I("L")+"²","8·"+I("T"))} = ${F(fm(o.w,3)+"·"+fm(p.L,1)+"²","8·"+fm(p.T,0))} = ${R(fm(o.f,3)+" m")} ${MU(fm(o.fPct,1)+" % del vano")}`,
     `${F(I("T"),"RTS")} = ${F(fm(p.T,0),fm(o.rts,0))} = ${R(fm(o.pctRts,1)+" %")} ${o.okT?AD("≤ 25 %"):BD("> 25 %")}`],"Parábola del vano");
  return st;
}

/* ============================================================
   Malla: supuestos y sensibilidad
   ============================================================ */
function renderMalExtra(o,p){
  const sfc=o.sf,calc=p.sfMode==="calc",row=(lab,ov)=>{const r=calcMal({...p,...ov});return `<tr><td class="l">${lab}</td><td>${fm(r.Em,0)} V <span class="mut">de ${fm(r.Etouch,0)}</span></td><td>${fm(r.Es,0)} V <span class="mut">de ${fm(r.Estep,0)}</span></td><td class="l">${okp(r.ok)}</td></tr>`};
  const grp=(t,why)=>`<tr class="grp"><td colspan="4">${t}<div style="font-family:var(--f-body);font-weight:400;font-size:13px;color:var(--muted);white-space:normal">${why}</div></td></tr>`;
  let h=`<p style="margin:0 0 10px;color:var(--muted);font-size:14px;max-width:80ch">Varios datos de la malla todavía no se han medido y se asumen. Esta tabla cambia un supuesto a la vez, deja lo demás igual y muestra si la malla seguiría cumpliendo. Así se ve cuáles supuestos hay que confirmar primero.</p>
   <div class="scroll"><table><tr><th class="l">Si el dato fuera…</th><th>Tensión de malla</th><th>Tensión de paso</th><th class="l">Resultado</th></tr>`;
  h+=row(`<b>Diseño actual</b>`,{});
  h+=grp(`Factor de reparto Sf = ${fm(o.SfUse,2)}${calc?" (calculado)":" (asumido)"}`,`Solo esa parte de la falla entra al suelo por la malla; el resto regresa por los cables de guarda de las líneas. ${sfc.N?`Con ${sfc.N} cables de guarda, vanos de ${fm(p.sfSpan,0)} m y ${fm(p.sfRt,0)} Ω de pie de torre, el cálculo da Sf = ${fm(sfc.Sf,2)}.`:"Sin cables de guarda toda la falla entra por la malla (Sf = 1)."}`);
  if(!calc&&sfc.N)h+=row(`Sf calculado: ${fm(sfc.Sf,2)}`,{Sf:sfc.Sf});
  if(sfc.N>1){const n2=Math.max(1,sfc.N-2),s2=SUBE.sfLadder({...p,sfN:n2},o.Rg).Sf;h+=row(`Solo ${n2} cable${n2>1?"s":""} de guarda: Sf = ${fm(s2,2)}`,{sfMode:"man",Sf:s2})}
  if(sfc.N){const s3=SUBE.sfLadder({...p,sfRt:2*p.sfRt},o.Rg).Sf;h+=row(`Pie de torre de ${fm(2*p.sfRt,0)} Ω: Sf = ${fm(s3,2)}`,{sfMode:"man",Sf:s3})}
  h+=row(`Sf = ${fm(Math.min(1,o.SfUse*2),2)} (el doble)`,{sfMode:"man",Sf:Math.min(1,o.SfUse*2)});
  h+=grp(`Tiempo de despeje = ${fm(p.tf,2)} s`,"Tiempo que tardan las protecciones en cortar la falla. Mientras más dura, menos tensión aguanta una persona.");
  if(Math.abs(p.tf-0.3)>1e-6)h+=row("Despeje en 0,3 s (protección principal)",{tf:0.3});
  if(Math.abs(p.tf-1)>1e-6)h+=row("Despeje en 1 s (respaldo lento)",{tf:1});
  h+=grp(`Capa de grava: ${fm(p.rhos,0)} Ω·m, ${fm(p.hs*100,0)} cm`,"La grava seca aumenta la resistencia de contacto de los pies y sube las tensiones tolerables. Mojada o sucia rinde menos.");
  if(p.rhos>3000)h+=row("Grava de 3000 Ω·m (mojada)",{rhos:3000});
  if(p.hs>0.1)h+=row("Capa de 10 cm",{hs:0.1});
  h+=grp(`Electrodos: ${fm(p.nR,0)} de ${fm(p.LR,1)} m`,"Las varillas largas alcanzan capas más profundas y reparten la corriente. Son lo que más baja la tensión de malla en suelos resistivos.");
  if(p.nR>0&&p.LR>2.4)h+=row(`Las mismas ${fm(p.nR,0)} varillas, pero de 2,4 m`,{LR:2.4});
  if(p.nR>0&&p.LR>6)h+=row(`Varillas de ${fm(p.LR/2,1)} m`,{LR:p.LR/2});
  h+=grp(`Resistividad del suelo = ${fm(p.rho,0)} Ω·m`,S.proy.base?"Dato del enunciado. Debe confirmarse con una medición de campo (método de Wenner).":"Debe salir de una medición de campo (método de Wenner).");
  h+=row(`ρ = ${fm(p.rho*1.25,0)} Ω·m (25 % más)`,{rho:p.rho*1.25})+row(`ρ = ${fm(p.rho*0.75,0)} Ω·m (25 % menos)`,{rho:p.rho*0.75});
  h+=grp(`Corriente de falla = ${fm(p.If,2)} kA`,"Falla monofásica en la barra. Crece si el sistema se refuerza.")+row(`Falla de ${fm(p.If*1.2,1)} kA (20 % más)`,{If:p.If*1.2});
  $("sensMal").innerHTML=h+"</table></div>";
}

/* ============================================================
   Apantallamiento
   ============================================================ */
function renderApa(){
  const g=S.g,p=S.apa;
  if(p.link){if(RA&&RA.BIL)p.BIL=RA.BIL;if(RD)p.hBus=RD.flex?RD.amarreA:RD.hbA;p.Lx=S.mal.Lx;p.Ly=S.mal.Ly}
  const o=RP=calcApa(g,p,{req:RC?RC.req:1.4});
  $("vApa").innerHTML=o.ok?verdict("ok","Las barras quedan protegidas",`Los cables de guarda a ${fm(p.hG,1)} m interceptan los rayos de ${fm(o.Is,1)} kA o más. Entre dos cables separados ${fm(p.X,1)} m la zona protegida llega hasta ${fm(o.hMid,2)} m de altura, y las barras están a ${fm(p.hBus,2)} m.`)
    :verdict("no","Las barras no quedan protegidas",o.dh<=0?"Los cables de guarda deben ir más altos que las barras.":`Con cables de guarda a ${fm(p.hG,1)} m y separados ${fm(p.X,1)} m, la zona protegida solo llega a ${Number.isFinite(o.hMid)?fm(o.hMid,2):"0"} m y las barras están a ${fm(p.hBus,2)} m. Suba los cables de guarda a ${Number.isFinite(o.hGmin)?fm(Math.ceil(o.hGmin*2)/2,1):"—"} m o acérquelos a ${fm(Math.floor(o.Xmax*2)/2,1)} m.`);
  $("kApa").innerHTML=kpi("Impedancia característica Zs",fm(o.Zs,0),"Ω",p.zsMode==="man"?"valor manual":`radio de corona ${fm(o.Rc*100,1)} cm`)+kpi("Corriente crítica del rayo",fm(o.Is,2),"kA",`BIL ${fm(p.BIL,0)} kV`,"hl")+kpi("Distancia de descarga S",fm(o.S,1),"m","radio de la esfera rodante","hl")+
    kpi("Altura protegida en el centro",Number.isFinite(o.hMid)?fm(o.hMid,2):"0","m",`barras a ${fm(p.hBus,2)} m`,o.okMid?"hl":"bad")+kpi("Separación máxima",fm(o.Xmax,1),"m",`hay ${fm(p.X,1)} m entre cables`,p.X<=o.Xmax?"":"bad")+
    kpi("Altura mínima de las guardas",Number.isFinite(o.hGmin)?fm(o.hGmin,2):"—","m",`están a ${fm(p.hG,1)} m`,p.hG>=o.hGmin?"":"bad")+kpi("Rayos esperados en el patio",fm(o.Nd,3),"por año",Number.isFinite(o.anios)?`uno cada ${fm(o.anios,0)} años`:"");
  $("svgApa").innerHTML=svgApa(o,p);
  $("tApa").innerHTML=`<tr><th class="l">Criterio</th><th>Calculado</th><th>Límite</th><th class="l">Estado</th></tr>
   <tr><td class="l">Altura de la zona protegida entre dos cables de guarda</td><td>${Number.isFinite(o.hMid)?fm(o.hMid,2):"0"} m</td><td>≥ ${fm(p.hBus,2)} m</td><td class="l">${okp(o.okMid)}</td></tr>
   <tr><td class="l">Separación entre cables de guarda</td><td>${fm(p.X,1)} m</td><td>≤ ${fm(o.Xmax,1)} m</td><td class="l">${okp(p.X<=o.Xmax)}</td></tr>
   <tr><td class="l">Altura de los cables de guarda</td><td>${fm(p.hG,1)} m</td><td>≥ ${Number.isFinite(o.hGmin)?fm(o.hGmin,2):"—"} m</td><td class="l">${okp(p.hG>=o.hGmin)}</td></tr>
   <tr><td class="l">Protección hacia afuera del último cable de guarda</td><td>${fm(o.dLat,2)} m</td><td class="l mut" colspan="2" style="white-space:normal">Informativo: una barra a ${fm(p.hBus,1)} m queda protegida si está a menos de esa distancia en planta, por fuera del cable.</td></tr>
`;
  memo("memoApa",memoApa(o,p));
  setSt("st-apa",o.ok?"ok":"no");
}
function svgApa(o,p){
  const Sd=o.S,hG=p.hG,h=p.hBus,X2=p.X/2,reach=y=>y>=Sd?Sd:Math.sqrt(Math.max(0,Sd*Sd-(Sd-y)*(Sd-y))),rg=reach(hG);
  const xmax=X2+rg+1.5,ytop=Math.max(hG,h)+3,W=760,pl=8,pt=10,pb=26,sc=Math.min((W-2*pl)/(2*xmax),30),vh=pt+ytop*sc+pb,cx=W/2;
  const PX=x=>Math.round((cx+x*sc)*10)/10,PY=y=>Math.round((pt+(ytop-y)*sc)*10)/10,N=36,z=[];
  for(let i=0;i<=N;i++){const y=hG*i/N;z.push([-X2-rg+reach(y),y])}
  if(X2<Sd){const yc=hG+Math.sqrt(Sd*Sd-X2*X2);for(let i=1;i<N;i++){const x=-X2+2*X2*i/N;z.push([x,yc-Math.sqrt(Sd*Sd-x*x)])}}
  else{for(let i=N;i>=0;i--){const y=hG*i/N;z.push([-X2+rg-reach(y),y])}for(let i=0;i<=N;i++){const y=hG*i/N;z.push([X2-rg+reach(y),y])}}
  for(let i=N;i>=0;i--){const y=hG*i/N;z.push([X2+rg-reach(y),y])}
  const T=(x,y,t,a="middle",c="var(--muted)",w="400")=>`<text x="${x}" y="${y}" font-size="12" text-anchor="${a}" fill="${c}" font-weight="${w}">${t}</text>`;
  let g=`<polygon points="${z.map(q=>PX(q[0])+","+PY(q[1])).join(" ")}" fill="var(--safe)" stroke="var(--link)" stroke-width="1.4" stroke-dasharray="6 4"/>`;
  g+=`<line x1="${pl}" y1="${PY(0)}" x2="${W-pl}" y2="${PY(0)}" stroke="var(--ink)" stroke-width="2"/>`;
  [-X2,X2].forEach(x=>{g+=`<line x1="${PX(x)}" y1="${PY(0)}" x2="${PX(x)}" y2="${PY(hG)}" stroke="var(--steel)" stroke-width="3"/><circle cx="${PX(x)}" cy="${PY(hG)}" r="5" fill="var(--ok)"/>`});
  const a=Math.min(RD?RD.SfA:2,X2*0.7);[-a,0,a].forEach(x=>g+=`<circle cx="${PX(x)}" cy="${PY(h)}" r="4.5" fill="var(--live)"/>`);
  g+=`<line x1="${PX(-X2)}" y1="${PY(h)}" x2="${PX(X2)}" y2="${PY(h)}" stroke="var(--live)" stroke-width="1" stroke-dasharray="2 4" opacity=".6"/>`;
  g+=T(PX(X2)+8,+PY(hG)-8,`cable de guarda · ${fm(hG,1)} m`,"start","var(--ok)","600")+T(PX(-a)-9,+PY(h)+4,`barras · ${fm(h,2)} m`,"end","var(--live)","600");
  if(Number.isFinite(o.hMid)&&o.hMid>0)g+=T(PX(0),PY(Math.min(h,o.hMid)/2)+4,"zona protegida","middle","var(--link)","600");
  g+=T(PX(-X2-rg/2),+PY(0)+17,`S = ${fm(Sd,1)} m`,"middle","var(--link)","600")+T(PX(0),+PY(0)+17,`${fm(p.X,1)} m entre cables de guarda`,"middle","var(--muted)");
  return `<svg viewBox="0 0 ${W} ${vh.toFixed(0)}" width="100%" style="min-width:520px" role="img" aria-label="Corte del patio con la zona protegida por los cables de guarda">${g}</svg>`;
}
function memoApa(o,p){
  const st=[],add=(sec,t,q,eqs,norma)=>st.push({sec,t,q,eqs,norma}),h2=fm(2*p.hBus,1);
  if(p.zsMode==="man")add("Rayo crítico","Impedancia característica",`Se usa el valor indicado de la impedancia característica de las barras.`,[`${Sb(I("Z"),"s")} = ${R(fm(o.Zs,0)+" Ω")}`],"Dato");
  else add("Rayo crítico","Impedancia característica de las barras",`Cuando un rayo cae en la barra, la tensión es tan alta que el aire alrededor se ioniza (corona) y el conductor se comporta como si fuera más grueso. Ese radio de corona se despeja por tanteo, con un gradiente de 1500 kV/m.${o.Rc<=o.r+1e-9?" Aquí el haz de conductores ya es más grueso que ese radio, así que se usa el radio equivalente del haz.":""}`,
    [`${Sb(I("R"),"c")}·ln${F("2"+I("h"),Sb(I("R"),"c"))} = ${F("BIL",Sb(I("E"),"0"))} = ${F(fm(p.BIL,0),"1500")} → ${Sb(I("R"),"c")} = ${R(fm(o.RcCor,3)+" m")}${o.Rc<=o.r+1e-9?MU("menor que el radio del haz, "+fm(o.r,3)+" m"):""}`,
     `${Sb(I("Z"),"s")} = 60·${Q("ln"+F("2"+I("h"),Sb(I("R"),"c"))+"·ln"+F("2"+I("h"),I("r")))} = 60·${Q("ln"+F(h2,fm(o.Rc,3))+"·ln"+F(h2,fm(o.r,4)))} = ${R(fm(o.Zs,0)+" Ω")}`],"IEEE 998 · barras a "+fm(p.hBus,2)+" m");
  add("Rayo crítico","Corriente crítica",`Es el rayo más pequeño que, si cayera directamente en las barras, superaría el BIL. Los rayos menores no dañan el aislamiento; los mayores deben caer en los cables de guarda.`,
    [`${Sb(I("I"),"s")} = ${F("2,2·BIL",Sb(I("Z"),"s"))} = ${F("2,2·"+fm(p.BIL,0),fm(o.Zs,0))} = ${R(fm(o.Is,2)+" kA")}`],"IEEE 998");
  add("Zona protegida","Distancia de descarga",`Es la distancia a la que el rayo «decide» dónde caer. Se imagina una esfera de ese radio rodando sobre los cables de guarda: todo lo que la esfera no toca está protegido.`,
    [`${I("S")} = 8·${I("k")}·${Sb(I("I"),"s")}<sup>0,65</sup> = 8·${fm(p.k,1)}·${fm(o.Is,2)}<sup>0,65</sup> = ${R(fm(o.S,1)+" m")}`],"IEEE 998 (modelo electrogeométrico)");
  add("Zona protegida","Altura protegida entre dos cables de guarda",`La esfera apoyada en dos cables de guarda separados ${fm(p.X,1)} m baja un poco en el centro. Las barras deben quedar por debajo de ese punto.`,
    [Number.isFinite(o.hMid)?`${Sb(I("h"),"prot")} = ${Sb(I("h"),"G")} − (${I("S")} − ${Q(I("S")+"² − ("+I("X")+"/2)²")}) = ${fm(p.hG,1)} − (${fm(o.S,1)} − ${Q(fm(o.S,1)+"² − "+fm(p.X/2,2)+"²")}) = ${R(fm(o.hMid,2)+" m")} ${o.okMid?AD("≥ "+fm(p.hBus,2)+" m"):BD("< "+fm(p.hBus,2)+" m")}`:`${I("X")}/2 ≥ ${I("S")}: la esfera toca el suelo entre los cables ${BD("no protege")}`,
     `${Sb(I("X"),"máx")} = 2·${Q(I("S")+"² − ("+I("S")+" − Δ"+I("h")+")²")} = ${R(fm(o.Xmax,1)+" m")} ${MU("separación máxima con Δh = "+fm(o.dh,2)+" m")}`],"Geometría de la esfera rodante");
  add("Exposición","Rayos esperados en el patio",`Con la densidad de descargas del sitio y el área del patio se estima cada cuánto cae un rayo dentro de la subestación.`,
    [`${Sb(I("N"),"d")} = DDT·${I("A")} = ${fm(p.ddt,1)}·${F(fm(o.area,0),"10<sup>6</sup>")} = ${R(fm(o.Nd,3)+" rayos/año")} ${MU(Number.isFinite(o.anios)?"uno cada "+fm(o.anios,0)+" años":"")}`],"NTC 4552 · IEEE 998");
  return st;
}

/* ============================================================
   Configuraciones
   ============================================================ */
const CFGX={
  bs:{c:1,f:1,k:1,barra:"Sale toda la subestación.",intr:"Sale el circuito de ese interruptor.",uso:"Subestaciones pequeñas o de poca importancia. Es la más barata y la más simple de operar."},
  bpt:{c:2,f:2,k:2,barra:"Sale toda la subestación: solo hay una barra principal.",intr:"El circuito sigue en servicio por la barra de transferencia.",uso:"Distribución y 115 kV. Permite mantener cualquier interruptor sin cortar el circuito."},
  db:{c:3,f:3,k:3,barra:"Los circuitos de esa barra se pasan a la otra.",intr:"Sale el circuito de ese interruptor.",uso:"115 y 230 kV con varias fuentes. Permite repartir los circuitos entre dos barras."},
  dbt:{c:4,f:4,k:4,barra:"Los circuitos de esa barra se pasan a la otra.",intr:"El circuito sigue en servicio por la barra de transferencia.",uso:"Subestaciones importantes de 115 y 230 kV: une las ventajas de la doble barra y de la transferencia."},
  an:{c:4,f:3,k:2,barra:"No tiene barras: una falla solo saca un tramo del anillo.",intr:"Ningún circuito sale; el anillo queda abierto.",uso:"Hasta unos seis circuitos. Económica y confiable, pero difícil de ampliar."},
  iym:{c:5,f:5,k:4,barra:"Ningún circuito sale.",intr:"Ningún circuito sale.",uso:"230 y 500 kV del sistema de transmisión. Tres interruptores por cada dos circuitos."},
  di:{c:5,f:5,k:5,barra:"Ningún circuito sale.",intr:"Ningún circuito sale.",uso:"Nodos críticos y grandes centrales. Es la más confiable y la más costosa."}
};
const dots=n=>`<span class="dots" aria-label="${n} de 5">${"●".repeat(n)}${"○".repeat(5-n)}</span>`;
function cfgSVG(k){
  const INK="var(--ink)",NV="var(--navy)";let g="";
  const ln=(x1,y1,x2,y2,w=1.6,c=INK)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
  const bus=(y,x0,x1,t)=>ln(x0,y,x1,y,4.5,NV)+`<text x="${x0-4}" y="${y+4}" font-size="10.5" text-anchor="end" fill="var(--muted)" font-weight="600">${t}</text>`;
  const dot=(x,y)=>`<circle cx="${x}" cy="${y}" r="2.6" fill="${INK}"/>`;
  const cb=(x,y)=>`<rect x="${x-5}" y="${y-5}" width="10" height="10" fill="var(--surface)" stroke="${INK}" stroke-width="1.6"/>`;
  const sv=(x,y)=>`<rect x="${x-3}" y="${y-5}" width="6" height="10" fill="var(--surface)"/>`+ln(x,y+5,x+5,y-4);       /* seccionador en tramo vertical */
  const sh=(x,y)=>`<rect x="${x-5}" y="${y-3}" width="10" height="6" fill="var(--surface)"/>`+ln(x-5,y,x+4,y-5);       /* seccionador en tramo horizontal */
  const arr=(x,y,d)=>d==="d"?`<path d="M${x-4} ${y-6}L${x} ${y}L${x+4} ${y-6}" fill="none" stroke="${INK}" stroke-width="1.6"/>`:d==="u"?`<path d="M${x-4} ${y+6}L${x} ${y}L${x+4} ${y+6}" fill="none" stroke="${INK}" stroke-width="1.6"/>`:`<path d="M${x-6} ${y-4}L${x} ${y}L${x-6} ${y+4}" fill="none" stroke="${INK}" stroke-width="1.6"/>`;
  const run=(x,y0,y1,it)=>ln(x,y0,x,y1)+it.map(([t,y])=>t==="i"?cb(x,y):sv(x,y)).join("");
  const xs=[52,108,164,220];
  if(k==="bs"){g+=bus(34,30,270,"B");xs.forEach(x=>g+=run(x,34,160,[["s",62],["i",92],["s",122]])+dot(x,34)+arr(x,166,"d"))}
  else if(k==="bpt"){const X=[46,96,146,196];g+=bus(26,30,278,"BP")+bus(146,30,278,"BT");
    X.forEach(x=>g+=run(x,26,180,[["s",48],["i",72],["s",96]])+dot(x,26)+dot(x,114)+ln(x,114,x+16,114)+run(x+16,114,146,[["s",130]])+dot(x+16,146)+arr(x,186,"d"));
    g+=run(254,26,146,[["s",54],["i",86],["s",118]])+dot(254,26)+dot(254,146)}
  else if(k==="db"){const X=[48,100,152,204];g+=bus(24,30,278,"B1")+bus(44,30,278,"B2");
    X.forEach(x=>g+=run(x-9,24,74,[["s",60]])+run(x+9,44,74,[["s",60]])+dot(x-9,24)+dot(x+9,44)+ln(x-9,74,x+9,74)+run(x,74,160,[["i",98],["s",128]])+arr(x,166,"d"));
    g+=run(247,24,82,[["s",62]])+run(267,44,82,[["s",62]])+dot(247,24)+dot(267,44)+ln(247,82,267,82)+cb(257,82)}
  else if(k==="dbt"){const X=[44,92,140,188];g+=bus(20,30,278,"B1")+bus(38,30,278,"B2")+bus(152,30,278,"BT");
    X.forEach(x=>g+=run(x-8,20,64,[["s",52]])+run(x+8,38,64,[["s",52]])+dot(x-8,20)+dot(x+8,38)+ln(x-8,64,x+8,64)+run(x,64,182,[["i",82],["s",104]])+dot(x,120)+ln(x,120,x+15,120)+run(x+15,120,152,[["s",136]])+dot(x+15,152)+arr(x,188,"d"));
    g+=run(226,20,72,[["s",54]])+run(242,38,72,[["s",54]])+dot(226,20)+dot(242,38)+ln(226,72,242,72)+cb(234,72);
    g+=run(266,20,152,[["s",60],["i",92],["s",124]])+dot(266,20)+dot(266,152)}
  else if(k==="an"){const x0=80,x1=220,y0=48,y1=142,xm=150,ym=95;
    g+=ln(x0,y0,x1,y0)+ln(x1,y0,x1,y1)+ln(x1,y1,x0,y1)+ln(x0,y1,x0,y0);
    g+=sh(xm-30,y0)+cb(xm,y0)+sh(xm+30,y0)+sh(xm-30,y1)+cb(xm,y1)+sh(xm+30,y1)+sv(x0,ym-24)+cb(x0,ym)+sv(x0,ym+24)+sv(x1,ym-24)+cb(x1,ym)+sv(x1,ym+24);
    [[x0,y0,-1],[x1,y0,-1],[x0,y1,1],[x1,y1,1]].forEach(([x,y,d])=>g+=dot(x,y)+run(x,y,y+d*34,[["s",y+d*17]])+arr(x,y+d*40,d>0?"d":"u"))}
  else if(k==="iym"){g+=bus(18,40,270,"B1")+bus(182,40,270,"B2");
    [96,196].forEach(x=>{g+=run(x,18,182,[["s",34],["i",48],["s",62],["s",88],["i",102],["s",116],["s",142],["i",156],["s",170]])+dot(x,18)+dot(x,182);
      [75,129].forEach(y=>g+=dot(x,y)+ln(x,y,x+42,y)+sh(x+20,y)+arr(x+48,y,"r"))})}
  else if(k==="di"){const X=[48,104,160,216];g+=bus(20,30,278,"B1")+bus(180,30,278,"B2");
    X.forEach(x=>g+=run(x,20,180,[["s",40],["i",58],["s",76],["s",124],["i",142],["s",160]])+dot(x,20)+dot(x,180)+dot(x,100)+ln(x,100,x+30,100)+sh(x+14,100)+arr(x+36,100,"r"))}
  return `<svg viewBox="0 0 300 200" width="100%" role="img" aria-label="Esquema unifilar de ${CFG[k].n}">${g}</svg>`;
}
function renderCfg(){
  const p=S.proy,n=nCirc()+nRes(),cur=CFG[p.cfg]?p.cfg:"dbt";
  $("cfgN").textContent=`para ${n} circuitos (${nCirc()} equipados${nRes()?` y ${nRes()} de reserva`:""})`;
  $("vCfg").innerHTML=`<div class="note"><b>Configuración del proyecto: ${CFG[cur].n}.</b> ${CFG[cur].int(n)} interruptores y ${CFG[cur].sec(n)} seccionadores con los ${n} circuitos equipados. ${CFGX[cur].uso}${p.base?` El enunciado del caso base pide «barraje doble principal y transferencia»; aquí se toma como dos barras principales (BP1 y BP2) más una de transferencia (BT), igual que en la Entrega 1.`:""}${CFG[cur].sim?"":" El simulador 3D todavía no dibuja esta configuración y sigue mostrando la última compatible."}</div>`;
  $("tCfg").innerHTML=`<tr><th class="l">Configuración</th><th>Interruptores</th><th>Seccionadores</th><th>Confiabilidad</th><th>Flexibilidad</th><th>Costo</th><th class="l">Si falla una barra</th><th class="l">Si se saca un interruptor a mantenimiento</th></tr>`+
    Object.entries(CFG).map(([k,c])=>`<tr class="${k===cur?"sel":""}"><td class="l"><b>${c.n}</b>${k===cur?" "+pill("ok","Proyecto"):""}</td><td>${c.int(n)}</td><td>${c.sec(n)}</td><td>${dots(CFGX[k].c)}</td><td>${dots(CFGX[k].f)}</td><td>${dots(CFGX[k].k)}</td><td class="l" style="min-width:190px">${CFGX[k].barra}</td><td class="l" style="min-width:190px">${CFGX[k].intr}</td></tr>`).join("");
  $("cfgCards").innerHTML=Object.entries(CFG).map(([k,c])=>`<div class="card cfgc ${k===cur?"on":""}"><h3>${c.n}</h3>${cfgSVG(k)}<p>${CFGX[k].uso}</p><div class="cfgf"><span class="mut">${c.sim?"Disponible en el simulador":"Solo comparación"}</span>${k===cur?pill("ok","Configuración del proyecto"):`<button class="btn" type="button" data-cfg="${k}">Usar en el proyecto</button>`}</div></div>`).join("");
}
$("cfgCards").addEventListener("click",e=>{const b=e.target.closest("[data-cfg]");if(!b)return;S.proy.cfg=b.dataset.cfg;save();buildForms();renderAll();toast(`Configuración del proyecto: ${CFG[S.proy.cfg].n}.`)});

/* ============================================================
   Validación y catálogos (se calculan una vez)
   ============================================================ */
function renderVal(){
  const V=SUBE.validar(),all=V.flatMap(c=>c.items),bad=all.filter(i=>!i.ok).length;
  $("vVal").innerHTML=bad?verdict("no",`${bad} de ${all.length} comprobaciones no coinciden`,"Revise la tabla: algún cálculo cambió respecto al valor publicado.")
    :verdict("ok",`Las ${all.length} comprobaciones coinciden con los valores publicados`,`${V.length} ejemplos resueltos con el mismo motor de cálculo del proyecto. Mayor diferencia: ${fm(Math.max(...all.map(i=>Math.abs(i.err))),2)} %.`);
  $("tVal").innerHTML=`<tr><th class="l">Valor</th><th>Publicado</th><th>Calculado aquí</th><th>Diferencia</th><th class="l">Estado</th></tr>`+
    V.map(c=>`<tr class="grp"><td colspan="5" style="white-space:normal">${c.mod}<div style="font-family:var(--f-body);font-weight:400;font-size:13px;color:var(--muted)">${c.caso}</div></td></tr>`+
      c.items.map(i=>`<tr><td class="l">${i.n}</td><td>${fm(i.pub,i.d)} ${i.u}</td><td><b>${fm(i.calc,i.d)}</b> ${i.u}</td><td>${fm(i.err,2)} %</td><td class="l">${okp(i.ok,"Coincide","Difiere")}</td></tr>`).join("")).join("");
  setSt("st-val",bad?"no":"ok");
}
function renderCat(){
  const nR=CAT.DPS.reduce((s,d)=>s+d.rows.length,0),marcas=[...new Set(CAT.DPS.map(d=>d.marca))];
  $("catList").innerHTML=`<li><b>${CAT.DPS.length} series de pararrayos</b> (${nR} tensiones asignadas) de ${marcas.join(", ")}; <b>${CAT.AIS.length} aisladores</b> y <b>${CAT.COND.length} conductores ACSR</b>.</li>`+
    CAT.FUENTES.map(([t,d,u])=>`<li><b>${esc(t)}</b>: ${esc(d)}${u?` <a href="${esc(u)}" target="_blank" rel="noopener">Abrir fuente</a>`:""}</li>`).join("");
}

/* ============================================================
   Resumen
   ============================================================ */
const RES=[
  ["Aislamiento","BIL","kV",()=>RA.BIL,0,550],["Aislamiento","Distancia máx. pararrayos–equipo","m",()=>RA.sel&&RA.sel.dmax,1,28.6],["Aislamiento","Factor de altitud Ka","",()=>RA.Ka,3,1.103],["Aislamiento","Fuga mínima","mm",()=>RA.Lreq,0,3383],
  ["Conductores","Capacidad de la fase","A",()=>RC.Icap,0],["Conductores","Gradiente en la superficie","kV/cm",()=>RC.Emax,2],["Conductores","Cortocircuito admisible","kA",()=>RC.Ith,1],
  ["Distancias","Fase–tierra","m",()=>RD.dftA,2,1.10],["Distancias","Fase–fase","m",()=>RD.dffA,2,1.30],["Distancias","Valor básico","m",()=>RD.VBa,2,1.21],["Distancias","Circulación de personal","m",()=>RD.DvA,2,3.50],["Distancias","Trabajo horizontal","m",()=>RD.DhA,2,3.00],["Distancias","Trabajo vertical","m",()=>RD.DtvA,2,2.50],["Distancias","Vehículos","m",()=>RD.HvehA,2,6.00],["Distancias","Flecha","m",()=>RD.f_m,2,0.66],["Distancias","Separación entre fases","m",()=>RD.SfA,2,2.11],["Distancias","Altura de equipos","m",()=>RD.heqA,2,3.60],["Distancias","Amarre de barras","m",()=>RD.amarreA,2,7.50],["Distancias","Remate de líneas","m",()=>RD.hremA,2,6.00],
  ["Malla de tierra","Tensión de malla","V",()=>RM.Em,0],["Malla de tierra","Tensión de paso","V",()=>RM.Es,0],["Malla de tierra","Resistencia","Ω",()=>RM.Rg,2],
  ["Apantallamiento","Corriente crítica del rayo","kA",()=>RP.Is,2],["Apantallamiento","Distancia de descarga","m",()=>RP.S,1]];
const ENT={"Aislamiento":"Entrega 1 · Grupo 1","Distancias":"Entrega 2 · Grupo 2"};
function renderResumen(){
  const a=RA,d=RD,m=RM,c=RC,ap=RP,p=S.proy,base=!!p.base,cf=cfgOf(),n=nCirc(),dNo=d.checks.some(x=>!x.ok&&x.lvl==="no"),dWa=d.checks.some(x=>!x.ok&&x.lvl==="wa");
  const card=(tab,k,title,big,unit,t,stc,stt)=>`<button class="fstep" type="button" data-go="${tab}"><span class="top"><span class="k">${k}</span><span class="pill ${stc}">${stt}</span></span><h4>${title}</h4><span class="big">${big}<small> ${unit}</small></span><p>${t}</p><span class="go">Ver cálculo →</span></button>`;
  $("flow").innerHTML=
    card("aislamiento","1 · Aislamiento","Nivel de aislamiento",a.BIL??"—","kV BIL",`Pararrayos Ur ${fm(a.ur,0)} kV protege hasta ${a.sel?fm(a.sel.dmax,1):"—"} m. Fuga exigida ${fm(a.Lreq,0)} mm.`,!a.sel?"no":a.ok?"ok":"wa",!a.sel?"No cumple":a.ok?"Cumple":"Revisar cadena")+
    card("conductores","2 · Conductores","Capacidad de las barras",fm(c.Icap,0),"A",`${c.n>1?c.n+" × ":""}${c.nombre.replace(/ · \d+\/\d+$/,"").replace("ACSR ","")} por fase. Gradiente ${fm(c.Emax,1)} de ${fm(c.E0,1)} kV/cm. Aguanta ${fm(c.Ith,0)} kA.`,c.ok?"ok":"no",c.ok?"Cumple":"No cumple")+
    card("distancias","3 · Distancias","Separación entre fases",fm(d.SfA),"m",`Fase–tierra ${fm(d.dftA)} m · equipos a ${fm(d.heqA)} m · barras ${d.flex?"amarradas":"montadas"} a ${fm(d.flex?d.amarreA:d.hbA)} m.`,dNo?"no":dWa?"wa":"ok",dNo?"No cumple":dWa?"Revisar":"Cumple")+
    card("malla","4 · Malla de tierra","Tensión de toque",fm(m.Em,0),"V",`Tolerable ${fm(m.Etouch,0)} V · Rg ${fm(m.Rg,2)} Ω · entra al suelo el ${fm(100*m.SfUse,0)} % de ${fm(S.mal.If,1)} kA.`,m.ok?"ok":"no",m.ok?"Cumple":"No cumple")+
    card("apantallamiento","5 · Apantallamiento","Distancia de descarga",fm(ap.S,1),"m",`Rayo crítico ${fm(ap.Is,1)} kA. Cables de guarda a ${fm(S.apa.hG,1)} m protegen hasta ${Number.isFinite(ap.hMid)?fm(ap.hMid,1):"0"} m en el centro.`,ap.ok?"ok":"no",ap.ok?"Cumple":"No cumple")+
    card("configuraciones","6 · Configuración",cf.n,n+cf.extra,"campos",`${cf.int(n)} interruptores y ${cf.sec(n)} seccionadores equipados. Maniobras, enclavamientos y patio 3D en el simulador.`,"ok","Ver");
  $("cmpTitle").innerHTML=base?"Resultados y comparación con las entregas <small>caso base S/E Termales</small>":"Resultados principales";
  $("tCmp").innerHTML=`<tr><th class="l">Valor</th><th>Herramienta</th>${base?"<th>Entrega</th><th></th>":""}</tr>`+
    RES.map((r,i)=>{const v=r[3](),has=base&&r[5]!=null,same=has&&v!=null&&Math.abs(v-r[5])<=0.5*Math.pow(10,-r[4])+1e-9;
      const head=i===0||RES[i-1][0]!==r[0]?`<tr class="grp"><td colspan="${base?4:2}">${r[0]}${base?` · ${ENT[r[0]]||"sin entrega todavía"}`:""}</td></tr>`:"";
      return head+`<tr><td class="l">${r[1]}</td><td><b>${v==null||!Number.isFinite(+v)?"—":fm(v,r[4])}</b> ${r[2]}</td>${base?`<td>${has?fm(r[5],r[4])+" "+r[2]:"—"}</td><td>${has?(same?pill("ok","✔"):pill("wa","Difiere")):""}</td>`:""}</tr>`}).join("");
  $("cmpNote").textContent=base?"«Entrega» son los valores oficiales de los grupos 1 y 2. Si cambia un dato y deja de coincidir, aparece «Difiere».":"Cada valor se explica paso a paso en la memoria de cálculo de su módulo.";
  const al=[];
  if(!a.sel)al.push(["no","Aislamiento: ningún BIL normalizado cumple con ese pararrayos y esa distancia."]);
  else if(a.ok)al.push(["ok",`Aislamiento: BIL ${a.BIL} kV con ${esc(a.dpsN)}. Cadena ${esc(a.A.n)}: ${fm(a.fugaTot,0)} mm de fuga frente a ${fm(a.Lreq,0)} mm exigidos.`]);
  else if(!a.okFuga)al.push(["wa",`Aislamiento: el ${esc(a.A.n)} tiene ${fm(a.fugaTot,0)} mm de fuga y se exigen ${fm(a.Lreq,0)} mm (kd ${fm(S.ais.kd,1)}). Elija un aislador con más fuga.`]);
  else al.push(["wa","Aislamiento: revise el pararrayos o el aislador en el módulo."]);
  al.push(c.ok?["ok",`Conductores: ${fm(c.Icap,0)} A por fase frente a ${fm(S.con.Idis,0)} A de diseño, sin corona y con ${fm(c.Ith,0)} kA admisibles en cortocircuito.`]:["no","Conductores: el conductor de las barras no cumple alguno de los criterios (corriente, corona o cortocircuito)."]);
  d.checks.filter(x=>!x.ok&&x.lvl!=="info").forEach(x=>al.push([x.lvl==="no"?"no":"wa",`Distancias: ${x.txt.toLowerCase()} (${x.cmp}).`]));
  if(!m.ok)al.push(["no","Malla de tierra: el diseño todavía no cumple con los datos actuales."]);
  else al.push(["wa",`Malla de tierra: cumple toque (${fm(m.Em,0)} V ≤ ${fm(m.Etouch,0)} V) y paso. Depende de supuestos por confirmar: Sf ${fm(m.SfUse,2)}${m.sf.N?` (calculado: ${fm(m.sf.Sf,2)})`:""}, grava, electrodos y resistividad medida. Vea la tabla de sensibilidad del módulo.`]);
  al.push(ap.ok?["ok",`Apantallamiento: cables de guarda a ${fm(S.apa.hG,1)} m cubren las barras a ${fm(S.apa.hBus,2)} m (esfera de ${fm(ap.S,1)} m).`]:["no","Apantallamiento: las barras no quedan dentro de la zona protegida."]);
  const icc=Math.max(+p.icc3||0,S.mal.If),okI=icc<=S.con.Ik;
  al.push([okI?"ok":"no",`Cortocircuito en barras: 3F ${fm(+p.icc3,2)} kA y 1F ${fm(S.mal.If,2)} kA frente a ${fm(S.con.Ik,1)} kA de los equipos${base&&okI?" (ETAP: pico de 79,6 kA frente a 82 kA; cumple con poco margen en el pico)":""}.`]);
  if(base)al.push(["wa","Configuración: «barraje doble principal y transferencia» se modela como doble barra + transferencia (BP1, BP2 y BT), como en la Entrega 1. Si el profesor indica otra lectura, se cambia en «Datos del proyecto»."]);
  if(base)al.push(["wa","Apantallamiento: la densidad de descargas (2 rayos/km²·año) y la altura de los cables de guarda son provisionales hasta que el Grupo 4 entregue su diseño."]);
  $("alerts").innerHTML=al.map(([k,t])=>`<div class="note ${k==="ok"?"":"wa"}"><span class="pill ${k}">${k==="ok"?"OK":k==="wa"?"Revisar":"Pendiente"}</span> ${t}</div>`).join("");
}
