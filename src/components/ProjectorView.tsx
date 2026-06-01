import React, { useState, useEffect } from 'react';
import type { SeatData, TimerState, Racer, ProjectorConfig, Student } from './types';
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
  const [kelas, setKelas] = useState<string>("");
  const [eligibleStudents, setEligibleStudents] = useState<Student[]>([]);

  const [activeTab, setActiveTab] = useState<'generator' | 'info'>('generator');

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
      if (data.kelas !== undefined) setKelas(data.kelas);
      if (data.eligibleStudents) setEligibleStudents(data.eligibleStudents);
    };

    channel.postMessage({ type: 'REQUEST_SYNC' });

    return () => channel.close();
  }, []);

  const columns: SeatData[][] = [];
  for (let c = 0; c < 5; c++) columns.push(seats.slice(c * 10, (c + 1) * 10));

  const showInfoTab = projectorConfig.showNotes || projectorConfig.showCountdown;

  // Auto-switch tab if the current one gets disabled via config
  useEffect(() => {
    if (!projectorConfig.showSeats && activeTab === 'generator' && showInfoTab) {
      setActiveTab('info');
    } else if (!showInfoTab && activeTab === 'info' && projectorConfig.showSeats) {
      setActiveTab('generator');
    }
  }, [projectorConfig.showSeats, showInfoTab, activeTab]);

  const renderGenerator = () => (
    <div className="projector-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
        <LuLayoutGrid /> Posisi Duduk
      </div>
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

  const renderInfo = () => (
    <div style={{ display: 'flex', gap: '16px', flex: 1, overflow: 'hidden' }}>
      {projectorConfig.showNotes && (
        <div className="projector-panel" style={{ 
          width: projectorConfig.showCountdown ? '50%' : '100%',
          flex: projectorConfig.showCountdown ? '0 0 auto' : '1',
          resize: projectorConfig.showCountdown ? 'horizontal' : 'none',
          minWidth: '300px',
          maxWidth: '80%',
          display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
            <LuFileText /> Catatan Praktikum
          </div>
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            <NotesTab notes={notes} readOnly={true} />
          </div>
        </div>
      )}
      
      {projectorConfig.showCountdown && (
        <div className="projector-panel" style={{ 
          flex: '1 1 auto', 
          minWidth: '300px',
          display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
            <LuTimer /> Waktu & Pembalap
          </div>
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CountdownTab 
              timer={timer} 
              racers={racers} 
              readOnly={true} 
              kelas={kelas}
              eligibleStudents={eligibleStudents}
            />
          </div>
        </div>
      )}
    </div>
  );

  if (!projectorConfig.showSeats && !projectorConfig.showNotes && !projectorConfig.showCountdown) {
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '16px', boxSizing: 'border-box', background: 'var(--bg-page)' }}>
      {projectorConfig.showSeats && showInfoTab && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', flexShrink: 0 }}>
          <div className="tab-bar">
            <button 
              className={`tab ${activeTab === 'generator' ? 'active' : ''}`}
              onClick={() => setActiveTab('generator')}
            >
              Posisi Duduk
            </button>
            <button 
              className={`tab ${activeTab === 'info' ? 'active' : ''}`}
              onClick={() => setActiveTab('info')}
            >
              Informasi Tambahan
            </button>
          </div>
        </div>
      )}
      
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        {projectorConfig.showSeats && (!showInfoTab || activeTab === 'generator') && renderGenerator()}
        {showInfoTab && (!projectorConfig.showSeats || activeTab === 'info') && renderInfo()}
      </div>
    </div>
  );
}
