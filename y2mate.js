import fetch from "node-fetch"

export function post(url, formdata) {
  return fetch(url, {
    method: "POST",
    headers: {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.9",
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
    body: new URLSearchParams(Object.entries(formdata)),
  })
}
export const ytIdRegex =
  /(?:http(?:s|):\/\/|)(?:(?:www\.|)?youtube(?:\-nocookie|)\.com\/(?:shorts\/)?(?:watch\?.*(?:|\&)v=|embed\/|v\/)?|youtu\.be\/)([-_0-9A-Za-z]{11})/

export async function queryYTVideo(url) {
  if (!ytIdRegex.test(url)) throw "Invalid URL"
  let ytId = ytIdRegex.exec(url)
  url = "https://youtu.be/" + ytId[1]
  let res = await post(`https://www.y2mate.com/mates/analyzeV2/ajax`, {
    k_query: url,
    k_page: "home",
    hl: "en",
    q_auto: 0,
  })
  let json = await res.json()
  return json
}

/**
 * Download YouTube Video via y2mate
 * @param {String} url YouTube Video URL
 * @param {String} quality (avaiable: `144p`, `240p`, `360p`, `480p`, `720p`, `1080p`, `1440p`, `2160p`)
 * @param {String} type (avaiable: `mp3`, `mp4`)
 */
export async function yt(url, quality, type) {
  let result = await queryYTVideo(url)
  let info = Object.values(result.links[type]).find(
    (value) => value.q == quality
  )
  if (!info) throw new RangeError("cannot find quality " + quality)
  let filesize = info.size
  let res = await post(`https://www.y2mate.com/mates/convertV2/index`, {
    vid: result.vid,
    k: info.k,
  })
  let json = await res.json()
  //console.log(json2)
  let KB = parseFloat(filesize) * (1000 * /MB$/.test(filesize))
  return {
    dl_link: json.dlink,
    title: json.title,
    filesizeF: filesize,
    filesize: KB,
  }
}

/**
 * Download YouTube Video as Audio via y2mate
 * @param {String} url YouTube Video URL
 */
export function yta(url) {
  return yt(url, "128kbps", "mp3")
}
/**
 * Download YouTube Video as Video via y2mate
 * @param {String} url YouTube Video URL
 */
export function ytv(url) {
  return yt(url, "auto", "mp4")
}
