/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//    loginDetails.json -- user login details
//    projectDetails.json -- project details
//    formQuestions.json -- quesstions for asking project details
//    package.json && package-lock.json -- details for imported 3rd party node modules
//    header-leftSection.json -- details for navbar headers and buttons present in left section
//    views -- html pages for dashboard and addProject form
//    userUploadedFiles -- files uploaded relating to the project ,a new folder is created using name as project id(pid)
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const upload = require("express-fileupload");
const path = require("path");
const archiver = require("archiver");

var app = express();

app.set("view engine", "ejs");

app.use(cors());
app.use(bodyParser());
app.use(bodyParser());
app.use(upload());

//////////////////sending name for dropdown menu in the navbar
app.get("/getName/:username", function (req, res) {
  var usersData = require("./loginDetails.json");
  var formatData = require("./header-leftSection.json");
  const data = {
    name: usersData[req.params.username].name,
    navbar: formatData.navbar,
  };
  console.log(data);
  res.send(JSON.stringify(data));
});

///////////////buttons data for left section buttons
app.get("/getLeftButtons", function (req, res) {
  var formatData = require("./header-leftSection.json");
  console.log("left-section sent");
  res.send(JSON.stringify(formatData.leftSection));
});

app.get("/pageFormatData", function (req, res) {
  const pageFormatData = require("./header-leftSection.json");
  console.log(pageFormatData);
  res.send(pageFormatData);
});

//////////////sending project details corresponding to particular user using username as key
app.get("/dashboard/:username", function (req, res) {
  var usersData = require("./loginDetails.json");
  var projectData = require("./projectDetails.json");
  var formquestion = require("./formQuestions.json");

  var header = [];

  formquestion.forEach(function (question) {
    header.push({ name: question["name"], type: question["type"] });
  });
  let sendData = usersData[req.params.username].pid.map(
    (id) => projectData[id]
  );
  console.log("req for dashboard recieved");
  res.render("dashboard", { showData: sendData, header: header });
});

////////////////sending form questions for adding a project.
app.get("/addProject/:username", function (req, res) {
  var addProjectForm = require("./formQuestions.json");
  res.render("addProject", {
    format: addProjectForm,
    username: req.params.username,
    message: "",
  });
});

//////////////////////updating project details from form input from the client side
app.post("/addProject/form/:username", function (req, res) {
  var projectData = require("./projectDetails.json");
  var userData = require("./loginDetails.json");
  console.log("caught event");
  console.log(req.files);

  let index = Object.keys(projectData).length + 1;
  req.body["pid"] = index;
  if (index == 0) projectData[index] = req.body;
  else projectData[index] = req.body;

  let username = req.params.username;
  userData[username]["pid"].push(index);

  if (req.files) {
    var uploadFile = req.files.projectFile;
    let dir = "./userUploadedFiles/" + index;
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
    } catch (err) {
      console.error(err);
    }
    console.log("length" + uploadFile.length);
    if (uploadFile.length === undefined) {
      uploadFile.mv(dir + "/" + uploadFile.name, function (err) {
        console.log(err);
      });
    } else {
      uploadFile.forEach((file) => {
        file.mv(dir + "/" + file.name, function (err) {
          console.log(err);
        });
      });
    }

    fs.writeFile(
      "loginDetails.json",
      JSON.stringify(userData, null, 4),
      (err) => {
        if (err) throw err;
      }
    );

    fs.writeFile(
      "projectDetails.json",
      JSON.stringify(projectData, null, 4),
      (err) => {
        if (err) throw err;
      }
    );
  }

  var addProjectForm = require("./formQuestions.json");
  res.render("addProject", {
    format: addProjectForm,
    username: req.params.username,
    message: "file added succesfully with pid : " + index,
  });
});

///////////////downloading files regarding a project .
app.get("/userUploadedFiles/:pid", function (req, res) {
  const dirname = "./userUploadedFiles/" + req.params.pid;
  fs.readdir(dirname, function (err, filenames) {
    if (err) {
      console.log(err);
    }
    console.log(filenames);
    // if (filenames.length == 1) {
    //   res.download(path.join(__dirname, dirname + "/" + filenames));
    // } else {
    var output = fs.createWriteStream(dirname + "/" + req.params.pid);
    var archive = archiver("zip", {
      gzip: true,
      // Sets the compression level.
    });
    archive.on("error", function (err) {
      throw err;
    });

    res.attachment("project_" + req.params.pid + ".zip");
    // pipe archive data to the output file
    archive.pipe(res);
    archive.directory(dirname, req.params.pid);
    archive.finalize();
  });
});

//////////login validation
app.post("/login", function (req, res) {
  var userData = require("./loginDetails.json");

  if (userData[req.body.username]) {
    if (userData[req.body.username].password == req.body.password) {
      res.send("success");
    } else res.send("username or password is wrong");
  } else res.send("username or password is wrong");
});

/////////////registering a user
app.post("/register", function (req, res) {
  var usersData = require("./loginDetails.json");

  let user = {
    username: req.body.username,
    password: req.body.password,
    name: req.body.name,
    pid: [],
  };

  if (usersData[user.username]) res.send("this username is already is used");
  else {
    usersData[user.username] = user;

    fs.writeFile(
      "loginDetails.json",
      JSON.stringify(usersData, null, 4),
      (err) => {
        if (err) throw err;
        res.send("succesfully added");
      }
    );
  }
});

app.listen(8080, () => console.log("lisen 8080"));
