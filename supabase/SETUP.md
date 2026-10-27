# Cloud save setup (Supabase)

The app works without any of this. Do these steps only if you want sign-in, sync and a leaderboard.

1. Create a free project at https://supabase.com.
2. SQL Editor > New query > paste `supabase/schema.sql` > Run.
3. Authentication > URL Configuration:
   - Site URL: your deployed address, e.g. `https://your-app.vercel.app`
   - Redirect URLs: add `https://your-app.vercel.app/account` and `http://localhost:3000/account`
4. Project Settings > API: copy the Project URL and the `anon` public key.
5. Locally: create `.env.local` (see `supabase/env.example`), then `npm run dev`.
6. On Vercel/Netlify: add the same two variables, then redeploy.

## Smoke test
1. Open `/account`, enter your email, click the link in the email.
2. Finish a lesson. In Supabase > Table Editor, `profiles` and `completed_lessons` should show your rows within a few seconds.
3. Play a game. `high_scores` gets a row and your name appears on `/leaderboard`.
4. Open the app in another browser, sign in, and check your XP and level appear.

The `anon` key is meant to be public. Row level security (in the schema) is what keeps each learner's data private.
