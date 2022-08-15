const { renameFiles, writeToCsv } = require("./common");
const path = require("path");

const dirLocation = path.join(__dirname, `../../videos-submission`);
const csvLocation = path.join(__dirname, `../../list-submission.csv`);

(async () => {
  await renameFiles(dirLocation);
  await writeToCsv(dirLocation, csvLocation);
})();
