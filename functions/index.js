const functions = require("firebase-functions");
const Twitter = require("./services/twitter");
const Storage = require("./services/storage");
const Database = require("./services/database");
const {
  verifySignature,
  formatSaweriaBodyToTweet,
  getVideosName,
} = require("./util/common");

const storage = new Storage();
const client = new Twitter({});
const db = new Database();

const SAWERIA_STREAM_KEY = process.env.SAWERIA_STREAM_KEY;

exports.tweetv2 = functions.pubsub.schedule("0 */2 * * *").onRun(async () => {
  const files = await db.getFolderFiles("videos");
  const listVideosName = getVideosName(files);

  const videosToUpload = await storage.getValidVideo(db, listVideosName);

  try {
    console.log("uploading", videosToUpload.fileName);
    const mediaId = await client.uploadMedia(
      videosToUpload.buffer,
      videosToUpload.type
    );
    await client.tweetMedia("", mediaId);
    console.log(`${videosToUpload.fileName} tweeted ✅`);
    await db.updateStatus(videosToUpload.fileName, "finished");
  } catch (error) {
    console.log("from catch", error);
    await db.updateStatus(videosToUpload.fileName, `error: ${error}`);
  }
});

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
