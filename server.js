var express = require("express")
var app = express()
var db = require("./database.js")

var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Server port
var HTTP_PORT = 8000 
// Start server
app.listen(HTTP_PORT, () => {
    console.log("Server running on port %PORT%".replace("%PORT%",HTTP_PORT))
});
// Root endpoint
app.get("/", (req, res, next) => {
    res.json({"message":"Ok"})
});

//get all jokes
app.get("/api/jokes", (req, res, next) => {
    var sql =
    `SELECT jokes.id, jokes.joke, jokes.likes, jokes.dislikes, categories.category FROM jokes 
     JOIN joke_category ON jokes.id = joke_category.joke_id
     JOIN categories ON joke_category.category_id = categories.id`
    var params = []
    db.all(sql, params, (err, rows) => {
        if (err) {
          res.status(400).json({"error":err.message});
          return;
        }
        res.json({
            "message":"success",
            "data":rows
        })
      });
});

//get joke by id
app.get("/api/jokes/:id", (req, res, next) => {
    var sql = 
    `SELECT jokes.id, jokes.joke, jokes.likes, jokes.dislikes, categories.category FROM jokes 
     JOIN joke_category ON jokes.id = joke_category.joke_id
     JOIN categories ON joke_category.category_id = categories.id
     WHERE jokes.id = ?`
    var params = [req.params.id]
    db.get(sql, params, (err, row) => {
        if (err) {
          res.status(400).json({"error":err.message});
          return;
        }
        res.json({
            "message":"success",
            "data":row
        })
      });
});

//get all jokes of specific category
app.get("/api/jokes/categories/:category", (req, res, next) => {
    var sql = 
    `SELECT jokes.id, jokes.joke, jokes.likes, jokes.dislikes, categories.category FROM jokes 
     JOIN joke_category ON jokes.id = joke_category.joke_id
     JOIN categories ON joke_category.category_id = categories.id
     WHERE categories.category = ?`
    var params = [req.params.category]
    db.get(sql, params, (err, row) => {
        if (err) {
          res.status(400).json({"error":err.message});
          return;
        }
        res.json({
            "message":"success",
            "data":row
        })
      });
});

//get list of categories
app.get("/api/jokes/category/list/all", (req, res, next) => {
    var sql = 
    `SELECT *
     FROM categories`
    var params = [req.params.gategory]
    db.all(sql, params, (err, rows) => {
        if (err) {
          res.status(400).json({"error":err.message});
          return;
        }
        res.json({
            "message":"success",
            "data":rows
        })
      });
});

//get random one from all
app.get("/api/jokes/random/all", (req, res, next) => {
    var sql = 
    `SELECT jokes.id, jokes.joke, jokes.likes, jokes.dislikes, categories.category FROM jokes 
     JOIN joke_category ON jokes.id = joke_category.joke_id
     JOIN categories ON joke_category.category_id = categories.id
     ORDER BY random() limit 1`
    var params = []
    db.all(sql, params, (err, rows) => {
        if (err) {
          res.status(400).json({"error":err.message});
          return;
        }
        res.json({
            "message":"success",
            "data":rows
        })
      });
});

//select random one from specific category
app.get("/api/jokes/random/:category", (req, res, next) => {
    var sql = 
    `SELECT jokes.id, jokes.joke, jokes.likes, jokes.dislikes, categories.category FROM jokes 
     JOIN joke_category ON jokes.id = joke_category.joke_id
     JOIN categories ON joke_category.category_id = categories.id
     WHERE categories.category = ? 
     ORDER BY RANDOM() LIMIT 1`
    var params = [req.params.category]
    
    db.get(sql, params, (err, row) => {
        if (err) {
          res.status(400).json({"error":err.message});
          return;
        }
        res.json({
            "message":"success",
            "data":row
        })
      });
});

//add with category name or category_id?
app.post("/api/joke/", (req, res, next) => {
    var errors=[]
    if (!req.body.joke){
        errors.push("No joke specified");
    }
    if (!req.body.category_id){
        errors.push("No category_id specified");
    }
    if (errors.length){
        res.status(400).json({"error":errors.join(",")});
        return;
    }
    var data = {
        joke: req.body.joke,
        category_id: req.body.category_id,
        likes: 0,
        dislikes: 0
    }
    var sql1 = 'INSERT IGNORE INTO jokes (joke, likes, dislikes) VALUES (?,?,?)'
    var sql2 = 'SET @id = LAST_INSERT_ID()'
    var sql3 = 'INSERT INTO joke_caegory (joke_id, category_id) VALUES (@id,?)'
    var params1 = [data.joke, data.likes, data.dislikes]
    var params2 = [data.category_id]
    db.run(sql1, params1, sql2, sql3, params2, function (err, result) {
        if (err){
            res.status(400).json({"error": err.message})
            return;
        }
        res.json({
            "message": "success",
            "data": data,
            "id" : this.lastID
        })
    });
})

//add category
app.post("/api/joke/category", (req, res, next) => {
    var errors=[]
    if (!req.body.category){
        errors.push("No category specified");
    }
    if (errors.length){
        res.status(400).json({"error":errors.join(",")});
        return;
    }
    var data = {
        category: req.body.category
    }
    var sql ='INSERT INTO categories (category) VALUES (?)'
    var params =[data.category]
    db.run(sql, params, function (err, result) {
        if (err){
            res.status(400).json({"error": err.message})
            return;
        }
        res.json({
            "message": "success",
            "data": data,
            "id" : this.lastID
        })
    });
})

//modify joke with id
app.patch("/api/jokes/:id", (req, res, next) => {
    var data = {
        joke: req.body.joke,
        category_id: req.body.category_id
    }
    db.run(
        `UPDATE jokes set 
           joke = COALESCE(?,joke), 
           category_id = COALESCE(?,category_id)
           WHERE id = ?`,
        [data.joke, data.category_id, req.params.id],
        function (err, result) {
            if (err){
                res.status(400).json({"error": res.message})
                return;
            }
            res.json({
                message: "success",
                data: data,
                changes: this.changes
            })
    });
})

//add category to joke with id
app.post("/api/joke/category/add", (req, res, next) => {
    var errors=[]
    if (!req.body.joke_id){
        errors.push("No id specified");
    }
    if (!req.body.category_id){
        errors.push("No category specified");
    }
    if (errors.length){
        res.status(400).json({"error":errors.join(",")});
        return;
    }
    var data = {
        joke_id: req.body.joke_id,
        category_id: req.body.category_id
    }
    var sql ='INSERT INTO joke_category (joke_id, category_id) VALUES (?,?)'
    var params =[data.id, data.category_id]
    db.run(sql, params, function (err, result) {
        if (err){
            res.status(400).json({"error": err.message})
            return;
        }
        res.json({
            "message": "success",
            "data": data,
            "id" : this.lastID
        })
    });
})

//give vote

app.put("/api/jokes/vote/:id", (req, res, next) => {

    var data = {
        likes: req.body.likes,
        dislikes: req.body.dislikes,
        //modified: new Date().toLocaleString()
    }
    var voted = {
        like: 0,
        dislike: 0
    }
    if (!data.likes&& !data.dislikes){
        console.log("No votes given!");
    }else {
        if (data.likes){
            voted.like = 1;
        }
        if (data.dislikes){
            voted.dislike = 1;
        }
        db.run(
            `UPDATE jokes SET 
               likes = likes + ?,
               dislikes = dislikes + ?
               where id=?
               `,
            [voted.like, voted.dislike, req.params.id],
            function (err, result) {
                if (err){
                    res.status(400).json({"error": res.message})
                    return;
                }
                res.json({
                    message: "success",
                    data: data,
                    changes: this.changes
                })
        });
    }

})

app.delete("/api/joke/:id", (req, res, next) => {
    db.run(
        'DELETE FROM jokes WHERE id = ?',
        req.params.id,
        function (err, result) {
            if (err){
                res.status(400).json({"error": res.message})
                return;
            }
            res.json({"message":"deleted", changes: this.changes})
    });
})

// Default response for any other request
app.use(function(req, res){
    res.status(404);
});
