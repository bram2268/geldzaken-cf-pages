/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Abonnement, BetaalCyclus } from '../types';
import { Search, Plus, Calendar, Pencil, Trash2, CheckCircle, PauseCircle, Download, Settings, X, FolderPlus } from 'lucide-react';

interface SubscriptionListProps {
  abonnementen: Abonnement[];
  categorieen: string[];
  onAddAbonnement: (sub: Abonnement) => void;
  onUpdateAbonnement: (sub: Abonnement) => void;
  onDeleteAbonnement: (id: string) => void;
  onAddCategorie: (cat: string) => void;
  onDeleteCategorie: (cat: string) => void;
}

const CYCLES: BetaalCyclus[] = ['wekelijks', 'maandelijks', 'kwartaal', 'jaarlijks'];

const EMOJI_PRESETS = [
  '🏡', '🏥', '⚡', '🚗', '🍿', '🎵', '🎮', '📱', '📶', '💻',
  '🛡️', '🔑', '🚴', '👟', '🐾', '📦', '💳', '💼', '💧', '📚',
  '🍕', '🥦', '☕', '🌟', '🛒', '🔥', '❤️', '✈️', '🏋️', '🧸'
];

export default function SubscriptionList({
  abonnementen,
  categorieen,
  onAddAbonnement,
  onUpdateAbonnement,
  onDeleteAbonnement,
  onAddCategorie,
  onDeleteCategorie
}: SubscriptionListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Alle');
  const [selectedStatus, setSelectedStatus] = useState<string>('Alle');
  const [sortBy, setSortBy] = useState<'naam' | 'bedrag-desc' | 'bedrag-asc' | 'datum'>('datum');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Abonnement | null>(null);

  // New Category form state
  const [newCatName, setNewCatName] = useState('');

  // Form Fields state
  const [naam, setNaam] = useState('');
  const [bedrag, setBedrag] = useState('');
  const [valuta, setValuta] = useState('EUR');
  const [categorie, setCategorie] = useState<string>('');
  const [cyclus, setCyclus] = useState<BetaalCyclus>('maandelijks');
  const [volgendeBetaling, setVolgendeBetaling] = useState('');
  const [beschrijving, setBeschrijving] = useState('');
  const [status, setStatus] = useState<'actief' | 'gepauzeerd'>('actief');
  const [betaalmethode, setBetaalmethode] = useState('Automatische incasso');
  const [selectedEmoji, setSelectedEmoji] = useState('🏡');

  const openAddModal = () => {
    setEditingSub(null);
    setNaam('');
    setBedrag('');
    setValuta('EUR');
    // Selecteer eerste beschikbare categorie of Overig
    setCategorie(categorieen[0] || 'Overig');
    setCyclus('maandelijks');
    setVolgendeBetaling(new Date().toISOString().split('T')[0]);
    setBeschrijving('');
    setStatus('actief');
    setBetaalmethode('Automatische incasso');
    setSelectedEmoji('🏡');
    setIsModalOpen(true);
  };

  const openEditModal = (sub: Abonnement) => {
    setEditingSub(sub);
    setNaam(sub.naam);
    setBedrag(sub.bedrag.toString());
    setValuta(sub.valuta);
    setCategorie(sub.categorie);
    setCyclus(sub.cyclus);
    setVolgendeBetaling(sub.volgendeBetaling);
    setBeschrijving(sub.beschrijving || '');
    setStatus(sub.status);
    setBetaalmethode(sub.betaalmethode);
    setSelectedEmoji(sub.logo || '🏡');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!naam || !bedrag || !volgendeBetaling) return;

    const parsedBedrag = parseFloat(bedrag);
    if (isNaN(parsedBedrag)) return;

    const subData: Abonnement = {
      id: editingSub ? editingSub.id : `ab_${Date.now()}`,
      naam,
      bedrag: parsedBedrag,
      valuta,
      categorie,
      cyclus,
      volgendeBetaling,
      beschrijving,
      status,
      betaalmethode,
      logo: selectedEmoji,
      aangemaaktOp: editingSub ? editingSub.aangemaaktOp : new Date().toISOString()
    };

    if (editingSub) {
      onUpdateAbonnement(subData);
    } else {
      onAddAbonnement(subData);
    }
    setIsModalOpen(false);
  };

  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    
    // Voorkom duplicaten
    if (categorieen.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      alert('Deze categorie bestaat al.');
      return;
    }

    onAddCategorie(trimmed);
    setNewCatName('');
  };

  const handleToggleStatus = (sub: Abonnement) => {
    onUpdateAbonnement({
      ...sub,
      status: sub.status === 'actief' ? 'gepauzeerd' : 'actief'
    });
  };

  const exportCSV = () => {
    const headers = ['Naam', 'Bedrag', 'Valuta', 'Categorie', 'Cyclus', 'Volgende Betaling', 'Status', 'Betaalmethode', 'Beschrijving'];
    const rows = filteredAbonnementen.map(s => [
      s.naam,
      s.bedrag,
      s.valuta,
      s.categorie,
      s.cyclus,
      s.volgendeBetaling,
      s.status,
      s.betaalmethode,
      s.beschrijving || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `kosten_overzicht_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter & Sorteer logica
  const filteredAbonnementen = abonnementen
    .filter((sub) => {
      const matchesSearch = sub.naam.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (sub.beschrijving && sub.beschrijving.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'Alle' || sub.categorie === selectedCategory;
      const matchesStatus = selectedStatus === 'Alle' || sub.status === selectedStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'naam') return a.naam.localeCompare(b.naam);
      if (sortBy === 'bedrag-desc') return b.bedrag - a.bedrag;
      if (sortBy === 'bedrag-asc') return a.bedrag - b.bedrag;
      if (sortBy === 'datum') return new Date(a.volgendeBetaling).getTime() - new Date(b.volgendeBetaling).getTime();
      return 0;
    });

  // Genereer dynamische badgekleur op basis van categorienaam (deterministisch)
  const getCategoryColor = (cat: string) => {
    const colors = [
      'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      'bg-red-500/10 text-red-400 border border-red-500/20',
      'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
      'bg-purple-500/10 text-purple-400 border border-purple-500/20',
      'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
      'bg-pink-500/10 text-pink-400 border border-pink-500/20',
      'bg-orange-500/10 text-orange-400 border border-orange-500/20',
    ];
    
    let hash = 0;
    for (let i = 0; i < cat.length; i++) {
      hash = cat.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  return (
    <div className="space-y-4" id="abonnementen-lijst-container">
      
      {/* Zoekbalk, Filters & Beheer knop */}
      <div className="bg-brand-dark border border-brand-border rounded-xl p-4 flex flex-col gap-3.5 shadow-sm" id="filters-sectie">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Zoeken op naam of beschrijving..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-brand-black border border-brand-border rounded-lg pl-11 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Categorie Filter */}
          <div className="flex-1 min-w-[130px] flex items-center space-x-1.5 bg-brand-black border border-brand-border rounded-lg px-3 py-2.5">
            <span className="text-[10px] sm:text-xs uppercase font-mono text-zinc-550">Cat:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-white text-xs sm:text-sm focus:outline-none cursor-pointer border-0 p-0 w-full font-medium"
            >
              <option value="Alle" className="bg-brand-dark">Alle categorieën</option>
              {categorieen.map(cat => (
                <option key={cat} value={cat} className="bg-brand-dark">{cat}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex-1 min-w-[110px] flex items-center space-x-1.5 bg-brand-black border border-brand-border rounded-lg px-3 py-2.5">
            <span className="text-[10px] sm:text-xs uppercase font-mono text-zinc-550">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-white text-xs sm:text-sm focus:outline-none cursor-pointer border-0 p-0 w-full font-medium"
            >
              <option value="Alle" className="bg-brand-dark">Alle status</option>
              <option value="actief" className="bg-brand-dark">Actief</option>
              <option value="gepauzeerd" className="bg-brand-dark">Gepauzeerd</option>
            </select>
          </div>

          {/* Sorteren */}
          <div className="flex-1 min-w-[120px] flex items-center space-x-1.5 bg-brand-black border border-brand-border rounded-lg px-3 py-2.5">
            <span className="text-[10px] sm:text-xs uppercase font-mono text-zinc-550">Sorteer:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-white text-xs sm:text-sm focus:outline-none cursor-pointer border-0 p-0 w-full font-medium"
            >
              <option value="datum" className="bg-brand-dark">Betaaldatum</option>
              <option value="naam" className="bg-brand-dark">Naam (A-Z)</option>
              <option value="bedrag-desc" className="bg-brand-dark">Prijs: Hoog-Laag</option>
              <option value="bedrag-asc" className="bg-brand-dark">Prijs: Laag-Hoog</option>
            </select>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            {/* Categorieën Beheren Knop */}
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="flex items-center justify-center space-x-1.5 bg-zinc-900 hover:bg-zinc-800 border border-brand-border text-zinc-300 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-medium transition cursor-pointer"
              title="Categorieën beheren"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Categorieën</span>
            </button>

            {/* CSV Exporteren */}
            <button
              onClick={exportCSV}
              className="flex items-center justify-center space-x-1 bg-zinc-900 hover:bg-zinc-800 border border-brand-border text-zinc-300 py-2.5 px-3.5 rounded-lg text-xs sm:text-sm transition cursor-pointer"
              title="Exporteer naar CSV"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Toevoegen Knop (Zwart-wit stijl: wit achtergrond met zwarte tekst!) */}
            <button
              onClick={openAddModal}
              className="flex-1 sm:flex-initial bg-white hover:bg-zinc-200 text-black font-bold py-2.5 px-4.5 rounded-lg text-xs sm:text-sm transition flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Toevoegen</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lijst van abonnementen/kosten */}
      <div className="bg-brand-dark border border-brand-border rounded-xl overflow-hidden shadow-sm" id="abonnementen-lijst">
        <div className="p-4 border-b border-brand-border/60 bg-zinc-950/40 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Kosten & Overzicht ({filteredAbonnementen.length})
          </span>
          <span className="text-xs text-zinc-500 font-sans hidden sm:inline">
            Klik op de status-badge om snel te wisselen tussen actief/gepauzeerd
          </span>
        </div>

        {filteredAbonnementen.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">
            <p className="text-sm">Geen kosten gevonden met deze filters.</p>
            <button
              onClick={openAddModal}
              className="mt-4 bg-white hover:bg-zinc-200 text-black font-bold text-xs sm:text-sm px-5 py-2.5 rounded-lg transition"
            >
              Post toevoegen
            </button>
          </div>
        ) : (
          <div className="divide-y divide-brand-border">
            {filteredAbonnementen.map((sub) => (
              <div key={sub.id} className="p-4 hover:bg-zinc-950/25 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                <div className="flex items-center space-x-4">
                  {/* Icon */}
                  <div className="w-11 h-11 rounded-xl bg-zinc-950 border border-brand-border flex items-center justify-center text-lg font-bold text-zinc-300 group-hover:border-white transition shrink-0">
                    {sub.logo || sub.naam.charAt(0)}
                  </div>
                  
                  {/* Naam en details */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-white text-sm sm:text-base font-bold truncate max-w-[160px] sm:max-w-xs">{sub.naam}</h4>
                      <span className={`px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase rounded-full shrink-0 ${getCategoryColor(sub.categorie)}`}>
                        {sub.categorie}
                      </span>
                    </div>
                    <p className="text-zinc-400 text-xs truncate max-w-[200px] sm:max-w-sm">{sub.beschrijving || 'Geen omschrijving'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-5">
                  {/* Prijs en betaaldatum */}
                  <div className="text-left sm:text-right font-sans">
                    <div className="text-white font-bold text-sm sm:text-base font-display">
                      {sub.valuta === 'USD' ? '$' : sub.valuta === 'GBP' ? '£' : '€'}
                      {sub.bedrag.toFixed(2)}
                      <span className="text-zinc-500 text-xs font-normal"> / {sub.cyclus}</span>
                    </div>
                    <p className="text-zinc-400 text-xs mt-1 flex items-center space-x-1.5 sm:justify-end">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Volgende: {sub.volgendeBetaling}</span>
                    </p>
                  </div>

                  {/* Acties */}
                  <div className="flex items-center space-x-2">
                    {/* Status Toggle */}
                    <button
                      onClick={() => handleToggleStatus(sub)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase border transition duration-150 cursor-pointer ${
                        sub.status === 'actief'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-yellow-500/10 hover:text-yellow-400 hover:border-yellow-500/20'
                          : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/20'
                      }`}
                      title="Klik om status te wijzigen"
                    >
                      {sub.status === 'actief' ? <CheckCircle className="w-3.5 h-3.5" /> : <PauseCircle className="w-3.5 h-3.5" />}
                      <span>{sub.status}</span>
                    </button>

                    {/* Wijzigen */}
                    <button
                      onClick={() => openEditModal(sub)}
                      className="bg-zinc-950 hover:bg-zinc-900 border border-brand-border text-zinc-400 hover:text-white p-2.5 rounded-lg transition cursor-pointer"
                      title="Wijzigen"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    {/* Verwijderen */}
                    <button
                      onClick={() => onDeleteAbonnement(sub.id)}
                      className="bg-zinc-950 hover:bg-red-500/10 border border-brand-border hover:border-red-500/30 text-zinc-500 hover:text-red-400 p-2.5 rounded-lg transition cursor-pointer"
                      title="Verwijderen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- MODAL 1: CATEGORIEËN BEHEREN --- */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="category-manager-modal">
          <div className="bg-brand-dark border border-brand-border rounded-xl max-w-md w-full overflow-hidden shadow-2xl relative">
            <div className="p-5 border-b border-brand-border/60 flex items-center justify-between">
              <div>
                <h3 className="text-white font-display font-bold text-base">
                  Categorieën beheren
                </h3>
                <p className="text-zinc-400 text-xs mt-1">
                  Voeg eigen rubrieken toe voor bijvoorbeeld verzekeringen of leningen.
                </p>
              </div>
              <button 
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-zinc-400 hover:text-white p-2.5 cursor-pointer rounded-lg hover:bg-zinc-900 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Toevoegen Formulier */}
              <form onSubmit={handleAddCategorySubmit} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Bijv. Verzekeringen, Hypotheek"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 bg-brand-black border border-brand-border rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-zinc-650 focus:outline-none focus:border-white transition"
                />
                <button
                  type="submit"
                  className="bg-white hover:bg-zinc-200 text-black font-bold text-xs sm:text-sm px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>Toevoegen</span>
                </button>
              </form>

              {/* Categorieën Lijst */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {categorieen.map((cat) => (
                  <div key={cat} className="flex items-center justify-between p-3 bg-brand-black border border-brand-border rounded-lg text-sm">
                    <div className="flex items-center space-x-2.5">
                      <span className="w-3 h-3 rounded-full bg-zinc-500" style={{ backgroundColor: getCategoryColor(cat).split(' ')[1] }} />
                      <span className="text-white font-medium">{cat}</span>
                    </div>
                    {cat !== 'Overig' ? (
                      <button
                        onClick={() => {
                          if (confirm(`Weet u zeker dat u "${cat}" wilt verwijderen? Eventuele lopende posten vallen terug op "Overig".`)) {
                            onDeleteCategorie(cat);
                          }
                        }}
                        className="text-zinc-450 hover:text-red-400 p-2.5 rounded-lg hover:bg-zinc-950 transition cursor-pointer"
                        title="Verwijderen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <span className="text-zinc-500 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 bg-zinc-950 border border-zinc-900 rounded">Systeem</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: ABONNEMENT TOEVOEGEN / WIJZIGEN --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="abonnement-modal">
          <div className="bg-brand-dark border border-brand-border rounded-xl max-w-md w-full overflow-hidden shadow-2xl relative">
            <div className="p-5 border-b border-brand-border/60">
              <h3 className="text-white font-display font-bold text-base">
                {editingSub ? `Wijzig post: ${editingSub.naam}` : 'Nieuwe vaste last toevoegen'}
              </h3>
              <p className="text-zinc-400 text-xs mt-1">
                Vul de details in om de kosten bij te houden in je dashboard.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">Dienst/Naam</label>
                  <input
                    type="text"
                    required
                    placeholder="Bijv. CZ Verzekering"
                    value={naam}
                    onChange={(e) => setNaam(e.target.value)}
                    className="w-full bg-brand-black border border-brand-border rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-zinc-650 focus:outline-none focus:border-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">Categorie</label>
                  <select
                    value={categorie}
                    onChange={(e) => setCategorie(e.target.value)}
                    className="w-full bg-brand-black border border-brand-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white cursor-pointer"
                  >
                    {categorieen.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3.5">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">Bedrag</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    placeholder="9.99"
                    value={bedrag}
                    onChange={(e) => setBedrag(e.target.value)}
                    className="w-full bg-brand-black border border-brand-border rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-zinc-650 focus:outline-none focus:border-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">Valuta</label>
                  <select
                    value={valuta}
                    onChange={(e) => setValuta(e.target.value)}
                    className="w-full bg-brand-black border border-brand-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white cursor-pointer"
                  >
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">Cyclus</label>
                  <select
                    value={cyclus}
                    onChange={(e) => setCyclus(e.target.value as BetaalCyclus)}
                    className="w-full bg-brand-black border border-brand-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white cursor-pointer"
                  >
                    {CYCLES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">Volgende betaling</label>
                  <input
                    type="date"
                    required
                    value={volgendeBetaling}
                    onChange={(e) => setVolgendeBetaling(e.target.value)}
                    className="w-full bg-brand-black border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">Betaalmethode</label>
                  <select
                    value={betaalmethode}
                    onChange={(e) => setBetaalmethode(e.target.value)}
                    className="w-full bg-brand-black border border-brand-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white cursor-pointer"
                  >
                    <option value="Automatische incasso">Automatische incasso</option>
                    <option value="Creditcard">Creditcard</option>
                    <option value="PayPal">PayPal</option>
                    <option value="iDEAL">iDEAL</option>
                    <option value="Overig">Overig</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'actief' | 'gepauzeerd')}
                    className="w-full bg-brand-black border border-brand-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white cursor-pointer"
                  >
                    <option value="actief">Actief</option>
                    <option value="gepauzeerd">Gepauzeerd</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">Icoon / Emoji</label>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 bg-brand-black border border-brand-border rounded-lg animate-in fade-in" id="emoji-picker-container">
                  {EMOJI_PRESETS.map((emo) => (
                    <button
                      key={emo}
                      type="button"
                      onClick={() => setSelectedEmoji(emo)}
                      className={`w-10 h-10 flex items-center justify-center text-lg rounded-lg border transition cursor-pointer ${
                        selectedEmoji === emo
                          ? 'bg-white border-white text-black scale-110'
                          : 'bg-zinc-950 border-brand-border text-zinc-300 hover:bg-zinc-900 hover:border-zinc-500'
                      }`}
                    >
                      {emo}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">Beschrijving / Notitie</label>
                <textarea
                  placeholder="Bijv. Polisnummer of gedeelde kosten"
                  value={beschrijving}
                  onChange={(e) => setBeschrijving(e.target.value)}
                  rows={2}
                  className="w-full bg-brand-black border border-brand-border rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-zinc-650 focus:outline-none focus:border-white transition resize-none"
                />
              </div>

              <div className="pt-3.5 border-t border-brand-border/60 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-zinc-900 hover:bg-zinc-800 border border-brand-border text-zinc-300 py-2.5 px-4 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="bg-white hover:bg-zinc-200 text-black py-2.5 px-5 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer"
                >
                  {editingSub ? 'Opslaan' : 'Toevoegen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
