export interface Token {
  accessToken: string;
  expiresIn: number;
  obtainmentTimestamp: number;
  refreshToken: string;
}

export interface Oauth2Token {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope: string[];
  token_type: 'bearer';
}