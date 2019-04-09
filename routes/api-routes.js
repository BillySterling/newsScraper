/* eslint-disable no-unused-vars */
// Require all models
var db = require('../models');
var axios = require("axios");
var cheerio = require("cheerio");

module.exports = function(app) {
    // A GET route for scraping the news website
    app.get("/scrape", function(req, res) {
        axios.get("https://www.bizjournals.com/atlanta/news/").then(function(response) {
        var $ = cheerio.load(response.data);
        $("a.item--flag").each(function(i, element) {
            var result = {};
            result.title = $(this)
            .children("div.item__body")
            .children("h3")
            .text();
            result.link = $(this)
            .attr("href")
            result.createdAt = Date.now()
            db.Article.create(result)
            .then(function(dbArticle) {
                //View result in console
                console.log(dbArticle);
            })
            .catch(function(err) {
                console.log("CREATE ARTICLE ERROR: " + err)
                res.send(err);
            });
        });
        res.send("******** Scrape Complete ********");
        });
    });
    
    // Route for getting all Articles from the db
    app.get("/articles", function(req, res) {
    // Grab every document in the Articles collection - include notes
    db.Article.find({})
    .populate("note")
    .then(function(dbArticle) {
        res.json(dbArticle);
    })
    .catch(function(err) {
        res.send(err);
    });
    });

    // Route for retrieving a specific Article by id, populate it with its note
    app.get("/articles/:id", function(req, res) {
    db.Article.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("note")
    .then(function(dbArticle) {
        res.json(dbArticle);
    })
    .catch(function(err) {
        res.send(err);
    });
    });

    // Route for saving/updating an Article's associated Note
    app.post("/articles/:id", function(req, res) {
    db.Note.create(req.body)
    .then(function(dbNote) {
        // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
        // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
        return db.Article.findOneAndUpdate({ _id: req.params.id },
        { $push: { note: dbNote._id } }, { upsert: true });
    })
    .then(function(dbArticle) {
        res.json(dbArticle);
    })
    .catch(function(err) {
        res.send(err);
    });
    });

    app.post("/notes/delete/:note_id/:article_id", function(req, res) {
    // Using the note and article id passed in the id parameters, delete the requested note.  if note removed from article then need to remove note rerference from the article
    db.Article.findOneAndUpdate({ _id: req.params.article_id }, 
        {$pull: {note: req.params.note_id}}, function(err) {
        if (err) {
            res.send(err);
            }
        })
        .exec();
    db.Note.deleteOne({_id: req.params.note_id})
        .then(function(dbNote) {
        res.json(dbNote);
        })
        .catch(function(err) {
            res.send(err);
        });
    });

    // Route save an article
    app.post("/saveArticle/:id", function(req, res) {
    db.Article.findOneAndUpdate({_id: req.params.id}, 
        {$set: {saved: true}})
    .then(function(dbArticle) {
        res.json(dbArticle);
    })
    .catch(function(err) {
        res.send(err);
        });
    });

    // Route for getting all saved articles
    app.get("/saveArticle", function(req, res) {
    db.Article.find({saved: true}).populate("note")
    .then(function(dbArticle) {
        res.json(dbArticle);
    })
    .catch(function(err) {
        res.send(err);
    });
    });

    // Route to delete a saved article
    app.post("/deleteSaved/:id", function(req, res) {
    db.Article.findOneAndUpdate({_id: req.params.id}, 
    {$set: {saved: false}})
    .then(function(dbArticle) {
        res.json(dbArticle);
    })
    .catch(function(err) {
        res.send(err);
    });
    });

};