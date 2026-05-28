import React, { useState, useEffect } from 'react';
import type { SeatData, TimerState, Racer, ProjectorConfig } from './types';
import { makeEmptySeats } from './utils';

import SeatsTab from './SeatsTab';
import NotesTab from './NotesTab';
import CountdownTab from './CountdownTab';
import { LuLayoutGrid, LuFileText, LuTimer, LuMonitor } from 'react-icons/lu';

import './KursiGenerator.css'; 

type PanelId = 'seats' | 'notes' | 'countdown';

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

  const [panelOrder, setPanelOrder] = useState<PanelId[]>(['seats', 'notes', 'countdown']);
  const [draggedPanel, setDraggedPanel] = useState<PanelId | null>(null);

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

  const activePanels = panelOrder.filter(id => {
    if (id === 'seats') return projectorConfig.showSeats;
    if (id === 'notes') return projectorConfig.showNotes;
    if (id === 'countdown') return projectorConfig.showCountdown;
    return false;
  });

  const handleDragStart = (e: React.DragEvent, id: PanelId) => {
    setDraggedPanel(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: PanelId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, id: PanelId) => {
    e.preventDefault();
    if (draggedPanel && draggedPanel !== id) {
      setPanelOrder(prev => {
        const newOrder = [...prev];
        const srcIdx = newOrder.indexOf(draggedPanel);
        const tgtIdx = newOrder.indexOf(id);
        if (srcIdx > -1 && tgtIdx > -1) {
          [newOrder[srcIdx], newOrder[tgtIdx]] = [newOrder[tgtIdx], newOrder[srcIdx]];
        }
        return newOrder;
      });
    }
    setDraggedPanel(null);
  };

  const renderPanelHeader = (id: PanelId, title: string) => (
    <div 
      draggable
      onDragStart={(e) => handleDragStart(e, id)}
      onDragOver={(e) => handleDragOver(e, id)}
      onDrop={(e) => handleDrop(e, id)}
      style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '16px',
        cursor: 'grab',
        padding: '8px',
        margin: '-8px -8px 16px -8px',
        borderRadius: 'var(--radius-sm)',
        background: draggedPanel === id ? 'var(--bg-hover)' : 'transparent',
      }}
      title="Tahan dan geser untuk memindahkan posisi"
    >
      <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h2>
      <div style={{ color: 'var(--text-muted)', fontSize: '16px', cursor: 'grab' }}>⋮⋮</div>
    </div>
  );

  const renderPanelContent = (id: PanelId, customStyle: React.CSSProperties) => {
    const panelStyle: React.CSSProperties = {
      overflow: 'auto', 
      background: 'var(--bg-card)', 
      padding: '20px', 
      borderRadius: 'var(--radius-lg)', 
      border: '1px solid var(--border)',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '100%',
      maxHeight: '100%',
      ...customStyle
    };

    if (id === 'seats') {
      return (
        <div key="seats" className="projector-panel" style={panelStyle}>
          {renderPanelHeader('seats', <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><LuLayoutGrid /> Posisi Duduk</span>)}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
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
        </div>
      );
    }

    if (id === 'notes') {
      return (
        <div key="notes" className="projector-panel" style={panelStyle}>
          {renderPanelHeader('notes', <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><LuFileText /> Catatan Praktikum</span>)}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            <NotesTab notes={notes} readOnly={true} />
          </div>
        </div>
      );
    }

    if (id === 'countdown') {
      return (
        <div key="countdown" className="projector-panel" style={{...panelStyle, alignItems: 'center', justifyContent: 'center'}}>
          <div style={{ width: '100%' }}>
            {renderPanelHeader('countdown', <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><LuTimer /> Waktu & Pembalap</span>)}
          </div>
          <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 0, overflowY: 'auto' }}>
            <CountdownTab 
              timer={timer} 
              racers={racers} 
              readOnly={true} 
            />
          </div>
        </div>
      );
    }

    return null;
  };

  if (activePanels.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-page)', color: 'var(--text-muted)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}><LuMonitor /></div>
          <h2 style={{ margin: 0, fontWeight: 600 }}>Mode Proyektor Menunggu...</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Aktifkan tampilan dari panel kontrol</p>
        </div>
      </div>
    );
  }

  if (activePanels.length === 1) {
    return (
      <div style={{ height: '100vh', padding: '16px', boxSizing: 'border-box', background: 'var(--bg-page)' }}>
        {renderPanelContent(activePanels[0], { width: '100%', height: '100%', resize: 'none' })}
      </div>
    );
  }

  if (activePanels.length === 2) {
    return (
      <div style={{ display: 'flex', gap: '16px', height: '100vh', padding: '16px', boxSizing: 'border-box', background: 'var(--bg-page)' }}>
        {renderPanelContent(activePanels[0], { width: '50%', flex: '0 0 auto', resize: 'horizontal', minWidth: '300px' })}
        {renderPanelContent(activePanels[1], { flex: '1 1 auto', resize: 'none', minWidth: '300px' })}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '16px', height: '100vh', padding: '16px', boxSizing: 'border-box', background: 'var(--bg-page)' }}>
      {renderPanelContent(activePanels[0], { width: '60%', flex: '0 0 auto', resize: 'horizontal', minWidth: '300px' })}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: '1 1 auto', minWidth: '300px' }}>
        {renderPanelContent(activePanels[1], { height: '50%', flex: '0 0 auto', resize: 'vertical', minHeight: '200px' })}
        {renderPanelContent(activePanels[2], { flex: '1 1 auto', resize: 'none', minHeight: '200px' })}
      </div>
    </div>
  );
}
