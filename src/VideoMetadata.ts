import { Video } from './Video'
import { Event } from './Event'

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
  }
  return data.title + ' by ' + getSpeakers(video)
}

export async function getVideoTitle(video: Video, language?: 'en') {
  const { data } = video
  return (
    (data.youtubeTitle &&
      (typeof data.youtubeTitle === 'string'
        ? data.youtubeTitle
        : data.youtubeTitle[language || 'th'])) ||
    (await getDefaultTitle(video))
  )
}

export async function getVideoDescription(
  video: Video,
  language?: 'en',
): Promise<string> {
  const event = await Event.findById(video.event)
  const version = event.metaVersion ?? 1
  const videoTitle = await getVideoTitle(video, language)
  const defaultTitle = await getDefaultTitle(video)
  const talkDescription =
    (language === 'en' && video.data.englishDescription) ||
    video.data.description
  return [
    ...(talkDescription
      ? [
          talkDescription.trim(),
          '',
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
    version >= 2
      ? 'Please consider supporting us by subscribing to the channel, and follow upcoming events via our Facebook page.'
      : 'Please consider supporting us by subscribing to the channel, and follow upcoming events via our Facebook pages.',
    '',
    'For reuse of this video under a more permissive license please get in touch with us. The speakers retain the copyright for their performances.',
    'mail@creatorsgarten.org',
    ...(event.metaVersion >= 2
      ? [
          '',
          'To edit the video metadata (title, description, timestamps, thumbnail, etc.), please visit:',
          `https://grtn.org/e/${video.event}/v/${video.slug}/edit`,
        ]
      : []),
  ].join('\n')
}
