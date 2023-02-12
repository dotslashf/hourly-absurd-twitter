const { initializeApp } = require("firebase-admin/app");
const { getStorage } = require("firebase-admin/storage");
const ObjectsToCsv = require("objects-to-csv");
const ffmpeg = require("fluent-ffmpeg");
const stream = require("stream");
const Database = require("./database");

class Storage {
  constructor() {
    initializeApp({
      storageBucket: "gs://twitter-absurd-humor.appspot.com/",
      databaseURL:
        "https://twitter-absurd-humor-default-rtdb.asia-southeast1.firebasedatabase.app/",
    });
    this.storage = getStorage();
  }

  /**
   * @param {string} fileName
   * @returns
   */
  async getCsvFiles(fileName) {
    const csvFile = this.storage.bucket().file(fileName);
    const buffer = (await csvFile.download())[0];
    const files = buffer.toString().split("\n");
    files.splice(0, 1);
    files.splice(files.length - 1, 1);
    return files.map((file) => {
      return { id: file.split(",")[0], status: file.split(",")[1] };
    });
  }

  async getVideoFile(fileName) {
    const file = this.storage.bucket().file(`videos-v2/${fileName}.mp4`);
    const buffer = (await file.download())[0];
    return {
      fileName: fileName,
      buffer: buffer,
      type: file.metadata.contentType,
      duration: await this.getVideoDuration(buffer),
    };
  }

  /**
   *
   * @param {string[]} files
   * @param {number} index
   * @param {Database} db
   * @returns {Promise<{fileName: string, buffer: Buffer, type: string, duration: number}>}
   */
  async getValidVideo(db, files, index = 0) {
    const file = files[index];
    if (file) {
      const video = await this.getVideoFile(file);
      if (video.duration <= 140) {
        return video;
      } else {
        db.updateStatus(
          file,
          `error: video duration is ${video.duration} seconds`
        );
        return this.getValidVideo(db, files, index + 1);
      }
    } else {
      return null;
    }
  }

  async getVideoDuration(buffer) {
    const readable = new stream.PassThrough();
    readable.end(buffer);

    return new Promise((resolve, reject) => {
      ffmpeg(readable).ffprobe((err, metadata) => {
        if (err) {
          reject(err);
        } else {
          resolve(metadata.format.duration);
        }
      });
    });
  }

  /**
   * @param {string[]} array
   * @param {string} fileName
   */
  async updateCsvFile(array, fileName) {
    const csvFile = this.storage.bucket().file(fileName);
    const csv = new ObjectsToCsv(array);
    await csvFile.save(Buffer.from(await csv.toString()), {
      metadata: {
        contentType: "text/csv",
      },
    });
  }
}

module.exports = Storage;
