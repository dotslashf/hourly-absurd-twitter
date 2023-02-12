const fs = require("fs");
const { join, extname } = require("path");
const uuid = require("uuid");
const ObjectsToCsv = require("objects-to-csv");
const toStream = require("buffer-to-stream");
const { Readable } = require("stream");
const crypto = require("crypto");

const SUBMISSION_HOURS = [1, 3, 5, 8, 11, 13];
const HMAC_PAYLOAD_KEYS = [
  "version",
  "id",
  "amount_raw",
  "donator_name",
  "donator_email",
];

async function renameFiles(dir) {
  const files = fs.readdirSync(dir);
  console.log("renaming files...");
  await Promise.all(
    files.map(async (file) => {
      const extension = extname(file);
      const newName = uuid.v4() + extension;
      fs.renameSync(join(dir, file), join(dir, newName));
    })
  );
  console.log("files renamed");
  return fs.readdirSync(dir);
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

function parsePayloadToData(payload) {
  return HMAC_PAYLOAD_KEYS.map((key) => payload[key]).join("");
}

function verifySignature(receivedHmac, body, secret) {
  if (!receivedHmac) return false;

  const hmacData = parsePayloadToData(body);

  const hmac = crypto
    .createHmac("sha256", secret)
    .update(hmacData)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(receivedHmac));
  } catch {
    return false;
  }
}

function formatIdrToXAmount(amount) {
  return "X".repeat(amount.toString().length);
}

function formatSaweriaBodyToTweet(payload) {
  const { donator_name, amount_raw, created_at, message } = payload;

  return `
  💰💸 Submission Alert 💸💰

  "${message}"

  - ${donator_name} (IDR. ${formatIdrToXAmount(amount_raw)})
  ${new Intl.DateTimeFormat("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(created_at))}
  `;
}

function getVideosName(files) {
  const sortedData = Object.entries(files)
    .sort((a, b) => a[1].createdAt - b[1].createdAt)
    .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
  return Object.keys(sortedData);
}

function sortByCreatedAt(files, order = "asc") {
  return Object.entries(files)
    .sort((a, b) => {
      if (order === "asc") return a[1].createdAt - b[1].createdAt;
      return b[1].createdAt - a[1].createdAt;
    })
    .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
}

module.exports = {
  renameFiles,
  writeToCsv,
  listToMap,
  randomize,
  updateArrayStatus,
  isItSubmissionTime,
  convertBuffer,
  verifySignature,
  formatSaweriaBodyToTweet,
  getVideosName,
  sortByCreatedAt,
};
