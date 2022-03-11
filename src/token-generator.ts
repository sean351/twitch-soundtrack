import 'isomorphic-fetch';

import config from 'config';
import express from 'express';
import { promises as fs } from 'fs';
import open from 'open';
import path from 'path';

import { Oauth2Token, Token } from './@types/Token';

const app = express()
const port = config.get('auth.port');
const shouldOpen = process.argv.includes('--open');

app.get('/', (req, res) => {
  const params = new URLSearchParams({
    client_id: config.get('twitch.client.id'),
    redirect_uri: config.get('twitch.redirect_uri.handshake'),
    response_type: 'code',
    scope: config.get<string[]>('twitch.scopes')?.join('+'),
    state: config.get('twitch.state')
  }).toString()

  res.redirect(`https://id.twitch.tv/oauth2/authorize?${params}`)
})

app.get('/handshake', async (req, res) => {
  try {
    const {
      code,
      state,
    } = req.query as { code: string; state: string }

    if (state !== config.get('twitch.state')) {
      throw new Error('CSRF error, state does not match')
    }

    const params = new URLSearchParams({
      client_id: config.get('twitch.client.id'),
      client_secret: config.get('twitch.client.secret'),
      code,
      grant_type: 'authorization_code',
      redirect_uri: config.get('twitch.redirect_uri.authenticated'),
    }).toString()

    const authRes = await fetch(`https://id.twitch.tv/oauth2/token?${params}`, {
      headers: {
        'Accept': 'application/json'
      },
      method: 'POST'
     });

    if (!authRes.ok) {
      console.log(authRes)
      throw new Error(`Couldn't authenticate via oauth2`)
    }

    const token = await authRes.json() as Oauth2Token;

    const tokenData: Token = {
      accessToken: token.access_token,
      expiresIn: token.expires_in,
      obtainmentTimestamp: Date.now(),
      refreshToken: token.refresh_token,
    }

    await fs.writeFile(path.resolve(config.get('auth.tokenFilePath')), JSON.stringify(tokenData))
    res.json({ ok: true, ...tokenData })
    console.log('Token config written, run `yarn start` to continue')
    process.exit(0)
  } catch (err) {
    res.json({ ok: false, err: (err as Error).message })
  }
})

app.get('/authenticated', (req, res) => {
  res.json(req.body)
})

app.listen(port, () => {
  console.log(`Auth service created on port ${port}`)
  if (shouldOpen) {
    open(`http://localhost:${port}`)
  }
})
