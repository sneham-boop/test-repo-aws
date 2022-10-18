require("dotenv").config();
const Express = require("express");
const App = Express();

const PORT = process.env.PORT || 8080;

App.get("/", (req, res) => {
  const testToken = process.env.TEST_SECRET;
  if (testToken === "Thisisatestsecret")
  { 
    res.send({ message: "I found your secret." });
  }
  else {
    res.send({ message: "I did not find your secret." });
  }
});

App.listen(PORT, () => {
  console.log(
    `Express seems to be listening on port ${PORT} so that's pretty good 👍`
  );
});
