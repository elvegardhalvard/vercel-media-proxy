import { google } from "googleapis";

export default async function handler(req, res) {
  try {
    // 1) lag OAuth-klient med verdiene fra Vercel
    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    // 2) få access token fra refresh token
    const { credentials } = await client.refreshAccessToken();
    const accessToken = credentials.access_token;

    // 3) kall Google Photos
    const resp = await fetch(
      "https://photoslibrary.googleapis.com/v1/mediaItems?pageSize=50",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const data = await resp.json();

    // 4) hvis Google svarer med feil → vis den til deg
    if (data.error) {
      return res.status(500).json({
        message: "Google Photos returnerte en feil",
        googleError: data.error,
      });
    }

    // 5) hvis det ikke er noen mediaItems → si det tydelig
    if (!data.mediaItems || data.mediaItems.length === 0) {
      return res.status(200).json({
        message:
          "Ingen mediaItems funnet. Enten er biblioteket tomt, eller appen har ikke tilgang til bildene.",
        raw: data,
      });
    }

    // 6) ellers: map til formatet Tizen-appen din bruker
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
