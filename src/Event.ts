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
   * Which organization recorded the event videos, for proper attribution.
   */
  recordedBy?: 'creatorsgarten' | 'livetubex'
}

export class Event {
  constructor(
    public id: string,
    public name: string,
    private options: EventOptions = {},
  ) {}
  public descriptionMode: 'modern' | 'classic' = 'modern'
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
  get recordedBy() {
    return this.options.recordedBy ?? 'creatorsgarten'
  }
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      url: this.url,
      externalOrganizer: this.externalOrganizer,
    }
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
  new Event('github1', 'GitHub Community Meetup #1'),
  new Event('universe2023', 'GitHub Universe After Party Thailand', {
    urlOverride:
      'https://www.eventpop.me/e/16683/github-universe-2023-after-party',
    externalOrganizer: {
      name: 'Spark Tech Thailand',
      url: 'https://www.facebook.com/SparkTechTH',
    },
  }),
  new Event('bkkjs19', 'BKK.JS #19'),
  new Event('bkkjs20', 'BKK.JS #20'),
  new Event('wind2', 'Code in the Wind #2'),
  new Event('algorave', 'a bit of thai tunes', {
    recordedBy: 'livetubex',
  }),
  new Event('worldwithoutwork', 'เศรษฐกิจเอไอกับโลกไร้งาน'),
  new Event('supabase', 'Supabase Meetup Bangkok 1.0', {
    urlOverride: 'https://guild.host/events/supabase-bangkok-meetup-le6a9z',
    externalOrganizer: {
      name: 'DevTools Bangkok',
      url: 'https://guild.host/devtools-bangkok',
    },
  }),
  new Event('bkkjs21', 'BKK.JS #21'),
  new Event('mongo0924', 'MongoDB.local Bangkok After Party', {
    urlOverride:
      'https://www.eventpop.me/e/52729/mongodb-local-bangkok-2024-after-party',
    externalOrganizer: {
      name: 'MongoDB Thailand User Group',
      url: 'https://mdb.link/thailand',
    },
  }),
  new Event('vueconf', 'Vue Thai Conf 2024', {
    urlOverride: 'https://connextickets.me/event/vue-thai-conf-2024',
    externalOrganizer: {
      name: 'Vue News Thailand',
      url: 'https://www.facebook.com/@VueNewsThailand/',
    },
  }),
  new Event('jsbkk1', 'JavaScript Bangkok 1.0.0', {
    urlOverride: 'https://2019.javascriptbangkok.com/',
    externalOrganizer: {
      name: 'Software Developer Community',
      url: 'https://javascriptbangkok.com',
    },
    recordedBy: 'livetubex',
  }),
  new Event('bac', 'Browser automation challenges'),
  new Event('jsbkk2', 'JavaScript Bangkok 2.0.0', {
    urlOverride: 'https://javascriptbangkok.com/',
    externalOrganizer: {
      name: 'Software Developer Community',
      url: 'https://javascriptbangkok.com',
    },
    recordedBy: 'livetubex',
  }),
  new Event('market', 'Creative Coding Meetup #3'),
  new Event('deconnect', 'DE Connect: Bridge Data Minds', {
    urlOverride: 'https://www.facebook.com/share/p/1BCKRCfJz8/',
    externalOrganizer: {
      name: 'Data Engineer Connect',
      url: 'https://www.facebook.com/dataengineerconnect',
    },
  }),
  new Event('bkkjs22', 'BKK.JS #22'),
  new Event('bkkjs23', 'BKK.JS #23'),
  new Event('sht9', 'Stupido Hackettino ๙'),
  new Event('claude', 'Claude Code Meetup Bangkok', {
    urlOverride: 'https://luma.com/3idvg9yn',
    externalOrganizer: {
      name: 'Claude Community Events',
      url: 'https://luma.com/claudecommunity',
    },
  }),
]

// To prevent YouTube API running out of quota,
// we will gradually update the description mode
// from 'classic' to 'modern' for all events.
for (const event of events) {
  if (event.id === 'bac') break
  event.descriptionMode = 'classic'
}
