import { Event } from './Event'
import { LocalizableText, Video } from './Video'

function getSpeakers(video: Video) {
  const { data } = video
  return data.speaker!.split(/;\s+/).join(', ')
}

async function getDefaultTitle(video: Video) {
  const { data } = video
  if (data.type === 'pitch') {
    const event = await Event.findById(video.event)
    return (
      data.title +
      (data.tagline ? ' - ' + data.tagline : '') +
      ' | ' +
      event.name
    )
  } else if (data.type === 'archive') {
    return 'Garten Streams: ' + data.title
  } else if (data.speaker === undefined) {
    return data.title
  }

  // generic meetup videos
  let meetupVideoTitle =
    data.title + ' by ' + data.speaker!.split(/;\s+/).join(', ')

  // if title length is longer than 100 characters, then only get spaker by first name
  if (meetupVideoTitle.length > 100)
    meetupVideoTitle =
      data.title +
      ' by ' +
      data
        .speaker!.split(/;\s+/)
        .map((speaker) => speaker.split(' ')[0])
        .join(', ')

  return meetupVideoTitle
}

export async function getVideoTitle(video: Video, language?: 'en') {
  const { data } = video
  return (
    (data.youtubeTitle && localize(data.youtubeTitle, language)) ||
    (await getDefaultTitle(video))
  )
}

function localize(text: LocalizableText, language?: 'en') {
  return typeof text === 'string' ? text : text[language || 'th']
}

export function recordingCredit(
  recordedBy: Event['recordedBy'],
  type: 'internal' | 'external',
): string[] {
  if (recordedBy === 'livetubex') {
    return type === 'internal'
      ? ['Recorded by LiveTubeX.', 'https://www.livetubex.com/']
      : [
          'Recorded by LiveTubeX and published by Creatorsgarten.',
          'https://www.livetubex.com/',
        ]
  }
  return type === 'internal'
    ? []
    : ['Recorded and published by Creatorsgarten.']
}

function padAbove(x: string[]): string[] {
  return x.length ? ['', ...x] : x
}

export async function getVideoDescription(
  video: Video,
  language?: 'en',
): Promise<string> {
  const event = await Event.findById(video.event)
  const videoTitle = await getVideoTitle(video, language)
  const defaultTitle = await getDefaultTitle(video)

  let talkDescription =
    (language === 'en' && video.data.englishDescription) ||
    video.data.description

  if (video.data.chapters) {
    talkDescription = (talkDescription || '').trimEnd()
    talkDescription += '\n'
    for (const [time, title] of Object.entries(video.data.chapters)) {
      talkDescription += `\n${time} | ${localize(title, language)}`
    }
  }

  return [
    ...(talkDescription
      ? [
          talkDescription.trim(),
          '',
          '--------------------------------------------',
        ]
      : []),
    ...(videoTitle !== defaultTitle
      ? [
          `Talk title: ${video.data.title}`,
          ...(video.data.speaker ? [`Speaker: ${getSpeakers(video)}`] : []),
        ]
      : []),
    ...(video.data.team ? [`Team: ${video.data.team.name}`] : []),
    ...(video.data.type !== 'archive'
      ? [`Event: ${event.name}`, event.url]
      : []),
    ...(event.externalOrganizer
      ? [
          '',
          'Organized by: ' +
            event.externalOrganizer.name +
            (event.externalOrganizer.url
              ? `\n${event.externalOrganizer.url}`
              : ''),
          '--------------------------------------------',
          ...recordingCredit(event.recordedBy, 'external'),
        ]
      : [...padAbove(recordingCredit(event.recordedBy, 'internal'))]),
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
    '',
    'To edit the video metadata (title, description, timestamps, thumbnail, etc.), please visit:',
    `https://grtn.org/e/${video.event}/v/${video.slug}/edit`,
    ...(video.data.tags
      ? ['', video.data.tags.map((tag) => `#${tag}`).join(' ')]
      : []),
  ].join('\n')
}
