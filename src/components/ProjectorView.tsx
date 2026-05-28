import React, { useState, useEffect } from 'react';
import type { SeatData, TimerState, Racer, ProjectorConfig } from './types';
import { makeEmptySeats } from './utils';

import SeatsTab from './SeatsTab';
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
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('kursi-gen-sync');
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
    } catch (e) {
      console.warn("BroadcastChannel registration failed or context is sandboxed:", e);
    }

    return () => {
      if (channel) channel.close();
    };
  }, []);

  const showSeats = projectorConfig?.showSeats ?? true;
  const showNotes = projectorConfig?.showNotes ?? false;
  const showCountdown = projectorConfig?.showCountdown ?? false;

  const activeCount = [showSeats, showNotes, showCountdown].filter(Boolean).length;
  
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
    Object.assign(gridStyle, {
      gridTemplateColumns: '3fr 2fr',
      gridTemplateRows: '1fr 1fr',
    });
  }

  const safeSeats = seats || [];
  const columns: SeatData[][] = [];
  for (let c = 0; c < 5; c++) {
    columns.push(safeSeats.slice(c * 10, (c + 1) * 10));
  }

  return (
    <div style={gridStyle}>
      {showSeats && (
        <div style={{ 
          overflowY: 'auto', 
          background: 'rgba(255,255,255,0.85)', 
          padding: '24px', 
          borderRadius: '16px', 
          boxShadow: 'var(--shadow-md)',
          gridRow: activeCount === 3 ? '1 / 3' : 'auto',
          gridColumn: activeCount === 3 ? '1 / 2' : 'auto'
        }}>
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

      {showNotes && (
        <div style={{ 
          overflowY: 'auto', 
          background: 'rgba(255,255,255,0.85)', 
          padding: '24px', 
          borderRadius: '16px', 
          boxShadow: 'var(--shadow-md)',
          gridRow: activeCount === 3 ? '1 / 2' : 'auto',
          gridColumn: activeCount === 3 ? '2 / 3' : 'auto'
        }}>
          <h2 style={{marginTop: 0}}>Catatan Praktikum</h2>
          <div 
            className="tiptap" 
            style={{ padding: 0, minHeight: 'auto', background: 'transparent' }} 
            dangerouslySetInnerHTML={{ __html: notes || "" }} 
          />
        </div>
      )}

      {showCountdown && (
        <div style={{ 
          overflowY: 'auto', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          gridRow: activeCount === 3 ? '2 / 3' : 'auto',
          gridColumn: activeCount === 3 ? '2 / 3' : 'auto'
        }}>
          <CountdownTab 
            timer={timer || { startTime: "08:00", endTime: "10:00", isRunning: false, startedAt: null }} 
            racers={racers || []} 
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
