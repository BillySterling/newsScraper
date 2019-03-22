var linkRef = "https://www.bizjournals.com/";

function getJson() {
  $.getJSON("/articles", function(data) {
      $("#savedArticles").hide();
      $("#infoHeader").empty();
      $("#infoHeader").append("<span class='d-block p-2 bg-primary text-white'>Scraped articles displayed below - Click Save Article button to save</span>");
    // For each one
      for (var i = 0; i < data.length; i++) {
        // Display the information on the page
        if (data[i].saved) {
          var btnText = "SAVED";
          var btnFunct = "btn-static";
          var btnClik = "disabled";
        } else {
          var btnText = "Save Article";
          var btnFunct = "btn-primary";
          var btnClik = ""; 
        }
        $("#articles").append("<div class='row'> <div class='col-sm-12'><h3 class='articleTitle' data-id='" + data[i]._id + "'>" + data[i].title + "<br />" +  "</h3></div>" + "<br>" +
        "<a class='btn btn-info' href='" + linkRef + data[i].link + "' target='_blank' role='button'>" + "View Article" + '</a>' +
          "<button class='btn btn-primary ml-2 view-notes' type='button' data-target='#noteModal' data-toggle='modal' data-id='" + data[i]._id + "'>" + "View Notes" + "</button>" +
          "<button class='btn " + btnFunct + " ml-2 save-article' type='submit' " + btnClik + " data-id='" + data[i]._id + "'>" + btnText + "</button></div></div>"  + "<hr>" + "<br>"
        );
      }
  });
}

// display data
getJson();

// view notes button
$(document).on("click", ".view-notes", function() {
  console.log("======= VIEW NOTES BUTTON CLICKED =======");
  // Empty the notes from the note section, reset fields
  $("#notes").empty();
  $("#newNote").empty();
  $("#saveBtn").empty();

  // Save article id for retrieval
  var thisId = $(this).attr("data-id");

  // ajax call for article
  $.ajax({
      method: "GET",
      url: "/articles/" + thisId
    })
    .then(function(data) {
      console.log(data);
      $("#noteModal").modal("show");
      $("#newNote").append("<h6>Enter new note title and note below</h6>Note Title: <input id='title-input' name='title'></input>" + "<br>Note Text:  <textarea id='body-input' name='body'></textarea>" + "<br>");
      $("#saveBtn").append("<button data-id='" + data._id + "' class='save-note btn btn-primary'>Save Note</button>");
      // display note(s) if any saved
      if (data.note.length != 0) {
      for (var i = 0; i < data.note.length; i++) {
        $("#notes").append(
          "<h6>" + data.note[i].title + "</h6>" +
          "<p class='noteText'>" + data.note[i].body + "</p>" +
          "<button data-id='" + data.note[i]._id + "' articleId='" + thisId + "' class='delete-note btn btn-danger'>Delete Note</button>" + "<br>" + "<hr>"
          );
        }
      }
      else {
        $("#notes").append("There are currently no notes for this article" + "<br>" + "<br>");
        }
    });
});

 // scrape articles button
 $(document).on("click", "#scrape", function() {
  console.log("========= SCRAPE CLICKED =========");
  // clear the display
$("#articles").empty();
  $.ajax({
    method: "GET",
    url: "/scrape"
  }).then(function(data) {
    console.log(data);
  location.reload();
  });    
});

// save article button
$(document).on("click", ".save-article", function() {
  console.log("======= SAVE ARTICLE BUTTON CLICKED =======");
  var thisId = $(this).attr("data-id");
  // POST the article
  $.ajax({
      method: "POST",
      url: "/saveArticle/" + thisId,
    })
    .then(function(data) {
    console.log("ARTICLE SAVED: " + data);
    });
  location.reload();
});

// delete article button
$(document).on("click", ".delete-article", function() {
  var thisId = $(this).attr("data-id");

  // POST to delete saved article (removing note id reference)
  $.ajax({
      method: "POST",
      url: "/deleteSaved/" + thisId,
    })
    .then(function(data) {
  viewSaved();
  $("#savedArticles").show();
    });
});

// save note button
$(document).on("click", ".save-note", function() {
  console.log("======= SAVE NOTE BUTTON CLICKED =======");
  // get article id from button id
  var thisId = $(this).attr("data-id");
  // POST the note
  $.ajax({
      method: "POST",
      url: "/articles/" + thisId,
      data: {
        title: $("#title-input").val(),
        body: $("#body-input").val()
      }
    })
    .then(function(data) {
      $("#notes").empty();
    });
  // reset note input and textarea and hide the modal
  $("#title-input").val("");
  $("#body-input").val("");
  $("#noteModal").modal("hide");
});

// delete note button clicked (in modal)
$(document).on("click", ".delete-note", function() {
  var thisId = $(this).attr("data-id");
  var articleId = $(this).attr("articleId");
  console.log("========== DELETE NOTE CLICKED: " + thisId + " " + articleId);
  $.ajax({
      method: "POST",
      url: "/notes/delete/" + thisId + "/" + articleId
    })
    .then(function(data) { 
      console.log("DELETE SUCCESSFUL! " + data);
    });
   $("#noteModal").modal("hide");
});

// view saved button
$("#view-saved").on("click", function() {
  viewSaved();
});

function viewSaved() {
  console.log("======= VIEW SAVED ARTICLE BUTTON CLICKED =======");
  $.getJSON("/saveArticle", function(data) {
      $("#articles").hide();
      $("#infoHeader").empty();
      $("#infoHeader").append("<span class='d-block p-2 bg-primary text-white'>Saved articles displayed below - Click Remove Article button to remove</span>");
      $("#savedArticles").show();
      $("#savedArticles").empty();
    // loop thru saved articles
    for (var i = 0; i < data.length; i++) {
      // Display the information on the page
      $("#savedArticles").append("<div class='row'> <div class='col-sm-12'><h3 class='articleTitle' data-id='" + data[i]._id + "'>" + data[i].title + "<br />" +  "</h3></div>" + "<br>" +
      "<a class='btn btn-info' href='" + linkRef + data[i].link + "' target='_blank' role='button'>" + "View Article" + '</a>' +
        "<button class='btn btn-primary ml-2 view-notes' type='button' data-target='#noteModal' data-toggle='modal' data-id='" + data[i]._id + "'>" + "View Notes" + "</button>" +
        "<button class='btn btn-danger ml-2 delete-article' type='submit' data-id='" + data[i]._id + "'>" + "Remove Article" + "</button></div></div>"  + "<hr>" + "<br>"
        );
    } 
  });
};

// view all articles button
$("#view-all").on("click", function() {
  console.log("======= VIEW ALL ARTICLES BUTTON CLICKED =======");
  // hide saved articles and...
    $("#savedArticles").hide();
    // display headlines again
    location.reload();
});