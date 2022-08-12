const fs = require("fs");
const { join, extname } = require("path");
const uuid = require("uuid");
const ObjectsToCsv = require("objects-to-csv");

function renameFiles(dir) {
  fs.readdir(dir, (err, files) => {
    if (err) throw err;
    for (const file of files) {
      const extension = extname(file);
      const newName = uuid.v4() + extension;
      fs.rename(join(dir, file), join(dir, newName), (err) => {
        if (err) throw err;
      });
      console.log("renamed file: " + file);
    }
  }),
    console.log("renamed all files");
}

async function writeToCsv(dir, csvDir) {
  const files = fs.readdirSync(dir);
  const fileAndStatus = files.map((file) => {
    return { file, status: "pending" };
  });
  const csv = new ObjectsToCsv(fileAndStatus);
  await csv.toDisk(csvDir, { append: true });
}

function listToMap(array) {
  const map = new Map();
  array.map((a, index) => {
    const row = a.split(",");
    row[1] === "pending" ? map.set(index, row[0]) : null;
  });
  return map;
}

function randomize(size) {
  return Math.floor(Math.random() * size);
}

module.exports = { renameFiles, writeToCsv, listToMap, randomize };
