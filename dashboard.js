const admin = require("firebase-admin");
const serviceAccount = require("./functions/util/key.json");
const { sortByCreatedAt } = require("./functions/util/common");
const prompt = require("readline-sync");
const fs = require("fs");

const INTERVAL_HOURS = 2;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    "https://twitter-absurd-humor-default-rtdb.asia-southeast1.firebasedatabase.app/",
});

const database = admin.database();

async function getRemainingVideoList(limit = 10) {
  const ref = database.ref("videos");
  const query = ref
    .orderByChild("status")
    .equalTo("waiting")
    .limitToLast(limit);
  const snapshot = await query.once("value");
  return snapshot.val();
}

async function getLatestUploadedVideo() {
  const ref = database.ref("videos");
  const query = ref.orderByChild("status").equalTo("finished");
  const snapshot = await query.once("value");
  return snapshot.val();
}

async function dashboardVideos() {
  const data = await getLatestUploadedVideo();
  const sortedData = sortByCreatedAt(data, "desc");
  const latestVideo = sortedData[Object.keys(sortedData)[0]];
  const dateUpdated = new Date(latestVideo.updatedAt);
  const timeUpdated = dateUpdated.toLocaleString("en-US", {
    timeStyle: "medium",
    dateStyle: "long",
  });
  const dataRemaining = await getRemainingVideoList();
  const sortedDataRemaining = sortByCreatedAt(dataRemaining);
  console.log(
    `Latest video:\n\n🪪: ${
      Object.keys(sortedData)[0]
    }\n⌚ uploaded at: ${timeUpdated}\n🚩 status: ${
      latestVideo.status === "finished" ? "✅" : "❌"
    }`
  );
  const table = Object.entries(sortedDataRemaining)
    .map((data, i) => {
      const resetSeconds = new Date(dateUpdated.setSeconds(0));
      const timeToPosted = resetSeconds.setHours(
        resetSeconds.getHours() + INTERVAL_HOURS * (i + 1)
      );
      const timeUpdated = new Date(timeToPosted).toLocaleString("en-US", {
        timeStyle: "medium",
        dateStyle: "long",
      });
      const createdAt = new Date(data[1].createdAt).toLocaleString("en-US", {
        timeStyle: "medium",
        dateStyle: "long",
      });
      return { id: data[0], createdAt, time: timeUpdated };
    })
    .reduce(
      (obj, value) => ({
        ...obj,
        [value.id]: {
          Created_At: value.createdAt,
          Will_Updated_At: value.time,
        },
      }),
      {}
    );
  console.table(table);
}

async function dashboardHoursLeft() {
  const data = await getRemainingVideoList(100);
  const length = Object.keys(data).length;
  const hours = length * 4;
  console.log(`🎥 Videos left: ${length}`);
  console.log(`⌚ Days left: ${(hours / 24).toFixed(2)}`);
}

// function deleteUploadedVideos() {
//   const uploadedFiles = await getUploadedVideosList();
//   const localFiles = fs.readdirSync("./downloaded-videos");
//   const hashLocalFiles = new Map(localFiles.map((file) => [file, true]));
//   const hashUploadedFiles = new Map(Object.entries(uploadedFiles));
//   for (let [key] of hashLocalFiles) {
//     if (hashUploadedFiles.has(`${key.replace(".mp4", "")}`)) {
//       hashLocalFiles.delete(key);
//       fs.unlinkSync(`./downloaded-videos/${key}`);
//     }
//   }
//   console.log(hashUploadedFiles.keys());
//   console.log(hashLocalFiles.keys());
// }

(async () => {
  const options = ["List Videos", "Hours Left"];
  const index = prompt.keyInSelect(options, "Choose Option?");
  switch (index) {
    case 0:
      await dashboardVideos();
      break;
    case 1:
      await dashboardHoursLeft();
      break;
  }
  return process.exit(1);
})();
