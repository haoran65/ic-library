/* A small companion for the gallery. DeskSprite is distributed under MIT. */
(() => {
  'use strict';
  if (!window.DeskSprite || !window.IC_GALLERY) return;
  const assetBase = new URL('.', document.currentScript.src);
  const standingImage = new Image();
  const walkingImages = Array.from({length:9}, (_,index) => {
    const image = new Image();
    image.src = new URL(`bappu-pixellab-walk-${String(index).padStart(2,'0')}.png`, assetBase).href;
    return image;
  });
  const actionImages = Object.fromEntries(['groom','lookback','stretch','pounce','eat','teaser'].map(name => [name, Array.from({length:9}, (_,index) => {
    const image = new Image();
    image.src = new URL(`bappu-${name}-${String(index).padStart(2,'0')}.png`, assetBase).href;
    return image;
  })]));
  const frontImages = Object.fromEntries(Object.entries({idle:5,reaction:9,sit:9,rise:9}).map(([name,count]) => [name, Array.from({length:count}, (_,index) => {
    const image = new Image();
    image.src = new URL(`bappu-front-${name}-${String(index).padStart(2,'0')}.png`, assetBase).href;
    return image;
  })]));
  const liftImages = Array.from({length:9}, (_,index) => {
    const image = new Image();
    image.src = new URL(`bappu-lift-${String(index).padStart(2,'0')}.png`, assetBase).href;
    return image;
  });
  const sleepImages = Array.from({length:9}, (_,index) => {
    const image = new Image();
    image.src = new URL(`bappu-sleep-approved-${String(index).padStart(2,'0')}.png`, assetBase).href;
    return image;
  });
  standingImage.src = new URL('bappu-standing-v2.png', assetBase).href;
  // Hand-drawn pixel skin inspired by the supplied reference images of 叭噗.
  // All frames share the same 25 × 23 grid and transparent background.
  const frame = rows => rows.map(row => row.padEnd(25, '.'));
  const idle = frame([
    '....KK.........KK........',
    '...KaaK.......KaaK.......',
    '...KaabK.....KbaaK.......',
    '...KaaabKKKKKbaaaK.......',
    '..KaaaaaaaaaaaaaaaK......',
    '.KaaaagggggaaaaaaaaK.....',
    '.KaaagggggggaaaaaaaK.....',
    'KaaaWWeeWWgWWeeWWaaaK....',
    'KaaWWeeeeWgWeeeeWWaaK....',
    'KaaWWWeeWWgWWeeWWWaaK....',
    'KaaaWWWWWgggWWWWWaaaK....',
    '.KaaaaagggNgggaaaaaK.....',
    '.KkkkaggngnggakkkaaK.....',
    '..KakkkgggggkkkaaaK......',
    '...KKaaaaKaaaaaaKK.......',
    '.....KKKCCCCKKKK.........',
    '......KaaVVVaaaaKKK......',
    '.....KaaaVVVaaaaaaaKK....',
    '....KaaaaVVVaaaaaaaaaK.KK',
    '....KaaaaVVVaaaaaaaKKKK.K',
    '....KaaaaVVVaaaaaaK...KK.',
    '.....KaaKKKKaaKKaaK......',
    '.....KKKK..KKKK.KKK......'
  ]);
  // Two loose cloth ends above the bandaged back.
  for (const [y,x,pixels] of [[12,21,'V..V'],[13,20,'VV.VV'],[14,20,'VVVVV'],[15,21,'VVV'],[16,20,'VVVV']]) {
    idle[y] = idle[y].slice(0,x) + pixels + idle[y].slice(x + pixels.length);
  }
  const walking = idle.map(row => row);
  walking[21] = '.....KaaKKKKaaaKKK.......'.padEnd(25,'.');
  walking[22] = '......KKKK...KKKK........'.padEnd(25,'.');
  const held = idle.map(row => row);
  held[7] = 'KaaaWWeeWWgWWeeWWaaaK....'.padEnd(25,'.');
  held[21] = '......KaaK.....KaaK......'.padEnd(25,'.');
  held[22] = '......KKK.......KKK......'.padEnd(25,'.');
  const sleeping = idle.map(row => row);
  sleeping[7] = 'KaaaaaaaaggaaaaaaaaK.....'.padEnd(25,'.');
  sleeping[8] = 'KaaKKKKKgggKKKKKaaaK.....'.padEnd(25,'.');
  sleeping[9] = 'KaaaaaaaaggaaaaaaaaK.....'.padEnd(25,'.');
  sleeping[10] = 'KaaaaaaaggggaaaaaaaK.....'.padEnd(25,'.');
  const bappu = {
    name:'bappu', author:'IC Gallery', size:{w:45,h:30}, anchor:{x:22,y:30},
    palette:{'.':null,K:'#252a2b',a:'#77817e',b:'#58645f',g:'#53605b',k:'#333e3a',n:'#27302e',N:'#1d2220',C:'#222827',W:'#f5f2df',e:'#2b302b',V:'#e8e5cc'},
    traits:{walkSpeed:1.1,walkFrameTicks:10},
    frames:{idle,walk:[idle,walking],held,sleep:sleeping}
  };
  const grid = document.getElementById('grid');
  const napCover = document.createElement('div');
  napCover.className = 'gallery-cat-nap-cover';
  napCover.hidden = true;
  napCover.setAttribute('aria-hidden', 'true');
  napCover.addEventListener('pointerdown', event => event.preventDefault());
  document.body.append(napCover);
  let bedElement;
  const companion = window.DeskSprite.start({
    desk: false, skin: bappu, accent: '#bd3025', galleryMode: true,
    galleryImages: { standing: walkingImages[0], walking: walkingImages },
    galleryActions: actionImages, galleryFront: frontImages, galleryLift: liftImages, gallerySleep: sleepImages,
    onGalleryBedMove(x,y) { if (bedElement) return positionProp(bedElement,x,y); },
    onGalleryCatPosition(x,y) { orientWand(x,y); },
    galleryDestination() {
      const options = [...grid.querySelectorAll('.card-open')].filter(node => {
        const box = node.getBoundingClientRect();
        return box.width > 90 && box.height > 60 && box.top >= 35 && box.bottom <= innerHeight - 35;
      });
      return options.length ? options[Math.floor(Math.random()*options.length)] : null;
    },
    onGalleryRest(element) {
      const box = element.getBoundingClientRect();
      Object.assign(napCover.style, {left:box.left+'px',top:box.top+'px',width:box.width+'px',height:box.height+'px'});
      napCover.hidden = false;
    },
    onGalleryWake() { napCover.hidden = true; }
  });
  document.querySelector('.desksprite-free')?.setAttribute('aria-hidden','true');

  const svg = name => `<span class="bappu-art-clip bappu-art-${name}"><img src="${new URL(`bappu-prop-${name}.png`,assetBase).href}" alt="" draggable="false"></span>`;
  const dock=document.createElement('div');
  dock.className='bappu-dock';
  dock.innerHTML=`<div class="bappu-menu" hidden><p class="bappu-empty">背包还是空的</p><button type="button" data-item="food">${svg('food')}<span>猫粮饭盆</span></button><button type="button" data-item="bed">${svg('bed')}<span>舒适猫窝</span></button><button type="button" data-item="wand">${svg('wand')}<span>逗猫棒</span></button></div><button type="button" class="bappu-unlock" hidden>!</button><button type="button" class="bappu-bag" aria-label="打开叭噗的背包" aria-expanded="false">${svg('bag')}</button><div class="bappu-hint" role="status" hidden></div>`;
  document.body.append(dock);
  const bag=dock.querySelector('.bappu-bag'),menu=dock.querySelector('.bappu-menu'),hint=dock.querySelector('.bappu-hint');
  const props={}; let placing=null,wandActive=false,hintTimer;
  const translate=(zh,en)=>window.ICGalleryI18n?.t(zh,en)??zh;
  function translatePetControls(){
    const open=bag.getAttribute('aria-expanded')==='true';
    bag.setAttribute('aria-label',translate(open?'收起叭噗的背包':'打开叭噗的背包',open?"Close Bappu's backpack":"Open Bappu's backpack"));
    for(const [key,zh,en] of [['food','猫粮饭盆','Food bowl'],['bed','舒适猫窝','Cat bed'],['wand','逗猫棒','Teaser wand']]){
      const button=menu.querySelector(`[data-item="${key}"]`);button.hidden=!window.ICGalleryCollection.has(key);
      button.querySelector('span:last-child').textContent=translate(zh,en);
      props[key]?.querySelector('button')?.setAttribute('aria-label',translate('收起'+zh,'Put away '+en.toLowerCase()));
    }
    menu.querySelector('.bappu-empty').hidden=['food','bed','wand'].some(key=>window.ICGalleryCollection.has(key));
    menu.querySelector('.bappu-empty').textContent=translate('背包还是空的','The backpack is empty');
    const unlock=dock.querySelector('.bappu-unlock');unlock.hidden=!window.ICGalleryCollection.complete||window.ICGalleryCollection.unlocked;
    unlock.setAttribute('aria-label',translate('解锁礼弥主题','Unlock the Reimi theme'));
    hint.hidden=true;
  }
  document.addEventListener('ic-gallery-language-change',translatePetControls);
  document.addEventListener('ic-gallery-collection-change',translatePetControls);
  dock.querySelector('.bappu-unlock').addEventListener('click',()=>{window.ICGalleryCollection.unlock();translatePetControls();message(translate('礼弥主题已解锁','Reimi theme unlocked'));});
  translatePetControls();
  function orientWand(x,y) {
    const wand=props.wand, img=wand?.querySelector('img');
    if(!img)return;
    const box=wand.getBoundingClientRect(),dx=x-(box.left+box.width/2);
    img.style.transform=`scaleX(${dx<0 ? -1 : 1}) scale(1.1)`;
  }
  function message(text){hint.textContent=text;hint.hidden=false;clearTimeout(hintTimer);hintTimer=setTimeout(()=>hint.hidden=true,2200);}
  function positionProp(el,x,y){
    const halfW=(el.offsetWidth||80)/2,halfH=(el.offsetHeight||50)/2;
    x=Math.max(halfW,Math.min(innerWidth-halfW,x));y=Math.max(halfH,Math.min(innerHeight-halfH,y));
    // Leave enough room above a bowl for the cat's visible eating sprite.
    if(el.dataset.prop==='food') y=Math.max(Math.min(innerHeight-halfH,74),y);
    el.style.left=x+'px';el.style.top=y+'px'; return {x,y};
  }
  function removeProp(name){
    if(props[name]){companion.galleryCancelProp(name);props[name].remove();delete props[name];}
    if(name==='wand')wandActive=false;
  }
  function createProp(name,x,y){
    if(props[name])removeProp(name);
    const el=document.createElement('div');el.className='bappu-prop bappu-prop-'+name;el.dataset.prop=name;
    el.innerHTML=`<div class="bappu-prop-art">${svg(name)}</div><button type="button" class="bappu-prop-remove">×</button>`;
    document.body.append(el);props[name]=el;if(name==='bed')bedElement=el;
    translatePetControls();
    const point=positionProp(el,x,y);
    el.querySelector('button').addEventListener('click',event=>{event.stopPropagation();removeProp(name);});
    if(name!=='wand')el.querySelector('.bappu-prop-art').addEventListener('pointerdown',event=>{
      event.preventDefault(); event.stopPropagation();
      const cat=document.querySelector('.desksprite-free'),together=name==='bed' && cat?.dataset.behavior==='prop-bed';
      if(!together)companion.galleryCancelProp(name);
      const box=el.getBoundingClientRect(),dx=event.clientX-(box.left+box.width/2),dy=event.clientY-(box.top+box.height/2);
      const move=e=>{const p=positionProp(el,e.clientX-dx,e.clientY-dy);if(together)companion.galleryMoveProp('bed',p.x,p.y);};
      const end=e=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',end);window.removeEventListener('pointercancel',end);const p=positionProp(el,e.clientX-dx,e.clientY-dy);if(!together)companion.galleryUseProp(name,p.x,p.y);};
      window.addEventListener('pointermove',move);window.addEventListener('pointerup',end);window.addEventListener('pointercancel',end);
    });
    if(!companion.galleryUseProp(name,point.x,point.y) && name!=='wand') message(translate('放近叭噗一些，它才会注意到哦','Place it closer to Bappu'));
  }
  bag.addEventListener('click',()=>{menu.hidden=!menu.hidden;bag.setAttribute('aria-expanded',String(!menu.hidden));translatePetControls();});
  menu.addEventListener('click',event=>{
    const button=event.target.closest('[data-item]');if(!button)return;
    const name=button.dataset.item;menu.hidden=true;bag.setAttribute('aria-expanded','false');
    if(name==='wand' && wandActive){removeProp('wand');placing=null;return;}
    if(name==='wand'){placing=null;wandActive=true;message(translate('移动鼠标或手指逗叭噗，按 Esc 收起','Move the pointer to play; press Esc to put it away'));return;}
    if(props[name]){removeProp(name);placing=null;return;}
    placing=name;message(translate('点击画面放置道具','Click the page to place the item'));
  });
  document.addEventListener('pointerdown',event=>{
    if(!placing || event.target.closest('.bappu-dock,.bappu-prop'))return;
    event.preventDefault();event.stopPropagation();const name=placing;placing=null;createProp(name,event.clientX,event.clientY);
  },true);
  function moveWand(event){
    if(!wandActive || document.getElementById('lightbox')?.open)return;
    if(event.pointerType==='touch' && event.type==='pointermove' && !event.buttons)return;
    if(!props.wand)createProp('wand',event.clientX,event.clientY);
    else {const p=positionProp(props.wand,event.clientX,event.clientY);companion.galleryMoveProp('wand',p.x,p.y);}
    const cat=document.querySelector('.desksprite-free')?.getBoundingClientRect();
    if(cat)orientWand(cat.left+cat.width/2,cat.top+cat.height/2);
  }
  document.addEventListener('pointermove',moveWand);
  document.addEventListener('pointerdown',moveWand);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){placing=null;removeProp('wand');menu.hidden=true;bag.setAttribute('aria-expanded','false');}});
  window.addEventListener('resize',()=>{for(const el of Object.values(props)){const b=el.getBoundingClientRect();const p=positionProp(el,b.left+b.width/2,b.top+b.height/2);companion.galleryMoveProp(el.dataset.prop,p.x,p.y);}});
})();
