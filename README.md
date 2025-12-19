# Sakura Biotech - Static Website

A modern, fully responsive single-page site built with HTML5, CSS3, and vanilla JavaScript (no frameworks, no backend).

## Files
- `index.html`
- `styles.css`
- `script.js`

## Assets (replace anytime)
- `Assessts/Home page/logo.png`
- `Assessts/Home page/algae.mp4`
- `Assessts/Home page/Mushroom.mp4`

If you rename/move assets, update the `<img>` / `<video><source>` paths in `index.html`.

## Features
- Sticky navbar with a mobile hamburger menu
- Light/dark theme toggle (persists in `localStorage` key `sakura-theme`)
- Full-screen home hero with 3 slanted panels (Algae / Mushroom / Plants)
- Background videos clipped to the slanted panels (Algae + Mushroom)
- Hover-expand effect (one panel grows, others shrink)
- Smooth anchor scrolling + active link highlighting
- Plant section embeds a Spline 3D scene (requires an internet connection)

## Run
Open `index.html` in any modern browser.

## Notes
- Some browsers may delay autoplay video until the first user interaction (even when muted). The site retries playback on the first click/tap/keypress.
- To change the Plant 3D, replace the `iframe src` inside the `#plant` banner in `index.html`.
