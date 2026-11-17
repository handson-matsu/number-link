"""Deterministic full-cover Numberlink solver; enumerates at most limit solutions."""
def solve(n,pairs,limit=2,budget=200000):
 adj=[[j for j in range(n*n) if abs(i//n-j//n)+abs(i%n-j%n)==1] for i in range(n*n)]
 used=set(sum(pairs,[])); paths=[[a] for a,b in pairs]; heads=[a for a,b in pairs]; done=set(); answers=[]; nodes=0
 def dfs():
  nonlocal nodes
  nodes+=1
  if nodes>budget: raise TimeoutError
  if len(done)==len(pairs):
   if len(used)==n*n: answers.append([p[:] for p in paths])
   return len(answers)>=limit
  # Empty cells need two accessible edges; each unfinished pair must remain connected.
  live=set(heads[k] for k in range(len(pairs)) if k not in done)|set(b for k,(a,b) in enumerate(pairs) if k not in done)
  for c in range(n*n):
   if c not in used and sum(v not in used or v in live for v in adj[c])<2:return False
  best=None
  for k,(a,b) in enumerate(pairs):
   if k in done:continue
   reachable={heads[k]}; stack=[heads[k]]
   while stack:
    for v in adj[stack.pop()]:
     if v not in reachable and (v not in used or v==b):reachable.add(v);stack.append(v)
   if b not in reachable:return False
   opts=[v for v in adj[heads[k]] if v not in used or v==b]
   if not opts:return False
   if best is None or len(opts)<len(best[1]):best=(k,opts)
  k,opts=best; old=heads[k]; target=pairs[k][1]
  for v in opts:
   heads[k]=v;paths[k].append(v)
   if v==target:done.add(k)
   else:used.add(v)
   stop=dfs()
   if v==target:done.remove(k)
   else:used.remove(v)
   paths[k].pop();heads[k]=old
   if stop:return True
  return False
 dfs();return answers,nodes
