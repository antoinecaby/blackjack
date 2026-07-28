const express = require("express");
const { exec } = require("node:child_process");

const app = express();

app.get("/run-command", (req, res) => {
  const command = req.query.command;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).send(error.message);
    }

    if (stderr) {
      return res.status(500).send(stderr);
    }

    return res.send(stdout);
  });
});

app.listen(3000);
