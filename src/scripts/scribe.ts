import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
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

// Create temporary directory for transcriptions
const tempDir = '.data/transcription'
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true })
}

const audioFile = path.join(tempDir, `${event}-${slug}.mp3`)
const outputFile = path.join(tempDir, `${event}-${slug}-transcription.json`)

// Download audio using yt-dlp
console.log(`Downloading audio from YouTube video ${video.data.youtube}...`)
execSync(
  `yt-dlp -f bestaudio[ext=m4a]/bestaudio -x --audio-format mp3 -o "${audioFile}" "https://www.youtube.com/watch?v=${video.data.youtube}"`,
  { stdio: 'inherit' },
)

// Transcribe using ElevenLabs
console.log('Transcribing audio...')
const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
})

const audioBlob = new Blob([fs.readFileSync(audioFile)], {
  type: 'audio/mp3',
})

const transcription = await elevenlabs.speechToText.convert({
  file: audioBlob,
  modelId: 'scribe_v2',
  tagAudioEvents: true,
  diarize: true,
})

// Save transcription result
console.log('Saving transcription result...')
fs.writeFileSync(outputFile, JSON.stringify(transcription, null, 2))
console.log(`Transcription saved to ${outputFile}`)
