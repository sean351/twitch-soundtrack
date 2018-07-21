# artdevgame/spotify

Connects to the Spotify API to retrive the current track and write to disk. The information can then be picked up by a third-party, such as OBS.

## Requirements

* yarn
* node.js

## Usage

Define environment variables called `SPOTIFY_API_ID` & `SPOTIFY_API_SECRET` and set it to your Spotify app's client id / secret (get this from the [Spotify developer dashboard](https://developer.spotify.com/dashboard)).

Make sure all of the dependencies are installed using `yarn`.

### Generating a new access token

**This only needs to be done on first-run or if you're having problems with authentication.**

In order to retrieve an access token, we need to handshake with Spotify using our client id and secret.

`yarn run start:auth`

You will need to add a whitelist address in the [Spotify apps settings](https://developer.spotify.com/dashboard) (default: http://localhost:8081/login) so it can talk back to your machine after logging in.

Finally, in a browser visit the server you're running (default: http://localhost:8081). If everything is setup correctly you'll be asked to confirm your identity with Spotify and the access tokens will be written to disk (default: ./config/local.json)

### Listening for Spotify changes

Run: `yarn start`

By default, the artist and album name will be written to /tmp/spotify-currently-playing.txt