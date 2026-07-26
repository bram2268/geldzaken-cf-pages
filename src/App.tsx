/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Abonnement, MaandInkomst, Notitie } from './types';
import SubscriptionList from './components/SubscriptionList';
import Analytics from './components/Analytics';
import Auth from './components/Auth';
import Notes from './components/Notes';
import Balans from './components/Balans';
import { isSupabaseConfigured, dbService, supabase } from './lib/api';

import { 
  LayoutDashboard, 
  CreditCard, 
  LineChart, 
  Calendar, 
  Plus, 
  User, 
  LogOut,
  TrendingUp,
  FileText,
  Sun,
  Moon,
  Loader2,
  Users
} from 'lucide-react';

const DEFAULT_CATEGORIES = [
  'Verzekeringen',
  'Hypotheek & Huur',
  'Energie & Nutsvoorzieningen',
  'Streaming & Media',
  'Productiviteit',
  'Gezondheid & Sport',
  'Overig'
];

export default function App() {
  // --- Authentication State ---
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string; id?: string; isGoogleUser?: boolean } | null>(() => {
    const savedSession = localStorage.getItem('subscription_tracker_session');
    return savedSession ? JSON.parse(savedSession) : null;
  });

  // Track the email of the user whose data has been loaded in state to prevent race conditions
  const loadedUserEmailRef = React.useRef<string | null>(null);
  
  // Loading state for Supabase background queries
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [isSessionVerified, setIsSessionVerified] = useState<boolean>(!isSupabaseConfigured());

  // --- Notification Toast State ---
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // --- Dynamic Categories State ---
  const [categorieen, setCategorieen] = useState<string[]>(() => {
    const savedSession = localStorage.getItem('subscription_tracker_session');
    const email = savedSession ? JSON.parse(savedSession)?.email : null;
    const saved = email ? localStorage.getItem(`subscription_tracker_categories_v2_${email}`) : null;
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  // --- Subscriptions State (Default to empty array - clean slate!) ---
  const [abonnementen, setAbonnementen] = useState<Abonnement[]>([]);

  // --- Monthly Income History State ---
  const [maandHistory, setMaandHistory] = useState<Record<string, { inkomsten: MaandInkomst[] }>>({});

  // --- Personal Notes State ---
  const [notities, setNotities] = useState<Notitie[]>([]);

  // Initialize the ref with the initial session email
  if (currentUser && loadedUserEmailRef.current === null) {
    loadedUserEmailRef.current = currentUser.email;
  }

  const [activeTab, setActiveTab] = useState<'overzicht' | 'abonnementen' | 'balans' | 'analyses' | 'notities'>('overzicht');

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('subscription_tracker_theme');
    return saved ? saved === 'dark' : false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.remove('light-mode');
      localStorage.setItem('subscription_tracker_theme', 'dark');
    } else {
      document.documentElement.classList.add('light-mode');
      localStorage.setItem('subscription_tracker_theme', 'light');
    }
  }, [isDarkMode]);

  // --- Supabase Auth Change Listener & Session Recovery ---
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;

    // Direct active session check on mount to guarantee valid UUID presence
    setIsLoadingData(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const userObj = {
          email: session.user.email || '',
          name: session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'Gebruiker',
          id: session.user.id
        };
        setCurrentUser(userObj);
        localStorage.setItem('subscription_tracker_session', JSON.stringify(userObj));
      } else {
        // Clear state to force authenticating correctly if local is stale
        setCurrentUser(null);
        localStorage.removeItem('subscription_tracker_session');
      }
    }).catch(err => {
      console.error("Fout bij ophalen sessie op start:", err);
    }).finally(() => {
      setIsLoadingData(false);
      setIsSessionVerified(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const userObj = {
          email: session.user.email || '',
          name: session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'Gebruiker',
          id: session.user.id
        };
        setCurrentUser(userObj);
        localStorage.setItem('subscription_tracker_session', JSON.stringify(userObj));
      } else if (_event === 'SIGNED_OUT') {
        setCurrentUser(null);
        localStorage.removeItem('subscription_tracker_session');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // --- Load User-Specific Data when currentUser changes ---
  useEffect(() => {
    const email = currentUser?.email || null;
    const userId = currentUser?.id || null;
    
    // Guard: Wait until Supabase session is verified before running queries
    if (isSupabaseConfigured() && !isSessionVerified) return;

    if (loadedUserEmailRef.current === email && !isSupabaseConfigured()) return;

    if (email) {
      if (isSupabaseConfigured() && userId) {
        setIsLoadingData(true);
        Promise.all([
          dbService.getSubscriptions(),
          dbService.getIncomes(),
          dbService.getNotes()
        ]).then(([subs, incs, notes]) => {
          setAbonnementen(subs);
          setMaandHistory(incs);
          setNotities(notes);
          setCategorieen(DEFAULT_CATEGORIES);
        }).catch(err => {
          console.error("Fout bij ophalen van gegevens uit Supabase:", err);
        }).finally(() => {
          setIsLoadingData(false);
        });
      } else {
        // Fallback to local storage load
        const savedCats = localStorage.getItem(`subscription_tracker_categories_v2_${email}`);
        setCategorieen(savedCats ? JSON.parse(savedCats) : DEFAULT_CATEGORIES);

        const savedSubs = localStorage.getItem(`subscription_tracker_posts_v2_${email}`);
        setAbonnementen(savedSubs ? JSON.parse(savedSubs) : []);

        const savedHistory = localStorage.getItem(`subscription_tracker_maand_history_v2_${email}`);
        setMaandHistory(savedHistory ? JSON.parse(savedHistory) : {});

        const savedNotes = localStorage.getItem(`subscription_tracker_notities_v2_${email}`);
        setNotities(savedNotes ? JSON.parse(savedNotes) : []);
      }
      
    } else {
      // Clear data to empty states on logout
      setCategorieen(DEFAULT_CATEGORIES);
      setAbonnementen([]);
      setMaandHistory({});
      setNotities([]);
    }

    loadedUserEmailRef.current = email;
  }, [currentUser, isSessionVerified]);

  // --- Sync / Save Effects ---
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('subscription_tracker_session', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('subscription_tracker_session');
    }
  }, [currentUser]);

  useEffect(() => {
    if (isSupabaseConfigured()) return;
    if (currentUser?.email && loadedUserEmailRef.current === currentUser.email) {
      localStorage.setItem(`subscription_tracker_categories_v2_${currentUser.email}`, JSON.stringify(categorieen));
    }
  }, [categorieen, currentUser]);

  useEffect(() => {
    if (isSupabaseConfigured()) return;
    if (currentUser?.email && loadedUserEmailRef.current === currentUser.email) {
      localStorage.setItem(`subscription_tracker_posts_v2_${currentUser.email}`, JSON.stringify(abonnementen));
    }
  }, [abonnementen, currentUser]);

  useEffect(() => {
    if (isSupabaseConfigured()) return;
    if (currentUser?.email && loadedUserEmailRef.current === currentUser.email) {
      localStorage.setItem(`subscription_tracker_maand_history_v2_${currentUser.email}`, JSON.stringify(maandHistory));
    }
  }, [maandHistory, currentUser]);

  useEffect(() => {
    if (isSupabaseConfigured()) return;
    if (currentUser?.email && loadedUserEmailRef.current === currentUser.email) {
      localStorage.setItem(`subscription_tracker_notities_v2_${currentUser.email}`, JSON.stringify(notities));
    }
  }, [notities, currentUser]);

  // --- Authentication Handlers ---
  const handleLoginSuccess = (user: { email: string; name: string; id?: string; isGoogleUser?: boolean }) => {
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured()) {
      try {
        await dbService.signOut();
      } catch (err) {
        console.error("Fout bij uitloggen uit Supabase:", err);
      }
    }
    setCurrentUser(null);
    setActiveTab('overzicht');
  };

  // --- Category Handlers ---
  const handleAddCategorie = (newCat: string) => {
    if (!categorieen.includes(newCat)) {
      setCategorieen(prev => [...prev, newCat]);
    }
  };

  const handleDeleteCategorie = (catToDelete: string) => {
    if (catToDelete === 'Overig') return; // Kan 'Overig' niet verwijderen
    
    // Verwijder categorie
    setCategorieen(prev => prev.filter(c => c !== catToDelete));

    // Update abonnementen die deze categorie gebruikten naar 'Overig'
    const updated = abonnementen.map(sub => {
      if (sub.categorie === catToDelete) {
        return { ...sub, categorie: 'Overig' };
      }
      return sub;
    });

    setAbonnementen(updated);

    // If Supabase is active, update each modified subscription in database
    if (isSupabaseConfigured() && currentUser?.id) {
      abonnementen.forEach(async (sub) => {
        if (sub.categorie === catToDelete) {
          try {
            await dbService.saveSubscription({ ...sub, categorie: 'Overig' }, currentUser.id!);
          } catch (err) {
            console.error("Fout bij bijwerken categorie in Supabase:", err);
          }
        }
      });
    }
  };

  // --- Subscription Mutators ---
  const handleAddAbonnement = async (sub: Abonnement) => {
    if (!currentUser?.id) return;
    try {
      const saved = await dbService.saveSubscription(sub, currentUser.id);
      setAbonnementen(prev => [saved, ...prev]);
      showNotification('Opgeslagen!', 'success');
    } catch (err: any) {
      console.error("Fout bij toevoegen abonnement in Supabase:", err);
      showNotification(`Fout bij database-opslag: ${err.message || 'Onbekende fout'}.`, 'error');
    }
  };

  const handleUpdateAbonnement = async (sub: Abonnement) => {
    if (!currentUser?.id) return;
    try {
      const saved = await dbService.saveSubscription(sub, currentUser.id);
      setAbonnementen(prev => prev.map(s => s.id === sub.id ? saved : s));
      showNotification('Opgeslagen!', 'success');
    } catch (err: any) {
      console.error("Fout bij bijwerken abonnement in Supabase:", err);
      showNotification(`Fout bij bijwerken in database: ${err.message || 'Onbekende fout'}.`, 'error');
    }
  };

  const handleDeleteAbonnement = async (id: string) => {
    if (!currentUser?.id) return;
    try {
      await dbService.deleteSubscription(id);
      setAbonnementen(prev => prev.filter(s => s.id !== id));
      showNotification('Verwijderd!', 'success');
    } catch (err: any) {
      console.error("Fout bij verwijderen abonnement in Supabase:", err);
      showNotification(`Fout bij verwijderen uit database: ${err.message || 'Onbekende fout'}.`, 'error');
    }
  };

  // --- Monthly Balance Handlers ---
  const handleSaveMaandHistory = async (maandSleutel: string, inkomsten: MaandInkomst[]) => {
    if (!currentUser?.id) return;
    try {
      await dbService.saveIncomes(maandSleutel, inkomsten, currentUser.id);
      setMaandHistory(prev => ({
        ...prev,
        [maandSleutel]: { inkomsten }
      }));
      showNotification('Opgeslagen!', 'success');
    } catch (err: any) {
      console.error("Fout bij opslaan inkomsten in Supabase:", err);
      showNotification(`Fout bij opslaan inkomsten: ${err.message || 'Onbekende fout'}.`, 'error');
    }
  };

  // --- Notes Handlers ---
  const handleAddNotitie = async (titel: string, inhoud: string, kleur?: string) => {
    if (!currentUser?.id) return;
    const nieuweNotitie: Notitie = {
      id: `note_${Date.now()}`,
      titel,
      inhoud,
      aangemaaktOp: new Date().toISOString(),
      kleur
    };
    try {
      const saved = await dbService.saveNote(nieuweNotitie, currentUser.id);
      setNotities(prev => [saved, ...prev]);
      showNotification('Opgeslagen!', 'success');
    } catch (err: any) {
      console.error("Fout bij opslaan notitie in Supabase:", err);
      showNotification(`Fout bij opslaan notitie: ${err.message || 'Onbekende fout'}.`, 'error');
    }
  };

  const handleDeleteNotitie = async (id: string) => {
    if (!currentUser?.id) return;
    try {
      await dbService.deleteNote(id);
      setNotities(prev => prev.filter(n => n.id !== id));
      showNotification('Verwijderd!', 'success');
    } catch (err: any) {
      console.error("Fout bij verwijderen notitie in Supabase:", err);
      showNotification(`Fout bij verwijderen notitie: ${err.message || 'Onbekende fout'}.`, 'error');
    }
  };

  // --- Calculations ---
  const actieveSubs = abonnementen.filter(s => s.status === 'actief');
  
  const totaalMaandKosten = actieveSubs.reduce((acc, sub) => {
    let amt = sub.bedrag;
    if (sub.cyclus === 'jaarlijks') amt = amt / 12;
    if (sub.cyclus === 'wekelijks') amt = amt * (52 / 12);
    if (sub.cyclus === 'kwartaal') amt = amt / 3;
    return acc + amt;
  }, 0);

  const aankomendeBetalingen = abonnementen
    .filter(s => s.status === 'actief')
    .map(s => {
      const betalingsDatum = new Date(s.volgendeBetaling);
      const vandaag = new Date();
      betalingsDatum.setHours(0, 0, 0, 0);
      vandaag.setHours(0, 0, 0, 0);
      
      const diffTijd = betalingsDatum.getTime() - vandaag.getTime();
      const diffDagen = Math.ceil(diffTijd / (1000 * 60 * 60 * 24));
      return { ...s, diffDagen };
    })
    .filter(s => s.diffDagen >= 0 && s.diffDagen <= 30)
    .sort((a, b) => a.diffDagen - b.diffDagen);

  // --- Render Loading Spinner during session verification ---
  if (isSupabaseConfigured() && !isSessionVerified) {
    return (
      <div className="min-h-screen bg-black text-[#f4f4f5] flex flex-col items-center justify-center space-y-4" id="app-booting">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
        <p className="text-xs text-zinc-500 font-mono tracking-wider">Sessie herstellen...</p>
      </div>
    );
  }

  // --- Render Auth Screen if not logged in ---
  if (!currentUser) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-black text-[#f4f4f5] flex flex-col antialiased pb-24" id="subscription-tracker-root">
      
      {/* Dynamic Toast Notification Popup */}
      {notification && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-6 py-3.5 rounded-xl border shadow-2xl flex items-center space-x-2.5 transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
          notification.type === 'success' 
            ? 'bg-zinc-950 border-emerald-500/50 text-emerald-400 shadow-emerald-950/20' 
            : 'bg-zinc-950 border-rose-500/50 text-rose-400 shadow-rose-950/20'
        }`} id="app-toast-alert">
          <div className={`w-2 h-2 rounded-full ${notification.type === 'success' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
          <span className="text-sm font-semibold tracking-wide">{notification.message}</span>
        </div>
      )}
      
      {/* TOP HEADER - Aligned to max-w-5xl */}
      <header className="border-b border-zinc-900 bg-[#09090b]/80 sticky top-0 z-30 backdrop-blur-md" id="app-header">
        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-display font-black text-sm">
              G
            </div>
            <div>
              <h1 className="text-white font-display font-bold text-sm tracking-tight sm:text-base">Geldzaken</h1>
            </div>
          </div>

          {/* Theme & Logout Buttons */}
          <div className="flex items-center space-x-3">
            {currentUser && (
              <span className="hidden sm:inline text-xs text-zinc-400 font-medium truncate max-w-[120px]">
                {currentUser.name}
              </span>
            )}
            <button
              onClick={() => setIsDarkMode(prev => !prev)}
              className="p-2 bg-transparent hover:bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white transition cursor-pointer"
              title={isDarkMode ? "Lichte modus" : "Donkere modus"}
              id="theme-toggle-btn"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={handleLogout}
              className="p-2 bg-transparent hover:bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white transition cursor-pointer"
              title="Uitloggen"
              id="logout-btn"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* HOOFDCONTAINER - Unified Mobile-First layout across all devices */}
      <div className="flex-1 flex flex-col w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 gap-6 pb-24 md:pb-32">
        
        {/* CONTENT AREA */}
        <main className="flex-1 min-w-0 space-y-6" id="tab-content-area">
          
          {isLoadingData ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-3" id="db-loading-overlay">
              <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
              <p className="text-xs text-zinc-500 font-mono">Gegevens ophalen van database...</p>
            </div>
          ) : (
            <>
              {activeTab === 'overzicht' && (
                <div className="space-y-6" id="overzicht-tab">
                  {/* Stat Cards Grid (Crisp high-contrast values with correct typography/font-size) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4" id="stats-grid">
                    <div className="bg-[#09090b] border border-zinc-800 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:border-zinc-700 transition" id="stat-totaal-maand">
                      <span className="text-xs font-semibold uppercase text-zinc-400 tracking-wider">Totaal p/m</span>
                      <div className="text-white text-2xl sm:text-3xl font-bold font-display tracking-tight mt-1">€{totaalMaandKosten.toFixed(2)}</div>
                      <span className="text-zinc-500 text-xs mt-1">Maandelijks gemiddelde</span>
                    </div>

                    <div className="bg-[#09090b] border border-zinc-800 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:border-zinc-700 transition" id="stat-actieve-diensten">
                      <span className="text-xs font-semibold uppercase text-zinc-400 tracking-wider">Vaste Lasten</span>
                      <div className="text-white text-2xl sm:text-3xl font-bold font-display tracking-tight mt-1">
                        {actieveSubs.length} <span className="text-sm text-zinc-505 font-sans font-normal">/ {abonnementen.length}</span>
                      </div>
                      <span className="text-zinc-500 text-xs mt-1">Lopende verplichtingen</span>
                    </div>

                    <div className="col-span-2 sm:col-span-1 bg-[#09090b] border border-zinc-800 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:border-zinc-700 transition" id="stat-volgende-dagen">
                      <span className="text-xs font-semibold uppercase text-zinc-400 tracking-wider">Inkomende Lasten</span>
                      <div className="text-white text-2xl sm:text-3xl font-bold font-display tracking-tight mt-1">{aankomendeBetalingen.length}</div>
                      <span className="text-zinc-500 text-xs mt-1">Volgende 30 dagen</span>
                    </div>
                  </div>

                  {/* Aankomende Betalingen Kalender */}
                  <div className="bg-[#09090b] border border-zinc-800 rounded-xl p-4 shadow-sm" id="aankomend-overzicht">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-800">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4.5 h-4.5 text-zinc-400" />
                        <h3 className="text-white font-semibold text-sm sm:text-base tracking-tight font-display">
                          Kalender (Komende 30 Dagen)
                        </h3>
                      </div>
                      <span className="text-xs text-zinc-500 font-sans">Chronologische volgorde</span>
                    </div>

                    {aankomendeBetalingen.length === 0 ? (
                      <div className="text-center py-8 text-zinc-500 text-xs font-sans">Geen geplande afschrijvingen binnen 30 dagen.</div>
                    ) : (
                      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                        {aankomendeBetalingen.map((sub) => (
                          <div key={sub.id} className="p-3 bg-black border border-zinc-800/85 rounded-xl flex items-center justify-between hover:border-white transition group">
                            <div className="flex items-center space-x-3.5 min-w-0">
                              <span className="w-9 h-9 rounded-lg bg-zinc-950 border border-zinc-800 text-center flex items-center justify-center text-base font-bold text-zinc-350 shrink-0">
                                {sub.logo || sub.naam.charAt(0)}
                              </span>
                              <div className="min-w-0">
                                <h4 className="text-white text-sm font-semibold group-hover:text-white transition truncate">{sub.naam}</h4>
                                <p className="text-zinc-400 text-xs mt-0.5">{sub.categorie}</p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-4 shrink-0 font-sans text-right">
                              <div className="text-xs">
                                {sub.diffDagen === 0 ? (
                                  <span className="text-white font-semibold bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">Vandaag</span>
                                ) : sub.diffDagen === 1 ? (
                                  <span className="text-white font-semibold">Morgen</span>
                                ) : (
                                  <span className="text-zinc-400">Over <span className="text-white font-semibold">{sub.diffDagen}</span> dgn</span>
                                )}
                                <p className="text-zinc-500 text-xs mt-0.5">{sub.volgendeBetaling}</p>
                              </div>
                              <div className="text-white font-bold text-sm sm:text-base font-mono">
                                {sub.valuta === 'USD' ? '$' : sub.valuta === 'GBP' ? '£' : '€'}{sub.bedrag.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Zwart-wit Quick Link Card */}
                  <div className="bg-[#09090b] border border-zinc-800 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm" id="quick-action-card">
                    <div className="space-y-1 text-center sm:text-left">
                      <h4 className="text-white text-sm sm:text-base font-semibold flex items-center justify-center sm:justify-start gap-1.5">
                        <span>Nieuwe kostenpost toevoegen?</span>
                      </h4>
                      <p className="text-zinc-400 text-xs leading-relaxed max-w-md">
                        Voeg verzekeringen, uw hypotheek, huur of maandelijkse nutsvoorzieningen toe om uw overzicht compleet te maken.
                      </p>
                    </div>
                    {/* Witte achtergrond, zwarte tekst knop met comfortabele mobiele tap target */}
                    <button
                      onClick={() => setActiveTab('abonnementen')}
                      className="bg-white hover:bg-zinc-200 text-black font-semibold py-2.5 px-5 rounded-lg text-xs sm:text-sm transition flex items-center space-x-1.5 shrink-0 w-full sm:w-auto justify-center cursor-pointer font-sans"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Nu toevoegen</span>
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'abonnementen' && (
                <SubscriptionList 
                  abonnementen={abonnementen} 
                  categorieen={categorieen}
                  onAddAbonnement={handleAddAbonnement} 
                  onUpdateAbonnement={handleUpdateAbonnement} 
                  onDeleteAbonnement={handleDeleteAbonnement}
                  onAddCategorie={handleAddCategorie}
                  onDeleteCategorie={handleDeleteCategorie}
                />
              )}

              {activeTab === 'balans' && (
                <Balans 
                  email={currentUser?.email || null}
                  vasteLasten={abonnementen}
                />
              )}

              {activeTab === 'analyses' && (
                <Analytics 
                  abonnementen={abonnementen} 
                  categorieen={categorieen}
                />
              )}

              {activeTab === 'notities' && (
                <Notes 
                  notities={notities}
                  onAddNotitie={handleAddNotitie}
                  onDeleteNotitie={handleDeleteNotitie}
                />
              )}
            </>
          )}

        </main>
      </div>

      {/* UNIFIED RESPONSIVE BOTTOM BAR NAVIGATION */}
      <nav className="fixed bottom-0 left-0 w-full bg-[#09090b]/95 border-t border-zinc-900 shadow-2xl backdrop-blur-md z-40 pb-safe" id="unified-nav-bar">
        <div className="w-full max-w-5xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between sm:justify-around py-3">
            <button
              onClick={() => setActiveTab('overzicht')}
          className={`flex flex-col items-center py-2 px-2 transition cursor-pointer rounded-xl ${
            activeTab === 'overzicht' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-[10px] sm:text-[11px] font-semibold mt-1">Overzicht</span>
        </button>

        <button
          onClick={() => setActiveTab('abonnementen')}
          className={`flex flex-col items-center py-2 px-2 transition cursor-pointer rounded-xl ${
            activeTab === 'abonnementen' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-[10px] sm:text-[11px] font-semibold mt-1">Kosten</span>
        </button>

        <button
          onClick={() => setActiveTab('balans')}
          className={`flex flex-col items-center py-2 px-2 transition cursor-pointer rounded-xl ${
            activeTab === 'balans' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-[10px] sm:text-[11px] font-semibold mt-1">Balans</span>
        </button>

        <button
          onClick={() => setActiveTab('analyses')}
          className={`flex flex-col items-center py-2 px-2 transition cursor-pointer rounded-xl ${
            activeTab === 'analyses' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <LineChart className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-[10px] sm:text-[11px] font-semibold mt-1">Analyses</span>
        </button>
        
        <button
          onClick={() => setActiveTab('notities')}
          className={`flex flex-col items-center py-2 px-2 transition cursor-pointer rounded-xl ${
            activeTab === 'notities' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-[10px] sm:text-[11px] font-semibold mt-1">Notities</span>
        </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
