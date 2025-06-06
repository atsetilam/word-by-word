# ADHD-friendly text reader.

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
* 📺 Optional, dynamic video background for a more engaging experience

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

### Enabling the Video Background

You can enable a video to play in the background for added visual stimulation.

1.  **Place your video file:** For simplicity, place your desired video file (e.g., `.mp4`) in the same directory as the `main.py` script.

2.  **Edit the script:** Open `main.py` in a text editor and find the following line inside the `__init__` method:
    ```python
    self.video_path = "path/to/your/video.mp4"
    ```

3.  **Update the path:** Change the placeholder path to the name of your video file. For example, to use the provided non-copyrighted video (link below), you would change it to:
    ```python
    self.video_path = "subway_surfer_ffmpeg_480p.mp4"
    ```

4.  **Run the app:** Launch the application and check the "Video Playback" box in the top bar to enable the feature.

> **Note:** Performance may vary depending on your computer's hardware and the resolution of the video you choose. Higher-resolution videos may require more processing power. Currently, the video is rendered via CPU, so it may be slow on older or less powerful machines. But compiling OpenCV to use GPU acceleration would be a good way to improve performance. I'm just too lazy to do that.

## Asset Information

The application includes an optional video background for visual stimulation. The default video is intended to be a gameplay clip from Subway Surfers, which you may find [here](https://drive.google.com/file/d/1C1itkeNvUKgCe7vVKyeV1vBcbzzUp9xT/view?usp=sharing).

The original video was shared by its creators, SYBO APS (a company incorporated and registered in Denmark), who have explicitly waived any copyright claim. It is available at this [link](https://www.youtube.com/watch?v=i0M4ARe9v0Y)

## License

MIT – free to use, modify, and share.
