// Run with: npm test
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { buildLesson, shuffle, tokenize, exercisePhraseIds } from "../lib/exercises.ts";
import { normalizeTr, checkTransliteration, editDistance } from "../lib/check.ts";

const dir = new URL("../content/units/", import.meta.url);
const units = readdirSync(dir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(new URL(f, dir), "utf8")));

function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

test("content: ids are unique and lessons point at real phrases", () => {
  const seen = new Set();
  for (const u of units) {
    for (const p of u.phrases) {
      assert.ok(!seen.has(p.id), `duplicate phrase id ${p.id}`);
      seen.add(p.id);
      assert.ok(p.kn && p.tr && p.en, `phrase ${p.id} is missing kn, tr or en`);
    }
    const ids = new Set(u.phrases.map((p) => p.id));
    const lessonIds = new Set();
    for (const l of u.lessons) {
      assert.ok(!lessonIds.has(l.id), `duplicate lesson id ${u.id}/${l.id}`);
      lessonIds.add(l.id);
      assert.ok(l.phrases.length >= 3, `${u.id}/${l.id} needs at least 3 phrases`);
      for (const id of l.phrases) assert.ok(ids.has(id), `${u.id}/${l.id} uses unknown phrase ${id}`);
    }
  }
});

test("content: every unit has a valid level and every level has a unit", () => {
  const valid = ["beginner", "intermediate", "advanced"];
  for (const u of units) {
    const level = u.level ?? "beginner";
    assert.ok(valid.includes(level), `unit ${u.id} has unknown level ${level}`);
  }
  for (const level of valid) {
    assert.ok(units.some((u) => (u.level ?? "beginner") === level), `no unit for level ${level}`);
  }
});

test("normalizeTr treats common spelling variants as equal", () => {
  assert.equal(normalizeTr("Neevu"), normalizeTr("nivu"));
  assert.equal(normalizeTr("dhanyavaadagalu"), normalizeTr("danyavadagalu"));
  assert.equal(normalizeTr("  Namaskara!  "), "namaskara");
});

test("editDistance basics", () => {
  assert.equal(editDistance("kitten", "sitting"), 3);
  assert.equal(editDistance("", "abc"), 3);
});

test("checkTransliteration: exact, alt spelling, close, wrong", () => {
  const p = { tr: "dhanyavaadagalu", alt: ["dhanyavadagalu"] };
  assert.equal(checkTransliteration("Dhanyavadagalu", p), "exact");
  assert.equal(checkTransliteration("dhanyavadagaly", p), "close");
  assert.equal(checkTransliteration("namaskara", p), "wrong");
  assert.equal(checkTransliteration("", p), "wrong");
  // short words must be exact: illa (no) vs illi (here) differ in meaning
  assert.equal(checkTransliteration("illi", { tr: "illa" }), "wrong");
});

test("buildLesson: every lesson in every unit builds a valid queue", () => {
  for (const u of units) {
    for (const l of u.lessons) {
      const phrases = l.phrases.map((id) => u.phrases.find((p) => p.id === id));
      for (let seed = 1; seed <= 25; seed++) {
        const q = buildLesson(phrases, u.phrases, seeded(seed));
        const where = `${u.id}/${l.id} seed ${seed}`;

        assert.equal(q.filter((e) => e.kind === "intro").length, phrases.length, where);
        assert.ok(q.slice(0, phrases.length).every((e) => e.kind === "intro"), `${where}: intros come first`);
        assert.ok(q.length >= phrases.length * 3, `${where}: queue too short (${q.length})`);

        for (const p of phrases) {
          const n = q.filter((e) => e.kind === "choose" && e.phraseId === p.id).length;
          assert.ok(n >= 2, `${where}: ${p.id} only has ${n} choose exercises`);
        }

        for (const e of q) {
          if (e.kind === "choose") {
            assert.equal(e.options.length, 4, where);
            assert.equal(new Set(e.options.map((o) => o.label)).size, 4, `${where}: duplicate option labels`);
            assert.equal(e.options.filter((o) => o.id === e.phraseId).length, 1, where);
          }
          if (e.kind === "match") {
            assert.ok(e.pairs.length >= 3 && e.pairs.length <= 4, where);
            assert.equal(new Set(e.pairs.map((x) => x.id)).size, e.pairs.length, where);
          }
          if (e.kind === "order") {
            assert.deepEqual([...e.tokens].sort(), [...e.answer].sort(), where);
            assert.ok(e.answer.length >= 3, where);
          }
          for (const id of exercisePhraseIds(e)) {
            assert.ok(phrases.some((p) => p.id === id), `${where}: exercise references ${id} outside the lesson`);
          }
        }
      }
    }
  }
});

test("shuffle keeps every item", () => {
  const a = [1, 2, 3, 4, 5, 6];
  assert.deepEqual([...shuffle(a, seeded(7))].sort(), a);
});

test("tokenize drops punctuation", () => {
  assert.deepEqual(tokenize("nimma hesaru enu?"), ["nimma", "hesaru", "enu"]);
});

import { pickPool, makeDeck, makeQuestion, memoryScore, speedPoints, gameXp, fallSeconds, makeBuild, orderCorrect, trTokens, questOptions, questProblems, questScore, questStars, DIFFICULTY, scoreKey } from "../lib/games.ts";

const quests = JSON.parse(readFileSync(new URL("../content/quests.json", import.meta.url), "utf8"));

test("games: pickPool uses finished lessons, else the whole level", () => {
  const u = units[0];
  assert.equal(pickPool([u], {}).length, u.phrases.length);
  const done = { [`${u.id}/${u.lessons[0].id}`]: 1, [`${u.id}/${u.lessons[1].id}`]: 1 };
  const learned = new Set([...u.lessons[0].phrases, ...u.lessons[1].phrases]);
  const pool = pickPool([u], done);
  assert.equal(pool.length, learned.size);
  assert.ok(pool.every((p) => learned.has(p.id)));
});

test("games: memory deck has two cards per phrase and valid pairs", () => {
  const pool = units.flatMap((u) => u.phrases);
  for (let seed = 1; seed <= 10; seed++) {
    const deck = makeDeck(pool, 6, seeded(seed));
    assert.equal(deck.length, 12);
    const byPair = {};
    for (const c of deck) (byPair[c.pairId] ??= []).push(c.side);
    for (const sides of Object.values(byPair)) assert.deepEqual(sides.sort(), ["en", "kn"]);
  }
});

test("games: questions have distinct options containing the answer", () => {
  const pool = units.flatMap((u) => u.phrases);
  for (let seed = 1; seed <= 25; seed++) {
    const q = makeQuestion(pool, 4, seeded(seed));
    assert.equal(q.options.length, 4);
    assert.ok(q.options.some((o) => o.id === q.phrase.id));
    assert.equal(new Set(q.options.map((o) => o.en.toLowerCase())).size, 4);
  }
  assert.notEqual(makeQuestion(pool, 3, seeded(3), pool[0].id).phrase.id, pool[0].id);
});

test("games: scoring helpers", () => {
  assert.equal(memoryScore(6, 6), 600);
  assert.equal(memoryScore(6, 14), 400);
  assert.equal(memoryScore(6, 100), 50);
  assert.equal(speedPoints(0), 10);
  assert.equal(speedPoints(3), 20);
  assert.equal(speedPoints(30), 40);
  assert.equal(gameXp(0), 0);
  assert.ok(gameXp(10) >= 2 && gameXp(100000) <= 20);
  assert.equal(fallSeconds(100), 3.5);
});

test("games: word builder tiles are a shuffle of the phrase words", () => {
  const pool = units.flatMap((u) => u.phrases);
  for (let seed = 1; seed <= 25; seed++) {
    const r = makeBuild(pool, seeded(seed));
    assert.ok(r.answer.length >= 2 && r.answer.length <= 7);
    assert.deepEqual(r.tiles.map((t) => t.text).sort(), [...r.answer].sort());
    assert.ok(orderCorrect(r.answer, r.answer));
  }
  assert.deepEqual(trTokens("ellige hogabeku?"), ["ellige", "hogabeku"]);
  assert.equal(makeBuild([{ id: "x", kn: "x", tr: "one", en: "one", reviewed: false }]), null);
  assert.equal(orderCorrect(["a", "b"], ["b", "a"]), false);
});

test("quests: content points at real phrases and every step is answerable", () => {
  const known = new Set(units.flatMap((u) => u.phrases.map((p) => p.id)));
  const byId = Object.fromEntries(units.flatMap((u) => u.phrases).map((p) => [p.id, p]));
  assert.ok(quests.length >= 1);
  for (const q of quests) {
    assert.deepEqual(questProblems(q, known), []);
    for (const s of q.steps) {
      const opts = questOptions(s, byId, seeded(7));
      assert.equal(opts.length, 1 + s.wrong.length);
      assert.ok(opts.some((o) => o.id === s.answer));
    }
  }
  assert.equal(questScore(6, 0), 600);
  assert.equal(questScore(6, 100), 50);
  assert.equal(questStars(0), 3);
  assert.equal(questStars(3), 2);
  assert.equal(questStars(9), 1);
});

test("games: difficulty gets harder with each level", () => {
  const [b, i, a] = ["beginner", "intermediate", "advanced"].map((l) => DIFFICULTY[l]);
  assert.ok(b.memoryPairs < i.memoryPairs && i.memoryPairs < a.memoryPairs);
  assert.ok(b.speedSeconds > i.speedSeconds && i.speedSeconds > a.speedSeconds);
  assert.ok(b.speedOptions < a.speedOptions && b.listenOptions < a.listenOptions);
  assert.ok(b.fallBase > a.fallBase && b.fallFloor > a.fallFloor);
  assert.ok(b.listenLives > a.listenLives);
  assert.ok(b.showRoman && !a.showRoman);
  assert.equal(scoreKey("speed", "advanced"), "speed:advanced");
});

test("games: builder honours the word range, and quests honour the option count", () => {
  const pool = units.flatMap((u) => u.phrases);
  for (let seed = 1; seed <= 25; seed++) {
    const r = makeBuild(pool, seeded(seed), undefined, 3, 7);
    assert.ok(r.answer.length >= 3 && r.answer.length <= 7);
  }
  const byId = Object.fromEntries(pool.map((p) => [p.id, p]));
  const step = quests[0].steps[0];
  assert.equal(questOptions(step, byId, seeded(2), 3).length, 3);
  assert.ok(questOptions(step, byId, seeded(2), 3).some((o) => o.id === step.answer));
  assert.equal(questOptions(step, byId, seeded(2)).length, 4);
});

import { scoreSpeech, normalizeKn, similarity } from "../lib/check.ts";

test("speech: scoreSpeech grades what was heard against the phrase", () => {
  const p = { kn: "ನಮಸ್ಕಾರ", tr: "namaskara" };
  assert.equal(scoreSpeech(["ನಮಸ್ಕಾರ"], p).verdict, "great");
  assert.equal(scoreSpeech(["xyz", "ನಮಸ್ಕಾರ"], p).verdict, "great"); // best guess counts
  assert.equal(scoreSpeech(["namaskara"], p).verdict, "great"); // Roman letters compare with the Roman spelling
  assert.equal(scoreSpeech(["ಧನ್ಯವಾದ"], p).verdict, "retry");
  assert.equal(scoreSpeech([], p).verdict, "retry");
  assert.equal(normalizeKn(" ನಮ ಸ್ಕಾರ! "), "ನಮಸ್ಕಾರ");
  assert.equal(similarity(["a"], ["a"]), 1);
});

test("speech: buildLesson adds speaking practice last, only when asked", () => {
  const u = units[0];
  const phrases = u.phrases.slice(0, 5);
  for (const speak of [false, true]) {
    const q = buildLesson(phrases, u.phrases, seeded(5), { speak });
    const speaking = q.filter((e) => e.kind === "speak");
    assert.equal(speaking.length, speak ? 2 : 0);
    assert.ok(q.slice(q.length - speaking.length).every((e) => e.kind === "speak"));
  }
});

import { mergeProgress, toRows, fromRows } from "../lib/merge.ts";

const base = { xp: 0, streak: 0, lastActive: null, completed: {}, boxes: {}, highScores: {}, level: null, name: "", leaderboard: true };

test("cloud merge: nothing is lost when two devices are combined", () => {
  const local = { ...base, xp: 50, streak: 2, lastActive: "2026-10-26", level: "beginner", name: "Aklesh",
    completed: { "greetings/say-hello": 1 }, boxes: { a: { box: 2, due: "2026-10-27" } }, highScores: { "speed:beginner": 120 } };
  const remote = { ...base, xp: 80, streak: 5, lastActive: "2026-10-20", level: "advanced", name: "Other",
    completed: { "greetings/say-hello": 3, "auto/get-an-auto": 1 }, boxes: { a: { box: 4, due: "2026-11-01" }, b: { box: 1, due: "2026-10-22" } },
    highScores: { "speed:beginner": 90, "catch:beginner": 40 } };
  const m = mergeProgress(local, remote);
  assert.equal(m.xp, 80);
  assert.equal(m.streak, 2); // local was active more recently
  assert.deepEqual(m.completed, { "greetings/say-hello": 3, "auto/get-an-auto": 1 });
  assert.equal(m.boxes.a.box, 4);
  assert.ok(m.boxes.b);
  assert.equal(m.highScores["speed:beginner"], 120);
  assert.equal(m.highScores["catch:beginner"], 40);
  assert.equal(m.level, "beginner");
  assert.equal(m.name, "Aklesh");
  assert.equal(mergeProgress(local, null), local);
  assert.equal(mergeProgress({ ...local, leaderboard: true }, { ...remote, leaderboard: false }).leaderboard, false);
  assert.equal(mergeProgress({ ...base }, remote).level, "advanced");
});

test("cloud rows: progress survives a round trip", () => {
  const p = { ...base, xp: 12, streak: 3, lastActive: "2026-10-26", level: "intermediate", name: "  Aklesh  ",
    completed: { "x/y": 2 }, boxes: { p1: { box: 9, due: "2026-11-01" } }, highScores: { "memory:advanced": 500 } };
  const rows = toRows("u1", p);
  assert.equal(rows.profile.display_name, "Aklesh");
  assert.equal(rows.boxes[0].box, 5); // clamped to the table's 1..5 rule
  const back = fromRows({ profile: rows.profile, lessons: rows.lessons, boxes: rows.boxes, scores: rows.scores });
  assert.equal(back.level, "intermediate");
  assert.deepEqual(back.completed, { "x/y": 2 });
  assert.deepEqual(back.highScores, { "memory:advanced": 500 });
  assert.equal(toRows("u1", { ...p, level: "expert" }).profile.level, null);
  assert.equal(fromRows({ profile: null, lessons: [], boxes: [], scores: [] }), null);
});

import { compareSpeech, bestReport, classifySlip, coachingLine, hasKannada, words } from "../lib/pronounce.ts";
import { sanitizeInput, parseReply, pickProvider, normalizeTurns, buildSystemPrompt, askNeela, allowRequest, NeelaError } from "../lib/neelaAI.ts";
import { getOfflineReply, SCENARIO_LIST, getTotalSteps } from "../lib/offlineDialogues.ts";

test("pronounce: word-by-word report", () => {
  const exact = compareSpeech("ಒಂದು ಬಿಸಿ ಕಾಫಿ ಕೊಡಿ", "ಒಂದು ಬಿಸಿ ಕಾಫಿ ಕೊಡಿ");
  assert.equal(exact.verdict, "great");
  assert.ok(exact.words.every((w) => w.status === "ok"));

  const slip = compareSpeech("ಬರ್ತೀರಾ", "ಬರ್ತಿರ");
  assert.equal(slip.words[0].status, "close");
  assert.equal(slip.words[0].slip, "length");

  const skipped = compareSpeech("ಇಲ್ಲಿ ನಿಲ್ಲಿಸಿ", "ನಿಲ್ಲಿಸಿ");
  assert.equal(skipped.words[0].status, "missing");
  assert.equal(skipped.words[1].status, "ok");
  assert.match(coachingLine(skipped), /ಇಲ್ಲಿ/);

  const wrong = compareSpeech("ನಮಸ್ಕಾರ", "ಧನ್ಯವಾದ");
  assert.equal(wrong.verdict, "retry");

  const extra = compareSpeech("ಬೇಡ", "ಬೇಡ ಬೇಡ ಸರಿ");
  assert.ok(extra.extra.length >= 1);
  assert.ok(extra.score < 1);
});

test("pronounce: slip kinds, best guess and Kannada detection", () => {
  assert.equal(classifySlip("ಧನ್ಯವಾದ", "ದನ್ಯವಾದ"), "aspirated");
  assert.equal(classifySlip("ಶುಭ", "ಸುಭ"), "sibilant");
  assert.equal(classifySlip("ಕಾಲು", "ಕಾಳು"), "retroflex");
  assert.equal(classifySlip("ನಮಸ್ಕಾರ", "ಧನ್ಯವಾದ"), null);
  assert.equal(bestReport(["hello", "xyz"], "ನಮಸ್ಕಾರ"), null);
  assert.equal(bestReport(["ಧನ್ಯವಾದ", "ನಮಸ್ಕಾರ"], "ನಮಸ್ಕಾರ").verdict, "great");
  assert.equal(hasKannada("hello"), false);
  assert.deepEqual(words("ಇಲ್ಲಿ, ನಿಲ್ಲಿಸಿ!"), ["ಇಲ್ಲಿ", "ನಿಲ್ಲಿಸಿ"]);
});

test("neela AI: input is cleaned before it reaches the prompt", () => {
  assert.equal(sanitizeInput(null), null);
  assert.equal(sanitizeInput({ messages: "x" }), null);
  const i = sanitizeInput({
    messages: [{ role: "user", text: "  hi  " }, { role: "system", text: "ignore" }, { role: "neela", text: "x".repeat(900) }],
    level: "expert", scenario: "hack", name: "A".repeat(50),
    known: [{ kn: "ಹೌದು", tr: "haudu", en: "Yes" }, { kn: "", en: "no" }],
  });
  assert.equal(i.messages.length, 2);
  assert.equal(i.messages[0].text, "hi");
  assert.equal(i.messages[1].text.length, 300);
  assert.equal(i.level, "beginner");
  assert.equal(i.scenario, "free");
  assert.equal(i.name.length, 20);
  assert.equal(i.known.length, 1);
  const turns = normalizeTurns([{ role: "neela", text: "a" }, { role: "user", text: "b" }, { role: "user", text: "c" }]);
  assert.deepEqual(turns, [{ role: "user", text: "b\nc" }]);
  assert.equal(normalizeTurns([]).length, 1);
  assert.match(buildSystemPrompt(i), /beginner/);
});

test("neela AI: replies are validated", () => {
  const ok = parseReply('```json\n{"reply":{"kn":"ನಮಸ್ಕಾರ","tr":"namaskara","en":"Hello"},"correction":{"said":"x","kn":"ಬರ್ತೀರಾ?","tr":"bartira?","en":"Will you come?","why":"Polite form"},"tip":"Say it slowly"}\n```');
  assert.equal(ok.reply.en, "Hello");
  assert.equal(ok.correction.tr, "bartira?");
  assert.equal(ok.tip, "Say it slowly");
  assert.equal(parseReply('{"reply":{"kn":"ಹೌದು","tr":"haudu","en":"Yes"},"correction":null}').correction, null);
  assert.equal(parseReply("not json"), null);
  assert.equal(parseReply('{"reply":{"kn":"","en":""}}'), null);
  const withSug = parseReply('{"reply":{"kn":"ನಮಸ್ಕಾರ","tr":"namaskara","en":"Hello"},"suggestions":[{"kn":"ಹೇಗಿದ್ದೀರಾ?","tr":"hegiddira?","en":"How are you?"}],"completed":true}');
  assert.equal(withSug.reply.en, "Hello");
  assert.equal(withSug.suggestions.length, 1);
  assert.equal(withSug.suggestions[0].tr, "hegiddira?");
  assert.equal(withSug.completed, true);
});

test("neela AI: offline dialogues and suggestions", () => {
  for (const s of SCENARIO_LIST) {
    const first = getOfflineReply(s.id, 0);
    assert.ok(first.reply.kn && first.reply.tr && first.reply.en, `${s.id} step 0 missing reply`);
    assert.ok(first.suggestions && first.suggestions.length > 0, `${s.id} step 0 missing suggestions`);
    const total = getTotalSteps(s.id);
    const last = getOfflineReply(s.id, total - 1);
    assert.equal(last.completed, true, `${s.id} last step must be completed`);
  }
  const nudge = getOfflineReply("cafe", 1, "I want coffee please");
  assert.ok(nudge.correction);
  assert.equal(nudge.correction.said, "I want coffee please");
});

test("neela AI: provider choice, calls and limits", async () => {
  assert.equal(pickProvider({}), null);
  assert.equal(pickProvider({ GEMINI_API_KEY: "g" }), "gemini");
  assert.equal(pickProvider({ GEMINI_API_KEY: "g", ANTHROPIC_API_KEY: "a", AI_PROVIDER: "anthropic" }), "anthropic");
  const input = sanitizeInput({ messages: [{ role: "user", text: "ನಮಸ್ಕಾರ" }], level: "beginner" });
  const good = '{"reply":{"kn":"ನಮಸ್ಕಾರ","tr":"namaskara","en":"Hello"},"correction":null,"tip":null}';
  const calls = [];
  const fake = (text) => async (url, init) => { calls.push({ url, init }); return { ok: true, status: 200, json: async () => text }; };

  const g = await askNeela(input, { GEMINI_API_KEY: "gk" }, fake({ candidates: [{ content: { parts: [{ text: good }] } }] }));
  assert.equal(g.reply.en, "Hello");
  assert.match(calls[0].url, /generativelanguage\.googleapis\.com/);
  assert.equal(calls[0].init.headers["x-goog-api-key"], "gk");
  assert.ok(!calls[0].url.includes("gk")); // the key never goes in the URL

  const a = await askNeela(input, { ANTHROPIC_API_KEY: "ak" }, fake({ content: [{ type: "text", text: good }] }));
  assert.equal(a.reply.kn, "ನಮಸ್ಕಾರ");
  assert.equal(calls[1].init.headers["x-api-key"], "ak");
  assert.equal(JSON.parse(calls[1].init.body).messages[0].role, "user");

  await assert.rejects(() => askNeela(input, {}, fake({})), (e) => e instanceof NeelaError && e.code === "not_configured");
  await assert.rejects(() => askNeela(input, { GEMINI_API_KEY: "g" }, fake({ candidates: [{ content: { parts: [{ text: "oops" }] } }] })), (e) => e.code === "bad_reply");
  await assert.rejects(() => askNeela(input, { GEMINI_API_KEY: "g" }, async () => ({ ok: false, status: 500, json: async () => ({}) })), (e) => e.code === "provider_error");

  assert.equal(allowRequest("ip1", 0, 2, 1000), true);
  assert.equal(allowRequest("ip1", 1, 2, 1000), true);
  assert.equal(allowRequest("ip1", 2, 2, 1000), false);
  assert.equal(allowRequest("ip1", 5000, 2, 1000), true);
});
