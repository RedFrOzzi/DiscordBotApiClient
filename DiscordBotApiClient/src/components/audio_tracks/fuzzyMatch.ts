export function fuzzyMatch(query: string, target: string): number | null {
  const q = query.trim().toLowerCase();
  const t = target.toLowerCase();

  if (!q) return 0;
  if (q.length > t.length) return null;

  let qi = 0;
  let score = 0;
  let lastMatchIndex = -1;

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      // bonus for consecutive matches
      if (lastMatchIndex === ti - 1) score += 2;
      // bonus for matching at word boundaries
      if (ti === 0 || /[\s\-_.]/.test(t[ti - 1])) score += 3;
      score += 1;
      lastMatchIndex = ti;
      qi++;
    }
  }

  // not all query chars matched
  if (qi < q.length) return null;

  // prefer shorter targets (matches are "denser")
  score -= t.length * 0.01;

  return score;
}
