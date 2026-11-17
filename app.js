import {recordAccessOnce} from './access-counter.js';
import {initial,status,step,hint} from './engine.js';
const $=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg';
const colors=['#cf6556','#5286b6','#d5a334','#6c9a69','#9576b5','#4a9b9b','#bd7797','#9a8155','#6277aa','#aa7048','#548a43','#bb5d79','#7f8941','#637c8b'];
let puzzles,solutions,index=0,paths=[],history=[],drag=null,highlight=null,won=false,sound=false,audio;
let records={};try{records=JSON.parse(localStorage.getItem('numberlink-cleared')||'{}')||{};sound=localStorage.getItem('numberlink-sound')==='true'}catch{}
function save(){try{localStorage.setItem('numberlink-cleared',JSON.stringify(records));localStorage.setItem('numberlink-sound',String(sound))}catch{}}
function svg(tag,attrs,parent=$('board')){let e=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);parent.append(e);return e}
function selectors(){const host=$('selection');host.replaceChildren();for(const level of ['初級','中級','上級']){let section=document.createElement('div');let label=document.createElement('div');label.className='level-label';label.textContent=level+' · '+({初級:'5 × 5',中級:'7 × 7',上級:'9 × 9'}[level]);section.append(label);let group=document.createElement('div');group.className='puzzle-group';puzzles.forEach((p,i)=>{if(p.level!==level)return;let b=document.createElement('button');b.textContent=String(p.id).padStart(2,'0');b.className='puzzle-choice'+(i===index?' active':'')+(records[p.id]?' solved':'');b.setAttribute('aria-label',`問題${p.id}${records[p.id]?' クリア済み':''}`);b.setAttribute('aria-pressed',String(i===index));b.onclick=()=>load(i);group.append(b)});section.append(group);host.append(section)}$('cleared').textContent=`${puzzles.filter(p=>records[p.id]).length} / 10`}
function load(i){if(drag)finish(true);index=i;paths=initial(puzzles[i]);history=[];highlight=null;won=false;selectors();$('difficulty').textContent=`${puzzles[i].level} / ${puzzles[i].size} × ${puzzles[i].size}`;$('puzzle-title').textContent=`問題 ${String(i+1).padStart(2,'0')}`;$('position').textContent=`${i+1} / 10`;$('prev').disabled=!i;$('next').disabled=i===9;render()}
function render(message){const p=puzzles[index],n=p.size,s=status(p,paths);$('board').setAttribute('viewBox',`0 0 ${n*50} ${n*50}`);$('board').replaceChildren();for(let c=0;c<n*n;c++)svg('rect',{x:c%n*50,y:Math.floor(c/n)*50,width:50,height:50,class:'grid-cell'});
 paths.forEach((line,k)=>{if(line.length>1)svg('polyline',{points:line.map(c=>`${c%n*50+25},${Math.floor(c/n)*50+25}`).join(' '),fill:'none',stroke:colors[k], 'stroke-width':11,'stroke-linecap':'round','stroke-linejoin':'round',opacity:.85})});
 if(highlight)svg('line',{x1:highlight.from%n*50+25,y1:Math.floor(highlight.from/n)*50+25,x2:highlight.to%n*50+25,y2:Math.floor(highlight.to/n)*50+25,stroke:colors[highlight.k],'stroke-width':8,'stroke-dasharray':'4 6','stroke-linecap':'round'});
 p.pairs.forEach((pair,k)=>pair.forEach(c=>{const g=svg('g',{class:'endpoint',tabindex:0,role:'button','aria-label':`数字${k+1}、${Math.floor(c/n)+1}行${c%n+1}列`,'data-cell':c});svg('circle',{cx:c%n*50+25,cy:Math.floor(c/n)*50+25,r:17,fill:colors[k]},g);const t=svg('text',{x:c%n*50+25,y:Math.floor(c/n)*50+25,'text-anchor':'middle','dominant-baseline':'central',fill:'white','font-size':23,'font-weight':700,'pointer-events':'none'},g);t.textContent=k+1;g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(drag)finish();else start(c)}}}));
 $('connections').textContent=`${s.connected} / ${p.pairs.length} ペア`;$('undo').disabled=!history.length&&!drag;
 $('message').textContent=message||(s.clear?'クリア！すべてのマスがつながりました。':s.connected===p.pairs.length?'数字はすべてつながりました。でも、まだ空白のマスがあります！':'数字からドラッグして、同じ数字につなげましょう。');
 const cleared=s.clear&&!drag;
 $('celebration').hidden=!cleared;
 $('next').classList.toggle('next-ready',cleared&&index<9);
 $('celebration-note').textContent=index===9?'全10問、おつかれさまでした！':'次の問題にも挑戦してみましょう。';
 if(!cleared)$('board').closest('.board-wrap').classList.remove('win');
 if(s.clear&&!drag&&!won){won=true;records[p.id]=true;save();selectors();const wrap=$('board').closest('.board-wrap');wrap.classList.remove('win');void wrap.getBoundingClientRect();wrap.classList.add('win');play()}
}
function start(c,pointer=null){if(drag)return;const k=puzzles[index].pairs.findIndex(pair=>pair.includes(c));if(k<0)return;drag={k,before:structuredClone(paths),pointer};paths[k]=[c];highlight=null;won=false;render()}
function completedDrag(){
 if(!drag)return false;
 const line=paths[drag.k],pair=puzzles[index].pairs[drag.k];
 return line.length>1&&pair.includes(line.at(-1))&&line[0]!==line.at(-1);
}
function move(c){
 if(!drag||!step(puzzles[index],paths,drag.k,c))return;
 highlight=null;
 // The endpoint is a commit boundary: later cancel/lost-capture events cannot undo it.
 if(completedDrag())finish();else render();
}
function finish(cancel=false){
 if(!drag)return;
 const {before,pointer}=drag;
 const keep=!cancel||completedDrag();
 drag=null; // Clear before releasing capture: lostpointercapture may follow synchronously.
 if(!keep)paths=before;
 else if(JSON.stringify(before)!==JSON.stringify(paths))history.push(before);
 if(pointer!==null&&$('board').hasPointerCapture(pointer))$('board').releasePointerCapture(pointer);
 render();
}
function cell(e){const b=$('board').getBoundingClientRect(),n=puzzles[index].size,x=Math.floor((e.clientX-b.left)/b.width*n),y=Math.floor((e.clientY-b.top)/b.height*n);return x>=0&&x<n&&y>=0&&y<n?y*n+x:null}
function pointerSample(e){
 if(!drag||drag.pointer!==e.pointerId)return;
 const c=cell(e);if(c===null)return;
 const n=puzzles[index].size,last=paths[drag.k].at(-1);
 if(Math.floor(c/n)===Math.floor(last/n)||c%n===last%n){
  const delta=c===last?0:Math.floor(c/n)===Math.floor(last/n)?Math.sign(c-last):Math.sign(c-last)*n;
  if(delta)for(let v=last+delta;drag&&(delta>0?v<=c:v>=c);v+=delta){
   const before=paths[drag.k].at(-1);move(v);
   if(!drag||paths[drag.k].at(-1)===before)break;
  }
 }else move(c);
}
$('board').onpointerdown=e=>{
 if(e.button!==0||drag)return;
 const c=cell(e);if(c===null||!puzzles[index].pairs.some(pair=>pair.includes(c)))return;
 e.preventDefault();
 // Capture on the persistent SVG BEFORE start() replaces the endpoint DOM.
 // Otherwise removal of the implicit touch capture target can cancel the drag.
 $('board').setPointerCapture(e.pointerId);
 start(c,e.pointerId);
 try{audio??=sound?new (window.AudioContext||window.webkitAudioContext)():null;audio?.resume()}catch{}
};
$('board').onpointermove=e=>{
 if(!drag||drag.pointer!==e.pointerId)return;
 const samples=e.getCoalescedEvents?.()||[];
 for(const sample of samples)pointerSample(sample);
 pointerSample(e);
};
$('board').onpointerup=e=>{
 if(drag?.pointer!==e.pointerId)return;
 pointerSample(e); // Some devices report the final cell only on pointerup.
 if(drag?.pointer===e.pointerId)finish();
};
$('board').onpointercancel=e=>{if(drag?.pointer===e.pointerId)finish(true)};
$('board').onlostpointercapture=e=>{if(drag?.pointer===e.pointerId)finish(true)};
document.addEventListener('keydown',e=>{if(!drag)return;if(e.key==='Escape'){finish(true);return}const n=puzzles[index].size,c=paths[drag.k].at(-1),delta={ArrowUp:-n,ArrowDown:n,ArrowLeft:-1,ArrowRight:1}[e.key];if(delta){e.preventDefault();const next=c+delta;if(next>=0&&next<n*n)move(next)}else if(e.key==='Enter'){e.preventDefault();finish()}});
$('undo').onclick=()=>{if(drag)finish(true);else if(history.length){paths=history.pop();highlight=null;won=false;render()}};
$('reset').onclick=()=>{if(drag)finish(true);if(paths.some(p=>p.length)){history.push(structuredClone(paths));paths=initial(puzzles[index]);highlight=null;won=false;render()}};
$('hint').onclick=()=>{if(drag)finish();const h=hint(puzzles[index],paths,solutions[puzzles[index].id]);highlight=h.error?null:h.k!==undefined?h:null;render(h.error?'現在の線の引き方では正解に到達できません。Undoかリセットで線を見直しましょう。':h.k!==undefined?`数字${h.k+1}：点線の方向へ1マス進めてみましょう。`:'すべてのマスがつながっています。')};
$('prev').onclick=()=>load(index-1);$('next').onclick=()=>load(index+1);
function soundLabel(){$('sound').textContent=`♪ 音 ${sound?'ON':'OFF'}`;$('sound').setAttribute('aria-pressed',String(sound))}$('sound').onclick=()=>{sound=!sound;save();soundLabel();if(sound){audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume()}};
function play(){if(!sound)return;try{audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume();[523.25,659.25,783.99,1046.5,1318.5].forEach((f,i)=>{const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime+i*.11;o.frequency.value=f;o.connect(g);g.connect(audio.destination);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.12,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+.3);o.start(t);o.stop(t+.32)})}catch{}}
// このモジュールの初期評価でのみ送信。問題の変更やゲーム操作では呼びません。
recordAccessOnce();
try{[puzzles,solutions]=await Promise.all(['puzzles','solutions'].map(name=>fetch(`data/${name}.json`).then(r=>{if(!r.ok)throw Error();return r.json()})));soundLabel();load(0)}catch{$('message').textContent='問題を読み込めませんでした。ローカルサーバーから開いて、再読み込みしてください。'}
