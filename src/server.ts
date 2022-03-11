import 'isomorphic-fetch';

import config from 'config';
import _fs, { promises as fs } from 'fs';

import { ApiClient } from '@twurple/api';
import { AccessToken, RefreshingAuthProvider } from '@twurple/auth';

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

const getTokenData = async (): Promise<Optional<AccessToken, 'accessToken' | 'scope'>> => {
  try {
    await fs.access(config.get('auth.tokenFilePath'), _fs.constants.F_OK);
    return JSON.parse(await fs.readFile(config.get('auth.tokenFilePath'), 'utf-8'))
  } catch (err) {
    return {
      accessToken: '',
      refreshToken: '',
      expiresIn: 0,
      obtainmentTimestamp: 0,
    }
  }
}

const getAuthProvider = async () => {
  const tokenData = await getTokenData();

  return new RefreshingAuthProvider({
    clientId: config.get('twitch.client.id'),
    clientSecret: config.get('twitch.client.secret'),
    onRefresh: async newTokenData => await fs.writeFile(config.get('auth.tokenFilePath'), JSON.stringify(newTokenData, null, 2), 'utf-8')
  }, tokenData);
}

let previousTrack: string;

const onUpdateCurrentlyPlaying = async () => {
  try {
    const authProvider = await getAuthProvider();
    const token = await authProvider.getAccessToken();
    const twitch = new ApiClient({ authProvider })

    const { id: broadcasterId } = await twitch.users.getMe()

    const params = new URLSearchParams({
      broadcaster_id: broadcasterId,
    }).toString()

    const soundtrackRes = await fetch(`https://api.twitch.tv/helix/soundtrack/current_track?${params}`, {
      headers: {
        'Authorization': `Bearer ${token?.accessToken}`,
        'Client-Id': config.get('twitch.client.id')
      }
    })

    if (!soundtrackRes.ok) {
      throw new Error(`Unable to retrieve current soundtrack`)
    }

    // https://dev.twitch.tv/docs/api/reference#get-soundtrack-current-track
    const { data: [soundtrack] } = await soundtrackRes.json();

    const {
      artists,
      title
    } = soundtrack.track
    const track = `${title} - ${artists[0].name}`

    if (track !== previousTrack) {
      return saveCurrentlyPlaying(track)
    }
  } catch (err) {
    console.log('onUpdateCurrentlyPlaying error', err)
  }
}

const saveCurrentlyPlaying = async (track: string) => {
  try {
    await fs.writeFile(config.get('obs.trackFilePath'), track)
    console.log(`Track set to: ${track}`)
    previousTrack = track
  } catch (err) {
    console.log(`Couldn't save currently playing track`, err)
  }
}

const main = () => {
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

main()
