import { useState } from 'react';

export interface AddressComponents {
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

export interface UseReverseGeocodeReturn {
  address: AddressComponents | null;
  loading: boolean;
  error: string | null;
  geocodeLocation: (lat: number, lon: number) => Promise<void>;
  clearAddress: () => void;
}

export const useReverseGeocode = (): UseReverseGeocodeReturn => {
  const [address, setAddress] = useState<AddressComponents | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const geocodeLocation = async (lat: number, lon: number) => {
    setLoading(true);
    setError(null);

    try {
      // Using the mobile server endpoint
      const response = await fetch(
        `http://localhost:3001/api/geocode?lat=${lat}&lon=${lon}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch address');
      }

      const addressData: AddressComponents = await response.json();
      setAddress(addressData);
    } catch (err) {
      console.error('Reverse geocoding error:', err);
      setError(err instanceof Error ? err.message : 'Failed to get address');
      setAddress(null);
    } finally {
      setLoading(false);
    }
  };

  const clearAddress = () => {
    setAddress(null);
    setError(null);
  };

  return {
    address,
    loading,
    error,
    geocodeLocation,
    clearAddress,
  };
};

// Helper function to format address for display
export const formatAddressForDisplay = (address: AddressComponents | null): string => {
  if (!address) return '';

  // Try to build a nice street address
  const parts = [];
  
  if (address.street_number && address.street_name) {
    parts.push(`${address.street_number} ${address.street_name}`);
  } else if (address.street_name) {
    parts.push(address.street_name);
  } else if (address.place_name) {
    parts.push(address.place_name);
  }

  if (address.neighborhood && !parts.some(part => part.includes(address.neighborhood!))) {
    parts.push(address.neighborhood);
  }

  if (address.city && !parts.some(part => part.includes(address.city!))) {
    parts.push(address.city);
  }

  return parts.length > 0 ? parts.join(', ') : address.formatted_address;
};

// Helper function to get just the street name
export const getStreetName = (address: AddressComponents | null): string => {
  if (!address) return '';
  
  if (address.street_name) {
    return address.street_number 
      ? `${address.street_number} ${address.street_name}`
      : address.street_name;
  }
  
  if (address.place_name) {
    return address.place_name;
  }
  
  return address.formatted_address;
}; 