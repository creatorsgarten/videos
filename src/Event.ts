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
    return this.options.urlOverride ?? `https://grtn.org/e/${this.id}`
  }
  get externalOrganizer() {
    return this.options.externalOrganizer
  }
}

const events = [
  new Event('svelte1', 'Svelte Meetup Bangkok #1'),
  new Event('sht6', 'The ៦th Stupid Hackathon in Thailand'),
  new Event('hacktoberfest2022', 'Hacktoberfest Thailand 2022'),
  new Event('reactmeetup0922', 'React Meetup 09/22', {
    urlOverride: 'https://www.eventpop.me/e/13545',
    externalOrganizer: {
      name: 'React ไปวันๆ',
      url: 'https://www.facebook.com/devMasterSomeday/',
    },
  }),
  new Event('bkkjs17', 'Bkk.js #17 - Developer Showtime'),
  new Event('bangkok', 'Bangkok Open Source Hackathon'),
  new Event('archive', 'Stream Archives'),
  new Event('creativecodingmeetup', 'Creative Coding Meetup'),
  new Event('vscodeday2023', 'VS Code Day 2023 - Thailand', {
    externalOrganizer: {
      name: 'Spark Tech Thailand',
      url: 'https://www.facebook.com/SparkTechTH',
    },
  }),
  new Event('functional', 'Functional Programming Meetup #1'),
  new Event('msbuild2023', 'Microsoft Build - After Party Thailand', {
    externalOrganizer: {
      name: 'Spark Tech Thailand',
      url: 'https://www.facebook.com/SparkTechTH',
    },
  }),
  new Event('reactmeetup0623', 'React Meetup 06/23', {
    externalOrganizer: {
      name: 'React ไปวันๆ',
      url: 'https://www.facebook.com/devMasterSomeday/',
    },
  }),
  new Event('bkkjs18', 'Bkk.js #18 - คิดถึงเลยอยากเจอ', {
    externalOrganizer: {
      name: 'Web Developer Thailand',
      url: 'https://www.facebook.com/web.developer.th',
    },
  }),
  new Event('typescript1', 'TypeScript Community Meetup', {
    externalOrganizer: {
      name: 'TypeScript Thailand',
      url: 'https://www.facebook.com/groups/typescriptthailand',
    },
  }),
  new Event('sideproject', 'Side Project Showdown'),
  new Event(
    'scisart',
    'Sciยศาสตร์ Night: คืนไสยศาสตร์เดือนวิทยาศาสตร์กรุงเทพฯ',
  ),
  new Event(
    'mathsatsundown',
    'Maths at Sundown - a prelude to sciยศาสตร์ night',
  ),
  new Event('functional2', 'Functional Meetup #2: Elm for Frontend Developers'),
  new Event('cssmeetup0823', 'CSS Meetup 16.08.2023'),
]
