# Watch Later

A simple watch-later list for TikTok and Instagram videos. It is a static site: plain HTML, CSS and JS with a shadcn/ui-style look, and nothing to build.

## Features

- **Add links:** paste one or many TikTok or Instagram links into the box at the top. Duplicates are skipped.
- **Thumbnails and titles** load automatically. TikTok uses its public oEmbed API. Instagram falls back to Microlink, which is less reliable, so use ✏️ to rename a video when needed.
- **Watched checkbox:** ticking it records the exact date and time. **↻ Rewatched** logs another watch, and **History** lists every watch.
- **★ Favorite:** a banner reminds you that you have favorites to rewatch.
- **Shuffle:** picks something random from *To watch*, *Favorites* or *Anything*, and respects the selected category. Favorites you haven't seen in a while come up more often. **Watch now** opens the video and logs the watch.
- **Delete** moves a video to **Recently deleted**. You can restore it for 30 days, then it is removed automatically.
- **Smart categories** are guessed from keywords and hashtags in the title (Planning, Self-help, Money & Business, and others). You can change a category from the dropdown on any video. Edit the keyword lists at the top of `app.js`.
- **Sort and group** by date bookmarked (grouped by day), title, category, recently watched or most rewatched.
- **Grid or list** view.
- Clicking a thumbnail or title opens the video on TikTok or Instagram.

## Where your data lives

| Layer | What it does |
|---|---|
| Browser `localStorage` (`watchlater.v1`) | The live copy. Every change saves instantly, and the app asks the browser to keep the data from being evicted. |
| **⋯ → Export backup (.json)** | Downloads everything (links, watch dates, favorites, deleted items) as JSON. |
| **⋯ → Import backup (.json)** | Merges a backup in. Watch histories are combined, so nothing is lost. Use it to move to another phone or browser. |
| `data/videos.json` | An optional seed list in the repo. Any link here that isn't on your list yet is added when the page loads. |

`localStorage` is per browser and per device. Export a backup now and then, and import it on any other device you use.

### `data/videos.json` format

Plain links:

```json
[
  "https://www.tiktok.com/@someone/video/7312345678901234567",
  "https://www.instagram.com/reel/C1AbCdEfGhI/"
]
```

Or objects. Every field except `url` is optional:

```json
[
  { "url": "https://www.instagram.com/reel/C1AbCdEfGhI/", "title": "Sunday reset routine", "category": "Planning", "addedAt": "2026-11-10", "favorite": true }
]
```

A link you delete forever stays deleted. It won't come back from the seed file.

## Run locally

```bash
cd watchlater && python3 -m http.server 8000
# open http://localhost:8000
```

To deploy, use Vercel or Netlify with `watchlater/` as the root directory.
