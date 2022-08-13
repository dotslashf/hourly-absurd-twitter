const functions = require("firebase-functions");
const Twitter = require("./services/twitter");
const Storage = require("./services/storage");
const { listToMap, randomize, updateArrayStatus } = require("./util/common");

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

const storage = new Storage("gs://twitter-absurd-humor.appspot.com/");

exports.helloWorld = functions.https.onRequest(async (_, response) => {
  const client = new Twitter();

  const result = await storage.getCsvFiles();
  const filesMap = listToMap(result);
  const randomIndex = randomize(filesMap.size);
  const fileName = filesMap.get(randomIndex);
  // const video = await storage.getVideoFile(fileName);
  updateArrayStatus(result, fileName);
  console.log(fileName, result, filesMap);
  storage.updateCsvFile(result);

  // const mediaId = await client.uploadMedia(video.buffer, video.type);
  // await client.tweetMedia("capek coy ginian doang", mediaId);

  // response.send(`${fileName}, ${randomIndex}, ${filesMap.size}`);
  return response.send("Hello from Firebase!");
});
