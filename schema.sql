-- Cloudflare D1 Database Schema for Geldzaken

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. SESSIONS TABLE (For simple token-based auth)
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    naam TEXT NOT NULL,
    bedrag REAL NOT NULL,
    cyclus TEXT NOT NULL CHECK (cyclus IN ('wekelijks', 'maandelijks', 'kwartaal', 'jaarlijks')),
    status TEXT NOT NULL CHECK (status IN ('actief', 'gepauzeerd')),
    betaalmethode TEXT NOT NULL,
    logo TEXT,
    beschrijving TEXT,
    valuta TEXT DEFAULT 'EUR' NOT NULL,
    categorie TEXT NOT NULL,
    volgende_betaling TEXT NOT NULL, -- Stored as ISO date string YYYY-MM-DD
    aangemaakt_op DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. MONTHLY INCOMES TABLE
CREATE TABLE IF NOT EXISTS monthly_incomes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    maand_sleutel TEXT NOT NULL, -- Format YYYY-MM
    naam TEXT NOT NULL,
    bedrag REAL NOT NULL,
    valuta TEXT DEFAULT 'EUR' NOT NULL,
    datum TEXT NOT NULL, -- Stored as ISO date string
    aangemaakt_op DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. NOTES TABLE
CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    titel TEXT NOT NULL,
    inhoud TEXT,
    kleur TEXT,
    aangemaakt_op DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_incomes_user_month ON monthly_incomes(user_id, maand_sleutel);
CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
