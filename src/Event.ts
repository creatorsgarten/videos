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
    return (
      this.options.urlOverride ??
      `https://creatorsgarten.org/wiki/Hacks/${this.id}`
    )
  }
  get externalOrganizer() {
    return this.options.externalOrganizer
  }
}

const events = [
  new Event('svelte1', 'Svelte Meetup Bangkok #1'),
  new Event('shit6', 'The ៦th Stupid Hackathon in Thailand'),
  new Event('hacktoberfest2022', 'Hacktoberfest Thailand 2022'),
  new Event('reactmeetup0922', 'React Meetup 09/22', {
    urlOverride: 'https://www.eventpop.me/e/13545',
    externalOrganizer: {
      name: 'React ไปวันๆ',
      url: 'https://www.facebook.com/devMasterSomeday/',
    },
  }),
  new Event('bkkjs17', 'Bkk.js #17 - Developer Showtime'),
  new Event('bkkoss', 'Bangkok Open Source Hackathon'),
]
