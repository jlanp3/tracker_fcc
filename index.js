const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const bodyParser = require("body-parser");
const db = require("./db");
let sql;

app.use(bodyParser.urlencoded({ extended: false }));

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// post in /api/users
app.post("/api/users", (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      throw new Error("No username");
    } else {
      sql = "INSERT INTO users(username) VALUES (?);";
      db.run(sql, [username], function (err) {
        if (err) {
          sql = "SELECT username, _id FROM users WHERE username = ?";
          db.get(sql, [username], function (err, row) {
            if (err) {
              return res.json({ status: 300, success: false, error: err });
            } else {
              return res.json({
                username: row.username,
                _id: row._id.toString(),
              });
            }
          });
        } else {
          const id = this.lastID;
          return res.json({ username: username, _id: id.toString() });
        }
      });
    }
  } catch (error) {
    return res.json({ status: 400, success: false, error: error.message });
  }
});

//get request to /api/users
app.get("/api/users", (req, res) => {
  try {
    sql = "SELECT username, _id FROM users;";
    db.all(sql, [], (err, row) => {
      if (err) {
        return res.json({ status: 300, success: false, error: err });
      } else {
        data = [];
        row.forEach((user) => {
          const { username, _id } = user;
          data.push({ username: username, _id: _id.toString() });
        });
        res.json(data);
      }
    });
  } catch (error) {
    return res.json({ status: 400, success: false, error: error.message });
  }
});

//post to /api/users/:_id/exercises
app.post("/api/users/:_id/exercises", (req, res) => {
  try {
    const { _id } = req.params;
    const { description, duration } = req.body;
    let date = req.body.date;
    if (!date) {
      date = new Date();
    } else {
      date = new Date(req.body.date);
    }
    let username;

    //SELECT id
    sql = "SELECT username FROM users WHERE _id = ?";
    db.get(sql, [_id], (err, row) => {
      if (err) {
        return res.json({ status: 300, success: false, error: err });
      } else if (!row) {
        return res.json({ error: "Not found" });
      } else {
        username = row.username;
      }
    });

    //INSERT
    sql =
      "INSERT INTO exercises(_id, description, duration_min, date) VALUES (?, ?, ?, ?)";
    db.run(sql, [_id, description, duration, date], (err) => {
      if (err) {
        return res.json({ status: 300, success: false, error: err });
      } else {
        res.json({
          _id: _id,
          username: username,
          date: new Date(date).toDateString(),
          duration: parseInt(duration),
          description: description,
        });
      }
    });
  } catch (error) {
    return res.json({ status: 400, success: false, error: error.message });
  }
});

//GET to /api/users/:_id/logs
app.get("/api/users/:_id/logs", (req, res) => {
  try {
    const { _id } = req.params;
    let from = Date.parse(req.query.from);
    let to = Date.parse(req.query.to);
    let limit = parseInt(req.query.limit);

    let param = [];
    if (from && to) {
      sql =
        "SELECT * FROM users join exercises USING (_id) WHERE _id = ? AND date BETWEEN ? AND ?;";
      param.push(_id, from, to);
    } else if (limit) {
      sql =
        "SELECT * FROM users join exercises USING (_id) WHERE _id = ? LIMIT ?;";
      param.push(_id, limit);
    } else if (from && to && limit) {
      sql =
        "SELECT * FROM users join exercises USING (_id) WHERE _id = ? AND date BETWEEN ? AND ? LIMIT ?;";
      param.push(_id, from, to, limit);
    } else {
      sql = "SELECT * FROM users join exercises USING (_id) WHERE _id = ?;";
      param.push(_id);
    }

    db.all(sql, param, (err, row) => {
      if (err) {
        return res.json({ status: 300, success: false, error: err });
      } else {
        let data = {
          username: row.username,
          count: row.length,
          _id: _id.toString(),
          log: [],
        };
        row.forEach((info) => {
          data.username = info.username;
          data.log.push({
            description: info.description,
            duration: info.duration_min,
            date: new Date(info.date).toDateString(),
          });
        });
        res.json(data);
      }
    });
  } catch (error) {
    return res.json({ status: 400, success: false, error: error.message });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
