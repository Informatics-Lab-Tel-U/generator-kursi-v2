import { useState, useEffect, useCallback, useRef } from 'react';
import { STUDENTS, MATKUL_OPTIONS, KELAS_MAP, type Student } from './mockData';
import './KursiGenerator.css';

const TOTAL_SEATS = 50;

interface SeatData {
  seatNo: number;
  student: Student | null;
}

interface TimerState {
  duration: number;
  remaining: number;
  isRunning: boolean;
}

interface NotesState {
  ip: string;
  username: string;
  password: string;
  instructions: string;
}

type TabId = 'seats' | 'notes' | 'countdown';

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function fisherYatesShuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function makeEmptySeats(): SeatData[] {
  return Array.from({ length: TOTAL_SEATS }, (_, i) => ({
    seatNo: i + 1,
    student: null,
  }));
}

export default function KursiGenerator() {
  const [matkul, setMatkul] = useState('ALPRO2');
  const [kelas, setKelas] = useState('IF-GABREM');
  const [seats, setSeats] = useState<SeatData[]>(makeEmptySeats);
  const [disabledSeats, setDisabledSeats] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<TabId>('seats');
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [dragSourceSeat, setDragSourceSeat] = useState<number | null>(null);
  const [dragOverSeat, setDragOverSeat] = useState<number | null>(null);

  const [timer, setTimer] = useState<TimerState>({
    duration: 90,
    remaining: 90 * 60,
    isRunning: false,
  });
  const timerRef = useRef<number | null>(null);

  const [notes, setNotes] = useState<NotesState>({
    ip: '10.34.1.100',
    username: 'praktikan',
    password: 'Prakt1k@n2025',
    instructions:
      'Selamat mengerjakan Modul 3 — Linked List.\nWaktu pengerjaan: 90 menit.\nDilarang menggunakan HP selama praktikum berlangsung.',
  });

  // Persist / restore
  useEffect(() => {
    try {
      const saved = localStorage.getItem('kursi-gen');
      if (saved) {
        const p = JSON.parse(saved);
        if (p.seats) setSeats(p.seats);
        if (p.disabledSeats) setDisabledSeats(new Set(p.disabledSeats));
        if (p.matkul) setMatkul(p.matkul);
        if (p.kelas) setKelas(p.kelas);
        if (p.timer) setTimer({ ...p.timer, isRunning: false });
        if (p.notes) setNotes(p.notes);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        'kursi-gen',
        JSON.stringify({
          seats,
          disabledSeats: Array.from(disabledSeats),
          matkul,
          kelas,
          timer: { ...timer, isRunning: false },
          notes,
        }),
      );
    } catch { /* ignore */ }
  }, [seats, disabledSeats, matkul, kelas, timer.duration, timer.remaining, notes]);

  // Timer tick
  useEffect(() => {
    if (timer.isRunning && timer.remaining > 0) {
      timerRef.current = window.setInterval(() => {
        setTimer((prev) => {
          if (prev.remaining <= 1) return { ...prev, remaining: 0, isRunning: false };
          return { ...prev, remaining: prev.remaining - 1 };
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timer.isRunning]);

  // Generate
  const handleGenerate = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      const filtered = STUDENTS.filter((s) => s.kelas === kelas);
      const shuffled = fisherYatesShuffle(filtered);
      const newSeats = makeEmptySeats();
      let idx = 0;
      for (let i = 0; i < TOTAL_SEATS; i++) {
        if (!disabledSeats.has(i + 1) && idx < shuffled.length) {
          newSeats[i].student = shuffled[idx++];
        }
      }
      setSeats(newSeats);
      setIsLoading(false);
    }, 500);
  }, [kelas, disabledSeats]);

  const handleReset = useCallback(() => setSeats(makeEmptySeats()), []);

  const toggleDisabledSeat = useCallback((seatNo: number) => {
    setDisabledSeats((prev) => {
      const next = new Set(prev);
      next.has(seatNo) ? next.delete(seatNo) : next.add(seatNo);
      return next;
    });
  }, []);

  // Drag-and-drop
  const handleDragStart = useCallback((seatNo: number) => setDragSourceSeat(seatNo), []);

  const handleDragOver = useCallback((e: React.DragEvent, seatNo: number) => {
    e.preventDefault();
    setDragOverSeat(seatNo);
  }, []);

  const handleDragLeave = useCallback(() => setDragOverSeat(null), []);

  const handleDrop = useCallback(
    (targetSeatNo: number) => {
      if (dragSourceSeat === null || dragSourceSeat === targetSeatNo) {
        setDragSourceSeat(null);
        setDragOverSeat(null);
        return;
      }
      setSeats((prev) => {
        const next = [...prev];
        const srcIdx = dragSourceSeat - 1;
        const tgtIdx = targetSeatNo - 1;
        const temp = next[srcIdx].student;
        next[srcIdx] = { ...next[srcIdx], student: next[tgtIdx].student };
        next[tgtIdx] = { ...next[tgtIdx], student: temp };
        return next;
      });
      setDragSourceSeat(null);
      setDragOverSeat(null);
    },
    [dragSourceSeat],
  );

  const handleDragEnd = useCallback(() => {
    setDragSourceSeat(null);
    setDragOverSeat(null);
  }, []);

  // Timer controls
  const startTimer = () => setTimer((p) => ({ ...p, isRunning: true }));
  const pauseTimer = () => setTimer((p) => ({ ...p, isRunning: false }));
  const resetTimer = () => setTimer((p) => ({ ...p, remaining: p.duration * 60, isRunning: false }));
  const setTimerDuration = (mins: number) =>
    setTimer((p) => ({ ...p, duration: mins, remaining: mins * 60, isRunning: false }));

  // Derived
  const kelasOptions = KELAS_MAP[matkul] || [];
  const assignedCount = seats.filter((s) => s.student !== null).length;
  const eligibleStudents = STUDENTS.filter((s) => s.kelas === kelas);
  const activeSeatCount = TOTAL_SEATS - disabledSeats.size;

  const columns: SeatData[][] = [];
  for (let c = 0; c < 5; c++) columns.push(seats.slice(c * 10, (c + 1) * 10));

  const circumference = 2 * Math.PI * 90;
  const timerRatio = timer.duration > 0 ? timer.remaining / (timer.duration * 60) : 1;
  const strokeOffset = circumference * (1 - timerRatio);

  return (
    <div className="app-container">
      <button
        className="sidebar-toggle"
        onClick={() => setShowSidebar(!showSidebar)}
      >
        {showSidebar ? '✕' : '☰'}
      </button>

      {/* ── Sidebar ── */}
      <aside className={`sidebar ${showSidebar ? 'open' : 'closed'}`}>
        <div className="sidebar-header">Isi datanya:</div>

        {/* Matkul & Kelas */}
        <div className="sidebar-section">
          <label className="sidebar-label">Matkul</label>
          <select
            className="sidebar-select"
            value={matkul}
            onChange={(e) => {
              const v = e.target.value;
              setMatkul(v);
              setKelas(KELAS_MAP[v]?.[0]?.value || '');
            }}
          >
            {MATKUL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <label className="sidebar-label">Kelas</label>
          <select
            className="sidebar-select"
            value={kelas}
            onChange={(e) => setKelas(e.target.value)}
          >
            {kelasOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Disabled seats */}
        <div className="sidebar-section">
          <label className="sidebar-label">
            Pilih nomor meja yang tidak bisa digunakan:
            {disabledSeats.size > 0 && (
              <span className="badge badge-danger">{disabledSeats.size}</span>
            )}
          </label>
          <div className="seat-toggle-grid">
            {Array.from({ length: TOTAL_SEATS }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                className={`seat-toggle ${disabledSeats.has(n) ? 'disabled' : ''}`}
                onClick={() => toggleDisabledSeat(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Generate */}
        <div className="sidebar-section">
          <div className="sidebar-info">
            {eligibleStudents.length} praktikan di {kelas}
          </div>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={isLoading}>
            Generate Acak
          </button>
          <button className="btn btn-secondary" onClick={handleReset}>
            Reset
          </button>
        </div>

        {/* Timer */}
        <div className="sidebar-section">
          <label className="sidebar-label">Hitung Mundur</label>
          <div className="timer-input-row">
            <input
              type="number"
              className="sidebar-input"
              value={timer.duration}
              onChange={(e) => setTimerDuration(Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
              max={300}
            />
            <span className="timer-unit">menit</span>
          </div>
          <div className="timer-controls">
            {!timer.isRunning ? (
              <button className="btn btn-timer btn-start" onClick={startTimer}>Mulai</button>
            ) : (
              <button className="btn btn-timer btn-pause" onClick={pauseTimer}>Jeda</button>
            )}
            <button className="btn btn-timer btn-reset" onClick={resetTimer}>Reset</button>
          </div>
        </div>

        {/* Notes editor */}
        <div className="sidebar-section">
          <label className="sidebar-label">Catatan & Kredensial</label>
          <input
            type="text"
            className="sidebar-input"
            placeholder="IP Server"
            value={notes.ip}
            onChange={(e) => setNotes((p) => ({ ...p, ip: e.target.value }))}
          />
          <input
            type="text"
            className="sidebar-input"
            placeholder="Username"
            value={notes.username}
            onChange={(e) => setNotes((p) => ({ ...p, username: e.target.value }))}
          />
          <input
            type="text"
            className="sidebar-input"
            placeholder="Password"
            value={notes.password}
            onChange={(e) => setNotes((p) => ({ ...p, password: e.target.value }))}
          />
          <textarea
            className="sidebar-textarea"
            placeholder="Instruksi modul..."
            value={notes.instructions}
            onChange={(e) => setNotes((p) => ({ ...p, instructions: e.target.value }))}
            rows={3}
          />
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="main-content">
        <header className="main-header">
          <h1 className="main-title">🪑 Generator Ganjil 25/26</h1>
          {assignedCount > 0 && (
            <span className="main-subtitle">
              {assignedCount}/{activeSeatCount} kursi terisi
            </span>
          )}
        </header>

        <div className="tab-bar">
          {([
            ['seats', 'Kursi'],
            ['notes', 'Catatan'],
            ['countdown', 'Hitung Mundur'],
          ] as [TabId, string][]).map(([id, label]) => (
            <button
              key={id}
              className={`tab ${activeTab === id ? 'active' : ''}`}
              onClick={() => setActiveTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ─ Seats ─ */}
        {activeTab === 'seats' && (
          <div>
            <p className="result-label">Hasil:</p>
            <div className="seat-grid">
              {columns.map((column, colIdx) => (
                <div key={colIdx} className="seat-column">
                  <div className="seat-column-header">
                    <span className="col-no">NO</span>
                    <span className="col-nim">NIM</span>
                    <span className="col-asprak">ASPRAK</span>
                  </div>
                  {column.map((seat) => {
                    const isDisabled = disabledSeats.has(seat.seatNo);
                    const isDragSource = dragSourceSeat === seat.seatNo;
                    const isDragOver = dragOverSeat === seat.seatNo;
                    const hasStudent = seat.student !== null;

                    return (
                      <div
                        key={seat.seatNo}
                        className={[
                          'seat-row',
                          isDisabled && 'disabled',
                          isDragSource && 'dragging',
                          isDragOver && 'drag-over',
                          hasStudent ? 'occupied' : 'empty',
                          isLoading && 'skeleton',
                        ].filter(Boolean).join(' ')}
                        draggable={hasStudent && !isDisabled && !isLoading}
                        onDragStart={() => handleDragStart(seat.seatNo)}
                        onDragOver={(e) => !isDisabled && handleDragOver(e, seat.seatNo)}
                        onDragLeave={handleDragLeave}
                        onDrop={() => !isDisabled && handleDrop(seat.seatNo)}
                        onDragEnd={handleDragEnd}
                      >
                        <span className="cell-no">{seat.seatNo}</span>
                        <span className="cell-nim">
                          {isLoading ? (
                            <span className="skeleton-bar" />
                          ) : isDisabled ? (
                            <span className="disabled-label">—</span>
                          ) : (
                            seat.student?.name || ''
                          )}
                        </span>
                        <span className="cell-asprak">
                          {isLoading ? (
                            <span className="skeleton-bar short" />
                          ) : isDisabled ? '' : (
                            seat.student?.asprak || ''
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─ Notes ─ */}
        {activeTab === 'notes' && (
          <div className="notes-tab">
            <div className="notes-section">
              <h2 className="notes-section-title">Kredensial Server</h2>
              <table className="credentials-table">
                <tbody>
                  <tr>
                    <td>IP Address</td>
                    <td>{notes.ip}</td>
                  </tr>
                  <tr>
                    <td>Username</td>
                    <td>{notes.username}</td>
                  </tr>
                  <tr>
                    <td>Password</td>
                    <td>{notes.password}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="notes-section">
              <h2 className="notes-section-title">Instruksi</h2>
              <pre className="notes-instructions">{notes.instructions}</pre>
            </div>
          </div>
        )}

        {/* ─ Countdown ─ */}
        {activeTab === 'countdown' && (
          <div className="countdown-tab">
            <div className={`countdown-display ${timer.remaining === 0 ? 'countdown-finished' : ''}`}>
              <div className="countdown-ring">
                <svg viewBox="0 0 200 200" className="countdown-svg">
                  <circle
                    cx="100" cy="100" r="90"
                    fill="none"
                    stroke="var(--border-light)"
                    strokeWidth="4"
                  />
                  <circle
                    cx="100" cy="100" r="90"
                    fill="none"
                    stroke={timer.remaining <= 60 && timer.remaining > 0 ? 'var(--danger)' : 'var(--accent)'}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeOffset}
                    transform="rotate(-90 100 100)"
                    className="countdown-progress"
                  />
                </svg>
                <div className="countdown-time">{formatTime(timer.remaining)}</div>
                <div className="countdown-label">
                  {timer.isRunning ? 'Berjalan' : timer.remaining === 0 ? 'Waktu Habis' : 'Dijeda'}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
