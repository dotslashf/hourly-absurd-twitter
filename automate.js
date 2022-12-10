const fs = require("fs");
const admin = require("firebase-admin");
const serviceAccount = require("./functions/util/key.json");

const file = fs.readFileSync("list.csv", "utf8");
const lines = file.split("\n");
const data = lines
  .map((line) => line.split(","))
  .filter((line) => line[1] === "pending");

const hashMap = new Map(data);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "gs://twitter-absurd-humor.appspot.com/",
});

(async () => {
  const storage = admin.storage();
  for (const [key, _] of hashMap) {
    const video = storage.bucket().file(`videos/${key}`);
    const buffer = await video.download();
    fs.writeFileSync(`downloaded-videos/${key}`, buffer[0], "utf8");
    console.log(`Downloaded ${key}`);
  }
})();
