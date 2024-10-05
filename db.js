const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();
const filepath = "./tracker.db";

function createDbConnection() {
  if (fs.existsSync(filepath)) {
    return new sqlite3.Database(filepath);
  } else {
    const db = new sqlite3.Database(filepath, (error) => {
      if (error) {
        return console.error(error.message);
      }
      createTable(db);
    });
    console.log("Connection with SQLite has been established");
    return db;
  }
}

function createTable(db) {
  db.exec(`
  CREATE TABLE users
  (
    _id INTEGER PRIMARY KEY AUTOINCREMENT,
    username   VARCHAR(50) NOT NULL UNIQUE
  );
  CREATE TABLE exercises
  (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    _id INT NOT NULL REFERENCES users(_id),
    description VARCHAR(50) NOT NULL,
    duration_min INT NOT NULL,
    date DATE NOT NULL
  );
`);
}

module.exports = createDbConnection();
