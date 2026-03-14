const { useState, useEffect, useRef, useCallback } = React;

// ─── YouTube URL parser ───────────────────────────────────────────────────────
function extractYouTubeId(url) {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

// ─── Stroke width helper ──────────────────────────────────────────────────────
function strokeWidth(fontSize) {
  return Math.min(Math.max(fontSize * 0.015, 1), 4);
}

// ─── WordDisplay ──────────────────────────────────────────────────────────────
function WordDisplay({ word, fontSize }) {
  const sw = strokeWidth(fontSize);
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 10, pointerEvents: 'none', userSelect: 'none',
    }}>
      <span style={{
        fontSize: `${fontSize}px`,
        fontFamily: '"Georgia", "Times New Roman", serif',
        fontWeight: 700,
        color: '#f0f0f0',
        WebkitTextStroke: `${sw}px #111`,
        paintOrder: 'stroke fill',
        lineHeight: 1,
        letterSpacing: '-0.01em',
        textAlign: 'center',
        maxWidth: '90vw',
        wordBreak: 'break-word',
      }}>
        {word}
      </span>
    </div>
  );
}

// ─── DropZone ─────────────────────────────────────────────────────────────────
function DropZone({ hasFile, onTextFile, onVideoFile }) {
  const [dragging, setDragging] = useState(false);
  const [feedback, setFeedback] = useState('');
  const counterRef = useRef(0);

  const flash = (msg) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 1800);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    counterRef.current++;
    setDragging(true);
  };
  const handleDragOver = (e) => { e.preventDefault(); };
  const handleDragLeave = (e) => {
    e.preventDefault();
    counterRef.current--;
    if (counterRef.current === 0) setDragging(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    counterRef.current = 0;
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      onTextFile(file);
    } else if (file.type.startsWith('video/')) {
      onVideoFile(file);
    } else {
      flash('Only .txt or video files accepted');
    }
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        position: 'absolute', inset: 0, zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 12,
        background: hasFile
          ? 'transparent'
          : dragging ? 'rgba(255,255,255,0.05)' : 'transparent',
        border: hasFile ? 'none'
          : dragging ? '2px dashed rgba(255,255,255,0.4)'
          : '2px dashed rgba(255,255,255,0.12)',
        transition: 'background 0.15s, border-color 0.15s',
        pointerEvents: hasFile ? 'none' : 'auto',
      }}
    >
      {!hasFile && (
        <>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
            stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, letterSpacing: '0.05em', fontFamily: 'sans-serif' }}>
            Drop a .txt file to begin
          </p>
        </>
      )}
      {feedback && (
        <div style={{
          position: 'absolute', bottom: 80,
          background: 'rgba(220,60,60,0.85)', color: '#fff',
          padding: '6px 14px', borderRadius: 4, fontSize: 13, fontFamily: 'sans-serif',
          pointerEvents: 'none',
        }}>
          {feedback}
        </div>
      )}
    </div>
  );
}

// ─── VideoBackground ──────────────────────────────────────────────────────────
function VideoBackground({ activeSource, localUrl, youtubeId, muted, ytReadyRef, ytPlayerRef, onYtReady }) {
  const videoRef = useRef(null);
  const ytDivRef = useRef(null);
  const prevSourceRef = useRef('off');

  // Sync local video mute
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  // Sync local video src
  useEffect(() => {
    if (!videoRef.current || !localUrl) return;
    videoRef.current.src = localUrl;
    if (activeSource === 'local') videoRef.current.play().catch(() => {});
  }, [localUrl]);

  // Source switching
  useEffect(() => {
    const prev = prevSourceRef.current;
    const next = activeSource;
    if (prev === next) return;
    prevSourceRef.current = next;

    const vid = videoRef.current;

    const pauseLocal = () => { if (vid && !vid.paused) vid.pause(); };
    const playLocal = () => { if (vid && localUrl) vid.play().catch(() => {}); };
    const pauseYT = () => {
      if (ytReadyRef.current && ytPlayerRef.current) {
        try { ytPlayerRef.current.pauseVideo(); } catch(e) {}
      }
    };
    const playYT = () => {
      if (ytReadyRef.current && ytPlayerRef.current) {
        try { ytPlayerRef.current.playVideo(); } catch(e) {}
      }
    };

    // Pause previous
    if (prev === 'local') pauseLocal();
    if (prev === 'youtube') pauseYT();

    // Resume next
    if (next === 'local') playLocal();
    if (next === 'youtube') playYT();
  }, [activeSource, localUrl]);

  // YouTube player init
  useEffect(() => {
    if (!youtubeId) return;
    if (!ytReadyRef.current) return;
    if (ytPlayerRef.current) {
      try {
        ytPlayerRef.current.loadVideoById(youtubeId);
        if (activeSource === 'youtube') ytPlayerRef.current.playVideo();
        else ytPlayerRef.current.pauseVideo();
      } catch(e) {}
      return;
    }
    ytPlayerRef.current = new YT.Player(ytDivRef.current, {
      videoId: youtubeId,
      playerVars: {
        autoplay: activeSource === 'youtube' ? 1 : 0,
        controls: 0, showinfo: 0, modestbranding: 1,
        loop: 1, playlist: youtubeId,
        mute: 1,
      },
      events: {
        onReady: (e) => {
          if (muted) e.target.mute(); else e.target.unMute();
          if (activeSource === 'youtube') e.target.playVideo();
        },
      },
    });
  }, [youtubeId, ytReadyRef.current]);

  // Mute YT player
  useEffect(() => {
    if (!ytPlayerRef.current || !ytReadyRef.current) return;
    try {
      if (muted) ytPlayerRef.current.mute();
      else ytPlayerRef.current.unMute();
    } catch(e) {}
  }, [muted]);

  const localVisible = activeSource === 'local';
  const ytVisible = activeSource === 'youtube';

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
      <video
        ref={videoRef}
        loop muted playsInline
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover',
          visibility: localVisible ? 'visible' : 'hidden',
          opacity: localVisible ? 1 : 0,
          transition: 'opacity 0.3s',
        }}
      />
      <div
        ref={ytDivRef}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          visibility: ytVisible ? 'visible' : 'hidden',
          opacity: ytVisible ? 1 : 0,
          transition: 'opacity 0.3s',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

// ─── ReaderControls ───────────────────────────────────────────────────────────
function ReaderControls({ status, speed, fontSize, onPlay, onPause, onRestart, onSpeedChange, onFontSizeChange }) {
  const label = status === 'playing' ? 'Pause' : (status === 'paused' || status === 'finished') ? 'Play' : 'Play';
  const canPlay = status !== 'stopped';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      padding: '10px 20px',
    }}>
      <button
        onClick={onRestart}
        disabled={!canPlay}
        style={btnStyle(!canPlay)}
        title="Restart (R)"
      >↺</button>
      <button
        onClick={status === 'playing' ? onPause : onPlay}
        disabled={status === 'stopped'}
        style={btnStyle(status === 'stopped')}
        title="Play/Pause (Space)"
      >{status === 'playing' ? '⏸' : '▶'}</button>

      <label style={labelStyle}>
        <span style={{ opacity: 0.5, fontSize: 11, letterSpacing: '0.06em' }}>SPEED</span>
        <input type="range" min={50} max={2000} step={10}
          value={speed} onChange={e => onSpeedChange(Number(e.target.value))}
          style={{ width: 100, accentColor: 'rgba(255,255,255,0.6)' }} />
        <span style={{ opacity: 0.5, fontSize: 11, minWidth: 40 }}>{speed}ms</span>
      </label>

      <label style={labelStyle}>
        <span style={{ opacity: 0.5, fontSize: 11, letterSpacing: '0.06em' }}>SIZE</span>
        <input type="range" min={24} max={200} step={2}
          value={fontSize} onChange={e => onFontSizeChange(Number(e.target.value))}
          style={{ width: 90, accentColor: 'rgba(255,255,255,0.6)' }} />
        <span style={{ opacity: 0.5, fontSize: 11, minWidth: 30 }}>{fontSize}px</span>
      </label>
    </div>
  );
}

const btnStyle = (disabled) => ({
  background: 'none', border: '1px solid rgba(255,255,255,0.2)',
  color: disabled ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.75)',
  padding: '5px 10px', borderRadius: 3, cursor: disabled ? 'default' : 'pointer',
  fontSize: 16, fontFamily: 'sans-serif', lineHeight: 1,
  transition: 'color 0.15s, border-color 0.15s',
});
const labelStyle = {
  display: 'flex', alignItems: 'center', gap: 8,
  color: 'rgba(255,255,255,0.7)', fontFamily: 'sans-serif',
};

// ─── SettingsPanel ────────────────────────────────────────────────────────────
function SettingsPanel({ open, onToggle, activeSource, onSourceChange, muted, onMuteToggle, onYouTubeUrl, onLocalVideoFile, ytId }) {
  const [ytInput, setYtInput] = useState('');
  const [ytError, setYtError] = useState('');

  const handleYtSubmit = () => {
    const id = extractYouTubeId(ytInput);
    if (!id) { setYtError('Could not find a YouTube video ID'); return; }
    setYtError('');
    onYouTubeUrl(id);
  };

  const handleVideoFile = (e) => {
    const file = e.target.files[0];
    if (file) onLocalVideoFile(file);
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Gear icon */}
      <button onClick={onToggle} title="Settings" style={{
        background: 'none', border: '1px solid rgba(255,255,255,0.2)',
        color: 'rgba(255,255,255,0.6)', borderRadius: 3,
        padding: '5px 8px', cursor: 'pointer', fontSize: 15, lineHeight: 1,
        fontFamily: 'sans-serif',
      }}>⚙</button>

      {open && (
        <div style={{
          position: 'absolute', bottom: '100%', right: 0, marginBottom: 8,
          background: 'rgba(20,20,20,0.95)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 6, padding: '14px 16px', width: 280,
          display: 'flex', flexDirection: 'column', gap: 14,
          fontFamily: 'sans-serif', color: 'rgba(255,255,255,0.75)',
        }}>
          {/* Mute toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, opacity: 0.6, letterSpacing: '0.06em' }}>AUDIO</span>
            <button onClick={onMuteToggle} style={btnStyle(false)} title="Mute/Unmute (M)">
              {muted ? '🔇' : '🔊'}
            </button>
          </div>

          {/* Source selector */}
          <div>
            <div style={{ fontSize: 12, opacity: 0.6, letterSpacing: '0.06em', marginBottom: 8 }}>VIDEO SOURCE</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['off','local','youtube'].map(src => (
                <button key={src} onClick={() => onSourceChange(src)}
                  style={{
                    ...btnStyle(false),
                    borderColor: activeSource === src ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.15)',
                    color: activeSource === src ? '#fff' : 'rgba(255,255,255,0.45)',
                    fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase', padding: '4px 10px',
                  }}>{src}</button>
              ))}
            </div>
          </div>

          {/* Local video */}
          <div>
            <div style={{ fontSize: 12, opacity: 0.6, letterSpacing: '0.06em', marginBottom: 6 }}>LOCAL VIDEO FILE</div>
            <label style={{
              display: 'inline-block', padding: '5px 10px',
              border: '1px solid rgba(255,255,255,0.2)', borderRadius: 3,
              cursor: 'pointer', fontSize: 12, color: 'rgba(255,255,255,0.6)',
            }}>
              Choose file
              <input type="file" accept="video/*" onChange={handleVideoFile} style={{ display: 'none' }} />
            </label>
          </div>

          {/* YouTube URL */}
          <div>
            <div style={{ fontSize: 12, opacity: 0.6, letterSpacing: '0.06em', marginBottom: 6 }}>YOUTUBE URL</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="text"
                placeholder="https://youtube.com/watch?v=..."
                value={ytInput}
                onChange={e => { setYtInput(e.target.value); setYtError(''); }}
                onKeyDown={e => { if (e.key === 'Enter') handleYtSubmit(); e.stopPropagation(); }}
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 3, color: '#fff', fontSize: 12, padding: '5px 8px',
                  outline: 'none', fontFamily: 'sans-serif',
                }}
              />
              <button onClick={handleYtSubmit} style={{ ...btnStyle(false), fontSize: 12 }}>Load</button>
            </div>
            {ytError && <div style={{ color: '#e06060', fontSize: 11, marginTop: 4 }}>{ytError}</div>}
            {ytId && !ytError && <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 4 }}>ID: {ytId}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  // Reader state
  const [words, setWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState('stopped'); // stopped | playing | paused | finished
  const [speed, setSpeed] = useState(400);
  const [fontSize, setFontSize] = useState(72);

  // Video state
  const [activeSource, setActiveSource] = useState('off');
  const [localUrl, setLocalUrl] = useState(null);
  const [youtubeId, setYoutubeId] = useState(null);
  const [muted, setMuted] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const lastActiveRef = useRef('off');

  // UI state
  const [controlsVisible, setControlsVisible] = useState(true);

  // Refs
  const timeoutRef = useRef(null);
  const statusRef = useRef('stopped');
  const speedRef = useRef(400);
  const wordsRef = useRef([]);
  const indexRef = useRef(0);
  const ytReadyRef = useRef(false);
  const ytPlayerRef = useRef(null);
  const localUrlRef = useRef(null);
  const hideTimerRef = useRef(null);
  const controlsRef = useRef(null);

  // Keep refs in sync
  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { wordsRef.current = words; }, [words]);
  useEffect(() => { indexRef.current = currentIndex; }, [currentIndex]);

  // ── YouTube API load ──
  useEffect(() => {
    window.onYouTubeIframeAPIReady = () => {
      ytReadyRef.current = true;
    };
    if (!document.getElementById('yt-api-script')) {
      const s = document.createElement('script');
      s.id = 'yt-api-script';
      s.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(s);
    }
  }, []);

  // ── Playback engine ──
  const tick = useCallback(() => {
    if (statusRef.current !== 'playing') return;
    const nextIndex = indexRef.current + 1;
    if (nextIndex >= wordsRef.current.length) {
      setStatus('finished');
      statusRef.current = 'finished';
      return;
    }
    setCurrentIndex(nextIndex);
    indexRef.current = nextIndex;
    timeoutRef.current = setTimeout(tick, speedRef.current);
  }, []);

  const play = useCallback(() => {
    if (wordsRef.current.length === 0) return;
    if (statusRef.current === 'finished') return;
    setStatus('playing');
    statusRef.current = 'playing';
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(tick, speedRef.current);
  }, [tick]);

  const pause = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setStatus('paused');
    statusRef.current = 'paused';
  }, []);

  const restart = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setCurrentIndex(0);
    indexRef.current = 0;
    setStatus('playing');
    statusRef.current = 'playing';
    timeoutRef.current = setTimeout(tick, speedRef.current);
  }, [tick]);

  // Cleanup on unmount
  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  // ── Text file ingestion ──
  const handleTextFile = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const parsed = text.split(/\s+/).filter(Boolean);
      if (parsed.length === 0) return;
      clearTimeout(timeoutRef.current);
      setWords(parsed);
      wordsRef.current = parsed;
      setCurrentIndex(0);
      indexRef.current = 0;
      setStatus('paused');
      statusRef.current = 'paused';
    };
    reader.readAsText(file);
  }, []);

  // ── Video file ingestion ──
  const handleVideoFile = useCallback((file) => {
    if (localUrlRef.current) URL.revokeObjectURL(localUrlRef.current);
    const url = URL.createObjectURL(file);
    localUrlRef.current = url;
    setLocalUrl(url);
    setActiveSource('local');
    lastActiveRef.current = 'local';
  }, []);

  // ── Source switching ──
  const handleSourceChange = useCallback((src) => {
    if (src === 'youtube' && !youtubeId) return;
    if (src === 'local' && !localUrl) return;
    if (src === activeSource) return;
    if (src !== 'off') lastActiveRef.current = src;
    setActiveSource(src);
  }, [activeSource, youtubeId, localUrl]);

  // ── Auto-hide controls ──
  const resetHideTimer = useCallback(() => {
    setControlsVisible(true);
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setControlsVisible(false), 2500);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', resetHideTimer);
    resetHideTimer();
    return () => {
      window.removeEventListener('mousemove', resetHideTimer);
      clearTimeout(hideTimerRef.current);
    };
  }, [resetHideTimer]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      switch (e.key) {
        case ' ':
          e.preventDefault();
          if (statusRef.current === 'playing') pause();
          else if (statusRef.current === 'paused' || statusRef.current === 'finished') play();
          break;
        case 'r': case 'R':
          e.preventDefault();
          if (wordsRef.current.length > 0) restart();
          break;
        case 'm': case 'M':
          e.preventDefault();
          setMuted(v => !v);
          break;
        case 'ArrowUp': case '+':
          e.preventDefault();
          setSpeed(v => { const n = Math.max(50, v - 50); speedRef.current = n; return n; });
          break;
        case 'ArrowDown': case '-':
          e.preventDefault();
          setSpeed(v => { const n = Math.min(2000, v + 50); speedRef.current = n; return n; });
          break;
        case 'Escape':
          e.preventDefault();
          setControlsVisible(v => !v);
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [play, pause, restart]);

  const currentWord = words.length > 0 ? words[currentIndex] : '';
  const hasFile = words.length > 0;

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#111', overflow: 'hidden' }}>
      {/* CSS for transitions */}
      <style>{`
        input[type=range] { cursor: pointer; }
        button:hover:not(:disabled) { opacity: 0.85; }
      `}</style>

      {/* Layer 1: Video */}
      <VideoBackground
        activeSource={activeSource}
        localUrl={localUrl}
        youtubeId={youtubeId}
        muted={muted}
        ytReadyRef={ytReadyRef}
        ytPlayerRef={ytPlayerRef}
      />

      {/* Layer 2: Word */}
      <WordDisplay word={currentWord} fontSize={fontSize} />

      {/* Layer 2: Drop zone (invisible after file loaded) */}
      <DropZone hasFile={hasFile} onTextFile={handleTextFile} onVideoFile={handleVideoFile} />

      {/* Layer 3: Controls overlay */}
      <div
        ref={controlsRef}
        onMouseEnter={() => clearTimeout(hideTimerRef.current)}
        onMouseLeave={resetHideTimer}
        style={{
          position: 'absolute', inset: 0, zIndex: 30,
          pointerEvents: 'none',
          opacity: controlsVisible ? 1 : 0,
          transition: 'opacity 0.3s',
        }}
      >
        {/* Bottom center: reader controls */}
        <div style={{
          position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          pointerEvents: 'auto',
          background: 'rgba(10,10,10,0.65)', borderRadius: 6,
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(6px)',
        }}>
          <ReaderControls
            status={status} speed={speed} fontSize={fontSize}
            onPlay={play} onPause={pause} onRestart={restart}
            onSpeedChange={(v) => { setSpeed(v); speedRef.current = v; }}
            onFontSizeChange={setFontSize}
          />
        </div>

        {/* Bottom right: settings */}
        <div style={{
          position: 'absolute', bottom: 20, right: 20,
          pointerEvents: 'auto',
        }}>
          <SettingsPanel
            open={settingsOpen}
            onToggle={() => setSettingsOpen(v => !v)}
            activeSource={activeSource}
            onSourceChange={handleSourceChange}
            muted={muted}
            onMuteToggle={() => setMuted(v => !v)}
            onYouTubeUrl={(id) => { setYoutubeId(id); }}
            onLocalVideoFile={handleVideoFile}
            ytId={youtubeId}
          />
        </div>

        {/* Progress indicator, top right */}
        {hasFile && (
          <div style={{
            position: 'absolute', top: 16, right: 20,
            pointerEvents: 'none',
            color: 'rgba(255,255,255,0.3)', fontSize: 12, fontFamily: 'sans-serif',
            letterSpacing: '0.05em',
          }}>
            {currentIndex + 1} / {words.length}
          </div>
        )}

        {/* Status badge */}
        {status === 'finished' && (
          <div style={{
            position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(10,10,10,0.7)', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 4, padding: '4px 12px',
            color: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: 'sans-serif',
            letterSpacing: '0.08em',
            pointerEvents: 'none',
          }}>
            FINISHED — press R to restart
          </div>
        )}
      </div>
    </div>
  );
}

// Mount
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
