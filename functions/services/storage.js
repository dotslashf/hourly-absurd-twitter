const { initializeApp } = require("firebase-admin/app");
const { getStorage } = require("firebase-admin/storage");

class Storage {
  constructor() {
    initializeApp({
      storageBucket: "gs://twitter-absurd-humor.appspot.com/",
    });
  }
}
