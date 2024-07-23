import { Database, OPEN_READWRITE } from "sqlite3";
import { SQLITE_DB_PATH } from "../../../../constants";

function openDatabase(mode: number = OPEN_READWRITE): Promise<Database> {
  return new Promise((resolve, reject) => {
    const db = new Database(SQLITE_DB_PATH, mode, (err) => {
      if (err) {
        return reject(err);
      }
      resolve(db);
    });
  });
}

function runNonSelectQuery(
  db: Database,
  sql: string,
  params: any[] = []
): Promise<{ lastID: number; changes: number }> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        return reject(err);
      }
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function runSelectQuery(
  db: Database,
  sql: string,
  params: any[] = []
): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        return reject(err);
      }
      resolve(rows);
    });
  });
}

function closeDatabase(db: Database): Promise<void> {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}

export async function executeSql(
  sql: string,
  params: any[] = []
): Promise<any> {
  const db = await openDatabase();
  try {
    const sqlTrimmed = sql.trim().toUpperCase();
    if (sqlTrimmed.startsWith("SELECT") || sqlTrimmed.startsWith("PRAGMA")) {
      const result = await runSelectQuery(db, sql, params);
      return result;
    } else {
      const result = await runNonSelectQuery(db, sql, params);
      return result;
    }
  } finally {
    await closeDatabase(db);
  }
}
