const { renameFiles, writeToCsv } = require("./common");
const path = require("path");

const dirLocation = path.join(__dirname, `../../videos`);
const csvLocation = path.join(__dirname, `../../list.csv`);

// renameFiles(dirLocation);
(async () => {
  await writeToCsv(dirLocation, csvLocation);
})();
