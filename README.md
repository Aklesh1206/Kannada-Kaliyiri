# Kannada Kaliyiri (ಕನ್ನಡ ಕಲಿಯಿರಿ)

**Learn Kannada by playing, speaking and chatting with Neela, the Karnataka state bird.**

Kannada Kaliyiri is a friendly, web app for learning the Kannada people actually use day to day. Lessons are built around real situations (an auto ride, the market, a clinic visit, a festival) instead of random word lists. You can hear every phrase, play games, say phrases out loud and get word-by-word feedback, and role-play conversations with Neela, the mascot.

- Live demo: _add your deployed link here_
- Built solo by Aklesh as a hackathon project.

---

## Contents

- [Why this project](#why-this-project)
- [Features](#features)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Project structure](#project-structure)
- [How it works](#how-it-works)
- [Talk with Neela](#talk-with-neela)
- [Voice and audio](#voice-and-audio)
- [Accounts, guests and cloud save](#accounts-guests-and-cloud-save)
- [Adding content](#adding-content)
- [Testing](#testing)
- [Deploying](#deploying)
- [Privacy and safety](#privacy-and-safety)
- [Known limitations](#known-limitations)
- [Roadmap](#roadmap)

---

## Why this project

People who move to Karnataka, families abroad whose children don't speak Kannada, and visitors all run into the same problem: few tools teach Kannada well, and almost none let you practise speaking and get corrected. Kannada Kaliyiri puts lessons, games, spoken feedback and a friendly conversation partner in one place, and it works without an account or a paid key.

## Features

| Area | What you get |
| --- | --- |
| **Animated intro** | A loading animation when the app opens, then Neela greets you, introduces herself and asks your name and level. Shown once per visit. |
| **Lessons** | 11 units, 33 lessons and 135 phrases across three levels (Beginner, Intermediate, Advanced). Exercise types: introduction cards, multiple choice (read, write, listen), matching, word order, typing and speaking. |
| **Levels** | A slim level meter where Neela animates raising your level, an always-available level switcher, and games whose difficulty changes with the level. Each level keeps its own high scores. |
| **Games** | Five games (Memory Flip, Speed Round, Sky Catch, Word Builder, Listen Up) and five story quests (for example an auto ride or a market trip). |
| **Talk with Neela** | Pronunciation practice with word-by-word feedback, and chat in eight everyday scenes: auto ride, café, market, making friends, small talk, bus and metro, a festival visit, and not feeling well. |
| **Voice** | Recorded Kannada voice for lessons, with automatic fallbacks, and a replay button on your own chat messages. |
| **Progress** | XP, streak, hearts, spaced-repetition review (Leitner boxes) and a per-level leaderboard. |
| **Guest mode** | Works with no sign-in. Nothing is stored until you sign in. |
| **Cloud save** | Optional sign-in with Supabase: progress syncs across devices. |

## Quick start

You need **Node.js 20 or newer**.

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

No account, database or API key is needed to run the lessons, games, pronunciation practice and the built-in chat scenes.

Useful scripts:

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build (run this before `typecheck` on a fresh clone, because it generates route types) |
| `npm start` | Serve the production build |
| `npm test` | Run the automated tests |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |

## Configuration

Copy `.env.example` to `.env.local` for local work, and add the same variables in your host's settings (Vercel or Netlify > Settings > Environment Variables) for the live site. **Never commit `.env.local`.**

| Variable | Needed for | Notes |
| --- | --- | --- |
| `GEMINI_API_KEY` | AI chat with Neela | Free tier available from Google AI Studio. Server-side only. |
| `ANTHROPIC_API_KEY` | AI chat with Neela | Alternative to Gemini. Server-side only. |
| `AI_PROVIDER` | AI chat | `gemini` or `anthropic`, when both keys are set. |
| `GEMINI_MODEL`, `ANTHROPIC_MODEL` | AI chat | Optional model overrides. |
| `NEXT_PUBLIC_SUPABASE_URL` | Sign-in and cloud save | From Supabase > Project Settings > API. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sign-in and cloud save | The public anon key. |
| `NEXT_PUBLIC_SHOW_TEST_LOGIN` | Local testing only | Set to `true` to show a shared test login on the Account page. Leave it unset on the live site. |

Everything is optional. Without AI keys, chat uses the built-in conversations. Without Supabase keys, the app runs without cloud save.

## Project structure

```
app/                  Pages and API routes (Next.js App Router)
  api/neela/          AI chat endpoint (keeps the AI key on the server)
  api/tts/            Kannada voice proxy
  games/, talk/, account/, leaderboard/, lesson/, review/
components/           UI: lessons, games, Talk screen, Neela mascot, account panel
  exercises/, games/, talk/
content/
  units/*.json        Lessons and phrases (the app's content)
  quests.json         Story quests
lib/                  Logic (kept free of UI so it can be tested)
  exercises.ts        Turns a lesson into a queue of exercises
  check.ts            Forgiving answer checking
  progress.ts         XP, streak, hearts, review schedule, guest vs signed-in saving
  games.ts            Game rules and per-level difficulty
  pronounce.ts        Word-by-word pronunciation comparison and scoring
  neelaAI.ts          AI prompt, input checks, reply validation, rate limit
  offlineDialogues.ts Built-in chat scenes (work without any AI key)
  audio.ts            Voice playback with fallbacks
  cloud.ts, merge.ts  Supabase client and progress merging
public/audio/         Pre-generated mp3 files for phrases
scripts/              generate_audio.py (makes the mp3 files)
supabase/             schema.sql, SETUP.md, env.example
tests/                Automated tests
```

## How it works

- **Exercises:** `lib/exercises.ts` builds a lesson's queue from its phrases. Wrong answers cost a heart and come back at the end of the lesson. Phrases of three or more words also get a word-order exercise.
- **Answer checking:** `lib/check.ts` forgives common spelling variants (for example `neevu` and `nivu`) and one-letter slips in long words.
- **Review:** `lib/progress.ts` keeps a Leitner-box schedule, so phrases you miss come back sooner on the Review page. Hearts refill every 15 minutes.
- **Levels and games:** Each unit belongs to a level. Game difficulty comes from a per-level table, and high scores are stored per game and level.

## Talk with Neela

Open **Talk with Neela** from the home screen. It has two modes.

**Pronunciation practice** works with no setup. Neela shows a phrase, you say it, and the app compares what the browser heard with the phrase, word by word:

1. The target phrase and what was heard are lined up word by word.
2. Each word is marked **right**, **close** or **wrong** (or missing).
3. Slips are named: vowel length, aspirated sounds, retroflex sounds and sibilants.
4. Scoring is simple and transparent: right = 1, close = 0.7, wrong = 0.2, missing = 0. A score of 0.85 or more is "great".

**Chat with Neela** is a short role-play at your level. You can speak or type, in Kannada or English. Neela replies in Kannada with transliteration and English, and when your sentence can be said better she shows a corrected version you can practise straight away.

- Without an AI key, chat uses the built-in conversations in `lib/offlineDialogues.ts`.
- With a key, the browser calls `/api/neela`, which checks and trims the input, applies a rate limit, calls the provider, and accepts only valid JSON replies.

Speech recognition uses your browser's own speech service, so use **Chrome or Edge**. Typing always works as a fallback.

## Voice and audio

Speaker buttons try these sources in order:

1. `public/audio/<phrase id>.mp3` (best quality, works offline).
2. For Neela's built-in chat lines, an mp3 named from the text (`t-<hash>.mp3`).
3. The browser's own Kannada voice, if the device has one.
4. `/api/tts`, a server route that fetches a Kannada voice.
5. A direct online voice URL.
6. If everything fails, a short message explains how to add a voice.

To make the mp3 files once (needs internet):

```bash
pip install edge-tts
python scripts/generate_audio.py
```

The script makes files for every lesson phrase and every built-in chat line, and skips files that already exist (`--force` redoes them, `--voice kn-IN-GaganNeural` gives a male voice). You can also run it on GitHub: **Actions > Generate audio > Run workflow**. It commits the files for you. Run it again whenever you add phrases or chat lines.

Replies written live by the AI have no pre-made file, so they use steps 3 to 5.

## Accounts, guests and cloud save

- **Guest mode:** without signing in, progress lives in memory only and is gone when the page reloads. Nothing is written to the device.
- **Signed in:** progress is saved on the device and synced to Supabase. What a guest did before signing in is kept and merged with their cloud data.
- **Signing out** clears the device and returns to a blank guest.

To set up Supabase, follow [`supabase/SETUP.md`](supabase/SETUP.md): create a project, run `supabase/schema.sql`, set the redirect URLs and add the two environment variables. Row-level security in the schema keeps each learner's data private. If you enable "Confirm email", new users must click the link in the confirmation email before they can sign in.

## Adding content

Everything lives in `content/units/*.json`. To add phrases, add them to a unit's `phrases` list, then add (or extend) a lesson that lists their ids. To add a whole unit, copy an existing unit file and list it in `lib/content.ts`.

| Field | Meaning |
| --- | --- |
| `id` | Unique phrase id |
| `kn` | Kannada script |
| `tr` | Roman spelling learners read and type |
| `alt` | Other accepted spellings (optional) |
| `en` | English meaning |
| `note` | Usage tip shown on the intro card (optional) |
| `reviewed` | Set to `true` only after a Kannada speaker has checked the phrase |

Every phrase ships with `reviewed: false`, and the intro card tells learners it is unchecked until you flip it. Have a native speaker go through the files before relying on them. A lesson needs at least three phrases.

To add chat scenes, edit `lib/offlineDialogues.ts` (and the scenario descriptions in `lib/neelaAI.ts` for AI mode). To add story quests, edit `content/quests.json`.

After adding phrases or chat lines, run the audio generator again.

## Testing

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

The tests cover content rules (unique ids, valid levels, quests that point at real phrases), exercises, answer checking, game rules, cloud merging, pronunciation scoring and the AI input and reply checks. The pure logic files in `lib/` have no UI imports on purpose, so Node can test them directly.

## Deploying

1. Push the project to GitHub (the project files must be at the **root** of the repository).
2. Import the repository into Vercel or Netlify. The default Next.js settings work.
3. Add the environment variables from [Configuration](#configuration).
4. Run **Actions > Generate audio** once so voice files are committed.

## Privacy and safety

- API keys stay on the server and are never sent to the browser.
- The Supabase anon key is meant to be public. Row-level security protects each learner's rows.
- Speech is turned into text by the browser vendor's speech service. Typed or spoken chat text goes to your AI provider when AI chat is on. The app stores no audio.
- Chat input is trimmed and limited, and each visitor is limited to 30 messages per 10 minutes. That limit is kept in memory per server instance, so also set a spending cap at your AI provider.
- Guests leave nothing behind on their device.

## Known limitations

- Kannada speech recognition in the browser is imperfect and works best in Chrome or Edge, so feedback is a guide, not a grade.
- All phrases are marked `reviewed: false` until a native speaker checks them.
- Live AI replies depend on an unofficial online voice or on a Kannada voice installed on the device.
- The in-memory rate limit is per server instance and is not a hard guarantee.

## Roadmap

- Native-speaker review of all content.
- Hundreds more phrases and more chat scenes.
- Per-sound pronunciation drills based on the slips heard most often.
- An installable app that works offline.
- A teacher or parent view.
- Support for more languages using the same engine.