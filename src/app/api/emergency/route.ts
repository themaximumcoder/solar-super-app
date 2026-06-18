import { NextResponse } from 'next/server';

const API_KEY = "AIzaSyCjTZvc3EYpn1R4DvTPluu4d_JTi1Q4g9o";

async function getPlaceDetails(query: string) {
  try {
    // 1. Text Search to find the place
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${API_KEY}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    
    if (!searchData.results || searchData.results.length === 0) {
        return { name: "Not Found", phone: "N/A" };
    }

    const placeId = searchData.results[0].place_id;

    // 2. Details API to get phone number
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_phone_number&key=${API_KEY}`;
    const detailsRes = await fetch(detailsUrl);
    const detailsData = await detailsRes.json();

    if (!detailsData.result) {
        return { name: searchData.results[0].name, phone: "N/A" };
    }

    return {
        name: detailsData.result.name || searchData.results[0].name || "Not Found",
        phone: detailsData.result.formatted_phone_number || "N/A"
    };
  } catch (e) {
    console.error("Error fetching place:", e);
    return { name: "Error", phone: "N/A" };
  }
}

export async function POST(req: Request) {
  try {
    const { address } = await req.json();
    if (!address) {
      return NextResponse.json({ error: "No address provided" }, { status: 400 });
    }

    // Run searches in parallel
    const [clinic, hospital, police, fire] = await Promise.all([
      getPlaceDetails(`clinic near ${address}`),
      getPlaceDetails(`hospital near ${address}`),
      getPlaceDetails(`police station near ${address}`),
      getPlaceDetails(`fire station near ${address}`)
    ]);

    return NextResponse.json({
      clinic,
      hospital,
      police,
      fire
    });
  } catch (error: any) {
    console.error("Emergency API Error:", error);
    return NextResponse.json({ error: "Failed to fetch emergency services" }, { status: 500 });
  }
}
