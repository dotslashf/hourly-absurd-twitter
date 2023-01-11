const admin = require("firebase-admin");
const { renameFiles } = require("./common");
const serviceAccount = require("./key.json");
const ObjectsToCsv = require("objects-to-csv");
const fs = require("fs");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    "https://twitter-absurd-humor-default-rtdb.asia-southeast1.firebasedatabase.app/",
});
const storage = admin.storage();
const database = admin.database();

const bucket = storage.bucket("gs://twitter-absurd-humor.appspot.com/");

// upload new files
(async () => {
  const files = await renameFiles("./videos");
  for (const file of files) {
    console.log("Uploading:", file);
    try {
      await bucket.upload(`./videos/${file}`, {
        destination: `videos-v2/${file}`,
        metadata: {
          contentType: "video/mp4",
        },
      });
      const fileNameRef = database
        .ref("videos")
        .child(file.replace(".mp4", ""));
      await fileNameRef.set({
        status: "waiting",
        createdAt: Date.now(),
      });
      fs.unlinkSync(`./videos/${file}`);
    } catch (error) {
      const csv = new ObjectsToCsv([file]);
      await csv.toDisk("./listError.csv", { append: true });
    } finally {
      console.log(`${file} uploaded`);
    }
  }
  process.exit(0);
})();
