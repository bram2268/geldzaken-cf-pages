// A simple in-memory mock of Cloudflare D1 for local development
export class MockD1Database {
  tables: Record<string, any[]> = {
    users: [],
    sessions: [],
    subscriptions: [],
    monthly_incomes: [],
    notes: []
  };

  prepare(query: string) {
    return new MockD1PreparedStatement(this, query);
  }
}

class MockD1PreparedStatement {
  constructor(private db: MockD1Database, private query: string) {}
  
  private params: any[] = [];

  bind(...params: any[]) {
    this.params = params;
    return this;
  }

  private execute() {
    const q = this.query.trim().toUpperCase();
    
    // Very naive SQL parser for our specific queries
    if (q.startsWith('INSERT INTO')) {
      const tableMatch = this.query.match(/INSERT INTO\s+([a-zA-Z_]+)/i);
      const table = tableMatch ? tableMatch[1] : '';
      
      const columnsMatch = this.query.match(/\((.*?)\)/);
      const columns = columnsMatch ? columnsMatch[1].split(',').map(c => c.trim()) : [];
      
      if (table && this.db.tables[table]) {
        const row: any = {};
        for (let i = 0; i < columns.length; i++) {
          row[columns[i]] = this.params[i];
        }
        this.db.tables[table].push(row);
      }
      return { success: true, results: [] };
    } 
    else if (q.startsWith('UPDATE')) {
      const tableMatch = this.query.match(/UPDATE\s+([a-zA-Z_]+)/i);
      const table = tableMatch ? tableMatch[1] : '';
      
      if (table === 'subscriptions') {
        const [naam, bedrag, cyclus, status, betaalmethode, logo, beschrijving, valuta, categorie, volgende_betaling, id, user_id] = this.params;
        const row = this.db.tables[table].find(r => r.id === id && r.user_id === user_id);
        if (row) {
          Object.assign(row, { naam, bedrag, cyclus, status, betaalmethode, logo, beschrijving, valuta, categorie, volgende_betaling });
        }
      }
      return { success: true, results: [] };
    }
    else if (q.startsWith('DELETE FROM')) {
      const tableMatch = this.query.match(/DELETE FROM\s+([a-zA-Z_]+)/i);
      const table = tableMatch ? tableMatch[1] : '';
      
      if (table && this.db.tables[table]) {
        if (this.query.includes('id = ? AND user_id = ?')) {
          this.db.tables[table] = this.db.tables[table].filter(r => !(r.id === this.params[0] && r.user_id === this.params[1]));
        } else if (this.query.includes('id = ?')) {
          this.db.tables[table] = this.db.tables[table].filter(r => r.id !== this.params[0]);
        }
      }
      return { success: true, results: [] };
    }
    else if (q.startsWith('SELECT')) {
      const tableMatch = this.query.match(/FROM\s+([a-zA-Z_]+)/i);
      const table = tableMatch ? tableMatch[1] : '';
      let results = [...(this.db.tables[table] || [])];
      
      if (this.query.includes('WHERE email = ?')) {
        results = results.filter(r => r.email === this.params[0]);
      } else if (this.query.includes('WHERE id = ? AND expires_at > datetime("now")')) {
        results = results.filter(r => r.id === this.params[0] && new Date(r.expires_at) > new Date());
      } else if (this.query.includes('WHERE id = ?')) {
        results = results.filter(r => r.id === this.params[0]);
      } else if (this.query.includes('WHERE user_id = ?')) {
        results = results.filter(r => r.user_id === this.params[0]);
      }

      if (this.query.includes('ORDER BY aangemaakt_op DESC')) {
        results.sort((a, b) => new Date(b.aangemaakt_op).getTime() - new Date(a.aangemaakt_op).getTime());
      }
      return { success: true, results };
    }
    
    return { success: true, results: [] };
  }

  async run() {
    return this.execute();
  }

  async all() {
    return this.execute();
  }

  async first() {
    const res = this.execute();
    return res.results.length > 0 ? res.results[0] : null;
  }
}

export const mockDb = new MockD1Database();
