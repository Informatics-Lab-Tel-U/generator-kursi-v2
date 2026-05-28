import React from 'react';
import TiptapEditor from './TiptapEditor';

interface NotesTabProps {
  notes: string;
  setNotes: (val: string) => void;
}

export default function NotesTab({ notes, setNotes }: NotesTabProps) {
  return (
    <div className="notes-tab">
      <TiptapEditor content={notes} onChange={setNotes} />
    </div>
  );
}
