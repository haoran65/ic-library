/* Shared collection state; storage failures fall back to this page session. */
(() => {
  'use strict';
  const key='ic-gallery-collection-v1', valid=['food','bed','wand'];
  let state={items:[],unlocked:false};
  try {
    const saved=JSON.parse(localStorage.getItem(key)||'null');
    if(saved && Array.isArray(saved.items)){
      state.items=[...new Set(saved.items.filter(item=>valid.includes(item)))];
      state.unlocked=saved.unlocked===true && state.items.length===3;
    }
  } catch {}
  function publish(){
    try{localStorage.setItem(key,JSON.stringify(state))}catch{}
    document.dispatchEvent(new CustomEvent('ic-gallery-collection-change'));
  }
  window.ICGalleryCollection={
    has:item=>state.items.includes(item),
    get complete(){return valid.every(item=>state.items.includes(item))},
    get unlocked(){return state.unlocked},
    collect(item){if(!valid.includes(item)||state.items.includes(item))return false;state.items.push(item);publish();return true},
    unlock(){if(!this.complete)return false;state.unlocked=true;publish();document.dispatchEvent(new CustomEvent('ic-gallery-unlock-theme'));return true}
  };
})();
