import { useState, useEffect, useCallback } from "react";
import type { Student } from "./types";
import "./KursiGenerator.css";

import type {
    SeatData,
    TimerState,
    Racer,
    TabId,
    ProjectorConfig,
    SeatVersion,
} from "./types";
import { makeEmptySeats, fisherYatesShuffle, getDefaultTimerSession } from "./utils";

import Sidebar from "./Sidebar";
import SeatsTab from "./SeatsTab";
import NotesTab from "./NotesTab";
import CountdownTab from "./CountdownTab";
import {
    LuLayoutGrid,
    LuFileText,
    LuTimer,
    LuMonitor,
    LuSun,
    LuMoon,
    LuPanelLeftOpen,
} from "react-icons/lu";

function getRequiredTotalSeats(studentsCount: number, disabledSeats: Set<number>) {
    if (studentsCount === 0) return 50;
    let c = 10;
    while (true) {
        let disabledInC = 0;
        for (let d of disabledSeats) {
            if (d <= c) disabledInC++;
        }
        if (c - disabledInC >= studentsCount) {
            break;
        }
        c += 10;
    }
    return c;
}

function useTheme() {
    const [theme, setTheme] = useState<"light" | "dark">(() => {
        if (typeof window !== "undefined") {
            return (
                (document.documentElement.getAttribute("data-theme") as
                    | "light"
                    | "dark") || "dark"
            );
        }
        return "dark";
    });

    const toggleTheme = useCallback(() => {
        setTheme((prev) => {
            const next = prev === "dark" ? "light" : "dark";
            document.documentElement.setAttribute("data-theme", next);
            localStorage.setItem("kursi-theme", next);
            return next;
        });
    }, []);

    return { theme, toggleTheme };
}

export default function KursiGenerator() {
    const { theme, toggleTheme } = useTheme();
    const [matkul, setMatkul] = useState("");
    const [kelas, setKelas] = useState("");
    const [seats, setSeats] = useState<SeatData[]>(makeEmptySeats(50));
    const [disabledSeats, setDisabledSeats] = useState<Set<number>>(new Set([1, 2]));
    const [activeTab, setActiveTab] = useState<TabId>("seats");
    const [isLoading, setIsLoading] = useState(false);
    const [isOptionsLoading, setIsOptionsLoading] = useState(false);
    const [showSidebar, setShowSidebar] = useState(true);

    const [versions, setVersions] = useState<SeatVersion[]>([]);

    useEffect(() => {
        try {
            const saved = localStorage.getItem("kursi_versions");
            if (saved) {
                const parsed: SeatVersion[] = JSON.parse(saved);
                const now = Date.now();
                const valid = parsed.filter(v => now - v.timestamp < 2 * 60 * 60 * 1000); // 2 jam
                setVersions(valid);
                if (valid.length !== parsed.length) {
                    localStorage.setItem("kursi_versions", JSON.stringify(valid));
                }
            }
        } catch (e) {}
    }, []);

    // API State
    const [matkulOptions, setMatkulOptions] = useState<
        { value: string; label: string }[]
    >([]);
    const [kelasOptions, setKelasOptions] = useState<
        { value: string; label: string }[]
    >([]);
    const [isKelasLoading, setIsKelasLoading] = useState(false);
    const [eligibleStudents, setEligibleStudents] = useState<Student[]>([]);

    // 1. Fetch mata kuliah list on mount
    useEffect(() => {
        const fetchMataKuliah = async () => {
            const cacheKey = "kursi_matkul_cache";
            const cached = sessionStorage.getItem(cacheKey);
            if (cached) {
                try {
                    const data = JSON.parse(cached);
                    if (data && data.ok && Array.isArray(data.data)) {
                        setMatkulOptions(data.data.map((m: string) => ({ value: m, label: m })));
                        return;
                    }
                } catch (e) {
                    // Ignore cache if parsing fails
                }
            }

            setIsOptionsLoading(true);
            try {
                const res = await fetch("/api/praktikan/mata-kuliah");
                const data = await res.json();

                if (data && data.ok && Array.isArray(data.data)) {
                    sessionStorage.setItem(cacheKey, JSON.stringify(data));
                    setMatkulOptions(data.data.map((m: string) => ({ value: m, label: m })));
                }
            } catch (e) {
                console.error("Failed to fetch mata kuliah:", e);
            } finally {
                setIsOptionsLoading(false);
            }
        };

        fetchMataKuliah();
    }, []);

    // 2. Fetch kelas list when mata kuliah changes
    useEffect(() => {
        if (!matkul) {
            setKelasOptions([]);
            return;
        }

        const fetchKelas = async () => {
            const cacheKey = `kursi_kelas_${matkul}`;
            const cached = sessionStorage.getItem(cacheKey);
            if (cached) {
                try {
                    const data = JSON.parse(cached);
                    if (data && data.ok && Array.isArray(data.data)) {
                        setKelasOptions(data.data.map((k: string) => ({ value: k, label: k })));
                        return;
                    }
                } catch (e) {
                    // Ignore cache if parsing fails
                }
            }

            setIsKelasLoading(true);
            try {
                const res = await fetch(`/api/praktikan/kelas?mata_kuliah=${encodeURIComponent(matkul)}`);
                const data = await res.json();

                if (data && data.ok && Array.isArray(data.data)) {
                    sessionStorage.setItem(cacheKey, JSON.stringify(data));
                    setKelasOptions(data.data.map((k: string) => ({ value: k, label: k })));
                } else {
                    setKelasOptions([]);
                }
            } catch (e) {
                console.error("Failed to fetch kelas:", e);
                setKelasOptions([]);
            } finally {
                setIsKelasLoading(false);
            }
        };

        fetchKelas();
    }, [matkul]);

    // 3. Fetch students when both mata kuliah and kelas are selected
    useEffect(() => {
        if (!matkul || !kelas) {
            setEligibleStudents([]);
            setSeats(makeEmptySeats(50));
            return;
        }

        const fetchStudents = async () => {
            const cacheKey = kelas
                ? `kursi_students_${matkul}_${kelas}`
                : `kursi_students_${matkul}`;
            const cached = sessionStorage.getItem(cacheKey);

            setIsLoading(true);
            try {
                let data;
                if (cached) {
                    try {
                        data = JSON.parse(cached);
                    } catch (e) {}
                }

                if (!data) {
                    let url = `/api/praktikan?mata_kuliah=${encodeURIComponent(matkul)}`;
                    if (kelas) {
                        url += `&kelas=${encodeURIComponent(kelas)}`;
                    }
                    const res = await fetch(url);
                    data = await res.json();
                    if (data && (data.ok || data.data || Array.isArray(data))) {
                        sessionStorage.setItem(cacheKey, JSON.stringify(data));
                    }
                }

                let students: Student[] = [];
                const payload = data.data || data;

                if (Array.isArray(payload)) {
                    students = payload.map((s: any) => ({
                        id: s.id ? String(s.id) : `stu-${Math.random()}`,
                        name: s.nama || "Unknown",
                        kelas: s.kelas || kelas,
                        asprak: s.kode_asprak || "N/A",
                    }));
                }

                setEligibleStudents(students);

                // Auto generate immediately
                const shuffled = fisherYatesShuffle(students);
                const reqSeats = getRequiredTotalSeats(students.length, disabledSeats);
                const newSeats = makeEmptySeats(reqSeats);
                let idx = 0;
                for (let i = 0; i < reqSeats; i++) {
                    if (!disabledSeats.has(i + 1) && idx < shuffled.length) {
                        newSeats[i].student = shuffled[idx++];
                    }
                }
                setSeats(newSeats);
            } catch (e) {
                console.error("Failed to fetch students:", e);
                setEligibleStudents([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStudents();
    }, [matkul, kelas]);
    const [dragSourceSeat, setDragSourceSeat] = useState<number | null>(null);
    const [dragOverSeat, setDragOverSeat] = useState<number | null>(null);

    const [racers, setRacers] = useState<Racer[]>([]);
    const [timer, setTimer] = useState<TimerState>(() => {
        const defaultSession = getDefaultTimerSession();
        return {
            startTime: defaultSession.start,
            endTime: defaultSession.end,
            isRunning: false,
            startedAt: null,
        };
    });

    const [notes, setNotes] = useState<string>(
        "<h2>Modul 13</h2><hr><p>Password: abcd123</p>",
    );

    const [projectorConfig, setProjectorConfig] = useState<ProjectorConfig>({
        showSeats: true,
        showNotes: false,
        showCountdown: false,
    });



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
            kelas,
            eligibleStudents,
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
                    kelas,
                    eligibleStudents,
                });
            }
        };

        return () => channel.close();
    }, [seats, disabledSeats, timer, notes, racers, projectorConfig, kelas, eligibleStudents]);

    // Generate
    const handleGenerate = useCallback(() => {
        setIsLoading(true);
        setTimeout(() => {
            const filtered = eligibleStudents;
            const shuffled = fisherYatesShuffle(filtered);
            const reqSeats = getRequiredTotalSeats(filtered.length, disabledSeats);
            const newSeats = makeEmptySeats(reqSeats);
            let idx = 0;
            for (let i = 0; i < reqSeats; i++) {
                if (!disabledSeats.has(i + 1) && idx < shuffled.length) {
                    newSeats[i].student = shuffled[idx++];
                }
            }
            setSeats(newSeats);
            setIsLoading(false);

            const newVersion: SeatVersion = {
                id: Math.random().toString(36).substring(2, 11),
                timestamp: Date.now(),
                seats: newSeats,
                matkul,
                kelas,
            };

            setVersions((prev) => {
                const next = [newVersion, ...prev].slice(0, 20); // Simpan 20 riwayat terakhir
                localStorage.setItem("kursi_versions", JSON.stringify(next));
                return next;
            });
        }, 500);
    }, [eligibleStudents, disabledSeats, matkul, kelas]);

    const restoreVersion = useCallback((version: SeatVersion) => {
        setMatkul(version.matkul);
        setKelas(version.kelas);
        setSeats(version.seats);
    }, []);

    const handleReset = useCallback(
        () => setSeats(makeEmptySeats(getRequiredTotalSeats(eligibleStudents.length, disabledSeats))),
        [eligibleStudents.length, disabledSeats],
    );

    const toggleDisabledSeat = useCallback((seatNo: number) => {
        setDisabledSeats((prev) => {
            const next = new Set(prev);
            next.has(seatNo) ? next.delete(seatNo) : next.add(seatNo);
            return next;
        });
    }, []);

    // Regenerate seats if a disabled seat is currently occupied
    useEffect(() => {
        const needsRegeneration = seats.some(
            (seat) => disabledSeats.has(seat.seatNo) && seat.student !== null
        );
        if (needsRegeneration && eligibleStudents.length > 0 && !isLoading) {
            handleGenerate();
        }
    }, [disabledSeats, seats, eligibleStudents.length, isLoading, handleGenerate]);

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
    const currentTotalSeats = getRequiredTotalSeats(eligibleStudents.length, disabledSeats);
    let disabledInC = 0;
    for (let d of disabledSeats) if (d <= currentTotalSeats) disabledInC++;
    const activeSeatCount = currentTotalSeats - disabledInC;

    const displaySeats = makeEmptySeats(currentTotalSeats).map((emptySeat, i) => {
        return seats[i] || emptySeat;
    });

    const columns: SeatData[][] = [];
    for (let c = 0; c < currentTotalSeats / 10; c++) {
        columns.push(displaySeats.slice(c * 10, (c + 1) * 10));
    }

    const TAB_CONFIG: { id: TabId; label: string; icon: React.ReactNode }[] = [
        { id: "seats", label: "Kursi", icon: <LuLayoutGrid /> },
        { id: "notes", label: "Catatan", icon: <LuFileText /> },
        { id: "countdown", label: "Hitung Mundur", icon: <LuTimer /> },
    ];

    return (
        <div className="app-container">
            {!showSidebar && (
                <button
                    className={`sidebar-toggle closed`}
                    onClick={() => setShowSidebar(true)}
                    aria-label="Buka sidebar"
                >
                    <LuPanelLeftOpen style={{ fontSize: "20px" }} />
                </button>
            )}

            <Sidebar
                showSidebar={showSidebar}
                setShowSidebar={setShowSidebar}
                matkul={matkul}
                setMatkul={setMatkul}
                kelas={kelas}
                setKelas={setKelas}
                matkulOptions={matkulOptions}
                kelasOptions={kelasOptions}
                disabledSeats={disabledSeats}
                toggleDisabledSeat={toggleDisabledSeat}
                eligibleStudents={eligibleStudents}
                isLoading={isLoading}
                isOptionsLoading={isOptionsLoading}
                isKelasLoading={isKelasLoading}
                handleGenerate={handleGenerate}
                handleReset={handleReset}
                totalSeats={currentTotalSeats}
                projectorConfig={projectorConfig}
                setProjectorConfig={setProjectorConfig}
                versions={versions}
                restoreVersion={restoreVersion}
            />

            <main className="main-content">
                <header className="main-header">
                    <div className="header-top-row">
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "16px",
                                flexWrap: "wrap",
                            }}
                        >
                            <h1 className="main-title">
                                Generator {matkul} {kelas}
                            </h1>
                            <div className="main-subtitle">
                                {assignedCount}/{activeSeatCount} kursi terisi
                            </div>
                        </div>
                        <button
                            className="theme-toggle"
                            onClick={toggleTheme}
                            aria-label={
                                theme === "dark"
                                    ? "Ganti ke tema terang"
                                    : "Ganti ke tema gelap"
                            }
                            title={
                                theme === "dark" ? "Tema Terang" : "Tema Gelap"
                            }
                        >
                            {theme === "dark" ? <LuSun /> : <LuMoon />}
                        </button>
                    </div>

                    <div className="header-bottom-row">
                        <div className="tab-bar">
                            {TAB_CONFIG.map(({ id, label, icon }) => (
                                <button
                                    key={id}
                                    className={`tab ${activeTab === id ? "active" : ""}`}
                                    onClick={() => setActiveTab(id)}
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "6px",
                                    }}
                                >
                                    {icon}
                                    <span>{label}</span>
                                </button>
                            ))}
                        </div>

                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                flexWrap: "wrap",
                            }}
                        >
                            <div className="projector-bar">
                                <span className="projector-bar-label">
                                    Proyektor:
                                </span>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={projectorConfig.showSeats}
                                        onChange={(e) =>
                                            setProjectorConfig((p) => ({
                                                ...p,
                                                showSeats: e.target.checked,
                                            }))
                                        }
                                    />
                                    Kursi
                                </label>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={projectorConfig.showNotes}
                                        onChange={(e) =>
                                            setProjectorConfig((p) => ({
                                                ...p,
                                                showNotes: e.target.checked,
                                            }))
                                        }
                                    />
                                    Catatan
                                </label>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={projectorConfig.showCountdown}
                                        onChange={(e) =>
                                            setProjectorConfig((p) => ({
                                                ...p,
                                                showCountdown: e.target.checked,
                                            }))
                                        }
                                    />
                                    Waktu
                                </label>
                            </div>

                            <button
                                className="btn btn-secondary"
                                style={{
                                    padding: "6px 12px",
                                    fontSize: "12px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                }}
                                onClick={() =>
                                    window.open(
                                        "/projector",
                                        "ProjectorWindow",
                                        "width=1280,height=720,menubar=no,toolbar=no,location=no,status=no,resizable=yes",
                                    )
                                }
                            >
                                <LuMonitor />
                                Buka
                            </button>
                        </div>
                    </div>
                </header>

                {activeTab === "seats" && (
                    (!matkul || !kelas) ? (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            minHeight: '400px',
                            color: 'var(--text-muted)',
                            fontSize: '16px',
                            flexDirection: 'column',
                            gap: '12px'
                        }}>
                            <LuLayoutGrid style={{ fontSize: '48px', opacity: 0.5 }} />
                            <span>Silakan pilih Mata Kuliah dan Kelas terlebih dahulu</span>
                        </div>
                    ) : (
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
                    )
                )}
                {activeTab === "notes" && (
                    <NotesTab notes={notes} setNotes={setNotes} />
                )}
                {activeTab === "countdown" && (
                    <CountdownTab
                        timer={timer}
                        setTimer={setTimer}
                        racers={racers}
                        setRacers={setRacers}
                        kelas={kelas}
                        eligibleStudents={eligibleStudents}
                    />
                )}
            </main>
        </div>
    );
}
