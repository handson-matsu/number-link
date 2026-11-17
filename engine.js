export const adjacent=(a,b,n)=>Math.abs(a%n-b%n)+Math.abs(Math.floor(a/n)-Math.floor(b/n))===1;
export function initial(p){return p.pairs.map(()=>[])}
export function validPaths(p,paths){
 const used=new Set();
 return paths.length===p.pairs.length&&paths.every((path,k)=>path.every((c,i)=>Number.isInteger(c)&&c>=0&&c<p.size**2&&!used.has(c)&&(used.add(c),true)&&(i?adjacent(path[i-1],c,p.size):p.pairs[k].includes(c))&&!p.pairs.some((pair,j)=>j!==k&&pair.includes(c))&&(!i||!p.pairs[k].includes(path[i-1])||i===1)));
}
export function status(p,paths){
 const used=new Set(p.pairs.flat());paths.flat().forEach(c=>used.add(c));
 const connected=paths.filter((path,k)=>path.length>1&&p.pairs[k].includes(path[0])&&p.pairs[k].includes(path.at(-1))&&path[0]!==path.at(-1)).length;
 return {used:used.size,connected,clear:validPaths(p,paths)&&connected===p.pairs.length&&used.size===p.size**2};
}
export function step(p,paths,k,c){
 const path=paths[k],last=path.at(-1);if(!Number.isInteger(c)||c<0||c>=p.size**2||c===last)return false;
 const index=path.indexOf(c);
 if(index>=0){path.splice(index+1);return true}
 if(!adjacent(last,c,p.size)||path.length>1&&p.pairs[k].includes(last))return false;
 if(p.pairs.some((pair,j)=>j!==k&&pair.includes(c))||paths.some((line,j)=>j!==k&&line.includes(c)))return false;
 path.push(c);return true;
}
export function hint(p,paths,solution){
 for(let k=0;k<paths.length;k++){
  const line=paths[k];if(!line.length)continue;
  const answer=solution[k][0]===line[0]?solution[k]:[...solution[k]].reverse();
  if(line.some((c,i)=>answer[i]!==c))return {error:true};
 }
 for(let k=0;k<paths.length;k++){
  const line=paths[k],answer=!line.length||solution[k][0]===line[0]?solution[k]:[...solution[k]].reverse();
  if(line.length<answer.length)return {k,from:answer[Math.max(0,line.length-1)],to:answer[Math.max(1,line.length)]};
 }
 return {};
}
