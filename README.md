# Telegram 3D Plane Game

This repository contains a simple 3D plane‑flying game intended to be used as a
Telegram mini‑game.  The project is written in plain HTML, CSS and
JavaScript using the [Three.js](https://threejs.org/) library for
WebGL rendering.  Players control a stylised aeroplane that flies across an
infinite landscape, dodging procedurally generated mountains.  A chase
camera follows the aircraft, producing a cinematic third‑person perspective.

## Features

* **3D world** – The game uses Three.js to render a sky, ground, mountains and
  an aeroplane model built from basic shapes.  Lighting and fog add
  atmosphere and depth to the scene.
* **Continuous flight** – The plane automatically moves forward.  Players can
  yaw left/right and pitch up/down using the arrow keys or `W/A/S/D`.
* **Procedural terrain** – A set of conical “mountains” are recycled as the
  plane flies, giving the impression of an endless terrain without loading
  additional assets.
* **Responsive design** – The canvas resizes to fit the user’s device and
  supports high‑DPI displays.

## Playing the game

Open `index.html` in a modern web browser with WebGL support (most current
browsers qualify).  When the page loads you will see the plane in a 3D
landscape.  Use the keyboard controls described below to steer the plane.  Try
to maintain altitude and avoid the ground.

### Controls

| Key              | Action        |
|------------------|---------------|
| `W` / ↑          | Pitch up      |
| `S` / ↓          | Pitch down    |
| `A` / ←          | Yaw left      |
| `D` / →          | Yaw right     |

These controls adjust the plane’s orientation.  There is no throttle control;
the aircraft flies at a constant speed.  Altitude is automatically clamped to
prevent the plane from leaving the playable area.

## Deploying as a Telegram game

Telegram games are simply HTML5 pages loaded into the Telegram client’s
browser.  According to the Telegram Bot Framework documentation, games are
“HTML5 (HTML/CSS/JS) pages loaded into a Telegram client’s browser”【929189574124138†L316-L318】.  Telegram’s
official API documentation also notes that bots can offer users **HTML5 games**
to play【845366969369873†L19-L20】.  To deploy this project as a Telegram game you need to:

1. Host the contents of this repository (including `index.html`) on a server
   accessible over HTTPS.  You can use GitHub Pages, Vercel, Netlify or any
   other static hosting provider.
2. Create a Telegram bot via [@BotFather](https://t.me/BotFather) and enable
   *Inline Mode* for your bot.  Then register a new game with `/newgame`,
   specifying a name and a unique short name.
3. Respond to the callback queries generated when a user taps the “Play”
   button by providing the URL of your hosted `index.html`.  The Telegram
   client will load the page in a WebView and the game will run.
4. (Optional) Implement a backend endpoint that your game can call to
   submit high scores, then use the `setGameScore` API to record them.  This
   sample does not include server‑side logic.

For more details on building Telegram games refer to the official
documentation at [core.telegram.org/api/bots/games](https://core.telegram.org/api/bots/games).

## License

This project is provided for educational purposes.  Feel free to use it as a
starting point for your own Telegram game.  Attribution is appreciated but
not required.