import type { Student, ProjectorConfig } from './types';
import { LuSettings, LuBook, LuUsers, LuBan, LuDices, LuRotateCcw, LuFileText, LuLoader, LuPanelLeftClose } from 'react-icons/lu';

interface SidebarProps {
  showSidebar: boolean;
  setShowSidebar: (val: boolean) => void;
  matkul: string;
  setMatkul: (val: string) => void;
  kelas: string;
  setKelas: (val: string) => void;
  matkulOptions: {value: string, label: string}[];
  kelasMap: Record<string, {value: string, label: string}[]>;
  disabledSeats: Set<number>;
  toggleDisabledSeat: (seatNo: number) => void;
  eligibleStudents: Student[];
  isLoading: boolean;
  handleGenerate: () => void;
  handleReset: () => void;
  totalSeats: number;
  projectorConfig: ProjectorConfig;
  setProjectorConfig: React.Dispatch<React.SetStateAction<ProjectorConfig>>;
}

export default function Sidebar({
  showSidebar,
  setShowSidebar,
  matkul,
  setMatkul,
  kelas,
  setKelas,
  matkulOptions,
  kelasMap,
  disabledSeats,
  toggleDisabledSeat,
  eligibleStudents,
  isLoading,
  handleGenerate,
  handleReset,
  totalSeats,
}: SidebarProps) {
  const kelasOptions = kelasMap[matkul] || [];

  return (
    <aside className={`sidebar ${showSidebar ? "open" : "closed"}`}>
      <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <LuSettings style={{ fontSize: '16px', marginRight: '6px' }} />
            Konfigurasi
        </div>
        <button 
            onClick={() => setShowSidebar(false)}
            style={{ 
                background: 'transparent', 
                border: 'none', 
                color: 'var(--text-secondary)', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                padding: '4px',
                borderRadius: '4px'
            }}
            aria-label="Tutup sidebar"
            title="Tutup sidebar"
        >
            <LuPanelLeftClose style={{ fontSize: '18px' }} />
        </button>
      </div>

      {/* Matkul & Kelas */}
      <div className="sidebar-section">
        <label className="sidebar-label">
          <LuBook style={{ marginRight: '6px' }} /> Mata Kuliah
        </label>
        <select
          className="sidebar-select"
          value={matkul}
          onChange={(e) => {
            const v = e.target.value;
            setMatkul(v);
            setKelas(""); // Reset kelas so user must explicitly pick again
          }}
        >
          <option value="" disabled>-- Pilih Mata Kuliah --</option>
          {matkulOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <label className="sidebar-label">
          <LuUsers style={{ marginRight: '6px' }} /> Kelas
        </label>
        <select
          className="sidebar-select"
          value={kelas}
          onChange={(e) => setKelas(e.target.value)}
          disabled={!matkul}
        >
          <option value="" disabled>-- Pilih Kelas --</option>
          {kelasOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Disabled seats */}
      <div className="sidebar-section">
        <label className="sidebar-label">
          <LuBan style={{ marginRight: '6px' }} /> Meja tidak aktif
          {disabledSeats.size > 0 && (
            <span className="badge badge-danger">
              {disabledSeats.size}
            </span>
          )}
        </label>
        <div className="seat-toggle-grid">
          {Array.from(
            { length: totalSeats },
            (_, i) => i + 1,
          ).map((n) => (
            <button
              key={n}
              className={`seat-toggle ${disabledSeats.has(n) ? "disabled" : ""}`}
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
          {eligibleStudents.length} praktikan di <strong>{kelas}</strong>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleGenerate}
          disabled={!matkul || !kelas || eligibleStudents.length === 0 || isLoading}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          {isLoading ? (
            <><LuLoader className="animate-spin" /> Generating...</>
          ) : (
            <><LuDices /> Generate Acak</>
          )}
        </button>
        <button 
          className="btn btn-secondary" 
          onClick={handleReset} 
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <LuRotateCcw /> Reset
        </button>
      </div>

      {/* Notes info */}
      <div className="sidebar-section">
        <label className="sidebar-label">
          <LuFileText style={{ marginRight: '6px' }} /> Catatan
        </label>
        <div className="sidebar-info">
          Catatan dapat diubah melalui tab{" "}
          <strong>Catatan</strong>.
        </div>
      </div>

    </aside>
  );
}
