const functions = require("firebase-functions");
const Twitter = require("./services/twitter");
const Storage = require("./services/storage");
const {
  listToMap,
  randomize,
  updateArrayStatus,
} = require("./util/common");

const storage = new Storage("gs://twitter-absurd-humor.appspot.com/");
const client = new Twitter({});

exports.tweet = functions.pubsub.schedule("0 */4 * * *").onRun(async () => {
  const path = {
    folderVideos: "videos/",
    csvFileName: "list.csv",
  };
  const result = await storage.getCsvFiles(path.csvFileName);
  const filesMap = listToMap(result);

  const randomIndex = randomize(filesMap.size);
  const fileName = filesMap.get(randomIndex);
  console.log(`selected ${path.folderVideos}${fileName}`);

  try {
    const video = await storage.getVideoFile(`${path.folderVideos}${fileName}`);
    const mediaId = await client.uploadMedia(video.buffer, video.type);
    await client.tweetMedia("", mediaId);

    updateArrayStatus(result, fileName);
    console.log(`tweeted ✅`);
  } catch (error) {
    updateArrayStatus(result, fileName, "error");
    console.log("from catch", error);
  }
  storage.updateCsvFile(result, path.csvFileName);
});
