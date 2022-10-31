export class Event {
  constructor(public id: string, public name: string) {}
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
    return `https://creatorsgarten.org/wiki/Hacks/${this.id}`
  }
}

const events = [
  new Event('svelte1', 'Svelte Meetup Bangkok #1'),
  new Event('shit6', 'The ៦th Stupid Hackathon in Thailand'),
  new Event('hacktoberfest2022', 'Hacktoberfest Thailand 2022'),
]
