import subtitle from 'subtitle'

export function serializeVtt(cues: subtitle.Cue[]): string {
  const events = cues.map((cue) => ({
    text: cue.text,
    start: cue.start / 1000,
    end: cue.end / 1000,
  }))
  const lines: string[] = []
  lines.push('WEBVTT')
  for (const event of events) {
    if (!event.text || !(event.start < event.end)) continue
    const text = event.text
    lines.push('')
    lines.push(
      [formatTime(event.start), '-->', formatTime(event.end)].join(' '),
    )
    lines.push(text)
  }
  lines.push('')
  return lines.join('\n')
}

function formatTime(t: number) {
  const h = Math.floor(t / 3600)
    .toString()
    .padStart(2, '0')
  const m = Math.floor((t % 3600) / 60)
    .toString()
    .padStart(2, '0')
  const s = Math.floor(t % 60)
    .toString()
    .padStart(2, '0')
  const ms = Math.floor((t * 1000) % 1000)
    .toString()
    .padStart(3, '0')
  return `${h}:${m}:${s}.${ms}`
}
