# videos

Meetup VODs — <https://www.youtube.com/@creatorsgarten>

## Contributing

### Update video metadata

You can update the data files in [data/videos](data/videos) and submit a pull request. When merged, GitHub Actions will update the description on YouTube.

### Update video thumbnail

You can help improve the video thumbnails by replacing the `.jpg` files in [data/videos](data/videos).

Image requirements:

- Dimensions must be 1280x720
- File extension must be `.jpg`
- Image must be smaller than 128 KB

## Video catalog file

For easy consumption, the contents is this repository is published as a single JSON file at <https://creatorsgarten.github.io/videos/videos.json>

## For developers

### Setting up

1. Get owner access to the YouTube channel.

2. Run `bin/auth` to get a refresh token for the YouTube API.

3. Put the refresh token in GitHub Secrets as `GOOGLE_REFRESH_TOKEN`.

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
