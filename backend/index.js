const express = require("express");
const cors = require("cors");
const { startChecker } = require("./checker");
const routes = require("./routes");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok", uptime: process.uptime() }));
app.use("/api", routes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "internal server error" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`PulseWatch API listening on ${PORT}`);
  startChecker();
});
