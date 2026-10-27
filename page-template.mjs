const transparent=(width=1,height=1)=>`data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"></svg>`).toString('base64')}`;
export function deferMedia(html){
 return html.replace(/<img\b[^>]*>/g,tag=>{
  if(!tag.includes('loading="lazy"'))return tag;
  const width=tag.match(/\bwidth="(\d+)"/)?.[1]||1,height=tag.match(/\bheight="(\d+)"/)?.[1]||1;
  const deferred=tag.replace(/\bsrc="([^"]+)"/,`src="${transparent(width,height)}" data-src="$1"`).replace(/\bsrcset=/,'data-srcset=');
  return `${deferred}<noscript>${tag}</noscript>`;
 }).replace(/<video\b[^>]*>/g,tag=>tag.replace(/\bpreload="[^"]*"/,'preload="none"').replace(/\bposter=/,'data-poster='))
 .replace(/<source\b[^>]*>/g,tag=>tag.replace(/\bsrc=/,'data-src='));
}
export function renderPage({lang,route,title,description,header,body,footer,assets,criticalStyles='',inlinePhotography='',photoPreviews=[]}){
 const alternate=language=>`/${language}/${route?route+'/':''}`;
 const styles=criticalStyles?`<style data-first-paint>${criticalStyles.replaceAll('</style','<\\/style')}</style><link rel="stylesheet" href="${assets.styles}" media="print" onload="this.media='all'">`:`<link rel="stylesheet" href="${assets.styles}">`;
 const photoPreload=photoPreviews.length?`<script>(()=>{const photos=${JSON.stringify(photoPreviews)};let position=0;try{position=Number(sessionStorage.getItem('yuanlan-photo-position'))||0}catch{}const link=document.createElement('link');link.rel='preload';link.as='image';link.fetchPriority='high';link.href=photos[((Math.round(position)%photos.length)+photos.length)%photos.length];document.head.append(link)})()</script>`:'';
 const feature=inlinePhotography?`<script type="text/plain" data-inline-feature="photography">${inlinePhotography.replaceAll('</script','<\\/script')}</script>`:'';
 return `<!doctype html><html lang="${lang==='zh'?'zh-CN':'en'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#ffffff"><title>${title} · Yuanlan Huang</title><meta name="description" content="${description}"><meta property="og:title" content="${title} · Yuanlan Huang"><meta property="og:description" content="${description}"><meta property="og:type" content="website"><link rel="alternate" hreflang="zh-CN" href="${alternate('zh')}"><link rel="alternate" hreflang="en" href="${alternate('en')}"><link rel="icon" href="/favicon.svg" type="image/svg+xml">${styles}${photoPreload}<script>window.PortfolioAssetMap=${JSON.stringify(assets).replaceAll('<','\\u003c')};try{if(sessionStorage.getItem('yuanlan-journal-fold-played-v2')!=='1')document.documentElement.classList.add('journal-intro-pending')}catch{}</script><script src="${assets.core}" defer fetchpriority="high"></script></head><body id="top" data-lang="${lang}">${feature}${header}<main id="main">${deferMedia(body)}</main>${footer}</body></html>`;
}
