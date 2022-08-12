const { initializeApp } = require("firebase-admin/app");
const { getStorage } = require("firebase-admin/storage");

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
    return files;
  }
}

module.exports = Storage;
