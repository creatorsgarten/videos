import { GoogleGenerativeAI } from '@google/generative-ai'
import * as csv from 'csv/sync'
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import subtitle from 'subtitle'
import yargs from 'yargs'
import { Video } from '../Video'

const argv = await yargs(process.argv.slice(2))
  .strict()
  .help()
  .option('video', {
    describe: 'Path to the markdown file',
    type: 'string',
    demandOption: true,
  })
  .parse()

const filePath = argv.video
if (!filePath) {
  throw new Error('Path is required')
}

const event = path.basename(path.dirname(filePath))
const slug = path.basename(filePath, '.md')
const videos = await Video.findAll()
const video = videos.find((v) => v.event === event && v.slug === slug)
if (!video) {
  throw new Error('Video not found')
}

// Check that metadata exists
if (!video.data.chapters || !video.data.description) {
  throw new Error(
    'Video metadata is incomplete. Please generate chapters and description first using generate-metadata.',
  )
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({
  model: 'gemini-3-pro-preview',
})

const videoLanguage = video.videoLanguage || 'th'
const subtitlePath =
  videoLanguage === 'en' ? video.englishSubtitlePath : video.thaiSubtitlePath
if (!subtitlePath) {
  throw new Error(
    'Video does not have a subtitle corresponding to the video language',
  )
}

function vttToCsv(vtt: string): string {
  const parsed = subtitle.parseSync(vtt)
  const cues = parsed.filter((x) => x.type === 'cue').map((x) => x.data)
  const lines: string[][] = []
  for (const cue of cues) {
    const start = cue.start / 1000
    const text = cue.text
    lines.push([formatCsvTime(start), text])
  }
  return csv.stringify(lines)
}

function formatCsvTime(t: number) {
  const h = Math.floor(t / 3600).toString()
  const m = Math.floor((t % 3600) / 60)
    .toString()
    .padStart(2, '0')
  const s = Math.floor(t % 60)
    .toString()
    .padStart(2, '0')
  return `${h}:${m}:${s}`.replace(/^0:/, '')
}

function getVideoDurationInSeconds(vtt: string): number {
  const parsed = subtitle.parseSync(vtt)
  const cues = parsed.filter((x) => x.type === 'cue').map((x) => x.data)
  if (cues.length === 0) {
    return 0
  }
  const lastCue = cues[cues.length - 1]
  return lastCue.end / 1000
}

function getPointsRange(durationSeconds: number): [number, number] {
  const durationMinutes = durationSeconds / 60
  if (durationMinutes < 10) {
    return [10, 20]
  } else if (durationMinutes < 20) {
    return [20, 40]
  } else if (durationMinutes < 30) {
    return [40, 80]
  } else if (durationMinutes < 60) {
    return [50, 100]
  } else {
    return [50, 150]
  }
}

const subtitleContent = fs.readFileSync(subtitlePath, 'utf-8')
const transcript = vttToCsv(subtitleContent)
const durationSeconds = getVideoDurationInSeconds(subtitleContent)
const [minPoints, maxPoints] = getPointsRange(durationSeconds)

// Format chapters for the prompt
const chaptersText = Object.entries(video.data.chapters)
  .map(([time, title]) => {
    const titleText = typeof title === 'string' ? title : title.th
    return `${time}: ${titleText}`
  })
  .join('\n')

const videoMetadata = {
  title: video.data.title,
  speaker: video.data.speaker,
  event: video.event,
  description: video.data.description,
}

const summaryPrompt = `คุณจะได้รับข้อมูลวิดีโอ transcript และคำอธิบาย description ของวิดีโอ งานของคุณคือการสรุปประเด็นสำคัญที่สุดหรือเนื้อหาหลักที่เกี่ยวข้องจากบันทึกเสียง แบ่งเป็นข้อๆ อ่านง่ายและน่าสนใจ

ข้อมูลวิดีโอ (Video Metadata):
<video_metadata>
${JSON.stringify(videoMetadata)}
</video_metadata>

คำอธิบาย (Description):
<description>
${video.data.description}
</description>

บันทึกเสียง (Transcript):
<transcript>
${transcript}
</transcript>

บท (Chapters):
<chapters>
${chaptersText}
</chapters>

รูปแบบผลลัพธ์ที่ต้องการ:
<summary>
สรุปเซสชั่น "[ชื่อวิดีโอ]" โดย [ชื่อวิทยากร] จากงาน [ชื่องาน] (ลิงก์คลิปเต็มในคอมเมนต์)

tl;dr: [สรุปสั้นๆ ใน 1-2 ประโยค]

⏺ I. [หัวข้อ]
1. [ประเด็น]
2. [ประเด็น]
...

⏺ II. [หัวข้อ]
3. [ประเด็น]
4. [ประเด็น]
...
</summary>

ขอให้คุณทำตามคำแนะนำต่อไปนี้:

1. สรุปประเด็นสำคัญต่างๆ เป็นข้อๆ ให้หน่อย ขอสัก ${minPoints}-${maxPoints} ข้อ (เขียนตัวเลขกำกับแต่ละข้อด้วย)
2. ขอแบบอ่านง่ายๆ ให้คนที่ไม่ได้มีความรู้เรื่องพวกนี้มาก่อนสามารถเข้าใจได้
3. ช่วยยกตัวอย่างสำหรับบางประเด็นที่เป็นนามธรรม เพื่อให้คนอ่านสามารถเห็นภาพได้ชัดเจนมากขึ้นด้วย
4. ขอแบบอ่านสนุกๆ
5. ช่วยแบ่งเป็น section ให้ด้วย หัวข้อละประเด็น โดยตั้งชื่อหัวข้อเป็น key takeaway หรือประเด็นสำคัญที่น่าสนใจของแต่ละ section นั้นๆ สั้นๆ
6. ห้ามใช้ Markdown (ห้ามทำตัวหนาด้วย ** หรือ __)
7. แต่ละประเด็นควรเป็นประโยคสั้นๆ กระชับได้ใจความ
8. ไม่ต้องให้แต่ละข้อยาวเท่ากันก็ได้ ยาวบ้าง สั้นบ้าง จะได้มีวาไรตี้

นำเสนอผลลัพธ์ของคุณด้วยการครอบคลุมในแท็ก <summary>...</summary>
`

async function runPrompt(text: string) {
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text }] }],
  })
  console.log('Usage:', result.response.usageMetadata)
  return result.response.text()
}

console.log('Generating summary…')
const summaryResult = await runPrompt(summaryPrompt)
console.log(summaryResult)
