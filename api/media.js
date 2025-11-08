import { google } from "googleapis";

export default async function handler(req, res) {
  try {
    // 1) sjekk at vi har alle miljøvariabler
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      return res.status(500).json({
        message: "Mangler én eller flere miljøvariabler.",
        have: {
          GOOGLE_CLIENT_ID: !!clientId,
          GOOGLE_CLIENT_SECRET: !!clientSecret,
          GOOGLE_REFRESH_TOKEN: !!refreshToken,
        },
      });
    }

    // 2) lag OAuth-klient
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      "http://localhost" // placeholder, vi bruker refresh token uansett
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    // 3) hent access token
    const accessTokenResponse = await oauth2Client.getAccessToken();
    const accessToken =
      typeof accessTokenResponse === "string"
        ? accessTokenResponse
        : accessTokenResponse?.token;

    if (!accessToken) {
      return res.status(500).json({
        message: "Klarte ikke å hente access token fra Google.",
      });
    }

    // 4) kall Google Photos
    const resp = await fetch(
      "https://photoslibrary.googleapis.com/v1/mediaItems?pageSize=50",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const data = await resp.json();

    // 5) hvis Google klager, vis det
    if (data.error) {
      return res.status(500).json({
        message: "Google Photos returnerte en feil",
        googleError: data.error,
      });
    }

    // 6) hvis ingen mediaItems, si det
    if (!data.mediaItems || data.mediaItems.length === 0) {
      return res.status(200).json({
        message:
          "Ingen mediaItems funnet. Enten er biblioteket tomt, eller dette tokenet ikke ser bildene.",
        raw: data,
      });
    }

    // 7) ellers: mapp til Tizen-formatet
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
    return res.status(500).json({
      message: "Kunne ikke hente media",
      error: err.message,
      // du kan avkommentere for mer info:
      // stack: err.stack,
    });
  }
}
