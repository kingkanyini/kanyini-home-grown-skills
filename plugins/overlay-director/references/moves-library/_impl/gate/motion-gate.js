const { chromium } = require('playwright');
const path = require('node:path');
const fs = require('node:fs');
const GSAP_LOCAL = path.join(__dirname, 'assets', 'gsap.min.js'); // gate inlines GSAP locally (headless file:// + CDN stalls)
const GSAP_SRC = fs.readFileSync(GSAP_LOCAL, 'utf8');
const TABLE = require('./assertions.js');
const { mad, edgeEnergy } = require('./assertions.js');
const MAD_FLOOR = 6.0; // calibrated in Task 2.3

async function seek(page, id, t){ await page.evaluate(({id,t})=>{ window.__timelines[id].totalTime(t); }, {id,t}); await page.waitForTimeout(30); }
async function regionPNG(page, sel){ const el = await page.$(sel); if(!el) return null; return await el.screenshot({ type:'png' }); }
async function rawRGBA(page, sel){ const el=await page.$(sel); if(!el) return null;
  const box = await el.boundingBox(); const buf = await page.screenshot({ clip: box });
  // decode png → rgba via sharp
  const sharp = require('sharp'); const { data, info } = await sharp(buf).raw().ensureAlpha().toBuffer({resolveWithObject:true});
  return { data, w: info.width, h: info.height }; }

async function gateEffect(id){
  const spec = TABLE[id]; if(!spec) throw new Error(`no assertion spec for ${id}`);
  const html = fs.readFileSync(path.join(__dirname, '..', `${id}.html`), 'utf8')
    .replace(/<script src="[^"]*gsap[^"]*"><\/script>/i, `<script>${GSAP_SRC}</script>`);
  const browser = await chromium.launch({ headless: true, timeout: 30000 });
  const page = await browser.newPage({ viewport:{width:1920,height:1080} });
  const failures = [];
  try {
    await page.setContent(html, { waitUntil: 'load' });
    await page.waitForFunction(`!!window.__timelines && !!window.__timelines["${id}"]`, { timeout: 15000 });
    const dur = await page.evaluate((id)=>window.__timelines[id].duration(), id);
    const T = {}; for(const [k,v] of Object.entries(spec.times)) T[k] = (v==='auto') ? Math.max(0, dur-0.1) : v;
    // capture region buffers at named times
    const caps = {};
    for(const [k,t] of Object.entries(T)){ await seek(page, id, t); caps[k] = await rawRGBA(page, spec.el); }
    // freeze-check: hold region must not equal enter region uniformly across the whole hold
    for(const c of spec.checks){
      if(c.type==='mad'){ const v = mad(caps[c.a].data, caps[c.b].data); if(v < (c.min||MAD_FLOOR)) failures.push(`mad ${c.a}->${c.b}=${v.toFixed(2)} < ${c.min||MAD_FLOOR}`); }
      if(c.type==='glassCrossfade'){ await seek(page,id,T.enter); const e=edgeEnergy(caps.enter.data,caps.enter.w,caps.enter.h);
        await seek(page,id,T.hold); const h2=await rawRGBA(page,spec.el); const eh=edgeEnergy(h2.data,h2.w,h2.h);
        if(eh - e < 1.0) failures.push(`glass edge-softness delta ${(eh-e).toFixed(2)} < 1.0 (blur not compositing?)`); }
      if(['scale','styleDelta','overshoot','crossoverLag','staggerReveal','yExtrema','distinctStates','wordStateChange','opacityArc','noTranslate','lumaBrighterThanSurround'].includes(c.type)){
        const r = await require('./style-checks.js').run(page, id, spec, c, T); if(!r.ok) failures.push(r.msg); }
    }
  } finally { await browser.close(); }
  return { id, pass: failures.length===0, failures };
}
module.exports = { gateEffect, MAD_FLOOR };
if(require.main===module){ gateEffect(process.argv[2]).then(r=>{ console.log(JSON.stringify(r,null,2)); process.exit(r.pass?0:1); }); }
