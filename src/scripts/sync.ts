import yargs from 'yargs'
import { GoogleOfflineAccess } from 'google-offline-access'
import { google, youtube_v3 } from 'googleapis'
import { isEqual } from 'lodash-es'
import { Video } from '../Video'
import { Event } from '../Event'
import { getState, setState } from '../StateStorage'
import fs from 'fs'
import crypto from 'crypto'
import { diff } from 'jest-diff'
import chalk from 'chalk'

const googleOfflineAccess = new GoogleOfflineAccess({
  scopes: [
    'https://www.googleapis.com/auth/youtube',
    'https://www.googleapis.com/auth/youtube.force-ssl',
  ],
})
const youtube = google.youtube('v3')

async function getVideoDescription(video: Video): Promise<string> {
  const event = await Event.findById(video.event)
  return [
    ...(video.data.description
      ? [
          video.data.description.trim(),
          '',
          '',
          '--------------------------------------------',
        ]
      : []),
    `Event: ${event.name}`,
    event.url,
    ...(event.externalOrganizer
      ? [
          '',
          'Organized by: ' +
            event.externalOrganizer.name +
            (event.externalOrganizer.url
              ? `\n${event.externalOrganizer.url}`
              : ''),
          '',
          '',
          '--------------------------------------------',
          'Recorded and published by Creatorsgarten.',
        ]
      : []),
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
    'mail@creatorsgarten.org',
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

/**
 * A resource is something that can be managed.
 *
 * @template T Type of the spec.
 *  This is the data that is need to generate or update the resource.
 *  If the spec hasn't changed, we assume that the resource doesn't need to be updated.
 *  For example, a video may contains a title, description, and privacy status in its spec.
 * @template S Type of the state.
 *  This is an extra data that is not present in the resource spec
 *  but is required to manage the resource, especially when updating it.
 *  For example, when creating a caption track, we need to store its ID in the state so that we can update it later.
 */
interface Resource<T extends {} = any, S extends {} = any> {
  /**
   * The spec of the resource.
   */
  spec: T

  /**
   * A human-readable description of the resource.
   * This is used to log the status of the resource.
   */
  description: string

  /**
   * Reconcile the resource by creating or updating it.
   *
   * This method should be idempotent.
   *
   * @param oldState The old state of the resource.
   *  When first creating the resource, this will be `undefined`.
   */
  reconcile(oldState?: S): Promise<S>
}

const resources = new Map<string, Resource>()

interface YouTubeVideoSpec {
  id: string
  snippet: youtube_v3.Schema$VideoSnippet
  status: youtube_v3.Schema$VideoStatus
}

class YouTubeVideo implements Resource<YouTubeVideoSpec, {}> {
  constructor(public spec: YouTubeVideoSpec) {}
  get description() {
    return `"${this.spec.snippet.title}"`
  }
  async reconcile() {
    const youtubeId = this.spec.id

    // Update the video title and description to match.
    // First, we need to get the video snippet data.
    const foundVideos = await youtube.videos.list({
      part: ['snippet', 'status'],
      id: [youtubeId],
    })
    const video = foundVideos.data.items?.[0]
    if (!video) {
      throw new Error(`Video ${youtubeId} not found`)
    }

    const { snippet, status } = video
    const newSnippet: youtube_v3.Schema$VideoSnippet = {
      ...snippet,
      ...this.spec.snippet,
    }
    const newStatus: youtube_v3.Schema$VideoStatus = {
      ...status,
      ...this.spec.status,
    }
    if (isEqual(snippet, newSnippet) && isEqual(status, newStatus)) {
      console.log(`Video ${youtubeId} is already up to date`)
      return {}
    }
    const updateParams: youtube_v3.Params$Resource$Videos$Update = {
      part: ['snippet', 'status'],
      requestBody: { id: youtubeId, snippet: newSnippet, status: newStatus },
    }
    const result = await youtube.videos.update(updateParams)
    console.log(`Updated video ${youtubeId}`)
    console.log(result.data)
    return {}
  }
}

interface YouTubeThumbnailSpec {
  videoId: string
  filePath: string
  hash: string
}
class YouTubeThumbnail implements Resource<YouTubeThumbnailSpec, {}> {
  constructor(public spec: YouTubeThumbnailSpec) {}
  get description() {
    return this.spec.filePath
  }
  async reconcile() {
    const youtubeId = this.spec.videoId
    const updateParams: youtube_v3.Params$Resource$Thumbnails$Set = {
      videoId: youtubeId,
      requestBody: {},
      media: {
        mimeType: 'image/jpeg',
        body: fs.createReadStream(this.spec.filePath),
      },
    }
    const result = await youtube.thumbnails.set(updateParams)
    console.log(`Updated thumbnail for video ${youtubeId}`)
    console.log(result.data)

    return {}
  }
}

interface YouTubeCaptionSpec {
  videoId: string
  language: string
  name: string
  filePath: string
  hash: string
  isDraft: boolean
}
interface YouTubeCaptionState {
  id: string
}
class YouTubeCaption
  implements Resource<YouTubeCaptionSpec, YouTubeCaptionState>
{
  constructor(public spec: YouTubeCaptionSpec) {}
  get description() {
    return this.spec.filePath
  }
  async reconcile(oldState?: YouTubeCaptionState) {
    const youtubeId = this.spec.videoId
    const snippet: youtube_v3.Schema$CaptionSnippet = {
      videoId: youtubeId,
      language: this.spec.language,
      name: this.spec.name,
      isDraft: this.spec.isDraft,
    }
    if (oldState?.id) {
      const id = oldState.id
      const updateParams: youtube_v3.Params$Resource$Captions$Update = {
        part: ['snippet'],
        requestBody: { id, snippet },
        media: {
          mimeType: 'text/vtt',
          body: fs.createReadStream(this.spec.filePath),
        },
      }
      const result = await youtube.captions.update(updateParams)
      console.log(
        `Updated caption track ${id} for video ${youtubeId}`,
        result.data,
      )
      return { id }
    } else {
      const insertParams: youtube_v3.Params$Resource$Captions$Insert = {
        part: ['snippet', 'id'],
        requestBody: { snippet },
        media: {
          mimeType: 'text/vtt',
          body: fs.createReadStream(this.spec.filePath),
        },
      }
      const result = await youtube.captions.insert(insertParams)
      const id = result.data.id!
      console.log(
        `Created caption track ${id} for video ${youtubeId}`,
        result.data,
      )
      return { id }
    }
  }
}

for (const video of await Video.findAll()) {
  const { data } = video
  if (!data.managed) continue
  const speakers = data.speaker.split(/;\s+/).join(', ')

  if (video.imageFilePath) {
    const hash = crypto
      .createHash('sha256')
      .update(fs.readFileSync(video.imageFilePath))
      .digest('hex')
    resources.set(
      'thumbnail:' + data.youtube,
      new YouTubeThumbnail({
        videoId: data.youtube,
        filePath: video.imageFilePath,
        hash,
      }),
    )
  }

  const snippet: youtube_v3.Schema$VideoSnippet = {
    title: (data.title + ' by ' + speakers).slice(0, 100),
    description: (await getVideoDescription(video)).replace(/[<>]/g, ''),
  }

  if (video.englishSubtitlePath) {
    snippet.defaultAudioLanguage = 'th'
    resources.set(
      'video:' + data.youtube + ':caption:en',
      new YouTubeCaption({
        videoId: data.youtube,
        filePath: video.englishSubtitlePath,
        language: 'en',
        name: 'English',
        hash: crypto
          .createHash('sha256')
          .update(fs.readFileSync(video.englishSubtitlePath))
          .digest('hex'),
        isDraft: !(data.subtitles || []).includes('en'),
      }),
    )
  }

  resources.set(
    'video:' + data.youtube,
    new YouTubeVideo({
      id: data.youtube,
      snippet: snippet,
      status: {
        embeddable: true,
        selfDeclaredMadeForKids: false,
        ...(data.published === true
          ? { privacyStatus: 'public' }
          : data.published === false
          ? { privacyStatus: 'unlisted' }
          : {}),
      },
    }),
  )
}

const idsToReconcile = new Map<string, any>()

for (const id of [...resources.keys()].sort()) {
  const resource = resources.get(id)!
  const data = (await getState(id)) || {}
  const oldSpec = data.spec || {}
  const newSpec = resource.spec
  if (isEqual(oldSpec, newSpec)) {
    console.log(chalk.green('✓'), id, `(${resource.description})`)
  } else {
    console.log(chalk.yellow('!'), id, `(${resource.description})`)
    console.log(
      diff(oldSpec, newSpec, {
        aAnnotation: 'Before',
        bAnnotation: 'After',
        aColor: chalk.red,
        bColor: chalk.green,
      }),
    )
    idsToReconcile.set(id, data.state)
  }
}

console.log()
console.log('Number of resources to reconcile:', idsToReconcile.size)

if (argv.confirm) {
  const authClient = await googleOfflineAccess.getAuthenticatedAuthClient()
  google.options({ auth: authClient })
  for (const [id, oldState] of idsToReconcile) {
    const resource = resources.get(id)!
    try {
      console.log(chalk.cyan('Reconciling'), id, `(${resource.description})`)
      const newState = await resource.reconcile(oldState)
      await setState(id, {
        spec: resource.spec,
        state: newState,
      })
    } catch (err) {
      console.error(chalk.red('Error reconciling'), id)
      console.error(err)
    }
  }
} else if (idsToReconcile.size > 0) {
  console.log('Run with "--confirm" to reconcile all resources')
}
