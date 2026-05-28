import { MATKUL_OPTIONS, KELAS_MAP } from './mockData';
import type { Student } from './mockData';
import type { ProjectorConfig } from './types';

interface SidebarProps {
  showSidebar: boolean;
  matkul: string;
  setMatkul: (val: string) => void;
  kelas: string;
  setKelas: (val: string) => void;
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
  matkul,
  setMatkul,
  kelas,
  setKelas,
  disabledSeats,
  toggleDisabledSeat,
  eligibleStudents,
  isLoading,
  handleGenerate,
  handleReset,
  totalSeats,
}: SidebarProps) {
  const kelasOptions = KELAS_MAP[matkul] || [];

  return (
    <aside className={`sidebar ${showSidebar ? "open" : "closed"}`}>
      <div className="sidebar-header">
        <span style={{ fontSize: '16px', marginRight: '6px' }}>⚙️</span>
        Konfigurasi
      </div>

      {/* Matkul & Kelas */}
      <div className="sidebar-section">
        <label className="sidebar-label">📚 Mata Kuliah</label>
        <select
          className="sidebar-select"
          value={matkul}
          onChange={(e) => {
            const v = e.target.value;
            setMatkul(v);
            setKelas(KELAS_MAP[v]?.[0]?.value || "");
          }}
        >
          {MATKUL_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <label className="sidebar-label">🏫 Kelas</label>
        <select
          className="sidebar-select"
          value={kelas}
          onChange={(e) => setKelas(e.target.value)}
        >
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
          🚫 Meja tidak aktif
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
          disabled={isLoading}
          style={{ width: '100%' }}
        >
          {isLoading ? '⏳ Generating...' : '🎲 Generate Acak'}
        </button>
        <button className="btn btn-secondary" onClick={handleReset} style={{ width: '100%' }}>
          ↺ Reset
        </button>
      </div>

      {/* Notes info */}
      <div className="sidebar-section">
        <label className="sidebar-label">📝 Catatan</label>
        <div className="sidebar-info">
          Catatan dapat diubah melalui tab{" "}
          <strong>Catatan</strong>.
        </div>
      </div>

    </aside>
  );
}
