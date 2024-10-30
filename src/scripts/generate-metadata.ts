import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from '@google/generative-ai'
import * as csv from 'csv/sync'
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

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-pro-002',
  generationConfig: {
    temperature: 0.45,
    maxOutputTokens: 8192,
  },
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
  ],
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

const transcript = vttToCsv(fs.readFileSync(subtitlePath, 'utf-8'))

const chaptersPrompt = `You will be given a timed transcript of a video or audio recording. Your task is to generate chapters with timestamp information based on this transcript.

Here is the timed transcript:
<transcript>
${transcript}
</transcript>

Analyze the transcript and create meaningful chapters based on the content. Follow these guidelines:

1. Identify major topic changes or significant shifts in the conversation.
2. Create concise, descriptive titles for each chapter that summarize the main point or theme.
3. Use the timestamp of when a new topic or significant point begins as the chapter start time.
4. Aim for chapters that are neither too short (less than 30 seconds) nor too long (more than 5 minutes), unless the content warrants it.

Format your output as follows:
"[timestamp]": "[chapter title]"

For example:
"0:00": "Introduction and greetings"
"2:30": "Discussion of JavaScript projects"

Important notes:
- The first chapter must start at 0:00, regardless of the first timestamp in the transcript.
- Use quotation marks around both the timestamp and the chapter title.
- Use a colon and space after the timestamp.
- Separate each chapter entry with a new line.
- The chapter titles should be in the same language as the transcript.
- Try to summarize the key points in a 'too long; didn't read' manner. We want the viewers to get the gist of the contents just by reading the chapter titles (so they can dive into more details if they're really interested), rather forcing them to read the whole thing to get the point. For example, prefer "when conflicts arise, assume good faith" over "dealing with conflicts".
- Aim for a chapter every 45-120 seconds of transcript.
- Use ${videoLanguage === 'en' ? 'English' : 'Thai'} language.

Think through the transcript carefully, identifying key topics and transitions. Then, create your chapter list based on your analysis.

Provide your final output enclosed in <chapters> tags.`

const descriptionPrompt =
  videoLanguage === 'en'
    ? `You are tasked with crafting a description in English language based on a given talk transcript. It will be used in the description of the video recording for the meetup's session. Follow these steps carefully:

1. First, read through the entire transcript provided below:

<transcript>
${transcript}
</transcript>

2. Analyze the transcript, paying attention to:
   - The main topic or theme of the talk
   - The speaker's background or credentials (if mentioned)

3. Based on your analysis, create a concise yet informative description in English language. The description should:
   - Summarize the main topic and purpose of the talk.
   - Be engaging and encourage viewers to watch the full video. Do not give away the whole talk (we have a summary section for that already).
   - Do not be overly enthusiastic or hard sell too much, just let the reader know what the session is about
   - Avoid words that exaggerate or exclamation marks. Let the content speak for itself.
   - Be between 100-150 words in length.

4. Ensure that the description is written in fluent, natural English language, appropriate for a general audience interested in the topic.

5. Do not include timestamps or specific time references from the transcript in your description.

6. Present your final session description within <description> tags.`
    : `You are tasked with crafting a description in Thai language based on a given talk transcript. It will be used in the description of the video recording for the meetup's session. Follow these steps carefully:

1. First, read through the entire transcript provided below:

<transcript>
${transcript}
</transcript>

2. Analyze the transcript, paying attention to:
   - The main topic or theme of the talk
   - The speaker's background or credentials (if mentioned)

3. Based on your analysis, create a concise yet informative description in Thai language. The description should:
   - Summarize the main topic and purpose of the talk.
   - Be engaging and encourage viewers to watch the full video. Do not give away the whole talk (we have a summary section for that already).
   - Do not be overly enthusiastic or hard sell too much, just let the reader know what the session is about
   - Avoid words that exaggerate like สุดล้ำ, น่าทึ่ง or exclamation marks. Let the content speak for itself.
   - Be between 100-150 words in length.

4. Ensure that the description is written in fluent, natural Thai language, appropriate for a general audience interested in the topic.
   - For English words, if it is a common word, then spell it using lowercase (e.g. oscillator). If it is a proper noun, capitalize it properly (e.g. Google Chrome). If it's an API name or part of computer code, use verbatim capitalization (e.g. getElementById).
   - Usage of ๆ: Do not add a space before ๆ. Add a space after ๆ.

5. Do not include timestamps or specific time references from the transcript in your description.

6. Present your final session description within <description> tags.

Here are some examples of good description.

- "โลกไร้งาน? อนาคตที่ AI อาจเข้ามาแทนที่แรงงานมนุษย์ ฟังมุมมองเชิงเศรษฐศาสตร์จากอาจารย์ผู้เชี่ยวชาญ ถึงผลกระทบของ AI ต่อตลาดแรงงานในประเทศไทย พร้อมแนวทางรับมือและการปรับตัวเพื่อเตรียมพร้อมสำหรับอนาคต การลงทุนในทักษะ การสร้างงานใหม่ และบทบาทของรัฐบาลในการช่วยเหลือประชาชน รวมถึงการพูดคุยถึงแนวคิด UBI หรือรายได้พื้นฐานถ้วนหน้า และการสร้างสมดุลระหว่างชีวิตและการทำงาน มาร่วมหาคำตอบและเตรียมพร้อมรับมือกับโลกที่กำลังเปลี่ยนแปลงไป"
- "พบกับคุณเอ็ม อดีต UX Designer ผู้ผันตัวมาเป็น frontend developer กับประสบการณ์กว่า 3-4 ปี ในหัวข้อ "JavaScript Mental Model" ที่จะพาคุณดำดิ่งสู่โลกของ JavaScript ตั้งแต่พื้นฐานความสำคัญของภาษา ไปจนถึงแนวคิดเชิงลึกที่มักถูกมองข้าม คุณเอ็มจะอธิบายถึงความเข้าใจผิดที่พบบ่อย พร้อมยกตัวอย่างโค้ดและภาพประกอบที่เข้าใจง่าย ช่วยให้คุณเห็นภาพการทำงานของ JavaScript อย่างชัดเจน ไม่ว่าคุณจะเป็นนักพัฒนาหน้าใหม่ หรือผู้ที่ต้องการทบทวนความรู้ วิดีโอนี้จะช่วยเสริมสร้างความเข้าใจพื้นฐาน JavaScript ให้แข็งแกร่งยิ่งขึ้น เพื่อต่อยอดสู่การเขียนโค้ดอย่างมืออาชีพ"
- "อาจารย์สมทิพ วัฒนพงษ์วานิช จากคณะเศรษฐศาสตร์ จุฬาลงกรณ์มหาวิทยาลัย นำเสนอมุมมองเกี่ยวกับผลกระทบของ AI ต่อตลาดแรงงานในยุคเศรษฐกิจดิจิทัล อาจารย์อธิบายทฤษฎีทางเศรษฐศาสตร์ที่เกี่ยวข้อง วิเคราะห์สถานการณ์ตลาดแรงงานไทยในปัจจุบัน และนำเสนอความท้าทายที่ประเทศไทยกำลังเผชิญ เช่น การขาดแคลนแรงงานทักษะสูง และประชากรสูงวัย นอกจากนี้ยังยกตัวอย่างนโยบาย upskilling และ reskilling ที่ประสบความสำเร็จจากประเทศอินโดนีเซีย เพื่อเป็นแนวทางในการพัฒนาทรัพยากรมนุษย์ของไทย วิดีโอนี้เหมาะสำหรับผู้ที่สนใจเรื่องเศรษฐกิจ การศึกษา และอนาคตของตลาดแรงงานในยุค AI"
- "พบกับคุณออม นักพัฒนา framework Elysia ที่จะมาเล่าถึงเบื้องหลังการพัฒนา framework ของตัวเอง พร้อมสาธิตการใช้งานฟีเจอร์ที่น่าสนใจอย่าง end-to-end type safety ที่ช่วยแก้ปัญหาการ sync type ระหว่าง frontend และ backend คุณออมจะพาไปดูกลไกการทำงานของฟีเจอร์นี้ ตั้งแต่การใช้งาน JavaScript Proxy ไปจนถึงเทคนิคการ ‘แก๊สไลท์’ ผู้ใช้งาน ฟังเรื่องราวการพัฒนา framework และเรียนรู้แนวคิดการแก้ปัญหาเชิงวิศวกรรมที่น่าสนใจจากประสบการณ์ตรงของคุณออมได้ในวิดีโอนี้"

Remember, the goal is to create a compelling teaser that accurately represents the content of the talk and encourages viewers to watch the full video.`

async function runPrompt(text: string) {
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text }] }],
  })
  console.log('Usage:', result.response.usageMetadata)
  return result.response.text()
}

if (video.data.chapters) {
  console.log('Skipping chapters generation because it already exists')
} else {
  console.log('Generating chapters…')
  const chaptersResult = await runPrompt(chaptersPrompt)
  console.log(chaptersResult)
  console.log()
}

if (video.data.description) {
  console.log('Skipping description generation because it already exists')
} else {
  console.log('Generating description…')
  const descriptionResult = await runPrompt(descriptionPrompt)
  console.log(descriptionResult)
}
