const functions = require("firebase-functions");
const Twitter = require("./services/twitter");
const Storage = require("./services/storage");
const Database = require("./services/database");
const {
  listToMap,
  randomize,
  updateArrayStatus,
  verifySignature,
  formatSaweriaBodyToTweet,
} = require("./util/common");

const storage = new Storage("gs://twitter-absurd-humor.appspot.com/");
const client = new Twitter({});
const db = new Database(
  "https://twitter-absurd-humor-default-rtdb.asia-southeast1.firebasedatabase.app/"
);

const SAWERIA_STREAM_KEY = process.env.SAWERIA_STREAM_KEY;

exports.tweetv2 = functions.pubsub.schedule("5 * * * *").onRun(async () => {
  const files = await db.getFolderFiles("videos");
  const videosToUpload = getFirstData(files);

  try {
    const video = await storage.getVideoFile(`videos-v2/${videosToUpload}.mp4`);
    const mediaId = await client.uploadMedia(video.buffer, video.type);
    await client.tweetMedia("", mediaId);
    console.log(`tweeted ✅`);
  } catch (error) {
    console.log("from catch", error);
  }
  await db.updateStatus(videosToUpload, "finished");
});

// exports.tweet = functions.pubsub.schedule("0 */4 * * *").onRun(async () => {
//   const path = {
//     folderVideos: "videos/",
//     csvFileName: "list.csv",
//   };
//   const result = await storage.getCsvFiles(path.csvFileName);
//   const filesMap = listToMap(result);

//   const randomIndex = randomize(filesMap.size);
//   const fileName = filesMap.get(randomIndex);
//   console.log(`selected ${path.folderVideos}${fileName}`);

//   try {
//     const video = await storage.getVideoFile(`${path.folderVideos}${fileName}`);
//     const mediaId = await client.uploadMedia(video.buffer, video.type);
//     await client.tweetMedia("", mediaId);

//     updateArrayStatus(result, fileName);
//     console.log(`tweeted ✅`);
//   } catch (error) {
//     updateArrayStatus(result, fileName, "error");
//     console.log("from catch", error);
//   }
//   storage.updateCsvFile(result, path.csvFileName);
// });

exports.saweria = functions.https.onRequest(async (req, res) => {
  const receivedHmac = req.header("Saweria-Callback-Signature");
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }
  if (!verifySignature(receivedHmac, req.body, SAWERIA_STREAM_KEY)) {
    console.log("invalid signature");
    return res.status(401).send("invalid signature");
  }
  const textToTweet = formatSaweriaBodyToTweet(req.body);
  client.tweetText(textToTweet);
  res.sendStatus(200);
});
