"""
Database — SQLite com aiosqlite (async)
Para produção: substitua por PostgreSQL com asyncpg
"""

import aiosqlite
import os

DB_PATH = os.getenv("DB_PATH", "fintechai.db")


async def get_db():
    """Dependency para injetar conexão DB nos endpoints."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        yield db


async def init_db():
    """Cria todas as tabelas se não existirem."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.executescript("""
            PRAGMA journal_mode=WAL;

            -- Renda mensal
            CREATE TABLE IF NOT EXISTS income (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                description TEXT NOT NULL,
                amount REAL NOT NULL,
                month INTEGER NOT NULL,
                year INTEGER NOT NULL,
                is_recurring INTEGER DEFAULT 1,
                created_at TEXT DEFAULT (datetime('now','localtime'))
            );

            -- Categorias de despesa
            CREATE TABLE IF NOT EXISTS categories (
                id TEXT PRIMARY KEY,
                label TEXT NOT NULL,
                icon TEXT NOT NULL,
                color TEXT NOT NULL
            );

            -- Orçamentos por categoria/mês
            CREATE TABLE IF NOT EXISTS budgets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category_id TEXT NOT NULL,
                amount REAL NOT NULL,
                month INTEGER NOT NULL,
                year INTEGER NOT NULL,
                UNIQUE(category_id, month, year)
            );

            -- Despesas
            CREATE TABLE IF NOT EXISTS expenses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                description TEXT NOT NULL,
                amount REAL NOT NULL,
                category_id TEXT NOT NULL,
                expense_date TEXT NOT NULL,
                type TEXT DEFAULT 'variable',
                notes TEXT,
                created_at TEXT DEFAULT (datetime('now','localtime'))
            );

            -- Empréstimos
            CREATE TABLE IF NOT EXISTS loans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                institution TEXT NOT NULL,
                description TEXT NOT NULL,
                total_amount REAL NOT NULL,
                amount_paid REAL DEFAULT 0,
                monthly_payment REAL NOT NULL,
                interest_rate REAL NOT NULL,
                start_date TEXT NOT NULL,
                end_date TEXT NOT NULL,
                total_installments INTEGER NOT NULL,
                paid_installments INTEGER DEFAULT 0,
                loan_type TEXT DEFAULT 'personal',
                status TEXT DEFAULT 'active',
                notes TEXT,
                created_at TEXT DEFAULT (datetime('now','localtime'))
            );

            -- Assinaturas recorrentes
            CREATE TABLE IF NOT EXISTS subscriptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                category_id TEXT NOT NULL,
                amount REAL NOT NULL,
                billing_cycle TEXT DEFAULT 'monthly',
                billing_day INTEGER NOT NULL,
                start_date TEXT NOT NULL,
                end_date TEXT,
                status TEXT DEFAULT 'active',
                url TEXT,
                notes TEXT,
                created_at TEXT DEFAULT (datetime('now','localtime'))
            );

            -- Metas de poupança
            CREATE TABLE IF NOT EXISTS savings_goals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                target_amount REAL NOT NULL,
                current_amount REAL DEFAULT 0,
                deadline TEXT,
                status TEXT DEFAULT 'active',
                created_at TEXT DEFAULT (datetime('now','localtime'))
            );

            -- Seed: Categorias padrão
            INSERT OR IGNORE INTO categories VALUES
                ('moradia',     'Moradia',      '🏠', '#4F6EF7'),
                ('alimentacao', 'Alimentação',  '🍽️', '#00D68F'),
                ('transporte',  'Transporte',   '🚗', '#FFB547'),
                ('saude',       'Saúde',        '💊', '#FF4D6A'),
                ('lazer',       'Lazer',        '🎮', '#9B59F5'),
                ('assinaturas', 'Assinaturas',  '📱', '#00C9E0'),
                ('emprestimos', 'Empréstimos',  '💳', '#FF8C42'),
                ('educacao',    'Educação',     '📚', '#3EC6A7'),
                ('outros',      'Outros',       '📦', '#A0A8C8');

            -- Seed: Renda de exemplo
            INSERT OR IGNORE INTO income (id, description, amount, month, year, is_recurring)
            VALUES (1, 'Salário', 6500, 3, 2026, 1);

            -- Seed: Orçamentos de exemplo
            INSERT OR IGNORE INTO budgets (category_id, amount, month, year) VALUES
                ('moradia',     2000, 3, 2026),
                ('alimentacao',  600, 3, 2026),
                ('transporte',   300, 3, 2026),
                ('saude',        200, 3, 2026),
                ('lazer',        300, 3, 2026),
                ('assinaturas',  150, 3, 2026),
                ('emprestimos',  700, 3, 2026),
                ('educacao',     300, 3, 2026),
                ('outros',       200, 3, 2026);

            -- Seed: Despesas de exemplo
            INSERT OR IGNORE INTO expenses (id, description, amount, category_id, expense_date, type) VALUES
                (1, 'Aluguel',         1800,  'moradia',     '2026-03-01', 'fixed'),
                (2, 'Netflix',         39.9,  'assinaturas', '2026-03-05', 'subscription'),
                (3, 'Spotify',         21.9,  'assinaturas', '2026-03-05', 'subscription'),
                (4, 'Supermercado',    320,   'alimentacao', '2026-03-02', 'variable'),
                (5, 'Gasolina',        180,   'transporte',  '2026-03-03', 'variable'),
                (6, 'Academia',        89.9,  'saude',       '2026-03-01', 'subscription'),
                (7, 'iFood',           95,    'alimentacao', '2026-03-04', 'variable');

            -- Seed: Empréstimo de exemplo
            INSERT OR IGNORE INTO loans (id, institution, description, total_amount, monthly_payment,
                interest_rate, start_date, end_date, total_installments, paid_installments, loan_type)
            VALUES (1, 'Banco do Brasil', 'Empréstimo Pessoal', 15000, 650,
                1.99, '2025-01-10', '2027-01-10', 24, 14, 'personal');

            -- Seed: Assinaturas de exemplo
            INSERT OR IGNORE INTO subscriptions (id, name, category_id, amount, billing_day, start_date) VALUES
                (1, 'Netflix',  'assinaturas', 39.9,  5,  '2024-01-01'),
                (2, 'Spotify',  'assinaturas', 21.9,  5,  '2024-01-01'),
                (3, 'Academia', 'saude',       89.9,  1,  '2024-06-01');
        """)
        await db.commit()
