const functions = require("firebase-functions");
const Twitter = require("./services/twitter");
const Storage = require("./services/storage");
const {
  listToMap,
  randomize,
  updateArrayStatus,
  isItSubmissionTime,
} = require("./util/common");

const storage = new Storage("gs://twitter-absurd-humor.appspot.com/");
const client = new Twitter();

exports.tweet = functions.pubsub.schedule("0 * * * *").onRun(async () => {
  const path = {
    folderVideos: "videos/",
    csvFileName: "list.csv",
  };
  let result = [];
  const isItSubmissionHour = isItSubmissionTime();

  if (isItSubmissionHour) {
    path.folderVideos = "videos-submission/";
    path.csvFileName = "list-submission.csv";
    console.log("Submission time!", new Date().getHours());
  }

  result = await storage.getCsvFiles(path.csvFileName);
  let filesMap = listToMap(result);

  if (filesMap.size === 0 && isItSubmissionHour) {
    path.folderVideos = "videos/";
    path.csvFileName = "list.csv";
    result = await storage.getCsvFiles(path.csvFileName);
    filesMap = listToMap(result);
  }

  const randomIndex = randomize(filesMap.size);
  const fileName = filesMap.get(randomIndex);
  console.log(`selected video ${path.folderVideos}${fileName}`);

  const video = await storage.getVideoFile(`${path.folderVideos}${fileName}`);
  const mediaId = await client.uploadMedia(video.buffer, video.type);
  await client.tweetMedia("", mediaId);

  updateArrayStatus(result, fileName);
  storage.updateCsvFile(result, path.csvFileName);
  console.log(`tweet ✅`);
});
