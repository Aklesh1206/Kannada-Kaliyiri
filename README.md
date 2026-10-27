# Kannada Kaliyiri

A Duolingo-style web app for learning the Kannada people actually use day to day. Lessons are built around situations (greetings, auto rickshaw) instead of random word lists.

## Run it

1. Install Node.js 20 or newer from nodejs.org.
2. Open the project folder in a terminal and run:
   ```
   npm install
   npm run dev
   ```
3. Open http://localhost:3000

No account, database or API key is needed. Progress (XP, streak, hearts, review schedule) is saved in the browser.

## Add audio (do this once, needs internet)

The speaker buttons play `public/audio/<phrase id>.mp3`. Until those files exist, they use an online Kannada voice (needs internet), then the browser's own Kannada voice (only some devices have one). For reliable, offline sound, make the mp3 files once:

```
pip install edge-tts
python scripts/generate_audio.py
```

Run it again whenever you add phrases. Existing files are skipped. Use `--voice kn-IN-GaganNeural` for a male voice.

## Speaking practice

Every lesson ends with up to two "Say it out loud" cards when the browser supports speech recognition (Chrome or Edge, needs internet). Tap the mic and say the phrase. It never costs a heart, can always be skipped, and earns 3 bonus XP for a good match.

## Add lessons

Everything lives in `content/units/*.json`. To add a lesson, add phrases to a unit's `phrases` list, then add a lesson that lists their ids. To add a whole unit, copy `auto.json`, then list it in `lib/content.ts`.

Each phrase has:

| Field | Meaning |
| --- | --- |
| `kn` | Kannada script |
| `tr` | Roman spelling learners read and type |
| `alt` | Other accepted spellings (optional) |
| `en` | English meaning |
| `note` | Usage tip shown on the intro card (optional) |
| `reviewed` | Set to `true` only after a Kannada speaker has checked the phrase |

Every phrase ships with `reviewed: false`. The intro card tells learners the phrase is unchecked until you flip it, so get a native speaker to go through the JSON files before you demo.

A lesson needs at least 3 phrases. Phrases of 3 or more words also get a word-order exercise.

## How it works

- `lib/exercises.ts` turns a lesson's phrases into a queue: intro cards, multiple choice (read, write, listen), matching, word order, typing.
- `lib/check.ts` forgives common spelling variants (`neevu` and `nivu`, `dhanyavaadagalu` and `dhanyavadagalu`) and one-letter slips in long words.
- `lib/progress.ts` holds XP, streak, hearts (they refill every 15 minutes) and a Leitner-box review schedule. Phrases you miss come back sooner on the Review page.
- Wrong answers cost a heart and are asked again at the end of the lesson.

## Checks

```
npm test          # content and exercise-engine tests
npm run typecheck
npm run lint
npm run build
```

## Next steps

- Roleplay chat where an LLM plays the auto driver or shopkeeper (add an API route, keep the key server-side).
- A "speak this phrase" mode for pronunciation practice.
- Sync progress to a database so it follows the learner across devices.

## Cloud save and leaderboard (optional)

Progress is stored in the browser by default. To add sign-in, sync across devices and a per-level leaderboard,
follow [`supabase/SETUP.md`](supabase/SETUP.md). The app works exactly as before when the two Supabase
environment variables are not set.
