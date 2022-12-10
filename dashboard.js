const admin = require("firebase-admin");
const serviceAccount = require("./functions/util/key.json");
const { sortByCreatedAt } = require("./functions/util/common");
const prompt = require("readline-sync");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    "https://twitter-absurd-humor-default-rtdb.asia-southeast1.firebasedatabase.app/",
});

const database = admin.database();

async function getRemainingVideoList() {
  const ref = database.ref("videos");
  const query = ref.orderByChild("status").equalTo("waiting");
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
        resetSeconds.getHours() + 4 * (i + 1)
      );
      const timeUpdated = new Date(timeToPosted).toLocaleString("en-US", {
        timeStyle: "medium",
        dateStyle: "long",
      });
      return { id: data[0], time: timeUpdated };
    })
    .reduce((obj, value) => ({ ...obj, [value.id]: { Date: value.time } }), {});
  console.table(table);
}

async function dashboardHoursLeft() {
  const data = await getRemainingVideoList();
  const length = Object.keys(data).length;
  const hours = length * 4;
  console.log(`🎥 Videos left: ${length}`);
  console.log(`⌚ Days left: ${(hours / 24).toFixed(2)}`);
}

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
