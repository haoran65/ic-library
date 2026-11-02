/* UI layer. Original paper keywords extend the frozen upstream keyword matcher. */
(() => {
'use strict';
const data=window.IC_GALLERY,core=window.ICGalleryCore,$=id=>document.getElementById(id);
const rows=data.figures,byId=new Map(rows.map(f=>[f.id,f])),VENUES=Object.fromEntries(Object.entries(data.sources).map(([k,name])=>[k,{name}]));
const fixedNumbers=new Map((window.IC_GALLERY_NUMBERS||[]).map((id,i)=>[id,i+1]));
// New figures use an ID-derived range so earlier numbers never shift.
for(const f of rows)if(!fixedNumbers.has(f.id)){
  let a=2166136261,b=2246822507;
  for(const c of f.id){a=Math.imul(a^c.charCodeAt(0),16777619);b=Math.imul(b^c.charCodeAt(0),3266489909);}
  fixedNumbers.set(f.id,10000000000+(a>>>0)*1048576+((b>>>0)&1048575));
}
const itemFigures={'p-03e8677d490da036fb66-fig002':'food','p-2decb9b6b83a4c07da49-fig003':'bed','p-03a5a8e84bd03022f88b-fig001':'wand'};
const PATTERNS=Object.fromEntries(Object.entries(data.patterns).map(([k,v])=>[k,v.en])),t=(zh,en)=>window.ICGalleryI18n?.t(zh,en)??zh,patLabel=k=>data.patterns[k]?.[window.ICGalleryI18n?.lang==='en'?'en':'zh']||k;
let state=core.readState(location.href,data),filtered=[],shown=0,currentId=null,zoom=1,returnFocus=null,lastURL=location.href;
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const motionStyle=getComputedStyle(document.documentElement),motion={
  quick:parseFloat(motionStyle.getPropertyValue('--motion-quick'))||120,
  standard:parseFloat(motionStyle.getPropertyValue('--motion-standard'))||240,
  slow:parseFloat(motionStyle.getPropertyValue('--motion-slow'))||360,
  enter:'cubic-bezier(.2,0,0,1)',exit:'cubic-bezier(.3,0,1,1)'};
const uiMotions=new Set(),uiOwners=new WeakMap();
function playUI(node,frames,options={}){
  uiOwners.get(node)?.cancel();if(reducedMotion.matches||typeof node.animate!=='function')return;
  const a=node.animate(frames,{duration:motion.standard,easing:motion.enter,fill:'both',...options});
  uiOwners.set(node,a);uiMotions.add(a);
  a.finished.catch(()=>{}).finally(()=>{uiMotions.delete(a);if(uiOwners.get(node)===a){uiOwners.delete(node);a.cancel();}});
}
const autoLoad=typeof IntersectionObserver==='function';
let loadEpoch=0,loading=false,motionEpoch=0,closing=false,motions=[],proxy=null;
const revealObserver=autoLoad?new IntersectionObserver(entries=>{let i=0;for(const entry of entries)if(entry.isIntersecting){const node=entry.target;node.style.setProperty('--reveal-delay',Math.min(i++,3)*28+'ms');node.classList.remove('reveal-pending');revealObserver.unobserve(node);setTimeout(()=>node.style.removeProperty('--reveal-delay'),motion.standard+100);}},{rootMargin:'80px'}):null;
const loadObserver=autoLoad?new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting))scheduleLoad();},{rootMargin:'500px 0px'}):null;
const searchState=new Proxy(state,{get:(target,key)=>key==='q'&&/^#\d+$/.test(target.q)?'':target[key]});
const matcher=core.withPaperKeywords(window.IC_LEGACY_MATCHER({state:searchState,VENUES,PATTERNS,patLabel:k=>data.patterns[k]?.zh||k,TIERS:{},tierLabel:()=>''}),data.paper_keywords);
const number=n=>n.toLocaleString('en-US');
const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
function patternTag(f){const tag=el('span','pattern-tag',patLabel(f.pattern)),human=f.classification_status==='human';tag.append(el('small','classification-label',human?t('人工','Reviewed'):t('初分','Preliminary')));tag.title=human?t('已人工确认类别','Manually reviewed'):f.classification_needs_review?t('自动初分，建议优先人工复核','Preliminary classification; review recommended'):t('自动初分，尚未人工确认','Preliminary classification; not manually reviewed');return tag;}
function updateURL(method='pushState',id=currentId){
  const next=core.stateURL(location.href,state,id);if(next===location.href)return;
  try{history[method](null,'',next);lastURL=next;}catch{location.hash=id?'f='+id:'';}
}
function hashId(){const m=/^#f=([A-Za-z0-9._-]+)$/.exec(location.hash);return m?.[1]||null;}
function makeChips(id,field,values,label){
  const fragment=document.createDocumentFragment();
  const all=el('button','',t('全部','All'));all.dataset.value='all';all.dataset.field=field;all.append(el('span','',number(rows.length)));all.addEventListener('click',()=>setFilter(field,'all'));fragment.append(all);
  for(const value of values){const count=rows.filter(f=>String(f[field])===String(value)).length,button=el('button','',label(value));button.dataset.value=String(value);button.dataset.field=field;button.disabled=count===0;button.append(el('span','',number(count)));button.addEventListener('click',()=>setFilter(field,String(value)));fragment.append(button);}
  $(id).append(fragment);
}
function setFilter(field,value){state[field]=value;closeLightbox(false);updateURL();render();}
function reset(){Object.assign(state,{venue:'all',year:'all',pattern:'all',tier:'all',q:'',sort:'year'});closeLightbox(false);updateURL();render();}
function card(f,index){
  const node=el('article','card');node.dataset.id=f.id;
  const open=el('button','card-open');open.setAttribute('aria-label',t('查看 ','View ')+f.title+' · Fig. '+f.figure_label);
  const image=el('img');image.src=f.image;image.alt=f.title+' · Fig. '+f.figure_label;image.loading='lazy';image.decoding='async';open.append(image,el('span','card-number',String(fixedNumbers.get(f.id)).padStart(4,'0')));open.addEventListener('click',()=>openLightbox(f.id));
  const body=el('div','card-body'),meta=el('div','card-meta');meta.append(el('strong','',data.sources[f.venue]),el('span','',f.year+' / FIG. '+f.figure_label));
  const heading=el('h3'),title=el('button','card-title-button',f.title);title.addEventListener('click',()=>openLightbox(f.id));heading.append(title);
  const bottom=el('div','card-bottom'),cite=el('span','citation');cite.append(t('引用 ','Citations '),el('b','',f.citation_count===null?t('暂无','N/A'):number(f.citation_count)));cite.title=f.citation_count===null?t('暂无缓存引用量','Citation count unavailable'):'OpenAlex · '+t('统计于 ','as of ')+(f.citation_count_as_of||t('日期未知','unknown date'));bottom.append(patternTag(f),cite);body.append(meta,heading,bottom);node.append(open,body);return node;
}
function append(animateEntry=true){
  const batch=filtered.slice(shown,shown+48),fragment=document.createDocumentFragment(),cards=[];
  batch.forEach((f,i)=>{const node=card(f,shown+i);if(animateEntry&&revealObserver&&!reducedMotion.matches)node.classList.add('reveal-pending');cards.push(node);fragment.append(node);});
  $('grid').append(fragment);cards.filter(node=>node.classList.contains('reveal-pending')).forEach(node=>revealObserver?.observe(node));shown+=batch.length;
  $('more').hidden=autoLoad||shown>=filtered.length;$('loaded').textContent=t(`已显示 ${number(shown)} / ${number(filtered.length)} 张`,`Showing ${number(shown)} / ${number(filtered.length)} figures`);
  $('loading-hint').textContent=shown>=filtered.length?(filtered.length?t('已全部浏览','All figures loaded'):t('暂无匹配图片','No matching figures')):t('下滑自动加载','Scroll to load more');
}
function scheduleLoad(){
  if(loading||shown>=filtered.length||$('lightbox').open)return;
  loading=true;const epoch=loadEpoch;$('grid').setAttribute('aria-busy','true');$('load-sentinel').dataset.loading='true';$('loading-hint').textContent=t('正在载入…','Loading…');
  requestAnimationFrame(()=>{
    if(epoch!==loadEpoch)return;
    loading=false;$('grid').setAttribute('aria-busy','false');$('load-sentinel').dataset.loading='false';
    if(!$('lightbox').open)append();
    requestAnimationFrame(checkLoadPosition);
  });
}
function checkLoadPosition(){if(autoLoad&&$('load-sentinel').getBoundingClientRect().top<innerHeight+500)scheduleLoad();}
function render(effect='filter'){
  const previousCount=$('result-count').textContent;
  uiOwners.get($('grid'))?.cancel();
  loadEpoch++;loading=false;revealObserver?.disconnect();$('grid').setAttribute('aria-busy','false');$('load-sentinel').dataset.loading='false';
  const byNumber=/^#(\d+)$/.exec(state.q);
  filtered=rows.filter(f=>matcher(f)&&(!byNumber||fixedNumbers.get(f.id)===Number(byNumber[1]))).sort(core.compare(state.sort));shown=0;$('grid').replaceChildren();append(effect==='initial');
  loadObserver?.disconnect();loadObserver?.observe($('load-sentinel'));
  $('search').value=state.q;$('sort').value=state.sort;
  for(const button of document.querySelectorAll('[data-field]'))button.setAttribute('aria-pressed',String(state[button.dataset.field]===button.dataset.value));
  $('result-count').textContent=t(`${number(filtered.length)} 张图片 / ${number(new Set(filtered.map(f=>f.paper_id)).size)} 篇论文`,`${number(filtered.length)} figures / ${number(new Set(filtered.map(f=>f.paper_id)).size)} papers`);
  $('empty').hidden=filtered.length!==0;
  $('active-filters').textContent=[state.venue!=='all'?data.sources[state.venue]:null,state.year!=='all'?state.year:null,state.pattern!=='all'?patLabel(state.pattern):null,state.q?t('搜索：','Search: ')+state.q:null].filter(Boolean).join(' / ');
  if(effect==='filter'&&filtered.length)playUI($('grid'),[{opacity:.45,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}]);
  if(effect!=='initial'&&previousCount!==$('result-count').textContent)playUI($('result-count'),[{opacity:.4,transform:'translateY(3px)'},{opacity:1,transform:'translateY(0)'}],{duration:motion.quick});
  if(!filtered.length&&effect!=='initial')playUI($('empty'),[{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}]);
}
function setZoom(value){
  zoom=Math.max(1,Math.min(5,value));const image=$('lb-img');image.classList.toggle('zoomed',zoom>1);
  if(zoom>1){const stage=$('lb-stage'),base=Math.min(stage.clientWidth-48,(stage.clientHeight-48)*(image.naturalWidth/(image.naturalHeight||1)),image.naturalWidth);image.style.width=Math.max(base,1)*zoom+'px';image.style.height='auto';}else{image.style.width='';image.style.height='';}
  $('zoom-label').textContent=zoom===1?t('适应窗口','Fit to window'):Math.round(zoom*100)+'%';
}
function showLightbox(id){
  const f=byId.get(id);if(!f)return;currentId=id;const index=filtered.findIndex(x=>x.id===id);
  $('lb-position').textContent=index>=0?`${index+1} / ${number(filtered.length)} · ${t('← → 切换','← → Navigate')}`:t('图片直达','Direct figure link');$('lb-prev').disabled=index<=0;$('lb-next').disabled=index<0||index>=filtered.length-1;
  $('lb-meta').textContent=`${data.sources[f.venue]} / ${f.year} / FIG. ${f.figure_label}`;$('lb-title').textContent=f.title;$('lb-authors').textContent=(f.authors||[]).join(', ');
  $('lb-caption').textContent=f.caption||t('暂无图注','No caption available');$('lb-doi').textContent=f.doi||t('暂无','N/A');$('lb-date').textContent=f.publication_date||f.year+t('（具体日期暂无）',' (exact date unavailable)');
  $('lb-citations').textContent=f.citation_count===null?t('暂无','N/A'):`${number(f.citation_count)}${t(' 次','')} · OpenAlex${f.citation_count_as_of?t(' · 截至 ',' · as of ')+f.citation_count_as_of:''}`;
  $('lb-tags').replaceChildren(patternTag(f),...(f.semantic_tags||[]).map(p=>el('span','pattern-tag',patLabel(p))));
  showKeywords(f);
  showCollectible(id);
  $('lb-id').textContent=f.id;$('share-status').textContent='';const image=$('lb-img');image.alt=f.title+' · Fig. '+f.figure_label;image.src=f.image;image.onload=()=>setZoom(1);setZoom(1);
}
const itemLabels={food:['猫粮饭盆','Food bowl'],bed:['舒适猫窝','Cat bed'],wand:['逗猫棒','Teaser wand']};
const collectible=el('button','gallery-collectible');collectible.type='button';collectible.hidden=true;
$('lb-stage').parentElement.append(collectible);
function showCollectible(id){
  const item=itemFigures[id],collection=window.ICGalleryCollection;
  collectible.hidden=!item;
  if(!item)return;
  const [zh,en]=itemLabels[item],label=t(zh,en),collected=collection.has(item);
  collectible.disabled=collected;
  collectible.setAttribute('aria-label',collected?t('已收集：','Collected: ')+label:t('收集','Collect ')+label);
  collectible.replaceChildren();
  const image=el('img');image.src=new URL('bappu-prop-'+item+'.png',document.currentScript?.src||new URL('assets/',document.baseURI)).href;image.alt='';
  collectible.append(image,el('span','',collected?t('已收集','Collected'):t('收集道具','Collect item')));
  collectible.onclick=()=>{collection.collect(item);showCollectible(id);};
}
function showKeywords(f){
  const groups=data.paper_keywords?.[f.paper_id]?.groups||[],container=$('lb-keyword-groups');
  container.replaceChildren();$('lb-keyword-empty').hidden=groups.length>0;
  for(const group of groups){
    const secondary=groups.length>1&&!['ieee','author','pdf_index','pdf_author'].includes(group.kind);
    const section=el(secondary?'details':'div',secondary?'keyword-group keyword-secondary':'keyword-group');
    const heading=el(secondary?'summary':'h4','',group.label+(secondary?' · '+group.terms.length:'')),list=el('div','keyword-list');
    for(const term of group.terms){
      const button=el('button','keyword-term',term);button.type='button';button.title=t('在图库中搜索此关键词','Search this keyword in the gallery');
      button.addEventListener('click',()=>{state.q=term.toLowerCase();closeLightbox(false);updateURL();render();$('search').focus();});
      list.append(button);
    }
    const source=el('span','keyword-source',group.source_type==='paper_pdf'?t(`论文原文 · 第 ${group.page} 页`,`Paper PDF · page ${group.page}`):t('出版平台','Publisher'));
    section.append(heading,list,source);container.append(section);
  }
}
function cancelMotion(){motionEpoch++;motions.forEach(a=>a.cancel());motions=[];$('lightbox').querySelectorAll('.image-flight').forEach(n=>n.remove());proxy=null;$('lb-img').style.visibility='';$('lightbox').classList.remove('is-opening','is-closing');closing=false;}
function animate(node,frames,options){if(reducedMotion.matches||typeof node.animate!=='function')return Promise.resolve();const a=node.animate(frames,{easing:motion.enter,fill:'both',...options});motions.push(a);return a.finished.catch(()=>{});}
function cardImage(id){return document.querySelector(`.card[data-id="${CSS.escape(id||'')}"] .card-open img`);}
function imageBounds(image){
  if(!image?.isConnected||!image.naturalWidth)return null;
  const b=image.getBoundingClientRect(),scale=Math.min(b.width/image.naturalWidth,b.height/image.naturalHeight),w=image.naturalWidth*scale,h=image.naturalHeight*scale;
  const box={x:b.x+(b.width-w)/2,y:b.y+(b.height-h)/2,w,h};
  return w>0&&h>0&&box.y+h>0&&box.y<innerHeight&&box.x+w>0&&box.x<innerWidth?box:null;
}
async function flyImage(from,to,epoch,exiting=false){
  if(!from||!to||reducedMotion.matches)return;
  const image=$('lb-img'),copy=document.createElement('img');copy.src=image.src;copy.alt='';copy.setAttribute('aria-hidden','true');copy.className='image-flight';
  Object.assign(copy.style,{width:to.w+'px',height:to.h+'px'});proxy=copy;$('lightbox').append(copy);image.style.visibility='hidden';
  // Intermediate waypoints keep large viewport-scale moves readable.
  const segments=Math.max(2,Math.ceil(Math.max(Math.abs(to.x-from.x)/(innerWidth/3),Math.abs(to.y-from.y)/(innerHeight/3),Math.abs(to.w-from.w)/(innerWidth/3),Math.abs(to.h-from.h)/(innerHeight/3))));
  const frames=Array.from({length:segments+1},(_,i)=>{const t=i/segments;return {offset:t,transform:`translate(${from.x+(to.x-from.x)*t}px,${from.y+(to.y-from.y)*t}px) scale(${(from.w+(to.w-from.w)*t)/to.w},${(from.h+(to.h-from.h)*t)/to.h})`};});
  await animate(copy,frames,{duration:exiting?motion.standard:motion.slow,easing:exiting?motion.exit:motion.enter});
  if(epoch===motionEpoch){copy.remove();proxy=null;image.style.visibility='';}
}
async function revealLightbox(from,epoch){
  const image=$('lb-img');
  await Promise.race([image.decode().catch(()=>{}),new Promise(resolve=>setTimeout(resolve,300))]);
  if(epoch!==motionEpoch||!$('lightbox').open)return;
  const destination=imageBounds(image),flight=flyImage(from,destination,epoch);
  const panel=from&&destination?[{opacity:0},{opacity:1}]:[{opacity:0,transform:'translateY(8px) scale(.99)'},{opacity:1,transform:'translateY(0) scale(1)'}];
  await Promise.all([flight,animate($('lightbox').querySelector('.lb-content'),panel,{duration:motion.standard}),animate($('lightbox').querySelector('.lb-info'),[{opacity:0,transform:'translateX(8px)'},{opacity:1,transform:'translateX(0)'}],{duration:motion.standard,delay:72})]);
  if(epoch===motionEpoch){motions.forEach(a=>a.cancel());motions=[];$('lightbox').classList.remove('is-opening');}
}
function openLightbox(id,write=true){
  if(!byId.has(id))return;const fresh=!$('lightbox').open,from=imageBounds(cardImage(id));cancelMotion();
  if(fresh)returnFocus=document.activeElement;showLightbox(id);
  if(fresh){$('lightbox').showModal();$('lb-close').focus({preventScroll:true});}
  if(write)updateURL('pushState',id);
  if(fresh&&!reducedMotion.matches&&typeof $('lightbox').animate==='function'){$('lightbox').classList.add('is-opening');revealLightbox(from,motionEpoch);}
}
function closeLightbox(write=true){
  if(closing){if(write)return;cancelMotion();}
  const dialog=$('lightbox'),id=currentId,thumbnail=cardImage(id),to=imageBounds(thumbnail),focus=thumbnail?.closest('button')||returnFocus,finish=()=>{dialog.close();currentId=null;if(write)updateURL('pushState',null);if(focus?.isConnected)focus.focus({preventScroll:true});checkLoadPosition();};
  if(!dialog.open){currentId=null;return;}
  cancelMotion();
  if(!write||reducedMotion.matches||typeof dialog.animate!=='function'){finish();return;}
  closing=true;const epoch=motionEpoch;dialog.classList.add('is-closing');
  const from=imageBounds($('lb-img'));
  Promise.all([flyImage(from,to,epoch,true),animate(dialog.querySelector('.lb-content'),[{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(4px)'}],{duration:motion.quick+60,easing:motion.exit})]).then(()=>{
    if(epoch!==motionEpoch)return;finish();cancelMotion();
  });
}
function step(direction){const index=filtered.findIndex(f=>f.id===currentId),next=filtered[index+direction];if(index>=0&&next){cancelMotion();const epoch=motionEpoch;showLightbox(next.id);updateURL('replaceState',next.id);if(!reducedMotion.matches)Promise.all([animate($('lb-img'),[{opacity:.35,transform:`translateX(${direction*10}px)`},{opacity:1,transform:'translateX(0)'}],{duration:motion.standard}),animate($('lightbox').querySelector('.lb-info'),[{opacity:.65,transform:`translateX(${direction*4}px)`},{opacity:1,transform:'translateX(0)'}],{duration:motion.quick+40})]).then(()=>{if(epoch===motionEpoch){motions.forEach(a=>a.cancel());motions=[];}});}}
function fromURL(){
  if($('gallery-welcome').open)return;
  if(lastURL===location.href)return;lastURL=location.href;const next=core.readState(location.href,data),changed=Object.keys(next).some(k=>next[k]!==state[k]);Object.assign(state,next);if(changed)render();const id=hashId();if(id&&byId.has(id))openLightbox(id,false);else{cancelMotion();closeLightbox(false);}
}
$('stat-figures').textContent=number(rows.length);$('stat-papers').textContent=number(new Set(rows.map(f=>f.paper_id)).size);$('stat-sources').textContent=Object.keys(data.sources).length;
function updateCoverage(){$('keyword-coverage').textContent=t(`原始关键词已收录 ${number(Object.keys(data.paper_keywords||{}).length)} / ${$('stat-papers').textContent} 篇论文 · 各词组标注原始来源。`,`Original keywords are available for ${number(Object.keys(data.paper_keywords||{}).length)} / ${$('stat-papers').textContent} papers; each group identifies its source.`);}updateCoverage();
makeChips('venue-chips','venue',Object.keys(data.sources),k=>data.sources[k]);makeChips('year-chips','year',[...new Set(rows.map(f=>f.year))].sort((a,b)=>b-a),String);makeChips('pattern-chips','pattern',Object.keys(data.patterns),patLabel);
$('search').addEventListener('input',e=>{const raw=e.target.value,start=e.target.selectionStart;state.q=raw.trim().toLowerCase();closeLightbox(false);updateURL('replaceState');render('search');e.target.value=raw;try{e.target.setSelectionRange(start,start);}catch{}});
$('sort').addEventListener('change',e=>{state.sort=e.target.value;closeLightbox(false);updateURL();render();});
$('more').addEventListener('click',append);$('reset').addEventListener('click',reset);$('empty-reset').addEventListener('click',reset);
reducedMotion.addEventListener('change',()=>{const wasClosing=closing;cancelMotion();uiMotions.forEach(a=>a.cancel());document.querySelectorAll('.reveal-pending').forEach(n=>n.classList.remove('reveal-pending'));if(wasClosing)closeLightbox();});
$('lb-close').addEventListener('click',()=>closeLightbox());$('lightbox').addEventListener('cancel',e=>{e.preventDefault();closeLightbox();});$('lb-prev').addEventListener('click',()=>step(-1));$('lb-next').addEventListener('click',()=>step(1));
$('lightbox').addEventListener('close',()=>{if(!$('lightbox').open&&currentId!==null){cancelMotion();currentId=null;updateURL('replaceState',null);if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});checkLoadPosition();}});
$('zoom-in').addEventListener('click',()=>{cancelMotion();setZoom(zoom+.5);});$('zoom-out').addEventListener('click',()=>{cancelMotion();setZoom(zoom-.5);});$('zoom-fit').addEventListener('click',()=>{cancelMotion();setZoom(1);});
$('lb-share').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.href);$('share-status').textContent=t('图片链接已复制','Figure link copied');}catch{$('share-status').textContent=t('可复制浏览器地址栏中的当前图片链接','Copy the figure link from your browser address bar');}});
document.addEventListener('ic-gallery-language-change',()=>{
  const count=shown,openId=currentId,oldZoom=zoom;
  for(const id of ['venue-chips','year-chips','pattern-chips'])$(id).replaceChildren();
  makeChips('venue-chips','venue',Object.keys(data.sources),k=>data.sources[k]);makeChips('year-chips','year',[...new Set(rows.map(f=>f.year))].sort((a,b)=>b-a),String);makeChips('pattern-chips','pattern',Object.keys(data.patterns),patLabel);
  updateCoverage();render('language');while(shown<count&&shown<filtered.length)append(false);
  if(openId&&$('lightbox').open){showLightbox(openId);setZoom(oldZoom);}
});
document.addEventListener('keydown',e=>{if(!$('lightbox').open)return;if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeLightbox();return;}if(['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName))return;if(e.key==='ArrowLeft'){e.preventDefault();step(-1);}if(e.key==='ArrowRight'){e.preventDefault();step(1);}},true);
const welcomeKey='ic-gallery-welcome-seen-v1';
function welcomeWasSeen(){try{if(localStorage.getItem(welcomeKey)==='1')return true;}catch{}try{return sessionStorage.getItem(welcomeKey)==='1';}catch{return false;}}
function rememberWelcome(){try{localStorage.setItem(welcomeKey,'1')}catch{}try{sessionStorage.setItem(welcomeKey,'1')}catch{}}
$('welcome-close').addEventListener('click',()=>{rememberWelcome();$('gallery-welcome').close();});
$('gallery-welcome').addEventListener('cancel',rememberWelcome);
$('gallery-welcome').addEventListener('close',()=>{rememberWelcome();lastURL='';fromURL();});
window.addEventListener('popstate',fromURL);window.addEventListener('hashchange',fromURL);render('initial');
if(welcomeWasSeen()){lastURL='';fromURL();}else $('gallery-welcome').showModal();
})();
