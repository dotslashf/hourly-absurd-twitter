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
const client = new Twitter({});

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

exports.updateUsername = functions.pubsub.schedule("*/10 * * * *").onRun(async () => {
  const formatter = Intl.NumberFormat('en', { notation: 'compact' });

  const client = new Twitter({
    consumerKey: process.env.TWITTER_CONSUMER_KEY_2,
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET_2,
    accessTokenKey: process.env.TWITTER_ACCESS_TOKEN_2,
    accessTokenSecret: process.env.TWITTER_ACCESS_SECRET_2,
  });

  const { followers_count } = await client.client.get("users/show", {
    screen_name: "hourly_absurd",
  });

  await client.client.post("account/update_profile", {
    name: `👉 ${formatter.format(followers_count)} hourly absurd folls`,
  });
});
