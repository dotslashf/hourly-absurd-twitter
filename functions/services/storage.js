const { initializeApp } = require("firebase-admin/app");
const { getStorage } = require("firebase-admin/storage");
const ObjectsToCsv = require("objects-to-csv");

class Storage {
  constructor(bucket) {
    initializeApp({
      storageBucket: bucket,
    });
    this.storage = getStorage();
  }

  async getCsvFiles() {
    const csvFile = this.storage.bucket().file("list.csv");
    const buffer = (await csvFile.download())[0];
    const files = buffer.toString().split("\n");
    files.splice(0, 1);
    files.splice(files.length - 1, 1);
    return files.map((file) => {
      return { id: file.split(",")[0], status: file.split(",")[1] };
    });
  }

  async getVideoFile(fileName) {
    const file = this.storage.bucket().file(`videos/${fileName}`);
    return {
      buffer: (await file.download())[0],
      type: file.metadata.contentType,
    };
  }

  async updateCsvFile(array) {
    const csvFile = this.storage.bucket().file("list.csv");
    const csv = new ObjectsToCsv(array);
    await csvFile.save(Buffer.from(await csv.toString()), {
      metadata: {
        contentType: "text/csv",
      },
    });
  }
}

module.exports = Storage;
