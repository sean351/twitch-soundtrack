const config = require('config')
const fs = require('fs')
const SpotifyWebApi = require('spotify-web-api-node')
const spotify = new SpotifyWebApi({
  clientId: config.get('spotify.client.id'),
  clientSecret: config.get('spotify.client.secret'),
  redirectUri: config.get('spotify.redirect_uri')
})

const refreshToken = async () => {
  const tokens = await spotify.refreshAccessToken()
  spotify.setAccessToken(tokens.body.access_token)
}

const onAuthenticate = async () => {
  try {
    spotify.setRefreshToken(config.get('refresh_token'))

    await refreshToken()
    onAuthenticated()
  } catch (err) {
    console.error('onAuthenticate error', err)
  }
}

let previousTrack

const onUpdateCurrentlyPlaying = async () => {
  try {
    await refreshToken()

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
    const track = `${name} - ${artists}`

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

const onAuthenticated = () => {
  const loop = setInterval(async () => {
    await onUpdateCurrentlyPlaying()
  }, config.get('obs.pollForChanges'))

  const shutdown = () => {
    clearInterval(loop)
    saveCurrentlyPlaying('')
  }

  ['exit', 'SIGINT', 'SIGUSR1', 'SIGUSR2', 'uncaughtException'].forEach(type => process.on(type, shutdown))
  onUpdateCurrentlyPlaying()
}

onAuthenticate()
