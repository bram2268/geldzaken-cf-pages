/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Users, Receipt, Wallet, CheckSquare, Square } from 'lucide-react';
import { MaandBalansData, EenmaligeUitgave, Abonnement } from '../types';

interface BalansProps {
  email: string | null;
  vasteLasten: Abonnement[];
}

const formatCurrency = (val: number) => 
  `€${val.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Balans({ email, vasteLasten }: BalansProps) {
  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [maandData, setMaandData] = useState<MaandBalansData>({
    eenmaligeUitgaven: [],
    isAfgerekend: false,
  });

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [beschrijving, setBeschrijving] = useState('');
  const [bedrag, setBedrag] = useState('');
  const [betaaldDoor, setBetaaldDoor] = useState<'Thomas' | 'Sanne' | 'Gezamenlijk'>('Thomas');
  const [datum, setDatum] = useState<string>(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const key = `subscription_tracker_balans_${email || 'local'}_${currentMonth}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      setMaandData(JSON.parse(saved));
    } else {
      setMaandData({ eenmaligeUitgaven: [], isAfgerekend: false });
    }
  }, [currentMonth, email]);

  const saveData = (newData: MaandBalansData) => {
    setMaandData(newData);
    const key = `subscription_tracker_balans_${email || 'local'}_${currentMonth}`;
    localStorage.setItem(key, JSON.stringify(newData));
  };

  const toggleAfgerekend = () => {
    saveData({
      ...maandData,
      isAfgerekend: !maandData.isAfgerekend,
    });
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!beschrijving || !bedrag) return;

    const newExpense: EenmaligeUitgave = {
      id: Date.now().toString(),
      beschrijving,
      bedrag: parseFloat(bedrag),
      datum,
      betaaldDoor,
    };

    saveData({
      ...maandData,
      eenmaligeUitgaven: [...(maandData.eenmaligeUitgaven || []), newExpense],
    });

    setBeschrijving('');
    setBedrag('');
    setShowAddExpense(false);
  };

  const handleDeleteExpense = (id: string) => {
    saveData({
      ...maandData,
      eenmaligeUitgaven: (maandData.eenmaligeUitgaven || []).filter((u) => u.id !== id),
    });
  };

  const totaalVasteLasten = useMemo(() => {
    return vasteLasten
      .filter((s) => s.status === 'actief')
      .reduce((acc, sub) => {
        let monthlyCost = sub.bedrag;
        if (sub.cyclus === 'wekelijks') monthlyCost = (sub.bedrag * 52) / 12;
        if (sub.cyclus === 'kwartaal') monthlyCost = sub.bedrag / 3;
        if (sub.cyclus === 'jaarlijks') monthlyCost = sub.bedrag / 12;
        return acc + monthlyCost;
      }, 0);
  }, [vasteLasten]);

  const eenmaligeKostenThomas = (maandData.eenmaligeUitgaven || [])
    .filter((u) => u.betaaldDoor === 'Thomas')
    .reduce((sum, u) => sum + u.bedrag, 0);

  const eenmaligeKostenSanne = (maandData.eenmaligeUitgaven || [])
    .filter((u) => u.betaaldDoor === 'Sanne')
    .reduce((sum, u) => sum + u.bedrag, 0);

  const eenmaligeKostenGezamenlijk = (maandData.eenmaligeUitgaven || [])
    .filter((u) => u.betaaldDoor === 'Gezamenlijk')
    .reduce((sum, u) => sum + u.bedrag, 0);

  const totaalEenmalig = eenmaligeKostenThomas + eenmaligeKostenSanne + eenmaligeKostenGezamenlijk;
  const totaalKosten = totaalVasteLasten + totaalEenmalig;
  const deelPerPersoon = totaalKosten / 2;

  const thomasContributed = totaalVasteLasten + eenmaligeKostenThomas + (eenmaligeKostenGezamenlijk / 2);
  const sanneContributed = eenmaligeKostenSanne + (eenmaligeKostenGezamenlijk / 2);

  const thomasBalance = thomasContributed - deelPerPersoon;

  const getMonthName = (YYYY_MM: string) => {
    const [year, month] = YYYY_MM.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleString('nl-NL', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      
      {/* Maand Selectie */}
      <div className="bg-brand-dark border border-brand-border rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm gap-4">
        <h2 className="text-white font-display font-semibold text-lg flex items-center space-x-2">
          <Users className="w-5 h-5 text-emerald-400" />
          <span>Balans & Samenwonen</span>
        </h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <input 
            type="month" 
            value={currentMonth}
            onChange={(e) => setCurrentMonth(e.target.value)}
            className="w-full sm:w-auto bg-brand-black border border-brand-border rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-white transition"
          />
        </div>
      </div>

      {/* Kosten Overzicht */}
      <div className="bg-brand-black border border-brand-border rounded-xl p-5 sm:p-6 shadow-sm">
        <h3 className="text-white font-display font-semibold mb-4 border-b border-brand-border pb-2">Kostenoverzicht ({getMonthName(currentMonth)})</h3>
        
        <div className="grid grid-cols-3 gap-4 p-4 bg-zinc-900/50 rounded-lg border border-brand-border/50">
          <div>
            <span className="text-xs text-zinc-500 block mb-1">Vaste Lasten (Totaal)</span>
            <span className="text-sm text-white font-bold block">{formatCurrency(totaalVasteLasten)}</span>
          </div>
          <div>
            <span className="text-xs text-zinc-500 block mb-1">Eenmalig (Totaal)</span>
            <span className="text-sm text-white font-bold block">{formatCurrency(totaalEenmalig)}</span>
          </div>
          <div>
            <span className="text-xs text-emerald-500 block mb-1">Totaal te verdelen</span>
            <span className="text-sm text-white font-bold block">{formatCurrency(totaalKosten)}</span>
          </div>
        </div>
      </div>

      {/* Eenmalige Kosten */}
      <div className="bg-brand-dark border border-brand-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-brand-border/60 bg-zinc-950/40 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Receipt className="w-4 h-4 text-zinc-400" />
            <span className="text-sm font-semibold text-white">Eenmalige Kosten ({(maandData.eenmaligeUitgaven || []).length})</span>
          </div>
          <button 
            onClick={() => setShowAddExpense(!showAddExpense)}
            className="flex items-center space-x-1.5 text-xs font-semibold bg-white text-black px-3 py-1.5 rounded-lg hover:bg-zinc-200 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Toevoegen</span>
          </button>
        </div>

        {showAddExpense && (
          <form onSubmit={handleAddExpense} className="p-4 bg-brand-black border-b border-brand-border space-y-4 animate-in slide-in-from-top-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 tracking-wider mb-1.5">Beschrijving</label>
                <input 
                  required
                  type="text" 
                  value={beschrijving}
                  onChange={(e) => setBeschrijving(e.target.value)}
                  placeholder="Boodschappen AH, Etentje..."
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 tracking-wider mb-1.5">Bedrag</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 font-bold text-zinc-400">€</span>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    value={bedrag}
                    onChange={(e) => setBedrag(e.target.value)}
                    placeholder="50.00"
                    className="w-full bg-brand-dark border border-brand-border rounded-lg pl-8 pr-3 py-2 text-sm text-white focus:outline-none focus:border-white transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 tracking-wider mb-1.5">Datum</label>
                <input 
                  required
                  type="date" 
                  value={datum}
                  onChange={(e) => setDatum(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 tracking-wider mb-1.5">Betaald Door</label>
                <select 
                  value={betaaldDoor}
                  onChange={(e) => setBetaaldDoor(e.target.value as any)}
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white transition"
                >
                  <option value="Thomas">Thomas</option>
                  <option value="Sanne">Sanne</option>
                  <option value="Gezamenlijk">Gezamenlijke Rekening</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button 
                type="button" 
                onClick={() => setShowAddExpense(false)}
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition"
              >
                Annuleren
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 text-xs font-semibold bg-emerald-500 text-black hover:bg-emerald-400 rounded-lg transition"
              >
                Opslaan
              </button>
            </div>
          </form>
        )}

        {(!maandData.eenmaligeUitgaven || maandData.eenmaligeUitgaven.length === 0) ? (
          <div className="p-10 text-center text-zinc-500">
            <Receipt className="w-8 h-8 mx-auto mb-3 text-zinc-600 opacity-50" />
            <p className="text-sm">Geen eenmalige kosten toegevoegd in deze maand.</p>
          </div>
        ) : (
          <div className="divide-y divide-brand-border">
            {maandData.eenmaligeUitgaven.map((uitgave) => (
              <div key={uitgave.id} className="p-4 hover:bg-zinc-950/25 transition flex items-center justify-between group">
                <div>
                  <h4 className="text-white text-sm font-semibold">{uitgave.beschrijving}</h4>
                  <p className="text-zinc-500 text-xs mt-0.5 flex items-center space-x-2">
                    <span>{new Date(uitgave.datum).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short' })}</span>
                    <span>&bull;</span>
                    <span className={uitgave.betaaldDoor === 'Thomas' ? 'text-blue-400' : uitgave.betaaldDoor === 'Sanne' ? 'text-purple-400' : 'text-zinc-400'}>
                      {uitgave.betaaldDoor}
                    </span>
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-white font-bold text-sm">{formatCurrency(uitgave.bedrag)}</span>
                  <button 
                    onClick={() => handleDeleteExpense(uitgave.id)}
                    className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Eindafrekening */}
      <div className="bg-brand-black border border-brand-border rounded-xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full pointer-events-none"></div>
        <h3 className="text-white font-display font-semibold mb-4 border-b border-brand-border pb-2">Eindafrekening ({getMonthName(currentMonth)})</h3>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <span className="text-xs uppercase text-zinc-500 font-semibold tracking-wider block mb-1">Bedrag per persoon (50%)</span>
            <div className="text-3xl text-white font-bold font-display">{formatCurrency(deelPerPersoon)}</div>
          </div>
          
          <div className="bg-brand-dark border border-brand-border rounded-lg p-4 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto z-10">
            <div className="flex-1 text-center sm:text-left">
              {thomasBalance > 0 ? (
                <div className="text-sm text-white">
                  Sanne moet aan Thomas <span className="text-emerald-400 font-bold">{formatCurrency(thomasBalance)}</span> betalen.
                </div>
              ) : thomasBalance < 0 ? (
                <div className="text-sm text-white">
                  Thomas moet aan Sanne <span className="text-emerald-400 font-bold">{formatCurrency(Math.abs(thomasBalance))}</span> betalen.
                </div>
              ) : (
                <div className="text-sm text-zinc-400">Jullie staan quitte!</div>
              )}
            </div>
            
            <button 
              onClick={toggleAfgerekend}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap ${
                maandData.isAfgerekend 
                  ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' 
                  : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              {maandData.isAfgerekend ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
              <span>{maandData.isAfgerekend ? 'Sanne heeft betaald' : 'Markeer als betaald'}</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
