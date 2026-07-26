/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Notitie } from '../types';
import { 
  Plus, 
  Trash2, 
  Search, 
  FileText, 
  StickyNote, 
  CalendarDays,
  X
} from 'lucide-react';

interface NotesProps {
  notities: Notitie[];
  onAddNotitie: (titel: string, inhoud: string, kleur?: string) => void;
  onDeleteNotitie: (id: string) => void;
}

const COLOR_PRESETS = [
  { name: 'Klassiek', value: 'border-brand-border bg-brand-dark/95' },
  { name: 'Focus (Wit)', value: 'border-white bg-zinc-950 text-white' },
  { name: 'Warm', value: 'border-amber-500/30 bg-amber-950/10 text-zinc-100' },
  { name: 'Accent (Groen)', value: 'border-emerald-500/30 bg-emerald-950/10 text-zinc-100' },
  { name: 'Subtiel', value: 'border-zinc-800 bg-zinc-900/40 text-zinc-300' }
];

export default function Notes({ notities, onAddNotitie, onDeleteNotitie }: NotesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [titel, setTitel] = useState('');
  const [inhoud, setInhoud] = useState('');
  const [gekozenKleur, setGekozenKleur] = useState(COLOR_PRESETS[0].value);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titel.trim() || !inhoud.trim()) return;

    onAddNotitie(titel.trim(), inhoud.trim(), gekozenKleur);

    // Reset form
    setTitel('');
    setInhoud('');
    setGekozenKleur(COLOR_PRESETS[0].value);
    setIsFormOpen(false);
  };

  const gefilterdeNotities = notities.filter(note => 
    note.titel.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.inhoud.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-5" id="notes-tab-container">
      
      {/* HEADER & SEARCH BAR */}
      <div className="bg-brand-dark border border-brand-border rounded-xl p-4 flex flex-col md:flex-row gap-3.5 items-center justify-between shadow-sm" id="notes-header-control">
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <StickyNote className="w-5 h-5 text-zinc-400" />
          <div>
            <h2 className="text-white text-sm sm:text-base font-bold tracking-tight uppercase font-display">
              Persoonlijke Notities
            </h2>
            <p className="text-zinc-400 text-xs mt-0.5">
              Sla herinneringen, verhuis checklists en contractafspraken veilig op
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 md:w-60">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Notities doorzoeken..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-brand-black border border-brand-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-550 focus:outline-none focus:border-white transition"
            />
          </div>

          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="bg-white hover:bg-zinc-200 text-black font-bold py-2.5 px-4.5 rounded-lg text-xs sm:text-sm transition flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nieuwe Notitie</span>
          </button>
        </div>
      </div>

      {/* FORMULIER OM NOTITIE TOE TE VOEGEN */}
      {isFormOpen && (
        <div className="bg-[#09090b] border border-brand-border rounded-xl p-4 sm:p-5 animate-fade-in shadow-lg" id="new-note-form-wrapper">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-brand-border/40">
            <span className="text-xs sm:text-sm font-bold uppercase font-display text-zinc-300">Nieuwe notitie opstellen</span>
            <button 
              onClick={() => setIsFormOpen(false)} 
              className="text-zinc-500 hover:text-white p-2 sm:p-2.5 transition cursor-pointer rounded-lg hover:bg-zinc-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">Titel</label>
              <input
                type="text"
                required
                placeholder="Bijv. Checklist verhuizen, Offerte zonnepanelen"
                value={titel}
                onChange={(e) => setTitel(e.target.value)}
                className="w-full bg-brand-dark border border-brand-border rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-zinc-650 focus:outline-none focus:border-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">Inhoud</label>
              <textarea
                required
                placeholder="Typ hier de volledige inhoud van uw notitie..."
                value={inhoud}
                onChange={(e) => setInhoud(e.target.value)}
                rows={4}
                className="w-full bg-brand-dark border border-brand-border rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-zinc-650 focus:outline-none focus:border-white transition resize-y font-sans"
              />
            </div>

            {/* Kleur kiezer */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">Kleurstijl kaart</label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => setGekozenKleur(p.value)}
                    className={`px-3.5 py-2 text-xs rounded-lg border transition cursor-pointer ${
                      gekozenKleur === p.value
                        ? 'bg-white text-black border-white font-bold'
                        : 'bg-brand-dark border-brand-border text-zinc-400 hover:text-white hover:border-zinc-500'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="bg-zinc-900 hover:bg-zinc-800 border border-brand-border text-zinc-300 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer"
              >
                Annuleren
              </button>
              <button
                type="submit"
                className="bg-white hover:bg-zinc-200 text-black px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer"
              >
                Opslaan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* NOTITIES GRID */}
      {gefilterdeNotities.length === 0 ? (
        <div className="bg-brand-dark border border-brand-border rounded-xl p-12 text-center shadow-sm" id="no-notes-view">
          <FileText className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-400 text-xs sm:text-sm font-semibold">Geen notities gevonden.</p>
          <p className="text-zinc-550 text-xs mt-1">Druk op "Nieuwe Notitie" om uw eerste notitie aan te maken.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5" id="notes-grid">
          {gefilterdeNotities.map((note) => (
            <div 
              key={note.id} 
              className={`border rounded-xl p-4 flex flex-col justify-between transition min-h-48 shadow-sm ${note.kleur || 'border-brand-border bg-brand-dark/95'}`}
            >
              <div>
                <div className="flex justify-between items-start gap-2 mb-3 pb-2 border-b border-brand-border/30">
                  <h3 className="text-white text-sm font-bold tracking-tight truncate flex-1">{note.titel}</h3>
                  <button
                    onClick={() => onDeleteNotitie(note.id)}
                    className="text-zinc-400 hover:text-red-400 transition p-2 sm:p-2.5 rounded-lg hover:bg-black/20 shrink-0 cursor-pointer"
                    title="Notitie verwijderen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                {/* De eigenlijke inhoud */}
                <p className="text-zinc-300 text-xs leading-relaxed whitespace-pre-wrap font-sans break-words max-h-48 overflow-y-auto pr-1">
                  {note.inhoud}
                </p>
              </div>

              {/* Datum aanduiding */}
              <div className="mt-4 pt-2 border-t border-brand-border/20 flex items-center justify-between text-[11px] text-zinc-500 uppercase font-medium">
                <span className="flex items-center space-x-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-zinc-550 shrink-0" />
                  <span>{new Date(note.aangemaaktOp).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </span>
                <span className="font-mono text-[10px]">ID: {note.id.split('_')[1]?.substring(0, 5) || note.id}</span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
