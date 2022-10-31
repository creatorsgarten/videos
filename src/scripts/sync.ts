import yargs from 'yargs'
import fs from 'fs'
import { authClient, getToken } from '../GoogleAuth'
import { dump, load } from 'js-yaml'
import { google, youtube_v3 } from 'googleapis'
import { isEqual } from 'lodash-es'
import { Video } from '../Video'
import { Event } from '../Event'
const youtube = google.youtube('v3')

async function getVideoDescription(video: Video): Promise<string> {
  const event = await Event.findById(video.event)
  return [
    video.data.description.trim(),
    '',
    'Event: ' + event.name,
    event.url,
  ].join('\n')
}

const argv = await yargs(process.argv.slice(2))
  .options({
    confirm: {
      type: 'boolean',
      default: false,
      description: 'Confirm that you want to update the videos',
      alias: 'f',
    },
  })
  .strict()
  .help()
  .parse()

// Load state file from youtube-sync.yml
const state = load(fs.readFileSync('youtube-sync.yml', 'utf8')) as Record<
  string,
  any
>

interface UpdateJob {
  id: string
  title: string
  description: string
  published?: boolean
}

const jobs: UpdateJob[] = []

for (const video of await Video.findAll()) {
  const { data } = video
  if (!data.managed) continue
  jobs.push({
    title: (data.title + ' by ' + data.speaker).slice(0, 100),
    description: (await getVideoDescription(video)).replace(/[<>]/g, ''),
    id: data.youtube,
    published: data.published,
  })
}

console.log('Number of jobs:', jobs.length)

interface VideoSpec {
  snippet: youtube_v3.Schema$VideoSnippet
  status: youtube_v3.Schema$VideoStatus
}

async function updateVideo(
  job: UpdateJob,
  { dryRun = true }: { dryRun?: boolean } = {},
) {
  const stateKey = `video_${job.id}`
  const oldState = state[stateKey] || {}
  const newState = JSON.parse(JSON.stringify(oldState))
  const spec: VideoSpec = {
    snippet: {
      title: job.title,
      description: job.description,
    },
    status: {
      embeddable: true,
      selfDeclaredMadeForKids: false,
    },
  }
  if (job.published === true) {
    spec.status.privacyStatus = 'public'
  } else if (job.published === false) {
    spec.status.privacyStatus = 'unlisted'
  }
  newState.spec = spec
  if (isEqual(oldState, newState)) {
    console.log(`Video ${job.id} is up to date`)
    return
  }
  if (dryRun) {
    console.log('Would update video', job.id, newState)
    return
  }
  await doUpdateVideo(job, spec)
  state[stateKey] = newState
  fs.writeFileSync('youtube-sync.yml', dump(state))
}

async function doUpdateVideo(job: UpdateJob, spec: VideoSpec) {
  const youtubeId = job.id

  // Update the video title and description to match.
  // First, we need to get the video snippet data.
  const foundVideos = await youtube.videos.list({
    part: ['snippet', 'status'],
    id: [youtubeId],
  })
  const video = foundVideos.data.items?.[0]
  if (!video) {
    console.error(`Video ${youtubeId} not found`)
    return false
  }

  const { snippet, status } = video
  const newSnippet: youtube_v3.Schema$VideoSnippet = {
    ...snippet,
    ...spec.snippet,
  }
  const newStatus: youtube_v3.Schema$VideoStatus = {
    ...status,
    ...spec.status,
  }
  if (isEqual(snippet, newSnippet) && isEqual(status, newStatus)) {
    console.log(`Video ${youtubeId} is up to date`)
    return false
  }

  const updateParams: youtube_v3.Params$Resource$Videos$Update = {
    part: ['snippet', 'status'],
    requestBody: { id: youtubeId, snippet: newSnippet, status: newStatus },
  }
  const result = await youtube.videos.update(updateParams)
  console.log(`Updated video ${youtubeId}`)
  console.log(result.data)
}

if (argv.confirm) {
  await getToken()
  google.options({ auth: authClient })
  for (const [i, job] of jobs.entries()) {
    console.log(`Processing job ${i + 1} of ${jobs.length}`)
    await updateVideo(job)
  }
} else {
  for (const [i, job] of jobs.entries()) {
    console.log(`Processing job ${i + 1} of ${jobs.length}`)
    await updateVideo(job, { dryRun: true })
  }
  console.log('Run with --confirm to update the videos')
}
