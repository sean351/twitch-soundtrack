const config = require('config')
const fs = require('fs')
const SpotifyWebApi = require('spotify-web-api-node')
const spotify = new SpotifyWebApi({
  clientId: config.get('spotify.client.id'),
  clientSecret: config.get('spotify.client.secret'),
  redirectUri: config.get('spotify.redirect_uri')
})

spotify.setAccessToken(config.get('access_token'))
spotify.setRefreshToken(config.get('refresh_token'))

let previousTrack

const onUpdateCurrentlyPlaying = async () => {
  try {
    await spotify.refreshAccessToken()
    const state = await spotify.getMyCurrentPlaybackState()
    const isPlaying = Boolean(state.body.is_playing)

    if (!isPlaying) {
      if (!previousTrack) return
      return saveCurrentlyPlaying('')
    }

    const {
      album,
      name
    } = state.body.item
    const artists = album.artists[0].name
    const track = `Listening to: ${name} - ${artists}`

    if (track !== previousTrack) {
      return saveCurrentlyPlaying(track)
    }
  } catch (err) {
    console.log('onUpdateCurrentlyPlaying error', err.message, err)
  }
}

const saveCurrentlyPlaying = (track) => {
  fs.writeFile(config.get('obs.trackFilePath'), track, (err) => {
    if (err) throw err
    console.log(`Track set to: ${track}`)
    previousTrack = track
  })
}

setInterval(async () => {
  await onUpdateCurrentlyPlaying()
}, config.get('obs.pollForChanges'))

onUpdateCurrentlyPlaying()
