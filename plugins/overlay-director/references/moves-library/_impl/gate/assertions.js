// Each entry: how to PROVE the effect's distinct motion. machine = checked here; human = VV#26.
// times are local seconds. el = a CSS selector (scoped) to read computed style / screenshot.
module.exports = {
  'liquid-glass-card': { el: '.od-card', times:{enter:0.1, hold:1.5, exit:'auto'},
    checks:[{type:'mad', a:'enter', b:'hold', min:6.0}, {type:'glassCrossfade', blur:'.od-blur', sharp:'.od-sharp'}] },
  'center-hero':      { el: '.od-line', times:{enter:0.1, hold:1.5, exit:'auto'},
    checks:[{type:'scale', from:0.94, toMin:0.99, at:'hold'}, {type:'mad', a:'enter', b:'hold', min:6.0}] },
  'full-frame-quote': { el: '.od-quote', times:{enter:0.1, hold:1.5, exit:'auto'},
    checks:[{type:'opacityArc', at:'hold', min:0.9}] },
  'image-card':       { el: '.od-img',   times:{enter:0.1, hold:1.5, exit:'auto'},
    checks:[{type:'opacityArc', at:'hold', min:0.9}, {type:'noTranslate'}] },
  'lower-third':      { el: '.od-lower',  times:{enter:0.1, hold:1.5, exit:'auto'},
    checks:[{type:'styleDelta', prop:'left', enter:'4%', hold:'6%', tolPx:4}] },
  'top-pill':         { el: '.od-pill',   times:{enter:0.1, hold:1.5, exit:'auto'},
    checks:[{type:'styleDelta', prop:'top', enter:'5%', hold:'7%', tolPx:4}] },
  'bottom-rise':      { el: '.od-rise',   times:{enter:0.1, peak:0.35, hold:1.5, exit:'auto'},
    checks:[{type:'overshoot', prop:'bottom', settle:'12%', at:'peak'}] },
  'split-card':       { el: '.od-split',  times:{enter:0.1, a:0.2, b:0.5, hold:1.5, exit:'auto'},
    checks:[{type:'crossoverLag', first:'.od-a', second:'.od-b', minLagS:0.2}] },
  'sandwich-stack':   { el: '.od-stack',  times:{enter:0.1, hold:1.8, exit:'auto'},
    checks:[{type:'staggerReveal', items:'.od-item', minDistinctBeats:2}] },
  'bouncing-arrows':  { el: '.od-arrow',  times:{enter:0.1, h1:0.6, h2:1.1, hold:1.5, exit:'auto'},
    checks:[{type:'yExtrema', samples:['h1','h2'], min:2}] },
  'reading-spotlight':{ el: '.od-spot',   times:{enter:0.1, s1:1.0, s2:2.0, exit:'auto'},
    checks:[{type:'distinctStates', samples:['s1','s2'], min:2}, {type:'lumaBrighterThanSurround', region:'.od-lit'}] },
  'karaoke-caption':  { el: '.od-track',  times:{w1:0.4, w2:1.0, hold:1.5, exit:'auto'},
    checks:[{type:'wordStateChange', words:'.od-word', samples:['w1','w2'], min:2}] },
};
// MAD over two same-size RGBA buffers (luma), 0..255
function mad(bufA, bufB){ let s=0,n=bufA.length/4; for(let i=0;i<bufA.length;i+=4){
  const la=0.299*bufA[i]+0.587*bufA[i+1]+0.114*bufA[i+2];
  const lb=0.299*bufB[i]+0.587*bufB[i+1]+0.114*bufB[i+2]; s+=Math.abs(la-lb);} return s/n; }
// crude high-frequency energy (edge softness): mean abs Laplacian over luma of an RGBA buffer
function edgeEnergy(buf,w,h){ let s=0,c=0; const L=(x,y)=>{const i=(y*w+x)*4;
  return 0.299*buf[i]+0.587*buf[i+1]+0.114*buf[i+2];};
  for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const e=Math.abs(4*L(x,y)-L(x-1,y)-L(x+1,y)-L(x,y-1)-L(x,y+1)); s+=e;c++;} return s/Math.max(1,c); }
module.exports.mad = mad; module.exports.edgeEnergy = edgeEnergy;
