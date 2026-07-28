const { exec } = require("node:child_process");

// Exemple volontairement vulnérable.
// Ne pas exécuter et ne jamais conserver en production.
const userInput = process.argv[2];

exec(userInput);
