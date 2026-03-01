import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// O banco de dados será criado na raiz do projeto
const dbPath = path.join(__dirname, '..', 'reybraztech.db');

const db = new Database(dbPath);

// Ativar WAL para melhor performance
db.pragma('journal_mode = WAL');

// Criar tabela de clientes se não existir
db.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    device TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    plan TEXT NOT NULL DEFAULT 'mensal',
    status TEXT NOT NULL DEFAULT 'Ativo',
    days_remaining INTEGER DEFAULT 0,
    app_account TEXT,
    app_password TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    plan TEXT NOT NULL,
    value TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pago',
    paid_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (client_id) REFERENCES clients(id)
  );
`);

console.log('✅ Banco de dados inicializado em:', dbPath);

export default db;
