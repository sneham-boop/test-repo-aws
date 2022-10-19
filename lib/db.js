require("dotenv").config();

// Supabase database initialization
const supa = require("@supabase/supabase-js");
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const db = supa.createClient(supabaseUrl, supabaseKey);

// Test user
let testUser = {
  id: 1,
  created_at: "2022-10-17T19:41:25.817008+00:00",
  name: "Jane Doe",
  email: "jane@jane.com",
  age: 23,
  gender: "F",
  password: "password",
  phone: "123456789",
  planner: true,
  runner: true,
};

const getUsers = async () => {
  let { data: users, error } = await db.from("users").select("*");
  return { users, error };
};

const getUser = async () => {
  let { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", "1");

  return { user, error };
};

const getRuns = async () => {
  let { data: runs, error } = await db.from("runs").select("*");
  return { runs, error };
};

const getAllUsers = () => {
  return db
    .query(`SELECT * FROM users;`)
    .then((result) => {
      const users = {};
      result.rows.forEach((row) => {
        const id = row.id;
        users[id] = row;
      });
      return { users };
    })
    .catch((err) => console.error(err.stack));
};

// const getUser = (id) => {
//   return db
//     .query(
//       `SELECT * FROM users
//     WHERE users.id = $1;`,
//       [id]
//     )
//     .then((result) => {
//       const user = result.rows[0];
//       return { user };
//     })
//     .catch((err) => console.error(err.stack));
// };

const createUser = ({
  name,
  email,
  hashedPassword,
  phone,
  gender,
  age,
  planner,
  runner,
}) => {
  return db
    .query(
      `INSERT INTO users (name, email, password, phone, gender, age, planner, runner)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING *;`,
      [name, email, hashedPassword, phone, gender, age, planner, runner]
    )
    .then((result) => {
      const user = result.rows[0];
      return { user };
    })
    .catch((err) => console.error(err.stack));
};

const getUserByEmail = ({ email }) => {
  return db
    .query(
      `SELECT * FROM users
      WHERE users.email = $1;`,
      [email]
    )
    .then((result) => {
      const user = result.rows[0];
      return { user };
    })
    .catch((err) => console.error(err.stack));
};

const getAllRuns = () => {
  return db
    .query(
      `SELECT runs.id, runs.name, runs.description, runs.location, TO_CHAR(runs.time, 'HH:MI AM') as event_time, TO_CHAR(runs.date, 'DDth Mon, YYYY') as date, runs.distance, runs.latitude, runs.longitude, runs.location_to, runs.latitude_to, runs.longitude_to,
      (CASE WHEN runs.date >= CURRENT_DATE THEN TRUE
        ELSE FALSE
      END) AS future_run
      FROM runs;`
    )
    .then((result) => {
      const runs = {};
      result.rows.forEach((row) => {
        const id = row.id;
        runs[id] = row;
      });
      return { runs };
    })
    .catch((err) => console.error(err.stack));
};

const getRun = (id) => {
  return db
    .query(
      `SELECT runs.id, runs.name, runs.description, runs.location, runs.time, TO_CHAR(runs.date, 'DDth Mon, YYYY') as date 
    FROM runs
    WHERE runs.id = $1;`,
      [id]
    )
    .then((result) => {
      const run = result.rows[0];
      return { run };
    })
    .catch((err) => console.error(err.stack));
};

const createRun = ({
  name,
  description,
  location,
  distance,
  time,
  date,
  planner_id,
  latitude,
  longitude,
  location_to,
  latitude_to,
  longitude_to,
}) => {
  return db
    .query(
      `INSERT INTO runs (name, description, location, distance, time, date, planner_id, latitude, longitude, location_to, latitude_to, longitude_to)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    RETURNING *;`,
      [
        name,
        description,
        location,
        distance,
        time,
        date,
        planner_id,
        latitude,
        longitude,
        location_to,
        latitude_to,
        longitude_to,
      ]
    )
    .then((result) => {
      const run = result.rows[0];
      return { run };
    })
    .catch((err) => console.error(err.stack));
};

const getRunsForPlanner = (id) => {
  return db
    .query(
      `SELECT runs.id, users.id AS planner_id, runs.name, runs.description, runs.distance, TO_CHAR(runs.date, 'DDth Mon, YYYY') as date, TO_CHAR(runs.time, 'HH:MI AM') as event_time, runs.location,runs.latitude, runs.longitude, runs.location_to, runs.latitude_to, runs.longitude_to,
        (CASE WHEN runs.date >= CURRENT_DATE THEN TRUE
            ELSE FALSE
        END) AS future_run
      FROM runs
      JOIN users ON runs.planner_id = users.id
      WHERE runs.planner_id = $1;`,
      [id]
    )
    .then((result) => {
      const plannerRuns = {};
      result.rows.forEach((row) => {
        const id = row.id;
        plannerRuns[id] = row;
      });
      return { plannerRuns };
    })
    .catch((err) => console.error(err.stack));
};

const getRunsForRunner = (id) => {
  return db
    .query(
      `SELECT runs.id, users.id AS user_id, runs.name, runs.description, runs.distance, runs.location, TO_CHAR(runs.date, 'DDth Mon, YYYY') as date, users_runs.time, users_runs.rating, runs.latitude, runs.longitude, runs.location_to, runs.latitude_to, runs.longitude_to, TO_CHAR(runs.time, 'HH:MI AM') AS event_time,
      (CASE WHEN runs.date >= CURRENT_DATE THEN TRUE
            ELSE FALSE
       END) AS future_run
      FROM runs
      JOIN users_runs ON runs.id = users_runs.run_id
      JOIN users ON users_runs.runner_id = users.id
      WHERE users_runs.runner_id = $1;`,
      [id]
    )
    .then((result) => {
      const runnerRuns = {};
      result.rows.forEach((row) => {
        const id = row.id;
        runnerRuns[id] = row;
      });
      return { runnerRuns };
    })
    .catch((err) => console.error(err.stack));
};

const registerForARun = ({ runner_id, run_id }) => {
  return db
    .query(
      `INSERT INTO users_runs (time, rating, runner_id, run_id)
      SELECT '0', 0, $1, $2
      WHERE
      EXISTS (
            -- only future runs can be joined
        SELECT *
        FROM runs
        WHERE runs.id = $2 AND runs.date >= CURRENT_DATE
        LIMIT 1
      ) AND 
      NOT EXISTS (
            -- runs can only be joined once
        SELECT *
        FROM users_runs
        WHERE users_runs.run_id = $2 AND users_runs.runner_id = $1
        LIMIT 1    
      )
      RETURNING *;`,
      [runner_id, run_id]
    )
    .then((result) => {
      const user_run = result.rows[0];
      return { user_run };
    })
    .catch((err) => console.error(err.stack));
};

module.exports = {
  db,
  getAllUsers,
  getUser,
  createUser,
  getAllRuns,
  getRun,
  createRun,
  getRunsForPlanner,
  getRunsForRunner,
  registerForARun,
  getUserByEmail,
  getUsers,
  getRuns,
};
