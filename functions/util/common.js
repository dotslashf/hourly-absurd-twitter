const fs = require("fs");
const { join, extname } = require("path");
const uuid = require("uuid");
const ObjectsToCsv = require("objects-to-csv");
const toStream = require("buffer-to-stream");
const { Readable } = require("stream");

const SUBMISSION_HOURS = [1, 3, 5, 8, 11, 13];

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
function updateArrayStatus(array, id, status = new Date()) {
  const n = array.findIndex((a) => a.id === id);
  array[n].status = status;
}

function randomize(size) {
  return Math.floor(Math.random() * size);
}

function isItSubmissionTime(submissionTime = SUBMISSION_HOURS) {
  const date = new Date();
  const hour = date.getHours();
  return submissionTime.includes(hour);
}

function convertBuffer(buf, chunkSize) {
  if (typeof buf === "string") {
    buf = Buffer.from(buf, "utf8");
  }
  if (!Buffer.isBuffer(buf)) {
    throw new TypeError(
      `"buf" argument must be a string or an instance of Buffer`
    );
  }

  const reader = new Readable();

  const len = buf.length;
  let start = 0;

  // Overwrite _read method to push data from buffer.
  reader._read = function () {
    while (reader.push(buf.slice(start, (start += chunkSize)))) {
      // If all data pushed, just break the loop.
      if (start >= len) {
        reader.push(null);
        break;
      }
    }
  };
  return reader;
}

module.exports = {
  renameFiles,
  writeToCsv,
  listToMap,
  randomize,
  updateArrayStatus,
  isItSubmissionTime,
  convertBuffer,
};
