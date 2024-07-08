import got from "got"
import ytdl from "ytdl-core"
// import fs, { exists } from "fs"
import {
  createWriteStream,
  readFileSync,
  existsSync,
  mkdirSync,
  unlinkSync,
} from "fs"
import path from "path"
import yts from "yt-search"
import { spawn } from "child_process"
import { ytIdRegex } from "./y2mate.js"

const name = process.argv[2]
const LIST_FILE = "list" + (name ? "_" + name : "")
const FOLDER_OUTPUT = "./Music" + (name ? "_" + name : "")
const TEMP = path.resolve("./temp")

name && console.log('Using:', name)
if (!existsSync(TEMP)) mkdirSync(TEMP)
let list = readFileSync(LIST_FILE, "utf-8").split("\n")

let useIndex = false
let downloaded = []
async function run() {
  if (!existsSync(FOLDER_OUTPUT)) mkdirSync(FOLDER_OUTPUT, { recursive: true })
  for (let i in list) {
    let a = list[i]
    if (!a) continue
    if (a.startsWith("#")) continue
    let videoId
    if (!/^https:\/\//i.test(a)) {
      let result = await yts(a)
      videoId = result.videos[0].url
    }
    videoId = ytIdRegex.exec(videoId)[1]

    // let res = await yta(url).catch(console.error)
    // if (!res) continue

    const info = await ytdl.getInfo(videoId)
    console.log(a + "\n" + info.videoDetails.title, videoId)
    const temp = path.join(TEMP, videoId + ".mp3")
    const fileName = path.join(
      FOLDER_OUTPUT,
      (useIndex ? i.toString().padStart(5, "0") + " " : "") +
        info.videoDetails.title.replace(/[|/\\:*^:<>"]/g, "_") +
        ".mp3"
    )
    // console.log(info.formats)
    if (videoId in downloaded) continue
    downloaded[videoId] = info.videoDetails.title
    let format = ytdl.chooseFormat(info.formats, { quality: "highestaudio" })
    ytdl
      .downloadFromInfo(info, { format: format })
      .pipe(createWriteStream(temp))
      .on("close", () => {
        console.log("ffmpeg", "-y", "-i", temp, fileName)
        spawn("ffmpeg", ["-y", "-i", temp, fileName]).on('exit', () => {
            unlinkSync(temp)
        })
      })
  }
  console.log("Done!", downloaded)
}

run()
