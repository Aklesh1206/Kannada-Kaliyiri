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

- More chat scenarios (market, restaurant, directions).
- Per-sound pronunciation drills based on the slips Neela hears most often.

## Cloud save and leaderboard (optional)

Progress is stored in the browser by default. To add sign-in, sync across devices and a per-level leaderboard,
follow [`supabase/SETUP.md`](supabase/SETUP.md). The app works exactly as before when the two Supabase
environment variables are not set.

## Audio

Speaker buttons play `public/audio/<phrase id>.mp3`. Make the files once, then commit them so the deployed site has them:

- **On GitHub (no setup):** Actions > "Generate audio" > Run workflow. It commits the files for you.
- **On your computer:** `pip install edge-tts`, then `python scripts/generate_audio.py`, then commit `public/audio`.

Without the files the app falls back to an online voice and then to the browser's own Kannada voice. Microsoft Edge has one; Chrome on Windows usually does not.

## Talk with Neela (One-on-One Tutoring & Speaking Practice)

Open **Talk with Neela** on the home screen. Neela (the friendly Indian Roller bird, ನೀಲಕಂಠ, Karnataka's state bird) is the app's representative and personal Kannada conversation coach.

It has two training modes:

- **Pronunciation practice**: Neela shows a phrase, you speak it, and the engine compares what the browser heard
  with the phrase word by word. Words are marked right, close, or wrong, with instant phonetic coaching tips
  (vowel length, aspirated sounds, retroflex consonants). Great attempts earn XP.
- **Chat with Neela (One-on-One Conversational Training)**:
  - **5 Real-Life Scenarios**:
    - 🛺 **Auto ride**: Hail an auto in Bengaluru, check meter, give directions ("ರೈಟ್ ತಗೊಳ್ಳಿ", "ಸ್ವಲ್ಪ ಮುಂದೆ ನಿಲ್ಲಿಸಿ"), and pay via UPI.
    - ☕ **Darshini / Cafe**: Order masala dosa & filter coffee, customize sugar, choose parcel or dine-in, and pay.
    - 🛒 **Market shopping**: Inquire about fresh vegetables and fruits, ask prices per kg, bargain politely, and buy.
    - 👋 **Making friends**: Warm introductions, sharing where you live and work, discussing learning Kannada.
    - 💬 **Small talk**: Daily chit-chat about food, Bengaluru weather, and life in Karnataka.
  - **Interactive Scaffolding**: Neela provides 2–3 suggested reply options with every turn (in Kannada script, Roman
    transliteration, and English meaning), so beginners never get stuck. Tap to send or speak with the microphone!
  - **Gentle Coaching**: If you speak English or make a Kannada grammar slip, Neela explains why kindly and shows
    a better way to say it, with a "Practice saying this" button.
  - **Audio Immersion**: Tap the speaker to hear Neela speak, or toggle "Auto-speak Neela's voice" for a hands-free conversation.
  - **Mission Completion**: Finishing a conversation earns **+15 XP** and celebratory cheer from Neela.

### Hybrid Setup (Zero Setup Required)

- **Out of the box (no API key needed):** Neela runs interactive, branching guided conversations for all 5 scenarios with full suggestions, audio, and XP rewards.
- **With a Cloud AI key (unlimited dynamic AI):** Add `GEMINI_API_KEY` (Google AI Studio free tier) or `ANTHROPIC_API_KEY` to `.env.local`:

```
GEMINI_API_KEY=your_gemini_api_key_here
# or
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

Optional: `AI_PROVIDER` (`gemini` or `anthropic`, when both keys exist), `GEMINI_MODEL`, `ANTHROPIC_MODEL`.

Before sharing the site publicly, set a monthly spending cap at your AI provider. The app limits each visitor to
30 messages per 10 minutes, but that limit is kept in memory per server instance, so it is a speed bump, not a guarantee.

Privacy: speech goes to the browser vendor's speech service; typed or spoken chat text goes to your AI provider.
This app stores no audio.
