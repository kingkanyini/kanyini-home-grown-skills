// Smoke: a fixture animates .od-card left 0->200px; gate wiring must read it back.
// GSAP is inlined locally (headless file:// + CDN load stalls in this env); load via setContent.
const fs=require('node:fs'),path=require('node:path');
const GSAP=fs.readFileSync(path.join(__dirname,'assets','gsap.min.js'),'utf8');
const html=`<!doctype html><html><head><script>${GSAP}</script>
<style>#root{position:relative;width:1920px;height:1080px}.od-card{position:absolute;left:0;top:100px;width:200px;height:80px;background:#888}</style></head>
<body><div id="root" data-composition-id="__smoke" data-duration="2"><div class="od-card"></div></div>
<script>window.__timelines={__smoke:gsap.timeline({paused:true})};window.__timelines.__smoke.fromTo('[data-composition-id="__smoke"] .od-card',{left:0},{left:200,duration:0.4},0);</script></body></html>`;
(async()=>{ try{
  const {chromium}=require('playwright');
  const b=await chromium.launch({timeout:30000});
  const p=await b.newPage({viewport:{width:1920,height:1080}});
  await p.setContent(html,{waitUntil:'load'});
  await p.waitForFunction('!!window.__timelines.__smoke',{timeout:15000});
  await p.evaluate(()=>window.__timelines.__smoke.totalTime(0));
  const a=await p.evaluate(()=>document.querySelector('.od-card').getBoundingClientRect().left);
  await p.evaluate(()=>window.__timelines.__smoke.totalTime(0.4));
  const z=await p.evaluate(()=>document.querySelector('.od-card').getBoundingClientRect().left);
  await b.close();
  if(!(z-a>150)){console.error('FAIL seek',a,z);process.exit(1);}
  console.log('OK seek',a,'->',z); process.exit(0);
}catch(e){ console.error('ERROR',e.message); process.exit(1);} })();
