import { useEffect, useState, useCallback } from 'react';
import * as Location from 'expo-location';
import { useUser } from '../components/context/UserContext';
import { useNetwork } from '../components/context/NetworkContext';
import { API_URL } from '../config/env';

/**
 * Liefert einen Referenzpunkt fuer die Umkreissuche:
 * 1. Versucht zuerst die Live-GPS-Position (mit Permission-Check)
 * 2. Faellt bei fehlender Permission/Fehler auf die Home-Adresse
 *    des eingeloggten Users zurueck (aus dem Profil)
 */
export function useUserLocation() {
  const [location, setLocation] = useState(null); // { latitude, longitude, source: 'gps' | 'address' }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { userId, accessToken } = useUser();
  const { safeFetch } = useNetwork();

  const fetchHomeAddressFallback = useCallback(async () => {
    if (!userId || !accessToken) return null;

    try {
      const response = await safeFetch(`${API_URL}/api/users/profile/${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response?.ok) return null;

      const data = await response.json();
      if (!data.address?.latitude || !data.address?.longitude) return null;

      return {
        latitude: data.address.latitude,
        longitude: data.address.longitude,
        source: 'address',
      };
    } catch (err) {
      console.error('Fehler beim Laden der Home-Adresse als Fallback:', err);
      return null;
    }
  }, [userId, accessToken, safeFetch]);

  const resolveLocation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === 'granted') {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          source: 'gps',
        });
        return;
      }

      // Permission verweigert -> Fallback auf Home-Adresse
      const fallback = await fetchHomeAddressFallback();
      if (fallback) {
        setLocation(fallback);
      } else {
        setError(
          'Kein Standort verfuegbar. Bitte Adresse im Profil hinterlegen oder Standortzugriff erlauben.'
        );
      }
    } catch (err) {
      console.error('Fehler beim Ermitteln des Standorts:', err);
      const fallback = await fetchHomeAddressFallback();
      if (fallback) {
        setLocation(fallback);
      } else {
        setError('Standort konnte nicht ermittelt werden.');
      }
    } finally {
      setLoading(false);
    }
  }, [fetchHomeAddressFallback]);

  useEffect(() => {
    resolveLocation();
  }, [resolveLocation]);

  return { location, loading, error, refetch: resolveLocation };
}