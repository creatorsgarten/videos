import chalk from 'chalk'
import crypto from 'crypto'
import fs from 'fs'
import { GoogleOfflineAccess } from 'google-offline-access'
import { google, youtube_v3 } from 'googleapis'
import { diff } from 'jest-diff'
import { isEqual } from 'lodash-es'
import yargs from 'yargs'
import { getState, setState } from '../StateStorage'
import { Video } from '../Video'
import { getVideoDescription, getVideoTitle } from '../VideoMetadata'

const googleOfflineAccess = new GoogleOfflineAccess({
  scopes: [
    'https://www.googleapis.com/auth/youtube',
    'https://www.googleapis.com/auth/youtube.force-ssl',
  ],
})
const youtube = google.youtube('v3')

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
  localizations?: { [key: string]: youtube_v3.Schema$VideoLocalization }
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
      part: ['snippet', 'status', 'localizations'],
      requestBody: {
        id: youtubeId,
        snippet: newSnippet,
        status: newStatus,
        localizations: this.spec.localizations || {},
      },
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

  const sanitizeTitle = (title: string) => title.slice(0, 100)
  const sanitizeDescription = (description: string) =>
    description.slice(0, 5000).replace(/[<>]/g, '')

  const snippet: youtube_v3.Schema$VideoSnippet = {
    title: sanitizeTitle(await getVideoTitle(video)),
    description: sanitizeDescription(await getVideoDescription(video)),
  }

  const enTitle = sanitizeTitle(await getVideoTitle(video, 'en'))
  const enDescription = sanitizeDescription(
    await getVideoDescription(video, 'en'),
  )
  let enLocalization: youtube_v3.Schema$VideoLocalization | undefined
  if (enTitle !== snippet.title || enDescription !== snippet.description) {
    snippet.defaultLanguage = 'th'
    enLocalization = {
      title: enTitle,
      description: enDescription,
    }
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
  if (video.thaiSubtitlePath) {
    snippet.defaultAudioLanguage = 'th'
    resources.set(
      'video:' + data.youtube + ':caption:th',
      new YouTubeCaption({
        videoId: data.youtube,
        filePath: video.thaiSubtitlePath,
        language: 'th',
        name: 'Thai',
        hash: crypto
          .createHash('sha256')
          .update(fs.readFileSync(video.thaiSubtitlePath))
          .digest('hex'),
        isDraft: !(data.subtitles || []).includes('th'),
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
        ...(typeof data.published === 'string'
          ? { privacyStatus: getPublishedFlag(data.published) }
          : data.published === true
          ? { privacyStatus: 'public' }
          : data.published === false
          ? { privacyStatus: 'unlisted' }
          : {}),
      },
      ...(enLocalization
        ? {
            localizations: {
              en: enLocalization,
              th: { title: snippet.title, description: snippet.description },
            },
          }
        : {}),
    }),
  )
}

function getPublishedFlag(timeToPublish: string) {
  if (!timeToPublish.includes('T')) {
    timeToPublish += 'T08:00:00Z'
  }
  const time = new Date(timeToPublish)
  const now = new Date()
  return now >= time ? 'public' : 'unlisted'
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
