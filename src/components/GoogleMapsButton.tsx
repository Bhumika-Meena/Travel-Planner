import React from 'react';

export interface LocationCoordinates {
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
}

export function buildGoogleMapsUrl(
  placeName: string,
  destination?: string,
  coordinates?: LocationCoordinates
): string {
  const lat = coordinates?.lat ?? coordinates?.latitude;
  const lng = coordinates?.lng ?? coordinates?.longitude;

  if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }

  const queryParts = [placeName?.trim()];
  if (
    destination &&
    destination.trim() &&
    placeName &&
    !placeName.toLowerCase().includes(destination.toLowerCase().trim())
  ) {
    queryParts.push(destination.trim());
  }

  const query = queryParts.filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

interface GoogleMapsButtonProps {
  placeName: string;
  destination?: string;
  coordinates?: LocationCoordinates;
  className?: string;
  variant?: 'compact' | 'pill' | 'button';
}

export const GoogleMapsButton: React.FC<GoogleMapsButtonProps> = ({
  placeName,
  destination,
  coordinates,
  className = '',
  variant = 'compact',
}) => {
  const mapUrl = buildGoogleMapsUrl(placeName, destination, coordinates);

  if (variant === 'pill') {
    return (
      <a
        href={mapUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={`View ${placeName} on Google Maps`}
        aria-label={`View ${placeName} on Google Maps`}
        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium text-slate-600 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 transition-all border border-slate-200/60 hover:border-blue-200 group shrink-0 ${className}`}
      >
        <svg
          className="w-3 h-3 text-red-500 group-hover:scale-110 transition-transform"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z" />
        </svg>
        <span>Maps</span>
        <svg
          className="w-2.5 h-2.5 opacity-50 group-hover:opacity-100 transition-opacity"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    );
  }

  return (
    <a
      href={mapUrl}
      target="_blank"
      rel="noopener noreferrer"
      title={`View ${placeName} on Google Maps`}
      aria-label={`View ${placeName} on Google Maps`}
      className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 hover:text-blue-600 bg-white hover:bg-blue-50/60 border border-slate-200 hover:border-blue-200 shadow-2xs hover:shadow-xs transition-all group shrink-0 ${className}`}
    >
      <svg
        className="w-3.5 h-3.5 text-red-500 group-hover:scale-110 transition-transform"
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z" />
      </svg>
      <span className="font-medium whitespace-nowrap">View on Google Maps</span>
      <svg
        className="w-3 h-3 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  );
};
