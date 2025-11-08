// api/media.js
import { google } from "googleapis";

export default async function handler(req, res) {
  try {
    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

    const { credentials } = await client.refreshAccessToken();
    const accessToken = credentials.access_token;

    const resp = await fetch(
      "https://photoslibrary.googleapis.com/v1/mediaItems?pageSize=50",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const data = await resp.json();
    const items = (data.mediaItems || []).map((item) => {
      const isVideo = item.mimeType?.startsWith("video/");
      const src = item.baseUrl + (isVideo ? "=dv" : "=w2000");
      return { type: isVideo ? "video" : "image", src, duration: 5 };
    });

    res.status(200).json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kunne ikke hente media" });
  }
}
