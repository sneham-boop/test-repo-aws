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

const registerForARun = async ({ runner_id, run_id }) => {
  // Check if run is in future
  let today = new Date();
  const dd = String(today.getDate()).padStart(2, "0");
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const yyyy = today.getFullYear();

  today = mm + "/" + dd + "/" + yyyy;

  let runInFutureQuery = db
    .from("runs")
    .select("*")
    .eq("id", run_id)
    .gt("date", today);
  const { data, error } = await runInFutureQuery;
  if (error)
    return {
      message: "We cannot find the run you are trying to register for.",
    };
  if (data.length === 0)
    return {
      message: "This run is in the past. Please join a run from a later date.",
    };

  // Check if user has already registered for a run
  let alreadyRegistered = db
    .from("users_runs")
    .select("*")
    .eq("run_id", run_id)
    .eq("runner_id", runner_id);
  const { data: alreadyRegisteredForRun, error: alreadyRegisteredForRunError } =
    await alreadyRegistered;
  if (alreadyRegisteredForRunError)
    return { message: "We cannot register you for this run right now." };
  if (alreadyRegisteredForRun.length !== 0)
    return { message: "You are already resistered for this run." };

  // Register for run if all good
  let insertRunQuery = db
    .from("users_runs")
    .insert([{ runner_id, run_id }])
    .select();
  const { data: newRun, error: insertError } = await insertRunQuery;

  return {
    userRun: newRun,
    error: insertError,
    message: "Run registered successfully!!",
  };
};

const createRun = async ({
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
  const { data: run, error } = await db
    .from("runs")
    .insert([
      {
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
      },
    ])
    .select();
  console.log("This run was created", run);
  return { run, error };
  // return db
  //   .query(
  //     `INSERT INTO runs (name, description, location, distance, time, date, planner_id, latitude, longitude, location_to, latitude_to, longitude_to)
  //   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
  //   RETURNING *;`,
  //     [
  //       name,
  //       description,
  //       location,
  //       distance,
  //       time,
  //       date,
  //       planner_id,
  //       latitude,
  //       longitude,
  //       location_to,
  //       latitude_to,
  //       longitude_to,
  //     ]
  //   )
  //   .then((result) => {
  //     const run = result.rows[0];
  //     return { run };
  //   })
  //   .catch((err) => console.error(err.stack));
};

//// Local db functions - yet to be converted to supabase

// const createRun = ({
//   name,
//   description,
//   location,
//   distance,
//   time,
//   date,
//   planner_id,
//   latitude,
//   longitude,
//   location_to,
//   latitude_to,
//   longitude_to,
// }) => {
//   return db
//     .query(
//       `INSERT INTO runs (name, description, location, distance, time, date, planner_id, latitude, longitude, location_to, latitude_to, longitude_to)
//     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
//     RETURNING *;`,
//       [
//         name,
//         description,
//         location,
//         distance,
//         time,
//         date,
//         planner_id,
//         latitude,
//         longitude,
//         location_to,
//         latitude_to,
//         longitude_to,
//       ]
//     )
//     .then((result) => {
//       const run = result.rows[0];
//       return { run };
//     })
//     .catch((err) => console.error(err.stack));
// };

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
