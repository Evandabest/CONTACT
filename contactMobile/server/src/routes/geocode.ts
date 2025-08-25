import { Router, Request, Response } from 'express';

const router = Router();

interface AddressComponents {
  formatted_address: string;
  street_name: string | null;
  street_number: string | null;
  place_name: string | null;
  neighborhood: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  postal_code: string | null;
  coordinates: [number, number];
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const { lat, lon } = req.query;
    const mapboxToken = process.env.MAPBOX_TOKEN;

    if (!lat || !lon) {
      return res.status(400).json({
        error: 'Latitude and longitude are required'
      });
    }

    if (!mapboxToken) {
      return res.status(500).json({
        error: 'Mapbox token not configured'
      });
    }

    // Mapbox Geocoding API - Reverse geocoding
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${mapboxToken}&types=address,poi`;

    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Mapbox API Error:', response.status, errorText);
      return res.status(response.status).json({
        error: 'Failed to fetch address data'
      });
    }

    const data = await response.json();
    
    // Extract the most relevant address information
    const features = data.features || [];
    
    if (features.length === 0) {
      return res.json({
        formatted_address: 'Address not found',
        street_name: null,
        street_number: null,
        place_name: null,
        neighborhood: null,
        city: null,
        region: null,
        country: null,
        postal_code: null,
        coordinates: [parseFloat(lon as string), parseFloat(lat as string)]
      });
    }

    // Get the first (most relevant) result
    const primaryResult = features[0];
    const context = primaryResult.context || [];
    
    // Parse address components
    const addressComponents: AddressComponents = {
      formatted_address: primaryResult.place_name || 'Address not found',
      street_name: null,
      street_number: null,
      place_name: primaryResult.text || null,
      neighborhood: null,
      city: null,
      region: null,
      country: null,
      postal_code: null,
      coordinates: primaryResult.geometry?.coordinates || [parseFloat(lon as string), parseFloat(lat as string)]
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

    res.json(addressComponents);
    
  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

export default router; 