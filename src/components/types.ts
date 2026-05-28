import type { Student } from './mockData';

export interface SeatData {
  seatNo: number;
  student: Student | null;
}

export interface TimerState {
  startTime: string;
  endTime: string;
  isRunning: boolean;
  startedAt: number | null;
}

export interface Racer {
  id: string;
  name: string;
  imageBase64: string | null;
}

export interface RacerJitter {
  currentOffset: number;
  targetOffset: number;
  speed: number;
  finalOffset: number;
}

export type TabId = 'seats' | 'notes' | 'countdown';
