import { google } from "googleapis";

export default async function handler(req, res) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      return res.status(500).json({
        message: "Mangler env-vars",
        have: {
          GOOGLE_CLIENT_ID: !!clientId,
          GOOGLE_CLIENT_SECRET: !!clientSecret,
          GOOGLE_REFRESH_TOKEN: !!refreshToken,
        },
      });
    }

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      "http://localhost"
    );
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    // 1) hent access token
    const accessTokenResponse = await oauth2Client.getAccessToken();
    const accessToken =
      typeof accessTokenResponse === "string"
        ? accessTokenResponse
        : accessTokenResponse?.token;

    if (!accessToken) {
      return res.status(500).json({
        message: "Fikk ikke access token fra Google",
      });
    }

    // 2) kall Google Photos – ingen pynt, bare rett ut
    const resp = await fetch(
      "https://photoslibrary.googleapis.com/v1/mediaItems?pageSize=10",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const data = await resp.json();

    // send ALT Google sier tilbake til nettleseren
    return res.status(resp.status).json({
      httpStatusFromGoogle: resp.status,
      googleRaw: data,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Feil i funksjonen",
      error: err.message,
    });
  }
}
