# Deployment

The site is a static Vite build. After `npm run build`, the `dist/` folder is the whole site. Prepared JSON is copied from `public/data` into that folder. Visitors do not need Python, and they do not need a headset.

There is no server, database, or API key.

## Netlify

- Base directory: the project root
- Build command: `npm run build`
- Publish directory: `dist`

`netlify.toml` already sets the build and the redirect so refreshing `/brain/eyes` still opens the app.

## Vercel

- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`

`vercel.json` rewrites routes to `index.html` for the same reason.

## What will not work on the hosted site

A page served over https cannot open `ws://127.0.0.1`. The live board page detects that and tells the visitor to use PhysioNet or an uploaded CSV. Live capture is a local `npm run dev` session with the bridge running on the same computer.

## Before you submit the URL

Click through the guided demo on a laptop and on a phone. Confirm the eyes-open recording names S001R01 and that the heart-rate page shows a real BPM, not a blank chart.
