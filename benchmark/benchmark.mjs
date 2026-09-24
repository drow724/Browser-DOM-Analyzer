import { analyzeDOM } from '../dist/index.js';
const products=document.querySelector('#products'), metrics=document.querySelector('#metrics');let result;
function generate(){
 const count=Math.max(1,Math.min(10000,Number(document.querySelector('#count').value)||1000));
 const fragment=document.createDocumentFragment();
 for(let i=0;i<count;i++){
  const card=document.createElement('article');card.className='card';
  const wrapper=document.createElement('div'),inner=document.createElement('div');
  const heading=document.createElement('h2');heading.textContent=`Studio headphones ${i+1}`;
  const badge=document.createElement('span');badge.className='badge';badge.textContent='Audio / Studio';
  const price=document.createElement('p');price.className='price';price.textContent='₩129,000';
  const buy=document.createElement('button');buy.textContent='구매하기';
  inner.append(badge,heading,price,buy);wrapper.append(inner);card.append(wrapper);fragment.append(card);
 }
 products.replaceChildren(fragment);result=undefined;document.querySelector('#download').disabled=true;document.querySelector('#json').textContent='분석 버튼을 누르세요.';metrics.textContent=`${count.toLocaleString()}개 상품 생성 완료`;
}
document.querySelector('#generate').onclick=generate;
document.querySelector('#analyze').onclick=()=>{
 result=analyzeDOM(document);console.log(result);
 const s=result.stats;
 const entries=[['Scanned Elements',s.scannedElements],['Included Nodes',s.includedElements],['Ignored Nodes',s.ignoredElements],['Unique Styles',s.uniqueStyles],['Analysis Time',s.scanDurationMs+' ms']];
 metrics.replaceChildren(...entries.map(([label,value])=>{const e=document.createElement('div');e.className='metric';const number=document.createElement('strong'),caption=document.createElement('span');number.textContent=typeof value==='number'?value.toLocaleString():value;caption.textContent=label;e.append(number,caption);return e}));
 document.querySelector('#json').textContent=JSON.stringify(result,null,2);document.querySelector('#download').disabled=false;
};
document.querySelector('#download').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='site-dom-model.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
generate();
