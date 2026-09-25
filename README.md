# Neon Rain 2019

A retro-futuristic, rain-soaked neo-noir you can walk around in. It's a pixel-art side-scrolling
narrative game that runs entirely in the browser as a static site. You don't need a server,
a build step or any asset files. The art, music and sound are all generated in code.

You play a "Runner", a detective pulled out of retirement to track four runaway synthetic humans
through a Los Angeles that never stops raining. There are 12 chapters, 9 locations, branching
dialogue choices, an empathy-test interrogation, a voice-style photo-enhancer puzzle, quick-time
chases, 9 hidden secrets and two endings.

> The game is an homage to early-'80s tech-noir films. The story beats echo the genre, but all
> characters, names, dialogue and art are original to this project.

## Play

| Action | Keyboard | Touch (turn on **PAD**) | Gamepad |
| --- | --- | --- | --- |
| Walk | ← → / A D | ◀ ▶ | D-pad / left stick |
| Enter door, fly spinner | ↑ / W | ▲ | D-pad up |
| Talk, examine, advance text | E / Space / Enter | **A** | A / Cross |
| Menu (case file, evidence, secrets) | Esc / I / X | **B** | B / Start |
| Choose a dialogue option | ↑ ↓ then E | tap the option | D-pad then A |

Toggles in the top bar: **MUSIC** (M), **SFX** (N), **CRT** scanlines (C) and the on-screen **PAD**.
Progress auto-saves in your browser.

In the ESPER photo analyzer, type commands such as `ENHANCE`, `PAN LEFT`, `ENHANCE 452 150`,
`ZOOM OUT`, `PRINT` and `EXIT`, or tap the buttons.

<details><summary>Secret hints (mild spoilers)</summary>

- Keep what Moreno folds for you. All three pieces matter at the very end.
- Look up when you're under the blimp.
- Ask the owl something personal.
- There's more than one living thing in Brick's photograph.
- The piano remembers something after Iris visits.
- A famous game from 1851 is waiting to be finished.
- The arcade door has a code scratched into it.
</details>

## Project layout

```
public/               ← everything that gets deployed (static assets)
  index.html          page shell, HUD, dialogue box, menus, touch pad
  css/style.css       layout, CRT filter, responsive/touch styles
  js/main.js          game engine: loop, camera, dialogue, menus, save/load
  js/scenes.js        the world: 9 scenes, cast, story scripts, secrets
  js/art.js           procedural pixel art: skylines, neon, rain, characters
  js/audio.js         Web Audio synth: generative score + sound effects
  js/input.js         keyboard / touch / gamepad input
  js/esper.js         the ESPER photo-enhancement puzzle
  _headers            security + cache headers (applied by Cloudflare)
  404.html            themed not-found page
wrangler.jsonc        Cloudflare Workers static-assets config
```

## Run locally

```bash
npm install
npm run dev          # wrangler dev → http://localhost:8787
```

Any static file server works too, for example `python3 -m http.server -d public 8080`.

## Hosting on Cloudflare (free plan)

**Recommendation: use Cloudflare Workers with static assets, not Pages.**

| | Workers + static assets ✅ | Pages |
| --- | --- | --- |
| Cost for this site | $0. Static asset requests are free and unlimited on the Free plan. This project has no Worker script, so it uses no invocations at all. | $0 as well |
| Branch previews | Yes. Each non-production branch gets its own preview URL through Workers Builds. | Yes |
| Custom subdomain | Yes (Custom Domain) | Yes |
| `_headers`, 404 page | Yes | Yes |
| Room to grow | Cron triggers, KV/D1 (for example a global secrets leaderboard), Durable Objects, better observability | More limited |
| Direction | Cloudflare's recommended path for new projects. They publish a Pages → Workers migration guide. | Still supported, but new features ship to Workers first |

A pure static game fits either product. Workers is the better long-term home at the same $0.

### One-time setup (dashboard, Git-connected)

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Import a repository** and pick
   `dorinnbun/side-quest`.
2. Build settings:
   - Build command: *(leave empty)*
   - Deploy command: `npx wrangler deploy`
   - Production branch: `main`
3. Under **Settings → Build → Branch control**, enable **Preview builds** for non-production
   branches. Every push to a branch other than `main` then gets a preview URL like
   `https://<branch>-neon-rain.<your-account>.workers.dev`. Cloudflare also posts that URL on
   the pull request.
4. **Settings → Domains & Routes → Add → Custom Domain**, then enter your subdomain
   (for example `game.yourdomain.com`). Your domain's DNS must be on Cloudflare. Cloudflare
   creates the DNS record and TLS certificate automatically.

### Release flow (test first, then production)

1. Work on a feature branch (this repo uses `claude/quirky-fermi-uhwing` for the first version).
2. Push it and open the **preview URL** Cloudflare builds for that branch. Play-test there.
3. When it's good, open a pull request into `main` and merge it. Cloudflare deploys `main` to
   your subdomain automatically.

### Deploy from your own machine instead (optional)

```bash
npx wrangler login
npm run preview   # upload a preview version (gets its own URL, production untouched)
npm run deploy    # publish to production
```

To attach the subdomain from config instead of the dashboard, uncomment the `routes` entry in
`wrangler.jsonc` and set your hostname.
