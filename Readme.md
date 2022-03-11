# artdevgame/twitch-soundtrack

Connects to the Twitch API to retrieve the current track and writes it to disk. The information can then be picked up by a third-party, such as OBS.

## Requirements

* yarn

## Usage

Define environment variables called `TWITCH_API_ID` & `TWITCH_API_SECRET` and set it to your Twitch app's client id / secret (get this from the [Twitch developer console](https://dev.twitch.tv/console)).

Make sure all of the dependencies are installed using `yarn`.

### Generating a new access token

**This only needs to be done on first-run or if you're having problems with authentication.**

You will need to add a couple of OAuth Redirect URLs in the [Twitch apps settings](https://dev.twitch.tv/console/apps) so it can talk back to your machine after logging in:

- http://localhost:8081/handshake
- http://localhost:8081/authenticated

In order to generate a token config, we need to handshake with Twitch using our client id and secret.

`yarn run start:auth`

Your default browser browser should start and visit the server you're running (default: http://localhost:8081). If everything is set up correctly you'll be asked to confirm your identity with Twitch and the access tokens will be written to disk (default: ./config/tokens.json)

### Listening for Twitch changes

Run: `yarn start`

By default, the artist and album name will be written to /tmp/twitch-soundtrack-currently-playing.txt