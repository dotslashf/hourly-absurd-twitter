const { convertBuffer } = require("./common");
const fs = require("fs");

const video = fs.readFileSync(
  "../../videos/f897560b-0130-405a-ba1c-7be0b7650601.mp4"
);

const media = convertBuffer(video, 1024 * 1024 * 2);
console.log(`media size ${video.byteLength}`);
let chunkNumber = 0;
media.on("data", (chunk) => {
  media.pause();
  console.log(`uploaded chunk ${chunkNumber}, chunk size ${chunk.byteLength}`);
  chunkNumber++;
  media.resume();
});
