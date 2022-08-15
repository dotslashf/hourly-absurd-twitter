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
  let result = [];
  let folderVideos = "";
  let csvFileName = "";

  if (isItSubmissionTime()) {
    csvFileName = process.env.LIST_VIDEOS_SUBMISSION;
    folderVideos = process.env.VIDEOS_SUBMISSION_FOLDER_PATH;
  } else {
    csvFileName = process.env.LIST_VIDEOS_DEFAULT;
    folderVideos = process.env.VIDEOS_FOLDER_PATH;
  }

  result = await storage.getCsvFiles(csvFileName);
  let filesMap = listToMap(result);

  if (filesMap.size === 0 && isItSubmissionTime()) {
    csvFileName = process.env.LIST_VIDEOS_DEFAULT;
    folderVideos = process.env.VIDEOS_FOLDER_PATH;
    result = await storage.getCsvFiles(csvFileName);
    filesMap = listToMap(result);
  }

  const randomIndex = randomize(filesMap.size);
  const fileName = filesMap.get(randomIndex);
  console.log(`selected video ${fileName}`);
  const video = await storage.getVideoFile(`${folderVideos}${fileName}`);

  const mediaId = await client.uploadMedia(video.buffer, video.type);
  await client.tweetMedia("", mediaId);
  updateArrayStatus(result, fileName);
  storage.updateCsvFile(result, csvFileName);
  console.log(`tweeted, isItSubmissionTime: ${isItSubmissionTime()}`);
});
