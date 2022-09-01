const twitter = require("twitter");
const { convertBuffer } = require("../util/common");
require("dotenv").config();

class Twitter {
  constructor() {
    this.client = new twitter({
      consumer_key: process.env.TWITTER_CONSUMER_KEY,
      consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
      access_token_key: process.env.TWITTER_ACCESS_TOKEN,
      access_token_secret: process.env.TWITTER_ACCESS_SECRET,
    });
    this.chunkNumber = 0;
    this.totalByte = 0;
  }

  async uploadMedia(buffer, mediaType) {
    const fileLength = buffer.byteLength;
    const mediaIdTemp = await this.initMediaUpload(mediaType, fileLength);

    const mediaData = convertBuffer(buffer, 1024 * 1024 * 2);

    return new Promise((resolve) => {
      mediaData.on("data", async (chunk) => {
        mediaData.pause();

        await this.client.post("media/upload", {
          command: "APPEND",
          media_id: mediaIdTemp,
          media: chunk,
          segment_index: this.chunkNumber,
        });

        console.log(`uploaded chunk ${this.chunkNumber}`);
        this.chunkNumber++;
        mediaData.resume();
      });

      mediaData.on("end", async () => {
        console.log("upload finish");
        resolve(await this.finalizeUpload(mediaIdTemp));
      });
    });
  }

  async initMediaUpload(mediaType, fileLength) {
    return new Promise((resolve, reject) => {
      this.client.post(
        "media/upload",
        {
          command: "INIT",
          total_bytes: fileLength,
          media_type: mediaType,
          media_category: "tweet_video",
        },
        (error, media, _) => {
          if (error) {
            reject(error);
          } else {
            resolve(media.media_id_string);
          }
        }
      );
    });
  }

  appendFileChunk(mediaIdTemp, chunk, chunkNumber, cb) {
    this.client.post(
      "media/upload",
      {
        command: "APPEND",
        media_id: mediaIdTemp,
        media: chunk,
        segment_index: chunkNumber,
      },
      cb
    );
  }

  async finalizeUpload(mediaIdStr) {
    return new Promise((resolve, reject) => {
      this.client.post(
        "media/upload",
        {
          command: "FINALIZE",
          media_id: mediaIdStr,
        },
        async (error) => {
          if (error) {
            reject(error);
          } else {
            let mediaStatus = await this.getMediaStatus(mediaIdStr);

            while (mediaStatus !== "succeeded" || mediaStatus !== "failed") {
              mediaStatus = await this.getMediaStatus(mediaIdStr);
              if (mediaStatus === "succeeded") {
                resolve(mediaIdStr);
                break;
              }
              if (mediaStatus === "failed") {
                reject(new Error("failed"));
                break;
              }
            }
          }
        }
      );
    });
  }

  async getMediaStatus(mediaIdStr) {
    const response = await this.client.get("media/upload", {
      command: "STATUS",
      media_id: mediaIdStr,
    });
    const state = response.processing_info.state;
    if (state === "failed") {
      console.log(`error: ${response.processing_info.error}`);
      throw new Error(response.processing_info.error.message);
    }
    await new Promise((resolve) => setTimeout(resolve, 3000));
    return state;
  }

  async tweetText(text) {
    try {
      await this.client.post("statuses/update", {
        status: text,
      });
    } catch (error) {
      console.error(error);
    }
  }

  async tweetMedia(text, mediaId) {
    try {
      await this.client.post("statuses/update", {
        status: text,
        media_ids: mediaId,
      });
    } catch (error) {
      console.error(error);
    }
  }
}

module.exports = Twitter;
