async function px(page, sel, prop){ return await page.evaluate(({sel,prop})=>{
  const el=document.querySelector(sel); if(!el) return null; const cs=getComputedStyle(el);
  return { val: cs[prop], rectTop: el.getBoundingClientRect().top, rectLeft: el.getBoundingClientRect().left,
           opacity: parseFloat(cs.opacity), transform: cs.transform }; }, {sel,prop}); }
async function seek(page,id,t){ await page.evaluate(({id,t})=>{ window.__timelines[id].totalTime(t); },{id,t}); await page.waitForTimeout(20); }
async function run(page, id, spec, c, T){
  const S = `[data-composition-id="${id}"] `;
  if(c.type==='styleDelta'){ await seek(page,id,T.enter); const a=await px(page,S+(c.elSel||spec.el),c.prop);
    await seek(page,id,T.hold); const b=await px(page,S+(c.elSel||spec.el),c.prop);
    const moved = Math.abs((c.prop==='left'?b.rectLeft-a.rectLeft:b.rectTop-a.rectTop));
    return { ok: moved >= (c.tolPx||4), msg:`${c.prop} moved ${moved.toFixed(1)}px < ${c.tolPx||4}` }; }
  if(c.type==='scale'){ await seek(page,id,T.hold); const b=await px(page,S+spec.el,'transform');
    const m=/matrix\(([-0-9.]+)/.exec(b.transform); const sc=m?parseFloat(m[1]):1;
    return { ok: sc>=c.toMin, msg:`scale ${sc.toFixed(3)} < ${c.toMin}` }; }
  if(c.type==='overshoot'){ await seek(page,id,T.peak); const p=await px(page,S+spec.el,'bottom');
    await seek(page,id,T.hold); const s=await px(page,S+spec.el,'bottom');
    return { ok: p.rectTop < s.rectTop - 2, msg:`no overshoot: peak rectTop ${p.rectTop} !< settle ${s.rectTop}` }; }
  if(c.type==='crossoverLag'){ const oa=async t=>{await seek(page,id,t);return (await px(page,S+c.first,'opacity')).opacity;};
    const ob=async t=>{await seek(page,id,t);return (await px(page,S+c.second,'opacity')).opacity;};
    return { ok:(await oa(T.a))>0.5 && (await ob(T.a))<0.5 && (await ob(T.b))>0.5, msg:'panel b did not lag panel a by ≥0.2s' }; }
  if(c.type==='staggerReveal'){ let beats=0; for(const t of [T.enter,T.hold]){ await seek(page,id,t);
    beats += await page.evaluate(({S,sel})=>[...document.querySelectorAll(S+sel)].filter(e=>parseFloat(getComputedStyle(e).opacity)>0.5).length,{S,sel:c.items}); }
    return { ok: beats>=c.minDistinctBeats, msg:`only ${beats} stacked items revealed` }; }
  if(c.type==='yExtrema'){ const ys=[]; for(const k of c.samples){ await seek(page,id,T[k]); ys.push((await px(page,S+spec.el,'top')).rectTop); }
    return { ok: Math.max(...ys)-Math.min(...ys) > 4, msg:`no bounce: y range ${(Math.max(...ys)-Math.min(...ys)).toFixed(1)}px` }; }
  if(c.type==='distinctStates'){ const tops=[]; for(const k of c.samples){ await seek(page,id,T[k]);
    tops.push(await page.evaluate(({S})=>{const e=document.querySelector(S+'.od-lit'); return e?Math.round(e.getBoundingClientRect().top):-1;},{S})); }
    return { ok: new Set(tops).size>=c.min, msg:`spotlight did not walk: ${tops.length} states, ${new Set(tops).size} distinct` }; }
  if(c.type==='wordStateChange'){ const states=[]; for(const k of c.samples){ await seek(page,id,T[k]);
    states.push(await page.evaluate(({S,sel})=>[...document.querySelectorAll(S+sel)].map(e=>getComputedStyle(e).color).join('|'),{S,sel:c.words})); }
    return { ok: new Set(states).size>=c.min, msg:`karaoke words did not change state` }; }
  if(c.type==='opacityArc'){ await seek(page,id,T.hold); const o=(await px(page,S+spec.el,'opacity')).opacity;
    return { ok:o>=c.min, msg:`opacity at hold ${o} < ${c.min}` }; }
  if(c.type==='noTranslate'){ await seek(page,id,T.hold); const t=(await px(page,S+spec.el,'transform')).transform;
    return { ok: t==='none'||/matrix\(1, 0, 0, 1,/.test(t), msg:`unexpected translate: ${t}` }; }
  if(c.type==='lumaBrighterThanSurround'){ return { ok:true, msg:'(luma routed to MAD/human)' }; }
  return { ok:true, msg:'' };
}
module.exports = { run };
