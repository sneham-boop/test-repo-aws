require("dotenv").config();
const Express = require("express");
const BodyParser = require("body-parser");
const cors = require("cors");
const supa = require("@supabase/supabase-js");
const fs = require("fs");
const App = Express();


// Express Configuration
App.use(BodyParser.urlencoded({ extended: false }));
App.use(BodyParser.json());
App.use(Express.static("public"));

const PORT = process.env.PORT || 8080;

const supabaseUrl = "https://vuhdrozeicqzvbmnorrl.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = supa.createClient(supabaseUrl, supabaseKey);

const testSupabase = async () => {
  let { data: users, error } = await supabase.from("users").select("*");
  console.log("All users", users);
  // const users = {id: 1, name: "Sneha"};
  return { users };
};

const getRuns = async () => {
  let { data: runs, error } = await supabase.from("runs").select("*");
  return { runs };
};

App.use(cors());

App.get("/", (req, res, next) => {
  res.send({
    message: "You are on the homepage or index route and your are live.",
  });
});

App.get("/users", (req, res, next) => {
  testSupabase().then((response) => {
    const { users } = response;
    console.log("Got users for route.", users);
    res.send({ users: users });
  });
});

App.get("/runs", (req, res, next) => {
  getRuns().then((response) => {
    const { runs } = response;
    res.send({ runs: runs });
  });
});

// Get image for run
App.get("/runs/image/:id", (req, res) => {
  const runID = req.params.id;
  const path = `./uploads/${runID}.jpeg`;
  // Checking if the path exists
  fs.exists(path, function (exists) {
    if (!exists) {
      res.writeHead(404, {
        "Content-Type": "text/plain",
      });
      res.end("404 Not Found");
      return;
    }

    // Setting the headers
    res.writeHead(200, {
      "Content-Type": "image/jpeg",
    });

    // Reading the file
    fs.readFile(path, function (err, content) {
      // Serving the image
      res.end(content);
    });
  });
});

App.listen(PORT, () => {
  console.log(
    `Express seems to be listening on port ${PORT} so that's pretty good 👍`
  );
});
