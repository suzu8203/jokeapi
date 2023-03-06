var sqlite3 = require('sqlite3').verbose()

const DBSOURCE = "db.sqlite"

let db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
      // Cannot open database
      console.error(err.message)
      throw err
    }else{
        console.log('Connected to the SQLite database.')
        db.run(`CREATE TABLE categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category text
        )`,
        (err) => {
            if (err) {
                // Table already created
            }else{
                // Table just created, creating some rows
                var insert = 'INSERT INTO categories (category) VALUES (?)'
                db.run(insert, ["BadJokes"])
                db.run(insert, ["EngineeringJokes"])
            }
        });
        db.run(`CREATE TABLE jokes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            joke text, 
            category_id integer, 
            likes integer,
            dislikes integer,
            FOREIGN KEY (category_id) REFERENCES category (id)
        )`,
        (err) => {
            if (err) {
                // Table already created
            }else{
                // Table just created, creating some rows
                var insert = 'INSERT INTO jokes (joke, category_id, likes, dislikes) VALUES (?,?,?,?)'
                db.run(insert, ["joke1",1,0,0])
                db.run(insert, ["joke2",2,0,0])
            }
        });  
    }
});


module.exports = db