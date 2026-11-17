"""Exhaustively count solutions; no timeout results are accepted."""
import json
from pathlib import Path
from solver import solve
puzzles=json.loads(Path('data/puzzles.json').read_text())
solutions=json.loads(Path('data/solutions.json').read_text())
assert len(puzzles)==10
for p in puzzles:
 answers,nodes=solve(p['size'],p['pairs'],budget=5000000)
 assert len(answers)==1,(p['id'],len(answers))
 assert answers[0]==solutions[str(p['id'])]
 assert sorted(sum(answers[0],[]))==list(range(p['size']**2))
 print(f"PASS #{p['id']:02}: {p['size']}x{p['size']}, exactly 1 full-cover solution ({nodes} search nodes)")
