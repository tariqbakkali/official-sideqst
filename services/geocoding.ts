/**
 * Geocoding service using OpenStreetMap Nominatim API
 * Provides address search and coordinate conversion functionality
 */

export interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  place_id: string;
  type: string;
  importance: number;
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  display_name: string;
  place_id: string;
}

class GeocodingService {
  private readonly baseUrl = 'https://nominatim.openstreetmap.org';
  private readonly userAgent = 'SideQuests/1.0.0'; // Required by Nominatim

  /**
   * Search for address suggestions based on user input
   */
  async searchAddresses(query: string, limit: number = 5): Promise<AddressSuggestion[]> {
    if (!query || query.trim().length < 3) {
      return [];
    }

    try {
      const params = new URLSearchParams({
        q: query.trim(),
        format: 'json',
        limit: limit.toString(),
        addressdetails: '1',
        extratags: '1',
        namedetails: '1',
      });

      const response = await fetch(`${this.baseUrl}/search?${params}`, {
        headers: {
          'User-Agent': this.userAgent,
        },
      });

      if (!response.ok) {
        throw new Error(`Geocoding request failed: ${response.status}`);
      }

      const data: AddressSuggestion[] = await response.json();
      
      // Sort by importance (higher is better)
      return data.sort((a, b) => (b.importance || 0) - (a.importance || 0));
    } catch (error) {
      console.error('Error searching addresses:', error);
      return [];
    }
  }

  /**
   * Get coordinates for a specific address
   */
  async geocodeAddress(address: string): Promise<GeocodeResult | null> {
    try {
      const suggestions = await this.searchAddresses(address, 1);
      
      if (suggestions.length === 0) {
        return null;
      }

      const result = suggestions[0];
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        display_name: result.display_name,
        place_id: result.place_id,
      };
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  }

  /**
   * Reverse geocode coordinates to get address
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
    try {
      const params = new URLSearchParams({
        lat: latitude.toString(),
        lon: longitude.toString(),
        format: 'json',
        addressdetails: '1',
      });

      const response = await fetch(`${this.baseUrl}/reverse?${params}`, {
        headers: {
          'User-Agent': this.userAgent,
        },
      });

      if (!response.ok) {
        throw new Error(`Reverse geocoding request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.display_name || null;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  }

  /**
   * Calculate distance between two points using Haversine formula
   * Returns distance in kilometers
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export const geocodingService = new GeocodingService();