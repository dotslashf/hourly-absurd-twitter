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
    return { id: file, status: "pending" };
  });
  const csv = new ObjectsToCsv(fileAndStatus);
  await csv.toDisk(csvDir, { append: true });
}

function listToMap(array) {
  const map = new Map();
  array
    .filter((a) => a.status === "pending")
    .map((a, index) => map.set(index, a.id));
  return map;
}

/**
 * @param {Array} array
 * @param {string} id
 * @returns
 */
function updateArrayStatus(array, id) {
  const n = array.findIndex((a) => a.id === id);
  array[n].status = "success";
}

function randomize(size) {
  return Math.floor(Math.random() * size);
}

module.exports = {
  renameFiles,
  writeToCsv,
  listToMap,
  randomize,
  updateArrayStatus,
};
