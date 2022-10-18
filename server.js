require("dotenv").config();
const Express = require("express");
const App = Express();

const PORT = process.env.PORT || 8080;

App.get("/", (req, res) => {
  res.send({ message: "This app is live now." });
});

App.listen(PORT, () => {
  console.log(
    `Express seems to be listening on port ${PORT} so that's pretty good 👍`
  );
});
