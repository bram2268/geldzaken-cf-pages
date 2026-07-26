import { Abonnement, MaandInkomst, Notitie } from '../types';

export const isSupabaseConfigured = (): boolean => {
  return true; // Always return true now since we use custom backend
};

export const supabase = {
  auth: {
    getSession: async () => {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const { user } = await res.json();
        return { data: { session: { user } } };
      }
      return { data: { session: null } };
    },
    onAuthStateChange: (callback: any) => {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
  }
};

export const dbService = {
  // --- Auth API ---
  async signUp(email: string, password: string, name: string) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Register failed');
    }
    return await res.json();
  },

  async signIn(email: string, password: string) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Login failed');
    }
    return await res.json();
  },

  async signOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
  },

  // --- Subscriptions API ---
  async getSubscriptions(): Promise<Abonnement[]> {
    const res = await fetch('/api/data/subscriptions');
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((row: any) => ({
      id: row.id,
      naam: row.naam,
      bedrag: Number(row.bedrag),
      valuta: row.valuta || 'EUR',
      categorie: row.categorie,
      cyclus: row.cyclus,
      volgendeBetaling: row.volgende_betaling,
      status: row.status,
      betaalmethode: row.betaalmethode,
      logo: row.logo,
      emoji: row.logo,
      beschrijving: row.beschrijving,
      aangemaaktOp: row.aangemaakt_op || row.created_at
    }));
  },

  async saveSubscription(sub: Abonnement, userId: string): Promise<Abonnement> {
    const payload = {
      id: sub.id,
      naam: sub.naam,
      bedrag: sub.bedrag,
      valuta: sub.valuta || 'EUR',
      categorie: sub.categorie,
      cyclus: sub.cyclus,
      volgende_betaling: sub.volgendeBetaling,
      status: sub.status,
      betaalmethode: sub.betaalmethode,
      logo: sub.logo || sub.emoji || '',
      beschrijving: sub.beschrijving || ''
    };
    
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sub.id);
    const res = await fetch(isUUID ? `/api/data/subscriptions/${sub.id}` : '/api/data/subscriptions', {
      method: isUUID ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!res.ok) throw new Error('Failed to save subscription');
    
    if (!isUUID) {
      const row = await res.json();
      return {
        ...sub,
        id: row.id,
        aangemaaktOp: row.aangemaakt_op
      };
    }
    return sub;
  },

  async deleteSubscription(id: string) {
    await fetch(`/api/data/subscriptions/${id}`, { method: 'DELETE' });
  },

  // --- Incomes API ---
  async getIncomes(): Promise<Record<string, { inkomsten: MaandInkomst[] }>> {
    const res = await fetch('/api/data/incomes');
    if (!res.ok) return {};
    const data = await res.json();
    
    const grouped: Record<string, { inkomsten: MaandInkomst[] }> = {};
    data.forEach((row: any) => {
      const monthKey = row.maand_sleutel;
      if (!grouped[monthKey]) grouped[monthKey] = { inkomsten: [] };
      grouped[monthKey].inkomsten.push({
        id: row.id,
        naam: row.naam,
        bedrag: Number(row.bedrag),
        valuta: row.valuta || 'EUR',
        datum: row.datum
      });
    });
    return grouped;
  },

  async saveIncomes(monthKey: string, inkomsten: MaandInkomst[], userId: string) {
    // Delete existing
    const existingRes = await fetch('/api/data/incomes');
    if (existingRes.ok) {
      const existing = await existingRes.json();
      for (const inc of existing) {
        if (inc.maand_sleutel === monthKey) {
          await fetch(`/api/data/incomes/${inc.id}`, { method: 'DELETE' });
        }
      }
    }
    // Insert new
    for (const inc of inkomsten) {
      await fetch('/api/data/incomes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maand_sleutel: monthKey,
          naam: inc.naam,
          bedrag: inc.bedrag,
          valuta: inc.valuta || 'EUR',
          datum: inc.datum || `${monthKey}-01`
        })
      });
    }
  },

  // --- Notes API ---
  async getNotes(): Promise<Notitie[]> {
    const res = await fetch('/api/data/notes');
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((row: any) => ({
      id: row.id,
      titel: row.titel,
      inhoud: row.inhoud || '',
      kleur: row.kleur,
      aangemaaktOp: row.aangemaakt_op
    }));
  },

  async saveNote(note: Notitie, userId: string): Promise<Notitie> {
    const res = await fetch('/api/data/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titel: note.titel,
        inhoud: note.inhoud || '',
        kleur: note.kleur || null
      })
    });
    if (!res.ok) throw new Error('Failed to save note');
    const row = await res.json();
    return {
      ...note,
      id: row.id,
      aangemaaktOp: row.aangemaakt_op
    };
  },

  async deleteNote(id: string) {
    await fetch(`/api/data/notes/${id}`, { method: 'DELETE' });
  },

  // --- Storage API (Bestanden) --- (Not implemented in D1, stubbed)
  async uploadFile(file: File, userId: string): Promise<string> {
    return 'mocked-file-path';
  },

  async getFiles(userId: string): Promise<any[]> {
    return [];
  },

  async deleteFile(path: string) {
  },

  async getFileUrl(path: string): Promise<string> {
    return '';
  }
};
