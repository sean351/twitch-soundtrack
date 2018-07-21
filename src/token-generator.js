const fs = require('fs')
const path = require('path')
const SpotifyWebApi = require('spotify-web-api-node')
const config = require('config')
const express = require('express')

const app = express()

const spotify = new SpotifyWebApi({
  clientId: config.get('spotify.client.id'),
  clientSecret: config.get('spotify.client.secret'),
  redirectUri: config.get('spotify.redirect_uri')
})

app.get('/', (req, res) => {
  res.redirect(spotify.createAuthorizeURL(config.get('spotify.scopes'), config.get('spotify.state')))
})

app.get('/login', async (req, res) => {
  const {
    code
  } = req.query

  try {
    const tokens = await spotify.authorizationCodeGrant(code)
    fs.writeFile(path.resolve(config.get('auth.tokenFilePath')), JSON.stringify(tokens.body), (err) => {
      if (err) throw new Error(err.message)
      res.json({ ok: true, ...tokens.body })
    })
  } catch (err) {
    res.json({ ok: false, err: err.message })
  }
})

app.listen(config.get('auth.port'), () => console.log(`Auth service created on port ${config.get('auth.port')}`))
