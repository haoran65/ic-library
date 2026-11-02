/* Shared pure behavior. Frozen upstream search is extended only with original paper keywords. */
(() => {
  const collator=new Intl.Collator('en',{sensitivity:'base',numeric:true});
  const title=(a,b)=>collator.compare(a.title||'',b.title||'');
  const tie=(a,b)=>title(a,b)||collator.compare(String(a.figure_label??a.figure_number??''),String(b.figure_label??b.figure_number??''))||a.id.localeCompare(b.id);
  const known=f=>Number.isInteger(f.citation_count)&&f.citation_count>=0;
  function compare(mode){return (a,b)=>{
    if(mode==='title')return tie(a,b);
    if(mode==='citations')return Number(known(b))-Number(known(a))||(known(a)&&known(b)?b.citation_count-a.citation_count:0)||b.year-a.year||tie(a,b);
    return b.year-a.year||Number(!!b.publication_date)-Number(!!a.publication_date)||(a.publication_date&&b.publication_date?b.publication_date.localeCompare(a.publication_date):0)||tie(a,b);
  };}
  function readState(url,data){
    const p=new URL(url).searchParams,v=p.get('v'),y=p.get('y'),pattern=p.get('p'),sort=p.get('s');
    return {venue:Object.hasOwn(data.sources,v)?v:'all',year:data.figures.some(f=>String(f.year)===y)?y:'all',
      pattern:Object.hasOwn(data.patterns,pattern)?pattern:'all',tier:'all',q:(p.get('q')||'').trim().toLowerCase(),sort:['title','citations'].includes(sort)?sort:'year'};
  }
  function stateURL(url,state,id){
    const u=new URL(url);for(const k of ['v','y','t','p','q','s'])u.searchParams.delete(k);
    for(const [field,key] of [['venue','v'],['year','y'],['pattern','p']])if(state[field]!=='all')u.searchParams.set(key,state[field]);
    if(state.q)u.searchParams.set('q',state.q);if(state.sort!=='year')u.searchParams.set('s',state.sort);
    u.hash=id?'f='+encodeURIComponent(id):'';return u.href;
  }
  function keywordTerms(record){return [...new Set((record?.groups||[]).flatMap(g=>g.terms||[]))];}
  function withPaperKeywords(legacy,papers={}){
    // Field adapter for the verbatim upstream matcher: only its search haystack
    // gains original terms. Do not mutate titles, rows, sorting or query state.
    const texts=new Map(Object.entries(papers).map(([id,p])=>[id,keywordTerms(p).join(' ')]));
    return f=>{const terms=texts.get(f.paper_id);return legacy(terms?{...f,title:(f.title||'')+' '+terms}:f);};
  }
  globalThis.ICGalleryCore={compare,readState,stateURL,keywordTerms,withPaperKeywords};
})();
