/* ===================== FOUNDER EXTENDED-INFO MODAL =====================
   Shared by index.html and about.html — the single source of truth for the
   founders' bios. Pages provide the #fmodal markup and cards carrying
   data-f="0|1"; this file fills and drives the modal. */
(function(){
  "use strict";
  var RM=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGSAP=typeof window.gsap!=="undefined";
  var $=function(s){return document.querySelector(s);};
  var F=[
    { img:"assets/img/coach1.webp", name:"Vlado Šćepanović",
      role_me:"Osnivač · Bivši reprezentativac", role_en:"Founder · Former international",
      sub_me:"Bek šuter · 1,97 m · 1975, Kolašin", sub_en:"Shooting guard · 1.97 m · b. 1975, Kolašin",
      meta_me:["Budućnost Podgorica","Partizan · Panathinaikos","Reprezentacija SRJ / Crne Gore"],
      meta_en:["Budućnost Podgorica","Partizan · Panathinaikos","FR Yugoslavia / Montenegro NT"],
      h_me:["Zlato na Svjetskom prvenstvu 1998. (Atina) sa SR Jugoslavijom","Zlato na Evrobasketu 2001. i bronza 1999.","Olimpijac 2000. i 2004.","Prvi kapiten reprezentacije Crne Gore (2006)","Dva prvenstva i dva kupa Jugoslavije sa Budućnošću","Kao trener vodio Budućnost (2016) i Partizan (2020/21)"],
      h_en:["Gold at the 1998 FIBA World Championship in Athens with FR Yugoslavia","Gold at EuroBasket 2001 and bronze in 1999","Olympian in 2000 and 2004","First-ever captain of the Montenegro national team (2006)","Two Yugoslav championships and two cups with Budućnost","As a coach led Budućnost (2016) and Partizan (2020/21)"],
      b_me:"Vlado Šćepanović jedan je od osnivača kampa i jedno od najvećih imena crnogorske košarke. Kao reprezentativac SR Jugoslavije osvojio je zlato na Svjetskom prvenstvu 1998. i na Evropskom prvenstvu 2001, a karijeru je gradio u Budućnosti, Partizanu, grčkom Panathinaikosu i PAOK-u te u španskim klubovima. Bio je i prvi kapiten reprezentacije Crne Gore od njenog osnivanja 2006. godine. Nakon igračke karijere posvetio se trenerskom poslu, vodeći Budućnost i Partizan.",
      b_en:"Vlado Šćepanović is a co-founder of the camp and one of the biggest names in Montenegrin basketball. Playing for FR Yugoslavia he won gold at the 1998 FIBA World Championship and at EuroBasket 2001, building his career at Budućnost, Partizan, Greece's Panathinaikos and PAOK, and clubs in Spain. He was also the first-ever captain of the Montenegro national team after its founding in 2006. Following his playing days he turned to coaching, leading Budućnost and Partizan." },
    { img:"assets/img/coach2.webp", name:"Savo Đikanović",
      role_me:"Osnivač · Direktor", role_en:"Founder · Director",
      sub_me:"Centar · 211 cm · 28.02.1975, Podgorica", sub_en:"Center · 211 cm · b. 28 Feb 1975, Podgorica",
      meta_me:["Škola Budućnosti","Evroliga · Olympiacos","Karijera u 6 zemalja"],
      meta_en:["Budućnost academy","EuroLeague · Olympiacos","A career in 6 countries"],
      h_me:["Prvak ABA (Jadranske) lige 2004/05 sa Hemofarmom","Kup SR Jugoslavije 1996. sa Budućnošću","Prvak Kipra 2011/12 sa ETHA Engomisom","Igrao Evroligu za Olympiacos i stigao do finala grčkog prvenstva","Najbolji skakač Prve lige SR Jugoslavije 2001/02","Suosnivač i organizator Basket kampa Kolašin"],
      h_en:["ABA (Adriatic) League champion 2004/05 with Hemofarm","FR Yugoslavia Cup winner 1996 with Budućnost","Cypriot League champion 2011/12 with ETHA Engomis","Played EuroLeague for Olympiacos and reached the Greek League final","Top rebounder of the FR Yugoslavia First League 2001/02","Co-founder and organizer of Basket Camp Kolašin"],
      b_me:"Savo Đikanović (1975, Podgorica) centar je visok 211 cm i dijete škole košarke podgoričke Budućnosti, sa kojom je 1996. osvojio Kup SR Jugoslavije. Karijeru je gradio širom Evrope — u dresu Olympiacosa igrao je Evroligu i stigao do finala grčkog prvenstva, sa Hemofarmom je osvojio ABA (Jadransku) ligu 2005, a sa ETHA Engomisom titulu prvaka Kipra 2012. Danas to iskustvo prenosi mladima kao jedan od osnivača i organizatora Basket kampa Kolašin.",
      b_en:"Savo Đikanović (b. 1975, Podgorica) is a 211 cm (6'11\") center and a product of Budućnost Podgorica's famed youth school, winning the FR Yugoslavia Cup with the club in 1996. He built his career across Europe — playing EuroLeague for Olympiacos and reaching the Greek League final, winning the ABA (Adriatic) League with Hemofarm in 2005 and the Cypriot title with ETHA Engomis in 2012. Today he passes that experience on to the next generation as a co-founder and organizer of Basket Camp Kolašin." }
  ];
  function lang(){ return document.documentElement.getAttribute("data-lang")==="en"?"en":"me"; }
  var open=-1;
  function fill(i){
    var p=F[i]; if(!p) return; var en=lang()==="en";
    $("#fmImg").src=p.img; $("#fmImg").alt=p.name;
    $("#fmNo").textContent=("0"+(i+1)).slice(-2);
    $("#fmRole").textContent=en?p.role_en:p.role_me;
    $("#fmName").textContent=p.name;
    $("#fmSub").textContent=en?p.sub_en:p.sub_me;
    $("#fmMeta").innerHTML=(en?p.meta_en:p.meta_me).map(function(m){return "<span>"+m+"</span>";}).join("");
    $("#fmHl").innerHTML=(en?p.h_en:p.h_me).map(function(h){return "<li>"+h+"</li>";}).join("");
    $("#fmBio").textContent=en?p.b_en:p.b_me;
    $("#fmCount").textContent=("0"+(i+1)).slice(-2)+" / "+("0"+F.length).slice(-2);
  }
  function show(i){
    var m=$("#fmodal"); if(!m) return; open=i; fill(i);
    m.classList.add("open"); m.setAttribute("aria-hidden","false");
    document.body.classList.add("lock"); if(window.lenis) window.lenis.stop();
    if(hasGSAP&&!RM){
      gsap.killTweensOf(["#fmVeil","#fmPanel"]);
      gsap.fromTo("#fmVeil",{opacity:0},{opacity:1,duration:.4,ease:"power2.out"});
      gsap.fromTo("#fmPanel",{opacity:0,y:30,scale:.96},{opacity:1,y:0,scale:1,duration:.65,ease:"power3.out"});
      gsap.fromTo("#fmodal .fmodal__body > *",{opacity:0,y:18},{opacity:1,y:0,duration:.6,ease:"power3.out",stagger:.05,delay:.12});
    } else { $("#fmVeil").style.opacity=1; }
    setTimeout(function(){ m.classList.add("show"); },30);
  }
  function close(){
    var m=$("#fmodal"); if(!m||open<0) return;
    var done=function(){ m.classList.remove("open","show"); m.setAttribute("aria-hidden","true"); open=-1; document.body.classList.remove("lock"); if(window.lenis) window.lenis.start(); };
    if(hasGSAP&&!RM){ gsap.to("#fmPanel",{opacity:0,y:24,scale:.97,duration:.35,ease:"power2.in"}); gsap.to("#fmVeil",{opacity:0,duration:.4,ease:"power2.in",onComplete:done}); }
    else done();
  }
  function step(d){ if(open<0) return; var i=(open+d+F.length)%F.length; open=i; fill(i);
    if(hasGSAP&&!RM){ gsap.fromTo("#fmPanel",{x:d*32,opacity:.5},{x:0,opacity:1,duration:.45,ease:"power3.out"}); gsap.fromTo("#fmodal .fmodal__body > *",{opacity:0,y:12},{opacity:1,y:0,duration:.5,ease:"power3.out",stagger:.03}); } }
  document.addEventListener("DOMContentLoaded",function(){
    Array.prototype.forEach.call(document.querySelectorAll(".cc[data-f],.fc[data-f]"),function(card){
      var i=parseInt(card.getAttribute("data-f"),10);
      card.addEventListener("click",function(){ show(i); });
      card.addEventListener("keydown",function(e){ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); show(i); } });
    });
    var x=$("#fmX"); if(x) x.addEventListener("click",close);
    var v=$("#fmVeil"); if(v) v.addEventListener("click",close);
    var pv=$("#fmPrev"); if(pv) pv.addEventListener("click",function(){ step(-1); });
    var nx=$("#fmNext"); if(nx) nx.addEventListener("click",function(){ step(1); });
    document.addEventListener("keydown",function(e){ if(open<0) return; if(e.key==="Escape") close(); else if(e.key==="ArrowLeft") step(-1); else if(e.key==="ArrowRight") step(1); });
    window.addEventListener("langchange",function(){ if(open>=0) fill(open); });
  });
})();
