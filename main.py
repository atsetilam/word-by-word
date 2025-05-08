import tkinter as tk
from tkinter import filedialog, messagebox
import threading
import time
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
        self.speed = 300  # milliseconds per word
        self.dnd_file_loaded = False

        # GUI Layout
        # Font size controls (upper right)
        top_bar = tk.Frame(root)
        top_bar.grid(row=0, column=0, sticky="ew", padx=0, pady=(5,0))
        self.font_size = 32
        btn_font = ("Helvetica", 16)
        zoom_out_btn = tk.Button(top_bar, text="-", command=self.decrease_font, width=3, height=2, font=btn_font)
        zoom_out_btn.pack(side=tk.RIGHT, padx=(0,8), pady=4)
        zoom_in_btn = tk.Button(top_bar, text="+", command=self.increase_font, width=3, height=2, font=btn_font)
        zoom_in_btn.pack(side=tk.RIGHT, padx=(0,4), pady=4)

        # Centering frame for word label
        self.center_frame = tk.Frame(root)
        self.center_frame.grid(row=1, column=0, sticky="nsew")
        self.word_label = tk.Label(self.center_frame, text="", font=("Helvetica", self.font_size), anchor="center")
        self.center_frame.rowconfigure(0, weight=1)
        self.center_frame.columnconfigure(0, weight=1)

        # Drag-and-drop area
        self.drop_label = None
        if DND_AVAILABLE:
            self.drop_label = tk.Label(
                self.center_frame,
                text="Drop a .txt file here",
                font=("Helvetica", 20, "bold"),
                fg="#666",
                bg="#e8e8ff",
                bd=3,
                relief="ridge"
            )
            self.drop_label.grid(row=0, column=0, sticky="nsew", padx=40, pady=40)
            self.drop_label.drop_target_register(DND_FILES)
            self.drop_label.dnd_bind('<<Drop>>', self.on_drop)
            self.word_label.grid_forget()  # Hide word label initially
        else:
            # Fallback: show a message if drag-and-drop is not available
            self.drop_label = tk.Label(
                self.center_frame,
                text="tkinterdnd2 not installed.\nDrag-and-drop not available.",
                font=("Helvetica", 14),
                fg="#a00",
                bg="#ffe8e8",
                bd=2,
                relief="ridge"
            )
            self.drop_label.grid(row=0, column=0, sticky="nsew", padx=40, pady=40)
            self.word_label.grid_forget()

        self.show_drop_area()

        controls = tk.Frame(root)
        controls.grid(row=2, column=0, pady=10)

        # Configure root grid for resizing
        root.grid_rowconfigure(1, weight=1)
        root.grid_columnconfigure(0, weight=1)

        self.open_btn = tk.Button(controls, text="Open File", command=self.open_file, font=btn_font, height=2, width=10)
        self.open_btn.grid(row=0, column=0, padx=8, pady=6)

        self.start_btn = tk.Button(controls, text="Start", command=self.toggle_start_stop, state=tk.DISABLED, font=btn_font, height=2, width=10)
        self.start_btn.grid(row=0, column=1, padx=8, pady=6)

        tk.Label(controls, text="Speed (ms/word):", font=("Helvetica", 14)).grid(row=0, column=2, padx=8)
        self.speed_var = tk.IntVar(value=self.speed)
        self.speed_slider = tk.Scale(controls, from_=50, to=2000, orient=tk.HORIZONTAL, variable=self.speed_var, length=200, command=self.on_slider_move)
        self.speed_slider.grid(row=0, column=3, padx=8)

        # Manual speed entry
        self.speed_entry = tk.Entry(controls, width=6, font=("Helvetica", 14))
        self.speed_entry.grid(row=0, column=4, padx=8)
        self.speed_entry.insert(0, str(self.speed_var.get()))
        self.speed_entry.bind('<Return>', self.on_speed_entry)

    def open_file(self):
        file_path = filedialog.askopenfilename(
            title="Select Text File",
            filetypes=[("Text Files", "*.txt")]
        )
        if file_path:
            self.load_text_file(file_path)

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
                self.word_label.config(text="Ready!")
                self.start_btn.config(state=tk.NORMAL)
                self.dnd_file_loaded = True
                self.show_word_area()
        except Exception as e:
            messagebox.showerror("Error", f"Failed to open file: {e}")
            self.show_drop_area()

    def on_drop(self, event):
        if event.data:
            file_path = event.data.strip()
            # Remove curly braces if present (Windows)
            if file_path.startswith('{') and file_path.endswith('}'):
                file_path = file_path[1:-1]
            if file_path.lower().endswith('.txt'):
                self.load_text_file(file_path)
            else:
                messagebox.showwarning("Invalid File", "Please drop a .txt file.")

    def show_drop_area(self):
        # Only show drop area, hide word label
        self.drop_label.grid(row=0, column=0, sticky="nsew", padx=40, pady=40)
        self.word_label.grid_forget()

    def show_word_area(self):
        # Only show word label, hide drop area
        self.word_label.grid(row=0, column=0, sticky="nsew")
        self.drop_label.grid_forget()

    def on_slider_move(self, val):
        # Update entry field when slider moves
        self.speed_entry.delete(0, tk.END)
        self.speed_entry.insert(0, str(self.speed_var.get()))

    def on_speed_entry(self, event):
        # Update slider and speed var from entry
        try:
            val = int(self.speed_entry.get())
            if 50 <= val <= 2000:
                self.speed_var.set(val)
                self.speed_slider.set(val)
            else:
                raise ValueError()
        except ValueError:
            messagebox.showwarning("Invalid Input", "Please enter a number between 50 and 2000.")
            self.speed_entry.delete(0, tk.END)
            self.speed_entry.insert(0, str(self.speed_var.get()))

    def toggle_start_stop(self):
        if not self.running:
            self.start_display()
        else:
            self.stop_display()

    def start_display(self):
        if not self.words:
            return
        self.running = True
        self.start_btn.config(text="Stop")
        self.open_btn.config(state=tk.DISABLED)
        threading.Thread(target=self.display_words, daemon=True).start()

    def stop_display(self):
        self.running = False
        self.start_btn.config(text="Start")
        self.open_btn.config(state=tk.NORMAL)
        self.word_label.config(text="Stopped.")
        self.word_index = 0

    def increase_font(self):
        if self.font_size < 200:
            self.font_size += 4
            self.word_label.config(font=("Helvetica", self.font_size))

    def decrease_font(self):
        if self.font_size > 8:
            self.font_size -= 4
            self.word_label.config(font=("Helvetica", self.font_size))

    def display_words(self):
        while self.word_index < len(self.words) and self.running:
            word = self.words[self.word_index]
            self.word_label.config(text=word)
            self.word_index += 1
            # Read speed live from the slider
            speed = self.speed_var.get()
            time.sleep(speed / 1000.0)
        if self.running:
            self.word_label.config(text="Done!")
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
