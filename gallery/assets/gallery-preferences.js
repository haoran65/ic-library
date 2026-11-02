/* Local display preferences; no changes to figure metadata or URL state. */
(() => {
  'use strict';
  const root=document.documentElement;
  let lang=root.lang==='en'?'en':'zh';
  const stored=(key,value)=>{try{localStorage.setItem(key,value)}catch{}};
  const staticText={
    '.skip-link':'Skip to figures',
    '.edition':'01 / INTEGRATED CIRCUITS',
    '#page-title':'See the structure.<br>Find your figure<span class="red">.</span>',
    '.intro-description':'Figure references from integrated circuits, EDA and computer architecture papers.<br>Explore how research is expressed through frameworks, workflows and device connections.',
    '.statistics>div:nth-child(1) span':'Reference figures',
    '.statistics>div:nth-child(2) span':'Research papers',
    '.statistics>div:nth-child(3) span':'Venues',
    '.search-field label':'Search the gallery <span>SEARCH THE INDEX</span>',
    '.sort-field label':'Sort <span>SORT BY</span>',
    '#sort option[value="year"]':'Date · Newest first',
    '#sort option[value="citations"]':'Citations · Highest first',
    '#sort option[value="title"]':'Title · A—Z',
    '.filter-hint':'Swipe horizontally for more sources and patterns →',
    '.filter-row:nth-of-type(1) h2':'Source<span>SOURCE</span>',
    '.filter-row:nth-of-type(2) h2':'Year<span>YEAR</span>',
    '.filter-row:nth-of-type(3) h2':'Pattern<span>PATTERN</span>',
    '.gallery-heading h2':'Figure references',
    '#reset':'Reset filters ↗',
    '#empty h3':'No matching figures',
    '#empty p':'Try fewer keywords or adjust the source, year and pattern.',
    '#empty-reset':'View all figures',
    '#more':'Show more <span>＋ 48</span>',
    '.footer-brand span':'Discover expression in structure.',
    '.footer-notes p:nth-child(2)':'Figures belong to their authors. Check their licenses before reuse.',
    '.footer-notes p:nth-child(3)':'Citation counts come from a local OpenAlex cache and are not live. Figure classifications are preliminary unless manually confirmed. Classifications require review.',
    '#lb-close':'Close ×',
    '#zoom-fit':'Fit',
    '#lb-keyword-heading':'Paper keywords <span>KEYWORDS</span>',
    '#lb-keyword-empty':'Original keywords are not available for this paper.',
    '.lb-info dl>div:nth-child(1) dt':'Citations',
    '.lb-info dl>div:nth-child(2) dt':'Published',
    '.lb-info dl+h3':'Caption <span>CAPTION</span>',
    '#lb-paper':'View paper ↗',
    '#lb-share':'Copy figure link',
    '#welcome-open':'Note',
    '#clues-title':"Three small poems from Bappu",
    '#clues-intro':'Each poem hides a number. Search for # and that number to discover what Bappu left behind.',
    '#clue-title-one':'I',
    '#clue-title-two':'II',
    '#clue-title-three':'III',
    '#clue-food':'Eight squares on each side,<br>paws cross the black and white world,<br>one step beyond the board.',
    '#clue-bed':'One star short of a thousand,<br>thirteen butterflies each take thirteen,<br>three more fall at dawn.',
    '#clue-wand':'The breath that feeds a flame,<br>a light metal inside batteries,<br>the lightest drifts through stars.',
    '#hint-label-one':'A small hint',
    '#hint-label-two':'A small hint',
    '#hint-label-three':'A small hint',
    '#hint-one':'Think of a black-and-white chessboard and the step beyond it.',
    '#hint-two':'Subtract the stars carried away and the ones that fell from the original count.',
    '#hint-three':'Think of three elements, then put their atomic numbers in the order of the poem.',
    '#welcome-title':'A note before you begin',
    '#welcome-copy':'<p>This small vibe-coded project is built on the wonderful open-source <a href="https://github.com/qwdwqfwq/topconf-paper-figure-gallery" target="_blank" rel="noopener">Top-Conf Figure Gallery</a>. My thanks to everyone who contributed to the original project.</p><p>The Gallery is still a work in progress. More figures and content are on the way, and the text-to-image feature is being migrated. The figures have not yet been accurately classified by hand, so search is the best way to find what you need.</p><p>There is also a little cat here named Bappu. Its three favorite things are scattered throughout the Gallery. Help find them, and something interesting might happen :)</p>',
    '#welcome-close':'Enter Gallery <span aria-hidden="true">↗</span>',
    '.library-return span':'RESEARCH EXPRESSION / IC GALLERY'
  };
  const originals=new Map();
  for(const [selector,en] of Object.entries(staticText)){const node=document.querySelector(selector);if(node)originals.set(node,{zh:node.innerHTML,en});}
  const attributes=[
    ['.wordmark','aria-label','IC Figure Gallery 首页','IC Figure Gallery home'],
    ['.browse','aria-label','搜索与筛选','Search and filters'],
    ['#search','placeholder','论文标题、作者、关键词或编号，如 memory、ADC、#65…','Paper title, author, keyword or number, e.g. memory, ADC, #65…'],
    ['#venue-chips','aria-label','来源筛选','Filter by source'],
    ['#year-chips','aria-label','年份筛选','Filter by year'],
    ['#pattern-chips','aria-label','模式筛选','Filter by pattern'],
    ['#lb-prev','aria-label','上一张图片','Previous figure'],
    ['#lb-next','aria-label','下一张图片','Next figure'],
    ['#lb-close','aria-label','关闭大图','Close figure'],
    ['#zoom-out','aria-label','缩小图片','Zoom out'],
    ['#zoom-in','aria-label','放大图片','Zoom in']
  ];
  function apply(){
    root.lang=lang==='en'?'en':'zh-CN';
    for(const [node,translations] of originals)node.innerHTML=translations[lang];
    for(const [selector,attribute,zh,en] of attributes)document.querySelector(selector)?.setAttribute(attribute,lang==='en'?en:zh);
    const note=document.querySelector('.header-note');if(note)for(const node of note.childNodes)if(node.nodeType===Node.TEXT_NODE&&node.textContent.trim())node.textContent=lang==='en'?'IC GALLERY ':'IC GALLERY ';
    document.title=lang==='en'?'IC Figure Gallery · Integrated Circuit Figure References':'IC Figure Gallery · 集成电路论文绘图参考';
    const language=document.getElementById('language-toggle');language.textContent=lang==='en'?'中文':'EN';language.setAttribute('aria-label',lang==='en'?'切换为中文':'Switch language to English');
    const theme=document.getElementById('theme-toggle'),current=root.dataset.theme;
    const next=current==='dark'?'light':current==='light'&&window.ICGalleryCollection?.unlocked?'reimi':current==='reimi'?'dark':current==='light'?'dark':'light';
    const themeName=value=>value==='reimi'?(lang==='en'?'Reimi':'礼弥'):value==='light'?(lang==='en'?'Light':'浅色'):(lang==='en'?'Dark':'深色');
    const label=themeName(current),nextLabel=themeName(next);
    theme.querySelector('.theme-label').textContent=label;
    const icon=theme.querySelector('[aria-hidden]');icon.classList.toggle('theme-hydrangea',current==='reimi');icon.textContent=current==='reimi'?'':current==='dark'?'☾':'☀';
    theme.setAttribute('aria-label',lang==='en'?'Current theme: '+label+'. Switch to '+nextLabel+' theme':'当前主题：'+label+'；切换到'+nextLabel+'主题');
    theme.setAttribute('aria-pressed',String(current!=='light'));
  }
  window.ICGalleryI18n={get lang(){return lang},t:(zh,en)=>lang==='en'?en:zh};
  document.getElementById('language-toggle').addEventListener('click',()=>{lang=lang==='zh'?'en':'zh';stored('ic-gallery-language',lang);apply();document.dispatchEvent(new CustomEvent('ic-gallery-language-change',{detail:{lang}}));});
  document.getElementById('theme-toggle').addEventListener('click',()=>{const current=root.dataset.theme;root.dataset.theme=current==='dark'?'light':current==='light'&&window.ICGalleryCollection?.unlocked?'reimi':current==='reimi'?'dark':'dark';stored('ic-gallery-theme',root.dataset.theme);apply();});
  document.addEventListener('ic-gallery-unlock-theme',()=>{root.dataset.theme='reimi';stored('ic-gallery-theme','reimi');apply();});
  apply();
})();
