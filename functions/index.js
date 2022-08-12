const functions = require("firebase-functions");
const Twitter = require("./services/twitter");
const Storage = require("./services/storage");
const { listToMap, randomize } = require("./util/common");

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

const storage = new Storage("gs://twitter-absurd-humor.appspot.com/");

exports.helloWorld = functions.https.onRequest(async (request, response) => {
  // const client = new Twitter();
  const result = await storage.getCsvFiles();
  const filesMap = listToMap(result);
  const randomIndex = randomize(filesMap.size);
  const fileName = filesMap.get(randomIndex);

  // const files = await storage.bucket().getFiles();
  // files[0].map(async (file) => {
  //   const mediaType = file.metadata.contentType;
  //   const downloadedFile = await file.download();
  //   const mediaId = await client.uploadMedia(downloadedFile[0], mediaType);
  //   console.log("final media id", mediaId);
  //   console.log("tweeting media");
  //   await client.tweetMedia("capek coy ginian doang", mediaId);
  // });
  response.send("Hello world");
});
