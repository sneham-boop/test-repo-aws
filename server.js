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

// const corsOptionsDelegate = {
//   origin: 'https://werun-app.netlify.app',
//   optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
// }

const allowlist = ['https://werun-app.netlify.app', 'http://localhost:3000']
const corsOptionsDelegate = function (req, callback) {
  let corsOptions;
  if (allowlist.indexOf(req.header('Origin')) !== -1) {
    corsOptions = { origin: true } // reflect (enable) the requested origin in the CORS response
  } else {
    corsOptions = { origin: false } // disable CORS for this request
  }
  callback(null, corsOptions) // callback expects two parameters: error and options
}

const PORT = process.env.PORT || 8080;

// Import db
const db = require("./lib/db");

// App.use(cors());

App.get("/", cors(corsOptionsDelegate),(req, res, next) => {
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

// App.get("/api/users/:id", (req, res) => {
//   const { id } = req.params;
//   db.getUser(id)
//     .then((response) => {
//       const { user } = response;
//       if (!user) res.send({ message: "User was not found" });
//       res.send({ user });
//     })
//     .catch((e) => {
//       console.error(e);
//       res.send(e);
//     });
// });

// App.post("/api/users", (req, res) => {
//   const { name, email, password, phone, gender, age, planner, runner } =
//     req.body;

//   const hashedPassword = Bcrypt.hashSync(password, 10);

//   const newUserMessage =
//     "Welcome to WeRun! Your account has been created. Join your first run now and put on your running shoes!";

//   db.createUser({
//     name,
//     email,
//     hashedPassword,
//     phone,
//     gender,
//     age,
//     planner,
//     runner,
//   })
//     .then((response) => {
//       const { user } = response;
//       if (!user) res.send({ message: "User was not created" });
//       sendUserText(user.phone, newUserMessage);
//       res.send({
//         message:
//           "Account created successfully! You will shortly receive a text message to confirm.",
//         user: user,
//       });
//     })
//     .catch((e) => {
//       console.error(e);
//       res.send(e);
//     });
// });

// App.put("/api/users/:id", (req, res) => {
//   res.send();
// });

// App.delete("/api/users/:id", (req, res) => {
//   res.send();
// });

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

// App.get("/api/runs/:id", (req, res) => {
//   const { id } = req.params;
//   db.getRun(id)
//     .then((response) => {
//       const { run } = response;
//       res.send({ run });
//     })
//     .catch((e) => {
//       console.error(e);
//       res.send(e);
//     });
// });

// // Add new image when creating a new run
// App.post(
//   "/api/image/:runID",
//   BodyParser.raw({ type: ["image/jpeg", "image/png"], limit: "5mb" }),
//   (req, res) => {
//     const { runID } = req.params;
//     try {
//       fs.writeFile(`./uploads/${runID}.jpeg`, req.body, (error) => {
//         if (error) {
//           throw error;
//         }
//       });
//       res.sendStatus(200);
//     } catch (error) {
//       res.sendStatus(500);
//     }
//   }
// );

// App.post("/api/runs", (req, res) => {
//   const {
//     name,
//     description,
//     location,
//     distance,
//     time,
//     date,
//     lat,
//     lng,
//     planner_id,
//     location_to,
//     latitude_to,
//     longitude_to,
//   } = req.body;

//   db.createRun({
//     name,
//     description,
//     location,
//     distance,
//     time,
//     date,
//     latitude: lat,
//     longitude: lng,
//     location_to,
//     latitude_to,
//     longitude_to,
//     planner_id,
//   })
//     .then((response) => {
//       const { run } = response;
//       if (!run) res.send({ message: "Run was not created" });
//       res.send({ run });
//     })
//     .catch((e) => {
//       console.error(e);
//       res.send(e);
//     });
// });

// App.put("/api/runs/:id", (req, res) => {
//   res.send();
// });

// App.delete("/api/runs/:id", (req, res) => {
//   res.send();
// });

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
App.get("/api/runs/planner/:id", cors(corsOptionsDelegate), (req, res, next) => {
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
});

// // Register for a run
// App.post("/api/register", (req, res) => {
//   const { runner_id, run_id } = req.body;

//   db.registerForARun({ runner_id, run_id })
//     .then((response) => {
//       const { user_run } = response;

//       if (!user_run)
//         return res.send({
//           message:
//             "You could not be registered for a run. This event was in the past or you are already registered for this run.",
//         });

//       res.send({ user_run });
//     })
//     .catch((e) => {
//       console.error(e);
//       res.send(e);
//     });
// });

App.listen(PORT, () => {
  console.log(
    `Express seems to be listening on port ${PORT} so that's pretty good 👍`
  );
});
