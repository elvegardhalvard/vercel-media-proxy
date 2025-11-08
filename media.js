import { google } from "googleapis";

export default async function handler(req, res) {
  try {
    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    // hent nytt access token
    const { credentials } = await client.refreshAccessToken();
    const accessToken = credentials.access_token;

    // hent media fra Google Photos
    const resp = await fetch(
      "https://photoslibrary.googleapis.com/v1/mediaItems?pageSize=50",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const data = await resp.json();

    // HJELP TIL DEBUG:
    // hvis Google svarte med en error, send den videre
    if (data.error) {
      return res.status(500).json({
        message: "Google Photos returnerte en feil",
        googleError: data.error,
      });
    }

    // hvis det ikke finnes mediaItems, si det tydelig
    if (!data.mediaItems || data.mediaItems.length === 0) {
      return res.status(200).json({
        message: "Ingen mediaItems funnet. Sjekk at kontoen har bilder i Google Foto og at du brukte samme konto i OAuth.",
        raw: data,
      });
    }

    // ellers: map til formatet TV-en forventer
    const items = data.mediaItems.map((item) => {
      const isVideo = item.mimeType?.startsWith("video/");
      const src = item.baseUrl + (isVideo ? "=dv" : "=w2000");
      return {
        type: isVideo ? "video" : "image",
        src,
        duration: 5,
      };
    });

    return res.status(200).json(items);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Kunne ikke hente media",
      error: err.message,
    });
  }
}
