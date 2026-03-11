# Missile Command: Last Stand

A mobile-first HTML5 Canvas missile defense game. 20 levels, 19 hilarious upgrades, one very angry villain.

**Play it:** [https://\<your-username\>.github.io/\<your-repo-name\>/](https://github.com)

---

## Stack

- Pure HTML5 + vanilla ES Modules — zero build step, zero dependencies
- HTML5 Canvas 2D for gameplay rendering
- Web Audio API for procedural sound
- Supabase REST API for global high scores

---

## Local Development

No Node.js or npm required. Serve the project root with any static file server.

**Python (recommended):**
```bash
cd path/to/mobileaddgame
python -m http.server 3000
# Open http://localhost:3000
```

**VS Code:** Install the _Live Server_ extension, right-click `index.html` → _Open with Live Server_.

**Node.js (if you have it):**
```bash
npx serve .
```

---

## Deployment to GitHub Pages

### One-time setup (manual steps required)

1. **Create a GitHub repository** and push this project's files to the `main` branch.

2. **Enable GitHub Pages** in your repo:
   - Go to **Settings → Pages**
   - Under _Source_, select **GitHub Actions**
   - Save

3. **That's it.** Every push to `main` triggers `.github/workflows/deploy.yml`, which uploads the static files and deploys them to GitHub Pages automatically.

> The workflow requires no secrets or tokens — it uses the built-in `GITHUB_TOKEN` with `pages: write` permission.

### After deployment

Your game will be live at:
```
https://<your-username>.github.io/<your-repo-name>/
```

---

## Supabase High Scores

The game uses a Supabase project for the global leaderboard. The connection is pre-configured — **no manual setup needed** to play.

| Setting | Value |
|---|---|
| Project URL | `https://iwfqaxyhxwylxsjubrkm.supabase.co` |
| Anon key | Embedded in `src/supabase.js` |
| Table | `high_scores` |

### Table schema

```sql
CREATE TABLE high_scores (
  id            bigserial PRIMARY KEY,
  player_name   text NOT NULL,
  score         integer NOT NULL,
  level_reached integer NOT NULL DEFAULT 1,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Index for fast leaderboard queries
CREATE INDEX high_scores_score_idx ON high_scores (score DESC);

-- RLS: public read, public insert
ALTER TABLE high_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON high_scores FOR SELECT USING (true);
CREATE POLICY "Public insert" ON high_scores FOR INSERT WITH CHECK (true);
```

### Score submission logic

- Scores are only submitted if the player's new score beats their **personal best** stored in the DB.
- No auth required — players identify by the name they enter on first visit (stored in `sessionStorage`).
- The leaderboard on the main menu shows the **top 10 all-time scores** fetched live from Supabase.

> If you want to use your own Supabase project, replace `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `src/supabase.js` and re-run the schema SQL above in your project's SQL editor.

---

## Game Overview

| Feature | Details |
|---|---|
| Levels | 20 (boss fights at 10 & 20) |
| Missile types | Standard, Fast, Zigzag, Cluster, Heavy, Decoy, MIRV |
| Upgrade choices | 19 hilarious pairs between every level |
| Base HP | 8 (upgradeable via Repair boosts) |
| Score multipliers | Chain kills (1.5× per extra), Morale stat, No-damage bonus |
| Night mode | Level 12 has a dark sky variant |

### Controls

| Action | Control |
|---|---|
| Fire interceptor | Tap / click anywhere on the play field |
| Navigate menus | Tap buttons |
| Mute audio | Tap the 🔊 icon (bottom-right) |

---

## Project Structure

```
mobileaddgame/
├── index.html              # Entry point
├── src/
│   ├── main.js             # Game engine, state machine, all game logic
│   ├── constants.js        # GAME_WIDTH, GAME_HEIGHT, BASE_HP, COLORS, SCORE
│   ├── utils.js            # Math helpers (lerp, dist, angle, randRange, ...)
│   ├── input.js            # Unified pointer/touch input with DPR-safe mapping
│   ├── screenshake.js      # Camera shake system
│   ├── particles.js        # Pooled particle system (600 slots)
│   ├── audio.js            # Procedural Web Audio sound effects
│   ├── villain.js          # Animated villain face (7 expressions)
│   ├── base.js             # Base renderer with 5 visual upgrade tiers
│   ├── levels.js           # 20 level definitions with wave/missile data
│   ├── boosts.js           # 19 upgrade choice pairs
│   └── supabase.js         # Supabase REST client (no SDK)
├── .github/
│   └── workflows/
│       └── deploy.yml      # GitHub Actions → GitHub Pages
└── README.md
```
