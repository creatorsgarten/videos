import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import subtitle from 'subtitle'
import yargs from 'yargs'
import { Video } from '../Video'
import { serializeVtt } from '../serializeVtt'

interface TranscriptionData {
  languageCode: string
  languageProbability: number
  text: string
  words: Array<{
    text: string
    start?: number
    end?: number
    type: string
    speakerId?: string
    logprob: number
  }>
}

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
const jsonFile = path.join(tempDir, `${event}-${slug}-transcription.json`)
const vttFile = path.join(tempDir, `${event}-${slug}.vtt`)

// Download audio using yt-dlp (skip if exists)
if (!fs.existsSync(audioFile)) {
  console.log(`Downloading audio from YouTube video ${video.data.youtube}...`)
  execSync(
    `yt-dlp -f bestaudio[ext=m4a]/bestaudio -x --audio-format mp3 -o "${audioFile}" "https://www.youtube.com/watch?v=${video.data.youtube}"`,
    { stdio: 'inherit' },
  )
} else {
  console.log(`Audio file already exists: ${audioFile}`)
}

// Transcribe using ElevenLabs (skip if exists)
let transcription: TranscriptionData
if (!fs.existsSync(jsonFile)) {
  console.log('Transcribing audio...')
  const elevenlabs = new ElevenLabsClient({
    apiKey: process.env.ELEVENLABS_API_KEY,
  })

  const audioBlob = new Blob([fs.readFileSync(audioFile)], {
    type: 'audio/mp3',
  })

  transcription = await elevenlabs.speechToText.convert({
    file: audioBlob,
    modelId: 'scribe_v2',
    tagAudioEvents: true,
    diarize: true,
  })

  // Save transcription result
  console.log('Saving transcription result...')
  fs.writeFileSync(jsonFile, JSON.stringify(transcription, null, 2))
  console.log(`Transcription saved to ${jsonFile}`)
} else {
  console.log(`Transcription JSON already exists: ${jsonFile}`)
  transcription = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'))
}

// Convert to WebVTT
console.log('Converting to WebVTT...')
const cues = generateWebVTTCues(transcription)
const webvttContent = serializeVtt(cues)
fs.writeFileSync(vttFile, webvttContent)
console.log(`WebVTT saved to ${vttFile}`)

function generateWebVTTCues(data: TranscriptionData): subtitle.Cue[] {
  // Filter words/spacing/audio_events with timing info
  const tokens = data.words.filter(
    (word) => typeof word.start === 'number' && typeof word.end === 'number',
  )

  if (tokens.length === 0) {
    return []
  }

  // Group words into cues (max 63 characters per cue or on significant pauses)
  // Audio events should be on their own line
  // Line breaks should only happen on spacing tokens
  const cues: subtitle.Cue[] = []
  let currentCue: {
    start: number
    end: number
    tokens: typeof tokens
    lastSpacingIndex: number
  } | null = null

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]

    // Audio events should always be on their own line
    if (token.type === 'audio_event') {
      // Finish current cue if it has tokens
      if (currentCue && currentCue.tokens.length > 0) {
        cues.push({
          start: currentCue.start * 1000,
          end: currentCue.end * 1000,
          text: currentCue.tokens.map((t) => t.text).join(''),
        })
        currentCue = null
      }
      // Add audio event as its own cue
      cues.push({
        start: token.start! * 1000,
        end: token.end! * 1000,
        text: token.text,
      })
      continue
    }

    // Initialize cue if needed
    if (!currentCue) {
      currentCue = {
        start: token.start!,
        end: token.end!,
        tokens: [token],
        lastSpacingIndex: token.type === 'spacing' ? 0 : -1,
      }
      continue
    }

    const prevToken = tokens[i - 1]
    const pause = token.start! - prevToken.end!
    const currentText = currentCue.tokens.map((t) => t.text).join('')
    const wouldBeText = currentText + token.text
    const charCount = wouldBeText.length

    // Start a new cue if pause > 0.5 seconds
    if (pause > 0.5) {
      cues.push({
        start: currentCue.start * 1000,
        end: currentCue.end * 1000,
        text: currentText,
      })
      currentCue = {
        start: token.start!,
        end: token.end!,
        tokens: [token],
        lastSpacingIndex: token.type === 'spacing' ? 0 : -1,
      }
    } else if (charCount > 63 && currentCue.lastSpacingIndex >= 0) {
      // Only break at spacing if we exceed 63 chars, never break in the middle of words
      const tokensForFirstCue = currentCue.tokens.slice(0, currentCue.lastSpacingIndex + 1)
      const tokensForSecondCue = currentCue.tokens.slice(currentCue.lastSpacingIndex + 1)

      // Add first cue
      cues.push({
        start: currentCue.start * 1000,
        end: tokensForFirstCue[tokensForFirstCue.length - 1].end! * 1000,
        text: tokensForFirstCue.map((t) => t.text).join(''),
      })

      // Start new cue with remaining tokens + current token
      const newTokens = tokensForSecondCue.length > 0
        ? [...tokensForSecondCue, token]
        : [token]

      currentCue = {
        start: newTokens[0].start!,
        end: token.end!,
        tokens: newTokens,
        lastSpacingIndex: -1,
      }

      // Find the spacing in the new cue
      for (let j = 0; j < currentCue.tokens.length; j++) {
        if (currentCue.tokens[j].type === 'spacing') {
          currentCue.lastSpacingIndex = j
        }
      }
    } else {
      currentCue.end = token.end!
      currentCue.tokens.push(token)

      // Track spacing tokens
      if (token.type === 'spacing') {
        currentCue.lastSpacingIndex = currentCue.tokens.length - 1
      }
    }
  }

  // Add the last cue
  if (currentCue && currentCue.tokens.length > 0) {
    cues.push({
      start: currentCue.start * 1000,
      end: currentCue.end * 1000,
      text: currentCue.tokens.map((t) => t.text).join(''),
    })
  }

  return cues
}
