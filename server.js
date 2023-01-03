require("dotenv").config();
const Express = require("express");
const BodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const Bcrypt = require("bcryptjs");
const CookieSession = require("cookie-session");

// Express Configuration
const App = Express();
App.use(BodyParser.urlencoded({ extended: false }));
App.use(BodyParser.json());
App.use(Express.static("public"));
App.use(
  CookieSession({
    name: "session",
    keys: ["key1", "key2"],
    maxAge: 30 * 60 * 1000, // 30 minutes session
  })
);

const allowlist = ["https://wehike-app.netlify.app", "http://localhost:3000"];
const corsOptionsDelegate = function (req, callback) {
  let corsOptions;
  if (allowlist.indexOf(req.header("Origin")) !== -1) {
    corsOptions = { origin: true }; // reflect (enable) the requested origin in the CORS response
  } else {
    corsOptions = { origin: false }; // disable CORS for this request
  }
  callback(null, corsOptions); // callback expects two parameters: error and options
};
App.options("*", cors());

const PORT = process.env.PORT || 8080;

// Import db
const db = require("./lib/db");

// App.use(cors());

App.get("/", cors(corsOptionsDelegate), (req, res, next) => {
  res.send({
    message: "You are on the homepage or index route and your are live.",
  });
});

// Get all users
App.get("/api/users", cors(corsOptionsDelegate), (req, res, next) => {
  db.getUsers().then((response) => {
    const { users, error } = response;
    if (error) return res.send({ message: "No users were found." });

    res.send({ users: users });
  });
});

// Get all runs
App.get("/api/runs", cors(corsOptionsDelegate), (req, res, next) => {
  db.getRuns().then((response) => {
    const { runs, error } = response;
    if (error)
      return res.send({
        message: "We could not find any runs for you at this time.",
      });

    res.send({ runs });
  });
});

// Get image for run
App.get("/api/runs/image/:id", cors(corsOptionsDelegate), (req, res, next) => {
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

//Users
App.post("/api/users", cors(corsOptionsDelegate), (req, res, next) => {
  const { name, email, password, phone, gender, age, planner, runner } =
    req.body;

  const hashedPassword = Bcrypt.hashSync(password, 10);

  const newUserMessage =
    "Welcome to WeRun! Your account has been created. Join your first run now and put on your running shoes!";

  db.createUser({
    name,
    email,
    hashedPassword,
    phone,
    gender,
    age,
    planner,
    runner,
  })
    .then((response) => {
      const { user, error } = response;
      if (!user || error) return res.send({ message: "User was not created" });
      // sendUserText(user.phone, newUserMessage);
      res.send({
        message:
          "Account created successfully! You will shortly receive a text message to confirm.",
        user: user,
        error: error,
      });
    })
    .catch((e) => {
      console.error(e);
      res.send(e);
    });
});

// User login
App.post("/api/login", cors(corsOptionsDelegate), (req, res, next) => {
  const { email, password } = req.body;
  if (!email) res.send({ message: "We could not log you in at this time." });

  db.getUser(email).then((response) => {
    const { user, error } = response;
    if (error || !user)
      return res.send({
        message: "We could not find this user.",
      });

    if (Bcrypt.compareSync(password, user.password)) {
      req.session.user = user;
      res.send({ user });
      return;
    }
    res.send({ message: "User not found." });
  });
});

// User logout
App.post("/api/logout", cors(corsOptionsDelegate), (req, res, next) => {
  req.session.user = null;
  res.send({ user: null, message: "User was successfully logged out." });
});

// Add new image when creating a new run
App.post(
  "/api/image/:runID",
  [
    cors(corsOptionsDelegate),
    BodyParser.raw({ type: ["image/jpeg", "image/png"], limit: "5mb" }),
  ],
  (req, res) => {
    const { runID } = req.params;
    try {
      fs.writeFile(`./uploads/${runID}.jpeg`, req.body, (error) => {
        if (error) {
          throw error;
        }
      });
      res.sendStatus(200);
    } catch (error) {
      res.sendStatus(500);
    }
  }
);

App.post("/api/runs", cors(corsOptionsDelegate), (req, res, next) => {
  const {
    name,
    description,
    location,
    distance,
    time,
    date,
    lat,
    lng,
    planner_id,
    location_to,
    latitude_to,
    longitude_to,
  } = req.body;

  db.createRun({
    name,
    description,
    location,
    distance,
    time,
    date,
    latitude: lat,
    longitude: lng,
    location_to,
    latitude_to,
    longitude_to,
    planner_id,
  })
    .then((response) => {
      const { run, error } = response;
      if (!run || error) res.send({ message: "Run was not created.", error });

      res.send({ run, message: "Run was created successfully!" });
    })
    .catch((e) => {
      console.error(e);
      res.send(e);
    });
});

// Users runs
// Runner
App.get("/api/runs/runner/:id", cors(corsOptionsDelegate), (req, res, next) => {
  const { id } = req.params;

  db.getRunsRunner(id)
    .then((response) => {
      const { runnerRuns, error } = response;
      if (!runnerRuns || error)
        return res.send({ message: "No runs for this runner!" });
      res.send({ runnerRuns });
    })
    .catch((e) => {
      console.error(e);
      res.send(e);
    });
});

// Planner
App.get(
  "/api/runs/planner/:id",
  cors(corsOptionsDelegate),
  (req, res, next) => {
    const { id } = req.params;

    db.getRunsPlanner(id)
      .then((response) => {
        const { plannerRuns, error } = response;
        if (!plannerRuns || error)
          return res.send({ message: "No runs for this planner!" });
        res.send({ plannerRuns });
      })
      .catch((e) => {
        console.error(e);
        res.send(e);
      });
  }
);

// Register for a run
App.post("/api/register", cors(corsOptionsDelegate), (req, res, next) => {
  const { runner_id, run_id } = req.body;

  db.registerForARun({ runner_id, run_id })
    .then((response) => {
      const { userRun, message, error } = response;

      if (!userRun)
        return res.send({
          message,
          error,
        });

      res.send({ user_run: userRun, message });
    })
    .catch((e) => {
      console.error(e);
      res.send(e);
    });
});

// Add time for run
App.put('/api/runs/runner/:id', cors(corsOptionsDelegate), (req, res, next) => {
  const { runner_id, run_id, time } = req.body;
  db.updateRunTime({ runner_id, run_id, time })
    .then((response) => {
      const { run, message, error } = response;

      if (!run)
        return res.send({
          message,
          error,
        });

      res.send({ run, message });
    })
    .catch((e) => {
      console.error(e);
      res.send(e);
    });
})

App.listen(PORT, () => {
  console.log(
    `Express seems to be listening on port ${PORT} so that's pretty good 👍`
  );
});
