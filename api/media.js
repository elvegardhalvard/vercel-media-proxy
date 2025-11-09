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

    // hent access token
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

    // 👇 NYTT: spør Google hva dette tokenet faktisk har av scopes
    const infoResp = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?access_token=${accessToken}`
    );
    const info = await infoResp.json();

    return res.status(200).json({
      message: "Dette er tokenet vi faktisk fikk fra Google",
      tokenInfo: info,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Feil i funksjonen",
      error: err.message,
    });
  }
}
