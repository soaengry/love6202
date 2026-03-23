import axios from "axios";
import { env } from "@/config/env";

interface Coordinate {
  lat: number;
  lng: number;
}

export async function geocode(address: string): Promise<Coordinate | null> {
  const res = await axios.get(
    "https://dapi.kakao.com/v2/local/search/address.json",
    {
      params: { query: address },
      headers: { Authorization: `KakaoAK ${env.KAKAO_REST_API_KEY}` },
    },
  );

  const doc = res.data.documents?.[0];
  if (!doc) return null;
  return { lat: parseFloat(doc.y), lng: parseFloat(doc.x) };
}
