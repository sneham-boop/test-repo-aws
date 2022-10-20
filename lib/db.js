require("dotenv").config();

// Supabase database initialization
const supa = require("@supabase/supabase-js");
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const db = supa.createClient(supabaseUrl, supabaseKey);

const getUsers = async () => {
  let { data: users, error } = await db.from("users").select("*");
  return { users, error };
};

const getUser = async (email) => {
  let { data: user, error } = await db
    .from("users")
    .select("*")
    .eq("email", email);
  return { user: user[0], error };
};

const getRuns = async () => {
  let { data: runs, error } = await db.from("runs").select("*");
  return { runs, error };
};

const getRunsRunner = async (id) => {
  let { data: users_runs, error } = await db
    .from("users_runs")
    .select(
      `
    runner_id, run_id, time, rating,
    runs (
      *
    )
  `
    )
    .eq("runner_id", id);

  if (error) return { error };

  const runnerRuns = {};
  users_runs.forEach((run) => {
    const id = run.run_id;
    const { runs, time, rating } = run;
    const { time: event_time } = runs;
    runnerRuns[id] = { ...runs, event_time, time, rating };
  });
  return { runnerRuns };
};

const getRunsPlanner = async (id) => {
  let { data: runs, error } = await db
    .from("runs")
    .select("*")
    .eq("planner_id", id);

  if (error) return { error };

  const plannerRuns = {};
  runs.forEach((run) => {
    const { id, time: event_time } = run;
    plannerRuns[id] = { ...run, event_time };
  });
  return { plannerRuns };
};

const createUser = async ({
  name,
  email,
  hashedPassword,
  phone,
  gender,
  age,
  planner,
  runner,
}) => {
  const { data: user, error } = await db
    .from("users")
    .insert([
      {
        name,
        name,
        email,
        phone,
        gender,
        age,
        planner,
        runner,
        password: hashedPassword,
      },
    ])
    .select();
  return { user, error };
};

//// Local db functions - yet to be converted to supabase

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
  getUser,
  createUser,
  createRun,
  registerForARun,
  getUsers,
  getRuns,
  getRunsRunner,
  getRunsPlanner,
};
