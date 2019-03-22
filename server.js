var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB
// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/BizNews";

mongoose.connect(MONGODB_URI, { useNewUrlParser: true }, function(err) {
  if (err)
  console.log(err);
});

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
        .attr("href");

      db.Article.create(result)
        .then(function(dbArticle) {
          console.log(dbArticle);
        })
        .catch(function(err) {
          console.log(err);
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
    res.json(err);
  });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  db.Article.findOne({ _id: req.params.id })
  // ..and populate all of the notes associated with it
  .populate("note")
  .then(function(dbArticle) {
    res.json(dbArticle);
  })
  .catch(function(err) {
    res.json(err);
  });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  db.Note.create(req.body)
  .then(function(dbNote) {
    // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
    // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
    // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
    // return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    return db.Article.findOneAndUpdate({ _id: req.params.id },
      { $push: { note: dbNote._id } }, { upsert: true });
  })
  .then(function(dbArticle) {
    res.json(dbArticle);
  })
  .catch(function(err) {
    res.json(err);
  });
});

// Route for deleting an Article's associated Note
// app.delete("/notes/delete/:note_id/:article_id", function(req, res) {
//   debugger;
//   // Using the note and article id passed in the id parameters, delete the requested note.
// db.Note.findOneAndDelete({id: req.params.note_id}, function(err) {
//   if (err) {
//     res.send(err);
//   }
//   else {
//     // if note removed from article then need to remove note rerference from the article
//     db.Article.findOneAndUpdate({ _id: req.params.article_id }, 
//       {$pull: {note: req.params.note_id}})
//       .exec(function(err, resp) {
//         if (err) {
//           console.log(err);
//           res.send(err);
//         } else {
//           res.send(resp);
//         }
//       });
//     }
//   });
// });

// app.delete("/notes/delete/:note_id/:article_id", function(req, res) {
//   console.log("~~~~~~~~~ DELETE NOTE ~~~~~~~~~");
//   // Using the note and article id passed in the id parameters, delete the requested note.  if note removed from article then need to remove note rerference from the article
//   db.Article.findOneAndUpdate({ _id: req.params.article_id }, 
//     {$pull: {note: req.params.note_id}})
//   //  .exec(function(err, resp) {
//     .then(function(err, resp) {
//       console.log("DELETE NOTE KEY IN ARTICLE RESP: " + resp);
//       if (err) {
//         console.log("DELETE NOTE KEY ERROR IN ARTICLE: " + err);
//         res.send(err);
//       } else {
//       // db.Note.findOneAndDelete({id: req.params.note_id}, function(err, response) {
//       db.Note.deleteOne({id: req.params.note_id}, function(err, response) {

//         console.log("DELETE NOTE RESP: " + response);
//         if (err) {
//           console.log("DELETE NOTE ERROR: " + err);
//           res.send(err);
//           }
//         });
//       }
//     });
// });



app.post("/notes/delete/:note_id/:article_id", function(req, res) {
  console.log("~~~~~~~~~ DELETE NOTE ~~~~~~~~~");
  // Using the note and article id passed in the id parameters, delete the requested note.  if note removed from article then need to remove note rerference from the article
  db.Article.findOneAndUpdate({ _id: req.params.article_id }, 
    {$pull: {note: req.params.note_id}}, function(err) {
      if (err) {
        console.log("ARTICLE UPDATE ERROR: " + err);
            res.send(err);
          }
      })
    .exec();

  db.Note.deleteOne({_id: req.params.note_id}, function(err) {
    if (err) {
      console.log("DELETE NOTE ERROR: " + err);
          res.send(err);
        }
    });
  });




// Route for saving an article
app.post("/saveArticle/:id", function(req, res) {
  db.Article.findOneAndUpdate({_id: req.params.id}, 
    {$set: {saved: true}})
  .then(function(dbArticle) {
      res.json(dbArticle);
  });
});

// Route for getting all saved articles
app.get("/saveArticle", function(req, res) {
db.Article.find({saved: true}).populate("note")
  .then(function(dbArticle) {
   res.json(dbArticle);
  })
  .catch(function(err) {
    res.json(err);
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
      res.json(err);
  });
});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT);
});
