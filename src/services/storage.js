import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite'

const sqlite = new SQLiteConnection(CapacitorSQLite)
const DB_NAME = 'expack_db'
const STORE_TABLE = 'storage'
let db = null
let initPromise = null
const writeQueues = new Map()

async function initDB() {
  if (db) return db
  if (initPromise) return initPromise
  initPromise = (async () => {
    try {
      let conn
      try {
        conn = await sqlite.retrieveConnection(DB_NAME)
      } catch {
        await CapacitorSQLite.closeConnection({ database: DB_NAME }).catch(() => {})
        conn = await sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false)
      }
      await conn.open()
      await conn.execute(`CREATE TABLE IF NOT EXISTS ${STORE_TABLE} (key TEXT PRIMARY KEY, value TEXT)`)
      db = conn
      return db
    } catch (e) {
      initPromise = null
      throw e
    }
  })()
  return initPromise
}

export const storage = {
  async get(key, dflt) {
    await initDB()
    const r = await db.query(`SELECT value FROM ${STORE_TABLE} WHERE key=?`, [key])
    return r.values?.length ? JSON.parse(r.values[0].value) : dflt
  },
  async set(key, value) {
    await initDB()
    const json = JSON.stringify(value)
    const prev = writeQueues.get(key) || Promise.resolve()
    const next = prev.then(() => db.run(`INSERT OR REPLACE INTO ${STORE_TABLE} (key,value) VALUES(?,?)`, [key, json]))
    writeQueues.set(key, next.catch(() => {}))
    await next
  },
  async delete(key) {
    await initDB()
    await db.run(`DELETE FROM ${STORE_TABLE} WHERE key=?`, [key])
  },
  async clear() {
    await initDB()
    await db.run(`DELETE FROM ${STORE_TABLE}`)
  },
  async keys() {
    await initDB()
    return (await db.query(`SELECT key FROM ${STORE_TABLE}`)).values?.map(r => r.key) ?? []
  },
  async entries() {
    await initDB()
    return (await db.query(`SELECT key,value FROM ${STORE_TABLE}`)).values?.map(r => [r.key, JSON.parse(r.value)]) ?? []
  },
}
