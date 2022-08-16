const fs = require("fs");
const { join, extname } = require("path");
const uuid = require("uuid");
const ObjectsToCsv = require("objects-to-csv");
const toStream = require("buffer-to-stream");
const { Readable } = require("stream");

const SUBMISSION_HOURS = [8, 12, 16, 20];

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
  array[n].status = new Date();
}

function randomize(size) {
  return Math.floor(Math.random() * size);
}

function isItSubmissionTime() {
  const date = new Date();
  const hour = date.getHours();
  return SUBMISSION_HOURS.includes(hour);
}

module.exports = {
  renameFiles,
  writeToCsv,
  listToMap,
  randomize,
  updateArrayStatus,
  isItSubmissionTime,
};
