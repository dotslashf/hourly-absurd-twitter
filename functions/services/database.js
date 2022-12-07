const { database } = require("firebase-admin");
class Database {
  constructor() {
    this.database = database();
    this.files = [];
  }

  async getFolderFiles(folderName) {
    const ref = this.database.ref(folderName);
    const query = ref.orderByChild("status").equalTo("waiting");
    const snapshot = await query.once("value");
    const data = snapshot.val();
    return data;
  }

  async updateStatus(fileName, status) {
    const ref = this.database.ref(`videos/${fileName}`);
    await ref.update({ status, updatedAt: Date.now() });
  }
}

module.exports = Database;
