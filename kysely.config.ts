import {
  SqliteDialect,
} from 'kysely'
import { defineConfig } from 'kysely-ctl'
import SQLite from 'better-sqlite3'

export default defineConfig({
  dialect: new SqliteDialect({ database: new SQLite('./storage/main.db') }),
  migrations: {
    migrationFolder: 'src/db/migrations',
  },
  plugins: [],
  seeds: {
    seedFolder: 'src/db/seeds',
  },
})
