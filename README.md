# word-by-word

> **This is v2** of word-by-word, rewritten from the ground up as an Electron + React desktop application. The original v1 was a Python desktop app built with `tkinter` and `tkinterdnd2`. If you're looking for the old version, check the git history. Though I'd advise against it—the original was a messy proof of concept held together by duct tape and pure hyperfocus.

**ADHD-friendly text reader.**

`word-by-word` is a distraction-free desktop app that displays a plain text file *one word at a time*. You can adjust the speed and text size, and optionally set a looping video — local or from YouTube — as a background. Designed for folks with ADHD, or anyone else whose brain decides to go on an unapproved vacation halfway through a long paragraph.

## Why?

Reading long blocks of text can be difficult for people with ADHD, as attention often drifts or shifts too quickly. This tool takes a different approach: by showing just one word at a time (and fast!!), it creates a sense of novelty and momentum that keeps your brain engaged.

The idea was inspired by a demo video showcasing a similar application, originally designed to illustrate that the brain reads faster than it can see by predicting upcoming words rather than visually processing each one in detail. That concept stuck with me, and I wanted to turn it into something usable.

<p align="center">
  <a href="https://www.youtube.com/watch?v=6E7ZGCfruaw">
    <img src="https://img.youtube.com/vi/6E7ZGCfruaw/hqdefault.jpg" alt="Go f-a-f (boiii)!">
  </a>
</p>

## Features

- Drag-and-drop `.txt` file ingestion — drop anywhere on the window
- Word-by-word playback with play, pause, and restart controls
- Adjustable speed (50ms – 2000ms per word), live during playback
- Scalable word display (24px – 200px) with proportionally scaled text stroke
- Optional looping video background — local file or YouTube URL
- Independent play/pause for the reader and the video
- Auto-hiding controls overlay (fades out after 3 seconds of inactivity)
- Keyboard shortcuts (see below)

## Requirements

- [Node.js](https://nodejs.org/) (v18 or later recommended)

## Installation

### macOS

1. Check if Homebrew is installed:

   ```bash
   which brew
   ```

   If it prints nothing, install Homebrew first:

   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. Install Node.js:

   ```bash
   brew install node
   ```

3. Clone the repo and install dependencies:

   ```bash
   git clone https://github.com/atsetilam/word-by-word.git
   cd word-by-word
   npm install
   ```

### Windows

1. Download and run the Node.js installer from [nodejs.org](https://nodejs.org/).

2. Open PowerShell or Command Prompt, then clone and install:

   ```powershell
   git clone https://github.com/atsetilam/word-by-word.git
   cd word-by-word
   npm install
   ```

### Linux

Using [nvm](https://github.com/nvm-sh/nvm) is the recommended approach and works on any distro:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/HEAD/install.sh | bash
# Restart your terminal, then:
nvm install --lts
```

Then clone and install:

```bash
git clone https://github.com/atsetilam/word-by-word.git
cd word-by-word
npm install
```

## Usage

```bash
npm start
```

This launches the Electron app. The app runs a small local HTTP server internally — this is required for the YouTube background feature to work correctly.

### Basic workflow

1. Drop a `.txt` file anywhere on the window.
2. Press **Play** or hit **Space** to start reading.
3. Drag the speed slider to adjust pace. Changes apply immediately, mid-playback.
4. Drag the size slider to scale the word up or down.

### Video background

- **Local file:** open the settings panel (gear icon), select *Local*, and pick a video file. You can also drop a video file directly onto the window.
- **YouTube:** open the settings panel, select *YouTube*, and paste a YouTube URL into the input field. Standard `watch?v=`, `youtu.be/`, and `embed/` formats are all accepted.
- Switch between *Off*, *Local*, and *YouTube* at any time. Each source remembers its position and resumes when re-selected.

### Keyboard shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause reader |
| `R` | Restart reader |
| `M` | Mute / Unmute video |
| `↑` / `↓` | Speed up / slow down |
| `Escape` | Show / hide controls |

## Building a distributable

```bash
npm run dist
```

This uses `electron-builder` to package the app. Output goes to the `dist/` folder.

## Asset information

The repo does not ship a video file. The original v1 used a Subway Surfers gameplay clip shared by its creators, SYBO APS, who waived copyright. That clip is available [here](https://www.youtube.com/watch?v=i0M4ARe9v0Y) if you want a ready-made background.

## License

MIT – free to use, modify, and share.
