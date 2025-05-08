# word-by-word

**ADHD-friendly text reader.**

`word-by-word` is a simple, distraction-free desktop app that displays a plain text file *one word at a time*. You can adjust the speed (in milliseconds per word) and text size, helping you stay engaged while reading. Designed with love for folks with ADHD—or anyone who finds it hard to stay focused on long paragraphs.

## Why?

Reading long blocks of text can be difficult for people with ADHD, as attention often drifts or shifts too quickly. This tool takes a different approach: by showing just one word at a time (and fast!!), it creates a sense of novelty and momentum that keeps your brain engaged.

The idea was inspired by a demo video showcasing a similar application, originally designed to illustrate that the brain reads faster than it can see by predicting upcoming words rather than visually processing each one in detail. That concept stuck with me, and I wanted to turn it into something usable.

<p align="center">
  <a href="https://www.youtube.com/watch?v=6E7ZGCfruaw">
    <img src="https://img.youtube.com/vi/6E7ZGCfruaw/hqdefault.jpg" alt="Go f-a-f (boiii)!">
  </a>
</p>

## Features

* ✅ Drag-and-drop support for `.txt` files (thanks to `tkinterdnd2`)
* 🕒 Adjustable word turnover speed (via slider or input field)
* 🔠 Scalable text size for better readability
* 🧘 Minimal interface for reduced distraction

## Installation

First, make sure you have Python 3 installed. You can check by running:

```bash
which python
```

Or, on some systems:

```bash
which python3
```

Then, install the required dependency:

```bash
pip install -r requirements.txt
```

## Usage

1. Open a terminal and navigate to the folder where `main.py` is located:

   ```bash
   cd path/to/your/project
   ```
2. Run the app:

   ```bash
   python main.py
   ```
3. Drag a `.txt` file into the app window, or open it by pressing the button on the GUI if you didn't install `tkinterdnd2`.
4. Use the slider or input field to set the word speed (in milliseconds per word).
5. Adjust text size as needed.
6. Start reading—word by word.

## License

MIT – free to use, modify, and share.
