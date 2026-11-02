(()=>{
  'use strict';
  const data=window.IC_LIBRARY,core=window.ICLibraryCore;
  const $=selector=>document.querySelector(selector);
  const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const categories=Object.fromEntries(data.categories.map(c=>[c.id,c]));
  let state=core.urlState(location.href,data),typingTimer;
  function resourceCard(r){return `<a class="resource-card" data-id="${escape(r.id)}" href="${escape(r.url)}" aria-labelledby="resource-${escape(r.id)}"><div class="resource-top"><span>${escape(categories[r.category].name)} / ${escape(r.language)}</span><span aria-hidden="true">↗</span></div><h3 id="resource-${escape(r.id)}">${escape(r.name)}</h3><p class="description">${escape(r.description)}</p><div class="resource-tags">${r.tags.map(t=>`<span>${escape(t)}</span>`).join('')}</div><p class="resource-access">${escape(r.access.join(' · '))}</p></a>`;}
  function topicCard(t){const index=data.topics.indexOf(t)+1;return `<a class="topic-card" data-topic="${escape(t.id)}" href="topics/${escape(t.id)}.html"><div class="topic-top"><span>0${index} / ${escape(t.en)}</span><span class="topic-arrow" aria-hidden="true">↗</span></div><h3>${escape(t.name)}</h3><p>${escape(t.description)}</p></a>`;}
  function settle(element){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;element.classList.remove('is-settling');void element.offsetWidth;element.classList.add('is-settling');}
  function render(animate=false,preserveSearch=false){
    const rows=core.filterResources(data,state),topics=core.filterTopics(data,state),counts=core.categoryCounts(data,state);
    if(!preserveSearch)$('#resource-search').value=state.q;
    // Retain the controls themselves so keyboard focus survives filtering.
    for(const button of document.querySelectorAll('[data-category]')){const id=button.dataset.category;button.setAttribute('aria-pressed',String(id===state.category));button.querySelector('span').textContent=counts[id];button.disabled=!counts[id]&&id!==state.category&&id!=='all';}
    for(const button of document.querySelectorAll('[data-direction]'))button.setAttribute('aria-pressed',String(button.dataset.direction===state.direction));
    $('#resources').innerHTML=rows.map(resourceCard).join('');$('#empty').hidden=!!rows.length;
    $('#topic-grid').innerHTML=topics.map(topicCard).join('');$('#topic-empty').hidden=!!topics.length;
    $('#topic-count').textContent=topics.length+' 条探索路径';
    $('#result-count').textContent=(categories[state.category]?.name||'全部资源')+' · '+rows.length+' 项';
    $('#search-summary').textContent=rows.length+' 项资源 / '+topics.length+' 个专题';
    $('#reset').hidden=!state.q&&state.category==='all'&&state.direction==='all';
    if(animate){settle($('#resources'));settle($('#topic-grid'));}
  }
  function navigate(next,{replace=false,animate=true,hash,preserveSearch=false}={}){state=core.cleanState({...state,...next},data);const u=new URL(core.stateURL(state,location.href));if(hash!==undefined)u.hash=hash;if(u.href!==location.href)history[replace?'replaceState':'pushState'](null,'',u.href);render(animate,preserveSearch);}
  $('#resource-search').addEventListener('input',event=>{clearTimeout(typingTimer);const query=event.target.value;const wasTyping=!!window.icLibraryTyping;window.icLibraryTyping=true;navigate({q:query},{replace:wasTyping,animate:false,preserveSearch:true});typingTimer=setTimeout(()=>{window.icLibraryTyping=false;},500);});
  $('#search-form').addEventListener('submit',event=>{event.preventDefault();navigate({q:$('#resource-search').value},{hash:'directory',animate:false});$('#directory-title').setAttribute('tabindex','-1');$('#directory-title').focus({preventScroll:true});$('#directory').scrollIntoView({block:'start'});});
  $('#categories').addEventListener('click',event=>{const button=event.target.closest('[data-category]');if(button&&!button.disabled)navigate({category:button.dataset.category});});
  $('#directions').addEventListener('click',event=>{const button=event.target.closest('[data-direction]');if(button)navigate({direction:button.dataset.direction});});
  for(const anchor of document.querySelectorAll('[data-quick-category]'))anchor.addEventListener('click',event=>{if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||event.button!==0)return;event.preventDefault();navigate({q:'',direction:'all',category:anchor.dataset.quickCategory},{hash:'directory'});$('#directory').scrollIntoView({block:'start'});});
  function reset(){clearTimeout(typingTimer);window.icLibraryTyping=false;navigate({q:'',category:'all',direction:'all'});}
  $('#reset').addEventListener('click',reset);$('#empty-reset').addEventListener('click',reset);
  window.addEventListener('popstate',()=>{clearTimeout(typingTimer);window.icLibraryTyping=false;state=core.urlState(location.href,data);render();});
  for(const element of [$('#resources'),$('#topic-grid')])element.addEventListener('animationend',()=>element.classList.remove('is-settling'));
  render();window.IC_LIBRARY_READY=true;
})();
