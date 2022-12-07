const admin = require("firebase-admin");
const { renameFiles } = require("./common");
const serviceAccount = require("./key.json");

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
  files.map((file) => {
    bucket
      .upload(`./videos/${file}`, {
        destination: `videos-v2/${file}`,
        metadata: {
          contentType: "video/mp4",
        },
      })
      .then(() => {
        console.log(`${file} uploaded`);
        const fileNameRef = database
          .ref("videos")
          .child(file.replace(".mp4", ""));
        fileNameRef.set({
          status: "waiting",
          createdAt: Date.now(),
        });
      })
      .catch((err) => {
        console.log(err);
      });
  });
})();
