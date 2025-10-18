import { useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

// Add your Google Places API key here
// Get it from: https://console.cloud.google.com/google/maps-apis/credentials
const GOOGLE_MAPS_API_KEY = "AIzaSyDFDstd6PpG8oQO2nSswKfddYsOcf3OzcY";

const LocationAutocomplete = ({ value, onChange, required }: LocationAutocompleteProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!inputRef.current) return;

    // Check if Google Maps is loaded
    if (!window.google?.maps?.places) {
      console.error("Google Maps Places API not loaded");
      return;
    }

    // Initialize autocomplete
    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      types: ["(cities)"],
      fields: ["formatted_address", "geometry", "name"],
    });

    // Listen for place selection
    autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current?.getPlace();
      if (place?.formatted_address) {
        onChange(place.formatted_address);
      }
    });

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onChange]);

  return (
    <Input
      ref={inputRef}
      type="text"
      placeholder="Start typing a city..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
    />
  );
};

// Load Google Maps script
export const loadGoogleMapsScript = () => {
  return new Promise<void>((resolve, reject) => {
    if (window.google?.maps?.places) {
      resolve();
      return;
    }

    if (GOOGLE_MAPS_API_KEY === "YOUR_GOOGLE_PLACES_API_KEY") {
      toast.error("Google Places API key not configured");
      reject(new Error("API key not configured"));
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });
};

export default LocationAutocomplete;
