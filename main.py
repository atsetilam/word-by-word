import tkinter as tk
from tkinter import filedialog, messagebox
import threading
import time
from PIL import Image, ImageTk
import cv2
import queue
import os # Import the os module to check for file existence

try:
    from tkinterdnd2 import DND_FILES, TkinterDnD
    DND_AVAILABLE = True
except ImportError:
    DND_AVAILABLE = False

class WordDisplayApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Word-by-Word Text Viewer")
        self.words = []
        self.word_index = 0
        self.running = False
        self.speed = 300
        self.dnd_file_loaded = False
        self.video_enabled = tk.BooleanVar(value=False)
        
        # --- MODIFIED: Replaced hardcoded path with a placeholder ---
        self.video_path = "path/to/your/video.mp4"

        # --- Threading, Queue, and Spinner Attributes ---
        self.cap = None
        self.bg_imgtk = None
        self.video_loop_running = False
        self.video_display_started = False
        self.bg_image_id = None
        self.word_text_id = None
        self.outline_text_ids = []
        self.frame_queue = None
        self.video_thread = None
        self.stop_video_event = None
        self.spinner_id = None
        self.spinner_animation_id = None

        # GUI Layout (unchanged)
        top_bar = tk.Frame(root)
        top_bar.grid(row=0, column=0, sticky="ew", padx=0, pady=(5,0))
        self.font_size = 32
        btn_font = ("Helvetica", 16)
        zoom_out_btn = tk.Button(top_bar, text="-", command=self.decrease_font, width=3, height=2, font=btn_font)
        zoom_out_btn.pack(side=tk.RIGHT, padx=(0,8), pady=4)
        zoom_in_btn = tk.Button(top_bar, text="+", command=self.increase_font, width=3, height=2, font=btn_font)
        zoom_in_btn.pack(side=tk.RIGHT, padx=(0,4), pady=4)
        self.video_checkbox = tk.Checkbutton(top_bar, text="Video Playback", variable=self.video_enabled, command=self.toggle_video_bg, font=("Helvetica", 12))
        self.video_checkbox.pack(side=tk.RIGHT, padx=(0,12), pady=4)

        self.center_frame = tk.Frame(root)
        self.center_frame.grid(row=1, column=0, sticky="nsew")
        self.bg_canvas = tk.Canvas(self.center_frame, width=800, height=600, highlightthickness=0)
        self.bg_canvas.grid(row=0, column=0, sticky="nsew")
        self.center_frame.rowconfigure(0, weight=1)
        self.center_frame.columnconfigure(0, weight=1)

        self.drop_label = None
        if DND_AVAILABLE:
            self.drop_label = tk.Label(
                self.center_frame, text="Drop a .txt file here", font=("Helvetica", 20, "bold"),
                fg="#666", bg="#e8e8ff", bd=3, relief="ridge"
            )
            self.drop_label.grid(row=0, column=0, sticky="nsew", padx=40, pady=40)
            self.drop_label.drop_target_register(DND_FILES)
            self.drop_label.dnd_bind('<<Drop>>', self.on_drop)
        else:
            self.drop_label = tk.Label(
                self.center_frame, text="tkinterdnd2 not installed.\nDrag-and-drop not available.",
                font=("Helvetica", 14), fg="#a00", bg="#ffe8e8", bd=2, relief="ridge"
            )
            self.drop_label.grid(row=0, column=0, sticky="nsew", padx=40, pady=40)

        self.show_drop_area()

        controls = tk.Frame(root)
        controls.grid(row=2, column=0, pady=10)

        root.grid_rowconfigure(0, weight=0)
        root.grid_rowconfigure(1, weight=1)
        root.grid_rowconfigure(2, weight=0)
        root.grid_columnconfigure(0, weight=1)
        root.minsize(800, 600)
        self.center_frame.grid_propagate(False)
        self.center_frame.configure(width=800, height=600)
        self.bg_canvas.configure(width=800, height=600)
        self.bg_canvas.grid_propagate(False)
        self.bg_canvas.grid(row=0, column=0, sticky="nsew")

        self.open_btn = tk.Button(controls, text="Open File", command=self.open_file, font=btn_font, height=2, width=10)
        self.open_btn.grid(row=0, column=0, padx=8, pady=6)
        self.start_btn = tk.Button(controls, text="Start", command=self.toggle_start_stop, state=tk.DISABLED, font=btn_font, height=2, width=10)
        self.start_btn.grid(row=0, column=1, padx=8, pady=6)
        tk.Label(controls, text="Speed (ms/word):", font=("Helvetica", 14)).grid(row=0, column=2, padx=8)
        self.speed_var = tk.IntVar(value=self.speed)
        self.speed_slider = tk.Scale(controls, from_=50, to=2000, orient=tk.HORIZONTAL, variable=self.speed_var, length=200, command=self.on_slider_move)
        self.speed_slider.grid(row=0, column=3, padx=8)
        self.speed_entry = tk.Entry(controls, width=6, font=("Helvetica", 14))
        self.speed_entry.grid(row=0, column=4, padx=8)
        self.speed_entry.insert(0, str(self.speed_var.get()))
        self.speed_entry.bind('<Return>', self.on_speed_entry)

    def _create_text_widgets(self, text=""):
        if self.word_text_id: self.bg_canvas.delete(self.word_text_id)
        for item_id in self.outline_text_ids: self.bg_canvas.delete(item_id)
        self.outline_text_ids = []
        outline_offset = 2
        font_details = ("Helvetica", self.font_size)
        for dx, dy in [(-outline_offset, 0), (outline_offset, 0), (0, -outline_offset), (0, outline_offset)]:
            self.outline_text_ids.append(self.bg_canvas.create_text(
                400 + dx, 300 + dy, text=text, font=font_details, fill="white",
                width=700, justify="center", tags="text_outline"
            ))
        self.word_text_id = self.bg_canvas.create_text(
            400, 300, text=text, font=font_details, fill="black",
            width=700, justify="center", tags="text_main"
        )

    def _update_text_on_canvas(self, new_text):
        for item_id in self.outline_text_ids + [self.word_text_id]:
            if item_id: self.bg_canvas.itemconfig(item_id, text=new_text)

    def _update_font_on_canvas(self):
        font_details = ("Helvetica", self.font_size)
        for item_id in self.outline_text_ids + [self.word_text_id]:
            if item_id: self.bg_canvas.itemconfig(item_id, font=font_details)

    def _show_spinner(self):
        self._hide_spinner()
        self.spinner_id = self.bg_canvas.create_arc(
            370, 270, 430, 330, start=0, extent=300,
            width=5, style=tk.ARC, outline="#555555"
        )
        self._animate_spinner(0)

    def _animate_spinner(self, angle):
        if self.spinner_id:
            self.bg_canvas.itemconfig(self.spinner_id, start=angle)
            new_angle = (angle - 20) % 360
            self.spinner_animation_id = self.root.after(50, self._animate_spinner, new_angle)

    def _hide_spinner(self):
        if self.spinner_animation_id: self.root.after_cancel(self.spinner_animation_id)
        if self.spinner_id: self.bg_canvas.delete(self.spinner_id)
        self.spinner_animation_id = None
        self.spinner_id = None

    def _video_reader_thread(self):
        try:
            cap = cv2.VideoCapture(self.video_path)
            if not cap.isOpened(): return
            while not self.stop_video_event.is_set():
                if not self.frame_queue.full():
                    ret, frame = cap.read()
                    if not ret:
                        cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                        continue
                    self.frame_queue.put(frame)
                else:
                    time.sleep(0.01)
        finally:
            cap.release()

    def toggle_video_bg(self):
        if self.video_enabled.get(): self.start_video_bg()
        else: self.stop_video_bg()

    def start_video_bg(self):
        if self.video_loop_running: return
        
        # --- NEW: Check if the video path is valid before starting ---
        if not self.video_path or not os.path.exists(self.video_path):
            messagebox.showwarning(
                "Video Not Found",
                "Video path is not set or the file does not exist.\n"
                "Please edit main.py to set a valid video_path."
            )
            self.video_enabled.set(False) # Uncheck the box
            return
            
        self.video_display_started = False
        self.bg_canvas.grid(row=0, column=0, sticky="nsew")
        self._show_spinner()
        self.frame_queue = queue.Queue(maxsize=60)
        self.stop_video_event = threading.Event()
        self.video_thread = threading.Thread(target=self._video_reader_thread)
        self.video_thread.daemon = True
        self.video_thread.start()
        self.video_loop_running = True
        self.update_video_bg()

    def stop_video_bg(self):
        if self.video_thread and self.video_thread.is_alive():
            self.stop_video_event.set()
            self.video_thread.join(timeout=1.0)
        self.video_loop_running = False
        self.video_display_started = False
        self._hide_spinner()
        current_text = ""
        try:
            current_text = self.bg_canvas.itemcget(self.word_text_id, "text")
        except (tk.TclError, AttributeError):
            if self.words: current_text = "Ready!" if not self.running else "Stopped."
        self.bg_canvas.delete("all")
        self.bg_image_id = None
        self._create_text_widgets(text=current_text)

    def update_video_bg(self):
        if not self.video_loop_running: return
        try:
            frame = self.frame_queue.get_nowait()
            if not self.video_display_started:
                self._hide_spinner()
                self.video_display_started = True
        except queue.Empty:
            self.root.after(10, self.update_video_bg)
            return
        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        img = Image.fromarray(frame).resize((800, 600))
        self.bg_imgtk = ImageTk.PhotoImage(img)
        if self.bg_image_id is None:
            self.bg_image_id = self.bg_canvas.create_image(0, 0, anchor="nw", image=self.bg_imgtk)
        else:
            self.bg_canvas.itemconfig(self.bg_image_id, image=self.bg_imgtk)
        self.bg_canvas.tag_raise("text_outline")
        self.bg_canvas.tag_raise("text_main")
        self.root.after(33, self.update_video_bg)

    def open_file(self):
        file_path = filedialog.askopenfilename(
            title="Select Text File", filetypes=[("Text Files", "*.txt")]
        )
        if file_path: self.load_text_file(file_path)

    def load_text_file(self, file_path):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                text = f.read()
            self.words = text.split()
            if not self.words:
                messagebox.showwarning("Empty File", "The selected file is empty.")
                self.start_btn.config(state=tk.DISABLED)
                self.dnd_file_loaded = False
                self.show_drop_area()
            else:
                self.word_index = 0
                self.show_word_area()
                self._update_text_on_canvas("Ready!")
                self.start_btn.config(state=tk.NORMAL)
                self.dnd_file_loaded = True
        except Exception as e:
            messagebox.showerror("Error", f"Failed to open file: {e}")
            self.show_drop_area()

    def on_drop(self, event):
        if event.data:
            file_path = event.data.strip()
            if file_path.startswith('{') and file_path.endswith('}'): file_path = file_path[1:-1]
            if file_path.lower().endswith('.txt'): self.load_text_file(file_path)
            else: messagebox.showwarning("Invalid File", "Please drop a .txt file.")

    def show_drop_area(self):
        self.drop_label.grid(row=0, column=0, sticky="nsew", padx=40, pady=40)
        self.bg_canvas.grid_remove()
        if self.video_loop_running: self.stop_video_bg()

    def show_word_area(self):
        self.bg_canvas.grid(row=0, column=0, sticky="nsew")
        self.drop_label.grid_forget()
        self._create_text_widgets()
        if self.video_enabled.get(): self.start_video_bg()

    def on_slider_move(self, val):
        self.speed_entry.delete(0, tk.END)
        self.speed_entry.insert(0, str(self.speed_var.get()))

    def on_speed_entry(self, event):
        try:
            val = int(self.speed_entry.get())
            if 50 <= val <= 2000:
                self.speed_var.set(val)
                self.speed_slider.set(val)
            else: raise ValueError()
        except ValueError:
            messagebox.showwarning("Invalid Input", "Please enter a number between 50 and 2000.")
            self.speed_entry.delete(0, tk.END)
            self.speed_entry.insert(0, str(self.speed_var.get()))

    def toggle_start_stop(self):
        if not self.running: self.start_display()
        else: self.stop_display()

    def start_display(self):
        if not self.words: return
        self.running = True
        self.start_btn.config(text="Stop")
        self.open_btn.config(state=tk.DISABLED)
        self.display_next_word()

    def stop_display(self):
        self.running = False
        self.start_btn.config(text="Start")
        self.open_btn.config(state=tk.NORMAL)
        self._update_text_on_canvas("Stopped.")
        self.word_index = 0

    def increase_font(self):
        if self.font_size < 200:
            self.font_size += 4
            self._update_font_on_canvas()

    def decrease_font(self):
        if self.font_size > 8:
            self.font_size -= 4
            self._update_font_on_canvas()

    def display_next_word(self):
        if self.word_index < len(self.words) and self.running:
            word = self.words[self.word_index]
            self._update_text_on_canvas(word)
            self.word_index += 1
            speed = self.speed_var.get()
            self.root.after(speed, self.display_next_word)
        else:
            if self.running: self._update_text_on_canvas("Done!")
            self.running = False
            self.start_btn.config(text="Start")
            self.open_btn.config(state=tk.NORMAL)
            self.word_index = 0

if __name__ == "__main__":
    if DND_AVAILABLE:
        root = TkinterDnD.Tk()
    else:
        root = tk.Tk()
    app = WordDisplayApp(root)
    root.mainloop()