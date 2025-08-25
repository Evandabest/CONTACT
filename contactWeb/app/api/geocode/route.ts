import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!lat || !lon) {
    return NextResponse.json(
      { error: 'Latitude and longitude are required' },
      { status: 400 }
    );
  }

  if (!mapboxToken) {
    return NextResponse.json(
      { error: 'Mapbox token not configured' },
      { status: 500 }
    );
  }

  try {
    // Mapbox Geocoding API - Reverse geocoding
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${mapboxToken}&types=address,poi`;

    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Mapbox API Error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to fetch address data' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Extract the most relevant address information
    const features = data.features || [];
    
    if (features.length === 0) {
      return NextResponse.json({
        formatted_address: 'Address not found',
        street_name: null,
        street_number: null,
        place_name: null,
        neighborhood: null,
        city: null,
        region: null,
        country: null,
        postal_code: null,
        coordinates: [parseFloat(lon), parseFloat(lat)]
      });
    }

    // Get the first (most relevant) result
    const primaryResult = features[0];
    const context = primaryResult.context || [];
    
    // Parse address components
    const addressComponents = {
      formatted_address: primaryResult.place_name || 'Address not found',
      street_name: null as string | null,
      street_number: null as string | null,
      place_name: primaryResult.text || null,
      neighborhood: null as string | null,
      city: null as string | null,
      region: null as string | null,
      country: null as string | null,
      postal_code: null as string | null,
      coordinates: primaryResult.geometry?.coordinates || [parseFloat(lon), parseFloat(lat)]
    };

    // Extract street number from address if present
    const addressText = primaryResult.properties?.address || primaryResult.address || '';
    if (addressText) {
      addressComponents.street_number = addressText;
    }

    // Extract street name from the place name
    if (primaryResult.properties?.category === 'address' || primaryResult.place_type?.includes('address')) {
      addressComponents.street_name = primaryResult.text;
    }

    // Parse context for additional information
    context.forEach((item: any) => {
      const category = item.id?.split('.')[0];
      switch (category) {
        case 'neighborhood':
        case 'locality':
          if (!addressComponents.neighborhood) {
            addressComponents.neighborhood = item.text;
          }
          break;
        case 'place':
          if (!addressComponents.city) {
            addressComponents.city = item.text;
          }
          break;
        case 'region':
          addressComponents.region = item.text;
          break;
        case 'country':
          addressComponents.country = item.text;
          break;
        case 'postcode':
          addressComponents.postal_code = item.text;
          break;
      }
    });

    return NextResponse.json(addressComponents);
    
  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 