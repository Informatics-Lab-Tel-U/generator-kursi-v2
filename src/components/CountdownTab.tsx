import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { TimerState, Racer, RacerJitter } from './types';
import { formatTimeWithMs, formatClockTime } from './utils';
import { LuPlay, LuPause, LuCar, LuCamera } from 'react-icons/lu';

interface CountdownTabProps {
  timer: TimerState;
  setTimer?: React.Dispatch<React.SetStateAction<TimerState>>;
  racers: Racer[];
  setRacers?: React.Dispatch<React.SetStateAction<Racer[]>>;
  readOnly?: boolean;
}

export default function CountdownTab({ timer, setTimer, racers, setRacers, readOnly = false }: CountdownTabProps) {
  const [now, setNow] = useState(new Date());
  const jitterMapRef = useRef<Record<string, RacerJitter>>({});
  const [newRacerName, setNewRacerName] = useState("");

  useEffect(() => {
    let interval: number;
    if (timer.isRunning) {
      interval = window.setInterval(() => {
        setNow(new Date());
        
        const jMap = jitterMapRef.current;
        Object.keys(jMap).forEach((id) => {
          const j = jMap[id];
          j.currentOffset += (j.targetOffset - j.currentOffset) * j.speed;
          if (Math.abs(j.targetOffset - j.currentOffset) < 1) {
            j.targetOffset = Math.random() * 30 - 15;
            j.speed = 0.02 + Math.random() * 0.04;
          }
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [timer.isRunning]);

  const handleRacerImageUpload = useCallback((id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        if (setRacers) setRacers((prev) => prev.map((r) => r.id === id ? { ...r, imageBase64: dataUrl } : r));
      };
      reader.readAsDataURL(file);
    }
  }, [setRacers]);

  const addRacer = useCallback(() => {
    if (newRacerName.trim() && setRacers) {
      setRacers((prev) => [
        ...prev,
        { id: Date.now().toString(), name: newRacerName.trim(), imageBase64: null },
      ]);
      setNewRacerName("");
    }
  }, [newRacerName, setRacers]);

  const removeRacer = useCallback((id: string) => {
    if (setRacers) setRacers((prev) => prev.filter((r) => r.id !== id));
  }, [setRacers]);

  const startRace = useCallback(() => {
    const shuffledRacers = [...racers].sort(() => Math.random() - 0.5);
    const newJitter: Record<string, RacerJitter> = {};

    shuffledRacers.forEach((r, idx) => {
      const finalOffset = idx === 0 ? 0 : -(idx * 3) - Math.random() * 3;
      newJitter[r.id] = {
        currentOffset: 0,
        targetOffset: Math.random() * 20 - 10,
        speed: 0.02 + Math.random() * 0.05,
        finalOffset,
      };
    });
    jitterMapRef.current = newJitter;
    if (setTimer) setTimer((p) => ({ ...p, isRunning: true, startedAt: Date.now() }));
  }, [racers, setTimer]);

  const startD = new Date();
  const [sh, sm] = timer.startTime.split(":").map(Number);
  startD.setHours(sh || 0, sm || 0, 0, 0);

  const endD = new Date();
  const [eh, em] = timer.endTime.split(":").map(Number);
  endD.setHours(eh || 0, em || 0, 0, 0);

  if (endD.getTime() < startD.getTime()) {
    endD.setDate(endD.getDate() + 1);
  }

  let totalSecs = Math.floor((endD.getTime() - startD.getTime()) / 1000);
  if (totalSecs <= 0) totalSecs = 1;

  let remainMs = totalSecs * 1000;
  if (timer.isRunning && timer.startedAt) {
    const elapsed = now.getTime() - timer.startedAt;
    remainMs = totalSecs * 1000 - elapsed;
  }
  if (remainMs < 0) remainMs = 0;

  const timerRatio = Math.max(0, Math.min(1, remainMs / (totalSecs * 1000)));

  return (
      <div className="countdown-tab" style={{ width: '100%' }}>
          {!readOnly && (
            <div className="countdown-config-card">
                <div className="countdown-field">
                    <label>Waktu Mulai</label>
                    <input
                        type="time"
                        value={timer.startTime}
                        onChange={(e) => setTimer && setTimer((p) => ({ ...p, startTime: e.target.value }))}
                    />
                </div>
                <div className="countdown-field">
                    <label>Waktu Selesai</label>
                    <input
                        type="time"
                        value={timer.endTime}
                        onChange={(e) => setTimer && setTimer((p) => ({ ...p, endTime: e.target.value }))}
                    />
                </div>
                <div>
                    {!timer.isRunning ? (
                        <button 
                          className="btn btn-start" 
                          style={{ padding: "12px 28px", height: "45px", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }} 
                          onClick={startRace}
                        >
                          <LuPlay /> Mulai
                        </button>
                    ) : (
                        <button 
                          className="btn btn-pause" 
                          style={{ padding: "12px 28px", height: "45px", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }} 
                          onClick={() => setTimer && setTimer((p) => ({ ...p, isRunning: false, startedAt: null }))}
                        >
                          <LuPause /> Hentikan
                        </button>
                    )}
                </div>
            </div>
          )}

          {!readOnly && !timer.isRunning && (
              <div className="racer-setup">
                  <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                    <LuCar /> Daftar Pembalap (ASPRAK)
                  </h3>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                      <input 
                        type="text" 
                        className="sidebar-input" 
                        placeholder="Kode ASPRAK (e.g. AFF)" 
                        value={newRacerName} 
                        onChange={(e) => setNewRacerName(e.target.value)} 
                        onKeyDown={(e) => e.key === "Enter" && addRacer()} 
                      />
                      <button className="btn btn-primary" onClick={addRacer}>+ Tambah</button>
                  </div>
                  <div className="racer-list">
                      {racers.map((r) => (
                          <div key={r.id} className="racer-list-item">
                              <div className="racer-avatar-preview">
                                  {r.imageBase64 ? <img src={r.imageBase64} alt={r.name} /> : <span>{r.name}</span>}
                              </div>
                              <span className="racer-name">{r.name}</span>
                              <label className="btn btn-secondary" style={{ cursor: "pointer", margin: 0, padding: "6px 10px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                                  <LuCamera /> Foto
                                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleRacerImageUpload(r.id, e)} />
                              </label>
                              <button 
                                className="btn" 
                                style={{ padding: "6px 10px", fontSize: "12px", margin: 0, background: 'var(--danger-surface)', color: 'var(--danger)' }} 
                                onClick={() => removeRacer(r.id)}
                              >
                                ✕
                              </button>
                          </div>
                      ))}
                      {racers.length === 0 && (
                        <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                          Belum ada pembalap
                        </div>
                      )}
                  </div>
              </div>
          )}

          <div className="race-track-container">
              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Waktu Tersisa</div>
                  <div className="countdown-time">{formatTimeWithMs(remainMs)}</div>
                  {timer.isRunning && timer.startedAt && (
                      <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-secondary)", marginTop: "8px" }}>
                          Selesai Pukul: {formatClockTime(new Date(timer.startedAt + totalSecs * 1000))}
                      </div>
                  )}
              </div>

              <div className="race-track">
                  {racers.length === 0 ? (
                      <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>Belum ada pembalap. Tambahkan pembalap di atas.</div>
                  ) : (
                      racers.map((racer) => {
                          const j = jitterMapRef.current[racer.id];
                          const progressFraction = 1 - timerRatio;
                          let racerProgress = progressFraction * 100;
                          if (j) {
                              const blendedOffset = j.currentOffset * (1 - progressFraction) + j.finalOffset * progressFraction;
                              racerProgress += blendedOffset;
                          }
                          if (timerRatio > 0) {
                              racerProgress = Math.max(0, Math.min(racerProgress, 99.5));
                          } else {
                              racerProgress = j ? 100 + j.finalOffset : 100;
                          }
                          return (
                              <div key={racer.id} className="race-lane">
                                  <div className="racer-vehicle" style={{ left: `calc(${racerProgress}% - ${(racerProgress / 100) * 88}px)` }}>
                                      <div className="racer-avatar">
                                          {racer.imageBase64 ? <img src={racer.imageBase64} alt={racer.name} /> : <span>{racer.name}</span>}
                                      </div>
                                  </div>
                              </div>
                          );
                      })
                  )}
                  <div className="finish-line"></div>
              </div>
          </div>
      </div>
  );
}
