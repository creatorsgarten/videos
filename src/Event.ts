type EventOptions = {
  /**
   * External organizer of the event.
   */
  externalOrganizer?: { name: string; url?: string }

  /**
   * URL to the event page.
   * @default https://creatorsgarten.org/wiki/Hacks/{id}
   */
  urlOverride?: string

  /**
   * Extra description about the event to add to the video description.
   */
  description?: string

  /**
   * YouTube API imposes a limit on how many videos can be edited per day.
   * So we can use this option to specify the version of the metadata
   * to gradually update the videos metadata to a new format.
   */
  metaVersion?: 1 | 2
}

export class Event {
  constructor(
    public id: string,
    public name: string,
    private options: EventOptions = {},
  ) {}
  static async findAll() {
    return events
  }
  static async findById(id: string) {
    const event = events.find((event) => event.id === id)
    if (!event) {
      throw new Error(
        `Event not found: ${id}. Make sure this event is listed in "src/Event.ts"`,
      )
    }
    return event
  }
  get url() {
    return (
      this.options.urlOverride ??
      (this.metaVersion >= 2
        ? `https://grtn.org/e/${this.id}`
        : `https://creatorsgarten.org/wiki/Hacks/${this.id}`)
    )
  }
  get externalOrganizer() {
    return this.options.externalOrganizer
  }
  get metaVersion() {
    return this.options.metaVersion ?? 2
  }
}

const events = [
  new Event('svelte1', 'Svelte Meetup Bangkok #1', {
    metaVersion: 1,
  }),
  new Event('shit6', 'The ៦th Stupid Hackathon in Thailand', {
    metaVersion: 1,
  }),
  new Event('hacktoberfest2022', 'Hacktoberfest Thailand 2022', {
    metaVersion: 1,
  }),
  new Event('reactmeetup0922', 'React Meetup 09/22', {
    metaVersion: 1,
    urlOverride: 'https://www.eventpop.me/e/13545',
    externalOrganizer: {
      name: 'React ไปวันๆ',
      url: 'https://www.facebook.com/devMasterSomeday/',
    },
  }),
  new Event('bkkjs17', 'Bkk.js #17 - Developer Showtime', {
    metaVersion: 2,
  }),
  new Event('bangkok', 'Bangkok Open Source Hackathon'),
  new Event('archive', 'Stream Archives'),
  new Event('creativecodingmeetup', 'Creative Coding Meetup'),
]
