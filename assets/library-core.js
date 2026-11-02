(function(root){
  'use strict';
  const normalize=value=>String(value??'').toLocaleLowerCase().trim();
  const tokens=query=>normalize(query).split(/\s+/u).filter(Boolean);
  const matches=(text,query)=>tokens(query).every(word=>normalize(text).includes(word));
  function cleanState(input,data){return {q:String(input.q||'').trim(),category:data.categories.some(c=>c.id===input.category)?input.category:'all',direction:data.directions.some(d=>d.id===input.direction)?input.direction:'all'};}
  function resourceText(resource,data){return [resource.name,...resource.aliases,resource.description,...resource.tags,...resource.directions.map(id=>data.directions.find(d=>d.id===id)?.name||id)].join(' ');}
  function filterResources(data,state){return data.resources.filter(r=>(state.category==='all'||r.category===state.category)&&(state.direction==='all'||r.directions.includes(state.direction))&&matches(resourceText(r,data),state.q));}
  function filterTopics(data,state){return data.topics.filter(t=>matches(t.name+' '+t.description,state.q));}
  function categoryCounts(data,state){const rows=filterResources(data,{...state,category:'all'});return Object.fromEntries([['all',rows.length],...data.categories.map(c=>[c.id,rows.filter(r=>r.category===c.id).length])]);}
  function urlState(url,data){const u=new URL(url);return cleanState(Object.fromEntries(u.searchParams),data);}
  function stateURL(state,url){const u=new URL(url);for(const key of ['q','category','direction']){if(state[key]&&state[key]!=='all')u.searchParams.set(key,state[key]);else u.searchParams.delete(key);}return u.href;}
  const api={normalize,tokens,matches,cleanState,resourceText,filterResources,filterTopics,categoryCounts,urlState,stateURL};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ICLibraryCore=api;
})(typeof window!=='undefined'?window:globalThis);
