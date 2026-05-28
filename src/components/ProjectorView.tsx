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
  
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gap: '24px',
    height: '100vh',
    padding: '24px',
    boxSizing: 'border-box',
    background: 'var(--bg-page)',
  };

  if (activeCount === 1) {
    gridStyle.gridTemplateColumns = '1fr';
  } else if (activeCount === 2) {
    gridStyle.gridTemplateColumns = '1fr 1fr';
  } else if (activeCount === 3) {
    gridStyle.gridTemplateColumns = '1fr 1fr 1fr';
  }

  return (
    <div style={gridStyle}>
      {projectorConfig.showSeats && (
        <div style={{ overflowY: 'auto', background: 'rgba(255,255,255,0.85)', padding: '24px', borderRadius: '16px', boxShadow: 'var(--shadow-md)' }}>
          <h2 style={{marginTop: 0}}>Posisi Duduk</h2>
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
        <div style={{ overflowY: 'auto', background: 'rgba(255,255,255,0.85)', padding: '24px', borderRadius: '16px', boxShadow: 'var(--shadow-md)' }}>
          <h2 style={{marginTop: 0}}>Catatan Praktikum</h2>
          <NotesTab notes={notes} readOnly={true} />
        </div>
      )}

      {projectorConfig.showCountdown && (
        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <CountdownTab 
            timer={timer} 
            racers={racers} 
            readOnly={true} 
          />
        </div>
      )}
      
      {activeCount === 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
          <h2>Mode Proyektor Menunggu...</h2>
        </div>
      )}
    </div>
  );
}
