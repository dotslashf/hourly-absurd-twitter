const fs = require("fs");
const { join, extname } = require("path");
const uuid = require("uuid");
const ObjectsToCsv = require("objects-to-csv");

async function renameFiles(dir) {
  const files = fs.readdirSync(dir);
  await Promise.all(
    files.map(async (file) => {
      const extension = extname(file);
      const newName = uuid.v4() + extension;
      fs.renameSync(join(dir, file), join(dir, newName));
      console.log("renamed file: " + file);
    })
  );
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
