const functions = require("firebase-functions");
const Twitter = require("./services/twitter");
const Storage = require("./services/storage");
const { listToMap, randomize, updateArrayStatus } = require("./util/common");

const storage = new Storage("gs://twitter-absurd-humor.appspot.com/");

exports.tweet = functions.pubsub.schedule("0 * * * *").onRun(async () => {
  const client = new Twitter();

  const result = await storage.getCsvFiles("list.csv");
  const filesMap = listToMap(result);
  const randomIndex = randomize(filesMap.size);
  const fileName = filesMap.get(randomIndex);
  console.log(`selected video ${fileName}`);
  const video = await storage.getVideoFile(fileName);

  const mediaId = await client.uploadMedia(video.buffer, video.type);
  await client.tweetMedia("", mediaId);
  updateArrayStatus(result, fileName);
  storage.updateCsvFile(result, "list.csv");
  console.log("tweeted");
});
