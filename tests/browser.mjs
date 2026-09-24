import { analyzeDOM, defaultFilter } from '../dist/index.js';
const report={passed:0,failed:0,tests:[],benchmarks:[],userAgent:navigator.userAgent};
const assert=(x,msg)=>{if(!x)throw new Error(msg)}, all=m=>Object.values(m.nodes), text=(m,t)=>all(m).find(n=>n.semantic.text===t);
function validate(m){
 assert(m.nodes[m.rootId],'root');assert(m.stats.scannedElements===m.stats.includedElements+m.stats.ignoredElements,'counts');
 const seen=new Set(),stack=[m.rootId];while(stack.length){const id=stack.pop(),n=m.nodes[id];assert(!seen.has(id),'cycle/duplicate');seen.add(id);
 for(const c of n.structure.childrenIds){assert(m.nodes[c]?.structure.parentId===id,'bidirectional edge');stack.push(c)}
 if(n.design)assert(m.styles[n.design.styleRef],'style exists');assert(m.scopes[n.structure.scopeId],'scope exists')}
 assert(seen.size===all(m).length,'connected tree');
}
async function using(name,fn){const frame=document.createElement('iframe');frame.style='width:1000px;height:700px;display:block';await new Promise((ok,no)=>{frame.onload=ok;frame.onerror=no;frame.src=`fixtures/${name}.html`;document.body.append(frame)});try{await fn(frame.contentDocument)}finally{frame.remove()}}
async function test(name,fn){try{await fn();report.passed++;report.tests.push({name,status:'passed'})}catch(e){report.failed++;report.tests.push({name,status:'failed',error:String(e.stack||e)})}}
await test('product: semantic roles, labels, reparenting, no duplicate child text',()=>using('product',d=>{
 const m=analyzeDOM(d);validate(m);assert(text(m,'Studio Headphones')?.semantic.role==='heading','heading');
 const buy=text(m,'구매하기');assert(buy?.interaction.interactive,'buy');assert(m.nodes[buy.structure.parentId].identity.tag==='main','collapsed wrappers');
 assert(all(m).filter(n=>n.semantic.text==='구매하기').length===1,'dedup text');assert(all(m).find(n=>n.identity.tag==='select')?.semantic.name==='색상','label');assert(all(m).some(n=>n.semantic.name==='위시리스트'),'ARIA');
}));
await test('form: values, editable content, private subtree and state excluded',()=>using('form',d=>{
 d.querySelector('input').value='SECRET_RUNTIME';d.querySelector('textarea').value='SECRET_RUNTIME_TEXTAREA';const m=analyzeDOM(d);validate(m);
 assert(!JSON.stringify(m).includes('SECRET_'),'secret leaked');assert(all(m).find(n=>n.interaction.inputType==='email')?.semantic.name==='Email address','label');assert(all(m).some(n=>n.interaction.inputType==='password'),'password metadata');assert(text(m,'Disabled action')?.interaction.disabled,'disabled fieldset');
}));
await test('nested: anonymous wrappers collapse, grid/card retained',()=>using('nested',d=>{const m=analyzeDOM(d);validate(m);assert(m.nodes[text(m,'Keep this action').structure.parentId].identity.tag==='main','reparent');assert(all(m).filter(n=>n.identity.tag==='div').length===2,'visual containers')}));
await test('visibility: overrides, offscreen, hidden helper, boxless parent, SVG',()=>using('hidden',d=>{
 const m=analyzeDOM(d);validate(m);for(const s of ['HIDDEN_DISPLAY','HIDDEN_VISIBILITY','HIDDEN_OPACITY','CLOSED_DETAILS'])assert(!JSON.stringify(m).includes(s),s);
 for(const s of ['Restored visibility','Contents child','Overflow child','Details summary'])assert(text(m,s),s);
 assert(text(m,'Below fold')?.layout.visible&&!text(m,'Below fold').layout.inViewport,'below fold');assert(!text(m,'Offscreen')?.layout.inViewport,'offscreen');
 assert(all(m).some(n=>n.semantic.name==='Accessible hidden name'),'hidden reference');assert(!text(m,'Accessible hidden name'),'helper excluded');assert(text(m,'Decorative action')?.semantic.ariaHidden,'ARIA inheritance');assert(all(m).some(n=>n.identity.tag==='svg')&&!all(m).some(n=>n.identity.tag==='path'),'SVG');
}));
await test('shadow: nested open roots, slots, scope names, closed root ignored',()=>using('shadow',d=>{
 const m=analyzeDOM(d);validate(m);for(const s of ['UNASSIGNED_LIGHT','UNUSED_FALLBACK','CLOSED_SHADOW_SECRET'])assert(!JSON.stringify(m).includes(s),s);
 assert(all(m).filter(n=>n.semantic.text==='Slotted buy').length===1,'slotted once');assert(text(m,'Nested shadow action'),'nested');assert(all(m).some(n=>n.semantic.name==='Shadow label'),'scope IDREF');assert(Object.keys(m.scopes).length===3,'scopes');
}));
await test('iframe: same and opaque origins recorded as boundaries',()=>using('frames',d=>{const m=analyzeDOM(d);validate(m);assert(all(m).filter(n=>n.boundary?.iframe==='not-traversed').length===2,'boundaries');assert(!JSON.stringify(m).includes('_PRIVATE'),'no frame access')}));
await test('determinism, exact styles, opt-out, no DOM mutations',()=>using('product',d=>{
 const observer=new MutationObserver(()=>{});observer.observe(d,{subtree:true,attributes:true,childList:true,characterData:true});const a=analyzeDOM(d),b=analyzeDOM(d);const changes=observer.takeRecords();observer.disconnect();assert(!changes.length,'DOM writes');
 a.stats.scanDurationMs=b.stats.scanDurationMs=0;assert(JSON.stringify(a)===JSON.stringify(b),'deterministic');const buttons=all(a).filter(n=>n.identity.tag==='button');assert(buttons[0].design.styleRef===buttons[1].design.styleRef,'dedup');
 const m=analyzeDOM(d,{styles:false});assert(!m.styles&&m.stats.uniqueStyles===0&&all(m).every(n=>!n.design),'styles opt out');
}));
await test('budget, custom filter, privacy hooks, identity opt-in',()=>using('product',d=>{
 const tiny=analyzeDOM(d,{maxElements:8});validate(tiny);assert(tiny.coverage.truncated&&tiny.stats.scannedElements===8,'budget');
 const m=analyzeDOM(d,{privacy:{excludeSelectors:['section'],redact:s=>s.replace('Studio','Example')},filter:c=>c.element.localName==='select'?'exclude-subtree':defaultFilter(c)});
 assert(text(m,'Example Headphones'),'redaction');assert(!all(m).some(n=>['section','select'].includes(n.identity.tag)),'exclusion');assert(!all(m).some(n=>n.identity.id||n.identity.classes),'identity off');assert(all(analyzeDOM(d,{privacy:{includeIdentity:true}})).some(n=>n.identity.id==='buy'),'identity on');
}));
await test('never reads control value getters; IDREF cannot leak textarea',()=>using('form',d=>{
 for(const el of d.querySelectorAll('input,textarea,select'))Object.defineProperty(el,'value',{get(){throw new Error('value read')}});
 const b=d.createElement('button');b.setAttribute('aria-labelledby','notes');b.textContent='Safe';d.body.append(b);assert(!JSON.stringify(analyzeDOM(d)).includes('SECRET_'),'IDREF privacy');
}));
await test('interaction evidence, inert, tabindex, URL redaction',()=>using('nested',d=>{
 const e=d.createElement('section');e.innerHTML='<a href="https://user:pw@example.com/account?auth=SECRET#token">Link</a><div tabindex="0">Focusable</div><div onclick="void 0">Handler</div><div style="cursor:pointer">Pointer</div><div inert><button>Inert action</button></div><div role="switch" aria-disabled="true">Switch</div>';d.body.append(e);const m=analyzeDOM(d);validate(m);
 assert(text(m,'Link').interaction.href==='https://example.com','href');assert(text(m,'Focusable').interaction.focusable,'focus');assert(text(m,'Handler').interaction.evidence.includes('onclick'),'handler');assert(text(m,'Pointer').interaction.evidence.includes('cursor'),'pointer');assert(text(m,'Inert action').interaction.inert&&!text(m,'Inert action').interaction.clickable,'inert');assert(text(m,'Switch').interaction.disabled,'ARIA disabled');
}));
await test('privacy through labels/shadow; nested helper and content-visibility',()=>using('hidden',d=>{
 const area=d.createElement('section');area.innerHTML='<span class="sr"><b>NESTED_HELPER_SECRET</b></span><div style="content-visibility:hidden">CONTENT_VISIBILITY_SECRET</div><div data-private><span id="private-label">PRIVATE_LABEL_SECRET</span></div><button aria-labelledby="private-label">Public action</button><h2>Public <span contenteditable>EDITABLE_NAME_SECRET</span> title</h2><private-host data-private></private-host>';
 area.querySelector('private-host').attachShadow({mode:'open'}).innerHTML='<button>SHADOW_PRIVATE_SECRET</button>';d.body.append(area);
 const m=analyzeDOM(d);validate(m);assert(!JSON.stringify(m).includes('_SECRET'),'private/hidden text escaped');
}));
await test('limits and structural root when whole document is hidden',()=>using('nested',d=>{
 for(const options of [{maxElements:0},{maxTextLength:-1},{privacy:{excludeSelectors:['[']}}]){let threw=false;try{analyzeDOM(d,options)}catch{threw=true}assert(threw,'bad options fail')}
 d.documentElement.style.display='none';const m=analyzeDOM(d);validate(m);assert(all(m).length===1&&!m.nodes[m.rootId].layout.visible,'structural root only');
}));
await test('large fixture: invariants, compression and measured benchmark',()=>using('nested',d=>{
 const section=d.createElement('section');for(let i=0;i<1000;i++){const card=d.createElement('div');card.innerHTML=`<div><div><h2>Product ${i}</h2><button>Buy</button></div></div>`;section.append(card)}d.body.append(section);analyzeDOM(d);let m;const runs=[];
 for(let i=0;i<5;i++){m=analyzeDOM(d);runs.push(m.stats.scanDurationMs)}validate(m);assert(m.stats.scannedElements>5000,'count');assert(m.stats.ignoredElements>2500,'compressed');assert(m.stats.uniqueStyles<30,'dedup');report.benchmarks.push({fixture:'1000 product cards',physicalDocumentElements:d.querySelectorAll('*').length,...m.stats,runsMs:runs,jsonBytes:new TextEncoder().encode(JSON.stringify(m)).length});
}));
document.querySelector('#results').textContent=JSON.stringify(report,null,2);document.documentElement.dataset.testStatus=report.failed?'failed':'passed';
