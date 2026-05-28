import { useState, useEffect, useCallback } from "react";
import { STUDENTS } from "./mockData";
import "./KursiGenerator.css";

import type { SeatData, TimerState, Racer, TabId, ProjectorConfig } from "./types";
import { makeEmptySeats, fisherYatesShuffle } from "./utils";

import Sidebar from "./Sidebar";
import SeatsTab from "./SeatsTab";
import NotesTab from "./NotesTab";
import CountdownTab from "./CountdownTab";

const TOTAL_SEATS = 50;

export default function KursiGenerator() {
    const [matkul, setMatkul] = useState("ALPRO2");
    const [kelas, setKelas] = useState("IF-GABREM");
    const [seats, setSeats] = useState<SeatData[]>(makeEmptySeats(TOTAL_SEATS));
    const [disabledSeats, setDisabledSeats] = useState<Set<number>>(new Set());
    const [activeTab, setActiveTab] = useState<TabId>("seats");
    const [isLoading, setIsLoading] = useState(false);
    const [showSidebar, setShowSidebar] = useState(true);
    const [dragSourceSeat, setDragSourceSeat] = useState<number | null>(null);
    const [dragOverSeat, setDragOverSeat] = useState<number | null>(null);

    const [racers, setRacers] = useState<Racer[]>([]);
    const [timer, setTimer] = useState<TimerState>({
        startTime: "08:00",
        endTime: "10:00",
        isRunning: false,
        startedAt: null,
    });

    const [notes, setNotes] = useState<string>(
        "<h2>Kredensial Server</h2><ul><li><strong>IP Address:</strong> 10.34.1.100</li><li><strong>Username:</strong> praktikan</li><li><strong>Password:</strong> <code>Prakt1k@n2025</code></li></ul><hr><h2>Instruksi</h2><p>Selamat mengerjakan Modul 3 — Linked List.</p><p>Waktu pengerjaan: 90 menit.</p><p>Dilarang menggunakan HP selama praktikum berlangsung.</p>",
    );

    const [projectorConfig, setProjectorConfig] = useState<ProjectorConfig>({
        showSeats: true,
        showNotes: false,
        showCountdown: false,
    });

    // Persist / restore
    useEffect(() => {
        try {
            const saved = localStorage.getItem("kursi-gen");
            if (saved) {
                const p = JSON.parse(saved);
                if (p.seats) setSeats(p.seats);
                if (p.disabledSeats) setDisabledSeats(new Set(p.disabledSeats));
                if (p.matkul) setMatkul(p.matkul);
                if (p.kelas) setKelas(p.kelas);
                if (p.timer)
                    setTimer({ ...p.timer, isRunning: false, startedAt: null });
                if (p.notes) setNotes(p.notes);
                if (p.racers) setRacers(p.racers);
                if (p.projectorConfig) setProjectorConfig(p.projectorConfig);
            }
        } catch {
            /* ignore */
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(
                "kursi-gen",
                JSON.stringify({
                    seats,
                    disabledSeats: Array.from(disabledSeats),
                    matkul,
                    kelas,
                    timer: { ...timer, isRunning: false, startedAt: null },
                    notes,
                    racers,
                    projectorConfig,
                }),
            );
        } catch {
            /* ignore */
        }
    }, [
        seats,
        disabledSeats,
        matkul,
        kelas,
        timer.startTime,
        timer.endTime,
        notes,
        racers,
        projectorConfig,
    ]);

    // Broadcast to Projector
    useEffect(() => {
        const channel = new BroadcastChannel("kursi-gen-sync");
        channel.postMessage({
            seats,
            disabledSeats: Array.from(disabledSeats),
            timer,
            notes,
            racers,
            projectorConfig,
        });

        // Also respond to REQUEST_SYNC from newly opened projectors
        channel.onmessage = (event) => {
            if (event.data?.type === "REQUEST_SYNC") {
                channel.postMessage({
                    seats,
                    disabledSeats: Array.from(disabledSeats),
                    timer,
                    notes,
                    racers,
                    projectorConfig,
                });
            }
        };

        return () => channel.close();
    }, [seats, disabledSeats, timer, notes, racers, projectorConfig]);

    // Generate
    const handleGenerate = useCallback(() => {
        setIsLoading(true);
        setTimeout(() => {
            const filtered = STUDENTS.filter((s) => s.kelas === kelas);
            const shuffled = fisherYatesShuffle(filtered);
            const newSeats = makeEmptySeats(TOTAL_SEATS);
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

    const handleReset = useCallback(
        () => setSeats(makeEmptySeats(TOTAL_SEATS)),
        [],
    );

    const toggleDisabledSeat = useCallback((seatNo: number) => {
        setDisabledSeats((prev) => {
            const next = new Set(prev);
            next.has(seatNo) ? next.delete(seatNo) : next.add(seatNo);
            return next;
        });
    }, []);

    // Drag-and-drop
    const handleDragStart = useCallback(
        (seatNo: number) => setDragSourceSeat(seatNo),
        [],
    );
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
                next[srcIdx] = {
                    ...next[srcIdx],
                    student: next[tgtIdx].student,
                };
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

    const assignedCount = seats.filter((s) => s.student !== null).length;
    const eligibleStudents = STUDENTS.filter((s) => s.kelas === kelas);
    const activeSeatCount = TOTAL_SEATS - disabledSeats.size;

    const columns: SeatData[][] = [];
    for (let c = 0; c < 5; c++) columns.push(seats.slice(c * 10, (c + 1) * 10));

    return (
        <div className="app-container">
            <button
                className="sidebar-toggle"
                onClick={() => setShowSidebar(!showSidebar)}
            >
                {showSidebar ? "✕" : "☰"}
            </button>

            <Sidebar
                showSidebar={showSidebar}
                matkul={matkul}
                setMatkul={setMatkul}
                kelas={kelas}
                setKelas={setKelas}
                disabledSeats={disabledSeats}
                toggleDisabledSeat={toggleDisabledSeat}
                eligibleStudents={eligibleStudents}
                isLoading={isLoading}
                handleGenerate={handleGenerate}
                handleReset={handleReset}
                totalSeats={TOTAL_SEATS}
                projectorConfig={projectorConfig}
                setProjectorConfig={setProjectorConfig}
            />

            <main className="main-content">
                <header className="main-header">
                    <div className="header-left">
                        <h1 className="main-title">Generator Ganjil 25/26</h1>
                        {assignedCount > 0 && (
                            <span className="main-subtitle">
                                {assignedCount}/{activeSeatCount} kursi terisi
                            </span>
                        )}
            
                        {/* Projector Options in Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: '24px', background: 'rgba(255,255,255,0.7)', padding: '6px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Proyektor:</span>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                                <input 
                                    type="checkbox" 
                                    checked={projectorConfig.showSeats} 
                                    onChange={(e) => setProjectorConfig(p => ({ ...p, showSeats: e.target.checked }))} 
                                />
                                Kursi
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                                <input 
                                    type="checkbox" 
                                    checked={projectorConfig.showNotes} 
                                    onChange={(e) => setProjectorConfig(p => ({ ...p, showNotes: e.target.checked }))} 
                                />
                                Catatan
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                                <input 
                                    type="checkbox" 
                                    checked={projectorConfig.showCountdown} 
                                    onChange={(e) => setProjectorConfig(p => ({ ...p, showCountdown: e.target.checked }))} 
                                />
                                Waktu
                            </label>
                        </div>

                        <button 
                          className="btn btn-secondary" 
                          style={{ marginLeft: '16px', padding: '6px 12px', fontSize: '12px' }}
                          onClick={() => window.open('/projector/', 'ProjectorWindow', 'width=1280,height=720,resizable=yes')}
                        >
                          📺 Buka
                        </button>
                    </div>

                    <div className="tab-bar">
                        {(
                            [
                                ["seats", "Kursi"],
                                ["notes", "Catatan"],
                                ["countdown", "Hitung Mundur"],
                            ] as [TabId, string][]
                        ).map(([id, label]) => (
                            <button
                                key={id}
                                className={`tab ${activeTab === id ? "active" : ""}`}
                                onClick={() => setActiveTab(id)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </header>

                <div style={{ display: activeTab === "seats" ? "block" : "none" }}>
                    <SeatsTab
                        columns={columns}
                        disabledSeats={disabledSeats}
                        dragSourceSeat={dragSourceSeat}
                        dragOverSeat={dragOverSeat}
                        isLoading={isLoading}
                        handleDragStart={handleDragStart}
                        handleDragOver={handleDragOver}
                        handleDragLeave={handleDragLeave}
                        handleDrop={handleDrop}
                        handleDragEnd={handleDragEnd}
                    />
                </div>
                <div style={{ display: activeTab === "notes" ? "block" : "none" }}>
                    <NotesTab notes={notes} setNotes={setNotes} />
                </div>
                <div style={{ display: activeTab === "countdown" ? "block" : "none" }}>
                    <CountdownTab
                        timer={timer}
                        setTimer={setTimer}
                        racers={racers}
                        setRacers={setRacers}
                    />
                </div>
            </main>
        </div>
    );
}
