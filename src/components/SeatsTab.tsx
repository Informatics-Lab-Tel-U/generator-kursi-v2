import React from 'react';
import type { SeatData } from './types';

interface SeatsTabProps {
  columns: SeatData[][];
  disabledSeats: Set<number>;
  dragSourceSeat: number | null;
  dragOverSeat: number | null;
  isLoading: boolean;
  handleDragStart: (seatNo: number) => void;
  handleDragOver: (e: React.DragEvent, seatNo: number) => void;
  handleDragLeave: () => void;
  handleDrop: (seatNo: number) => void;
  handleDragEnd: () => void;
}

export default function SeatsTab({
  columns,
  disabledSeats,
  dragSourceSeat,
  dragOverSeat,
  isLoading,
  handleDragStart,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleDragEnd,
}: SeatsTabProps) {
  return (
    <div>
      <div className="seat-grid">
        {columns.map((column, colIdx) => (
          <div key={colIdx} className="seat-column">
            <div className="seat-column-header">
              <span className="col-no">NO</span>
              <span className="col-nim">NIM</span>
              <span className="col-asprak">ASPRAK</span>
            </div>
            {column.map((seat) => {
              const isDisabled = disabledSeats.has(seat.seatNo);
              const isDragSource = dragSourceSeat === seat.seatNo;
              const isDragOver = dragOverSeat === seat.seatNo;
              const hasStudent = seat.student !== null;

              return (
                <div
                  key={seat.seatNo}
                  className={[
                    "seat-row",
                    isDisabled && "disabled",
                    isDragSource && "dragging",
                    isDragOver && "drag-over",
                    hasStudent ? "occupied" : "empty",
                    isLoading && "skeleton",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  draggable={hasStudent && !isDisabled && !isLoading}
                  onDragStart={() => handleDragStart(seat.seatNo)}
                  onDragOver={(e) =>
                    !isDisabled && handleDragOver(e, seat.seatNo)
                  }
                  onDragLeave={handleDragLeave}
                  onDrop={() => !isDisabled && handleDrop(seat.seatNo)}
                  onDragEnd={handleDragEnd}
                >
                  <span className="cell-no">{seat.seatNo}</span>
                  <span className="cell-nim">
                    {isLoading ? (
                      <span className="skeleton-bar" />
                    ) : isDisabled ? (
                      <span className="disabled-label">—</span>
                    ) : (
                      seat.student?.name || ""
                    )}
                  </span>
                  <span className="cell-asprak">
                    {isLoading ? (
                      <span className="skeleton-bar short" />
                    ) : isDisabled ? (
                      <span className="disabled-label">—</span>
                    ) : (
                      seat.student?.asprak || ""
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
