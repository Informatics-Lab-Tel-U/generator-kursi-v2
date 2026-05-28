import React, { useState, useEffect } from 'react';
import type { SeatData, TimerState, Racer, ProjectorConfig } from './types';
import { makeEmptySeats } from './utils';

import SeatsTab from './SeatsTab';
import NotesTab from './NotesTab';
import CountdownTab from './CountdownTab';

import './KursiGenerator.css'; 

export default function ProjectorView() {
  const [seats, setSeats] = useState<SeatData[]>(makeEmptySeats(50));
  const [disabledSeats, setDisabledSeats] = useState<Set<number>>(new Set());
  const [timer, setTimer] = useState<TimerState>({ startTime: "08:00", endTime: "10:00", isRunning: false, startedAt: null });
  const [racers, setRacers] = useState<Racer[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [projectorConfig, setProjectorConfig] = useState<ProjectorConfig>({
    showSeats: true,
    showNotes: false,
    showCountdown: false,
  });

  useEffect(() => {
    const channel = new BroadcastChannel('kursi-gen-sync');
    channel.onmessage = (event) => {
      const data = event.data;
      if (data.seats) setSeats(data.seats);
      if (data.disabledSeats) setDisabledSeats(new Set(data.disabledSeats));
      if (data.timer) setTimer(data.timer);
      if (data.racers) setRacers(data.racers);
      if (data.notes) setNotes(data.notes);
      if (data.projectorConfig) setProjectorConfig(data.projectorConfig);
    };

    channel.postMessage({ type: 'REQUEST_SYNC' });

    return () => channel.close();
  }, []);

  const columns: SeatData[][] = [];
  for (let c = 0; c < 5; c++) columns.push(seats.slice(c * 10, (c + 1) * 10));

  const activeCount = [projectorConfig.showSeats, projectorConfig.showNotes, projectorConfig.showCountdown].filter(Boolean).length;
  
  let gridTemplateColumns = '1fr';
  let gridTemplateRows = '1fr';

  if (activeCount === 2) {
    gridTemplateColumns = '1fr 1fr';
  } else if (activeCount === 3) {
    gridTemplateColumns = '3fr 2fr';
    gridTemplateRows = '1fr 1fr';
  }

  return (
    <div 
      className="projector-grid"
      style={{
        display: 'grid',
        gap: '16px',
        height: '100vh',
        padding: '16px',
        boxSizing: 'border-box',
        background: 'var(--bg-page)',
        gridTemplateColumns,
        gridTemplateRows,
      }}
    >
      {projectorConfig.showSeats && (
        <div 
          className="projector-panel"
          style={{ 
            overflowY: 'auto', 
            background: 'var(--bg-card)', 
            padding: '20px', 
            borderRadius: 'var(--radius-lg)', 
            border: '1px solid var(--border)',
            gridRow: activeCount === 3 ? '1 / 3' : 'auto',
            gridColumn: activeCount === 3 ? '1 / 2' : 'auto'
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>💺 Posisi Duduk</h2>
          <SeatsTab 
            columns={columns}
            disabledSeats={disabledSeats}
            dragSourceSeat={null}
            dragOverSeat={null}
            isLoading={false}
            handleDragStart={() => {}}
            handleDragOver={() => {}}
            handleDragLeave={() => {}}
            handleDrop={() => {}}
            handleDragEnd={() => {}}
          />
        </div>
      )}

      {projectorConfig.showNotes && (
        <div 
          className="projector-panel"
          style={{ 
            overflowY: 'auto', 
            background: 'var(--bg-card)', 
            padding: '20px', 
            borderRadius: 'var(--radius-lg)', 
            border: '1px solid var(--border)',
            gridRow: activeCount === 3 ? '1 / 2' : 'auto',
            gridColumn: activeCount === 3 ? '2 / 3' : 'auto'
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>📝 Catatan Praktikum</h2>
          <NotesTab notes={notes} readOnly={true} />
        </div>
      )}

      {projectorConfig.showCountdown && (
        <div 
          className="projector-panel"
          style={{ 
            overflowY: 'auto', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            background: 'var(--bg-card)',
            padding: '20px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            gridRow: activeCount === 3 ? '2 / 3' : 'auto',
            gridColumn: activeCount === 3 ? '2 / 3' : 'auto'
          }}
        >
          <CountdownTab 
            timer={timer} 
            racers={racers} 
            readOnly={true} 
          />
        </div>
      )}
      
      {activeCount === 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📺</div>
            <h2 style={{ margin: 0, fontWeight: 600 }}>Mode Proyektor Menunggu...</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Aktifkan tampilan dari panel kontrol</p>
          </div>
        </div>
      )}
    </div>
  );
}
