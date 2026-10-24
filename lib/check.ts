// Standalone on purpose (no imports) so Node can run the tests directly.

/**
 * Learners spell Kannada in Roman letters many ways ("neevu" / "nivu", "dhanyavaadagalu" / "dhanyavadagalu").
 * Both sides are squashed to the same form before comparing.
 */
export function normalizeTr(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z\s]/g, " ")
    .replace(/w/g, "v")
    .replace(/ee/g, "i")
    .replace(/oo/g, "u")
    .replace(/([kgcjtdpb])h/g, "$1")
    .replace(/([aeiou])\1+/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function editDistance(a: string, b: string): number {
  const dp: number[] = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}

export type TypeResult = "exact" | "close" | "wrong";

/** "close" counts as correct but shows the proper spelling. Short words must match exactly. */
export function checkTransliteration(
  input: string,
  phrase: { tr: string; alt?: string[] },
): TypeResult {
  const guess = normalizeTr(input);
  if (!guess) return "wrong";
  const targets = [phrase.tr, ...(phrase.alt ?? [])].map(normalizeTr);
  if (targets.includes(guess)) return "exact";
  const best = Math.min(...targets.map((t) => editDistance(guess, t)));
  const longest = Math.max(...targets.map((t) => t.length));
  return best <= 1 && longest >= 6 ? "close" : "wrong";
}
