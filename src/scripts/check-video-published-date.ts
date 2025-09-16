import { GoogleOfflineAccess } from 'google-offline-access'
import { google } from 'googleapis'
import yargs from 'yargs'

const googleOfflineAccess = new GoogleOfflineAccess({
  scopes: ['https://www.googleapis.com/auth/youtube.readonly'],
})
const youtube = google.youtube('v3')

const argv = await yargs(process.argv.slice(2))
  .strict()
  .help()
  .option('id', {
    describe: 'YouTube video ID',
    type: 'string',
    demandOption: true,
  })
  .parse()

const videoId = argv.id

try {
  const auth = await googleOfflineAccess.getAuthenticatedAuthClient()
  google.options({ auth })

  const response = await youtube.videos.list({
    part: ['snippet'],
    id: [videoId],
  })

  if (!response.data.items || response.data.items.length === 0) {
    console.error(`Video with ID ${videoId} not found`)
    process.exit(1)
  }

  const video = response.data.items[0]
  const publishedAt = video.snippet?.publishedAt

  if (publishedAt) {
    const publishedDate = new Date(publishedAt)
    console.log(`Video ID: ${videoId}`)
    console.log(`Title: ${video.snippet?.title}`)
    console.log(`Published: ${publishedDate.toISOString()}`)
    console.log(`Published (local): ${publishedDate.toLocaleString()}`)
  } else {
    console.error(`Could not retrieve published date for video ${videoId}`)
    process.exit(1)
  }
} catch (error) {
  console.error('Error checking video published date:', error)
  process.exit(1)
}
