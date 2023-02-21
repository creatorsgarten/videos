# videos

Meetup VODs — <https://www.youtube.com/@creatorsgarten>

## Contributing

There are many ways you can contribute! For more information see [CONTRIBUTING.md](CONTRIBUTING.md).

## Video catalog file

For easy consumption, the contents is this repository is published as a single JSON file at <https://creatorsgarten.github.io/videos/videos.json>

## For developers

### Setting up

1. Get owner access to the YouTube channel.

2. Run `bin/auth` to get a refresh token for the YouTube API.

3. Put the refresh token in GitHub Secrets as `GOOGLE_REFRESH_TOKEN`.

### Import YouTube video

```sh
./bin/import --event <event> --slug <slug> --video https://youtu.be/<videoId>
```

### Exploring YouTube API with `tsx`

```
pnpm exec tsx
```

```ts
const { google } = await import('googleapis')
const GoogleAuth = await import('./src/GoogleAuth')
const accessToken = await GoogleAuth.getToken()
google.options({ auth: GoogleAuth.authClient })
const youtube = google.youtube('v3')

// Get video info by ID
await youtube.videos.list({ part: ['snippet', 'status'], id: ['uDZIraaY5s8'] })
```
