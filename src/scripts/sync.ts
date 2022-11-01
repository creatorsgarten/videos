import yargs from 'yargs'
import { authClient, getToken } from '../GoogleAuth'
import { google, youtube_v3 } from 'googleapis'
import { cloneDeep, isEqual } from 'lodash-es'
import { Video } from '../Video'
import { Event } from '../Event'
import { getState, setState } from '../StateStorage'
import fs from 'fs'
import crypto from 'crypto'
import { diff } from 'jest-diff'
import chalk from 'chalk'

const youtube = google.youtube('v3')

async function getVideoDescription(video: Video): Promise<string> {
  const event = await Event.findById(video.event)
  return [
    video.data.description.trim(),
    '',
    '',
    '--------------------------------------------',
    `Event: ${event.name}`,
    event.url,
    '',
    'Website:',
    'https://creatorsgarten.org',
    '',
    'Facebook:',
    'https://facebook.com/creatorsgarten',
    '',
    'Please consider supporting us by subscribing to the channel, and follow upcoming events via our Facebook pages.',
    '',
    'For reuse of this video under a more permissive license please get in touch with us. The speakers retain the copyright for their performances.',
    'mail@creatorsgarten.org'
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

interface UpdateJob {
  id: string
  title: string
  description: string
  published?: boolean
  video: Video
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
    video,
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
  const oldState = (await getState(stateKey)) || {}
  const newState = cloneDeep(oldState)
  const updateTasks: (() => Promise<any>)[] = []

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
  if (!isEqual(oldState.spec, newState.spec)) {
    updateTasks.push(() => doUpdateVideo(job, spec))
  }

  if (fs.existsSync(job.video.imageFilePath)) {
    const hash = crypto
      .createHash('sha256')
      .update(fs.readFileSync(job.video.imageFilePath))
      .digest('hex')
    newState.thumbnail ??= {}
    newState.thumbnail.hash = hash
    if (oldState.thumbnail?.hash !== hash) {
      updateTasks.push(() => doUpdateThumbnail(job))
    }
  }

  if (updateTasks.length === 0) {
    console.log(`Video ${job.id} is up to date`)
    return
  }
  if (dryRun) {
    console.log('Would update video', job.id)
    console.log(
      diff(oldState, newState, {
        aAnnotation: 'Before',
        bAnnotation: 'After',
        aColor: chalk.red,
        bColor: chalk.green,
      }),
    )
    return
  }
  for (const updateTask of updateTasks) {
    await updateTask()
  }
  await setState(stateKey, newState)
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

async function doUpdateThumbnail(job: UpdateJob) {
  const youtubeId = job.id

  const updateParams: youtube_v3.Params$Resource$Thumbnails$Set = {
    videoId: youtubeId,
    requestBody: {},
    media: {
      mimeType: 'image/jpeg',
      body: fs.createReadStream(job.video.imageFilePath),
    },
  }
  const result = await youtube.thumbnails.set(updateParams)
  console.log(`Updated thumbnail for video ${youtubeId}`)
  console.log(result.data)
}

if (argv.confirm) {
  await getToken()
  google.options({ auth: authClient })
  for (const [i, job] of jobs.entries()) {
    console.log(`Processing job ${i + 1} of ${jobs.length}`)
    await updateVideo(job, { dryRun: false })
  }
} else {
  for (const [i, job] of jobs.entries()) {
    console.log(`Processing job ${i + 1} of ${jobs.length}`)
    await updateVideo(job, { dryRun: true })
  }
  console.log('Run with --confirm to update the videos')
}
