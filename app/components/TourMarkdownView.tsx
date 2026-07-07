'use client';

import type { Tour, Waypoint } from '@/app/lib/types';

interface TourMarkdownViewProps {
  tour: Tour;
  waypoints: Waypoint[];
  activeStepIndex?: number;
}

export default function TourMarkdownView({ tour, waypoints, activeStepIndex }: TourMarkdownViewProps) {
  const waypointMap = new Map(waypoints.map(w => [w.id, w]));

  return (
    <div className="h-full overflow-y-auto p-6 bg-white">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{tour.name}</h1>
        {tour.description?.trim() && (
          <p className="text-gray-600 mb-3">
            <span className="font-bold">Tour Description: </span>
            {tour.description}
          </p>
        )}
        <p className="text-xs text-gray-400 mb-6">
          {tour.stops.length} stop{tour.stops.length === 1 ? '' : 's'}
        </p>

        {tour.stops.length === 0 ? (
          <p className="text-sm text-gray-400 italic">This tour has no waypoints yet.</p>
        ) : (
          <div className="flex flex-col gap-6">
            {tour.stops.map((stop, index) => {
              const wp = waypointMap.get(stop.waypointId);
              if (!wp) return null;
              const isActive = index === activeStepIndex;
              return (
                <div
                  key={`${stop.waypointId}-${index}`}
                  className={`border-l-2 pl-4 ${
                    isActive ? 'active-stop border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <h2 id={`stop-${index}`} className="text-base font-semibold text-gray-800 mb-1">
                    <span className="text-gray-400 font-normal text-sm mr-2">{index + 1}.</span>
                    {wp.label}
                  </h2>
                  {wp.description?.trim() && (
                    <div className="mb-2">
                      <p className="text-sm font-bold text-gray-800">What this is:</p>
                      <p className="text-sm text-gray-700">{wp.description}</p>
                    </div>
                  )}
                  {wp.notes?.trim() && (
                    <div className="mb-2">
                      <p className="text-sm font-bold text-gray-800">Notes:</p>
                      <p className="text-sm text-gray-600">{wp.notes}</p>
                    </div>
                  )}
                  {wp.filePath?.trim() && (
                    <a
                      href={`vscode://file/Users/mstorey/shrimp-2/${wp.filePath}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 hover:bg-gray-200 block mb-2 font-mono break-all"
                    >
                      {wp.filePath}
                    </a>
                  )}
                  {stop.narrative?.trim() && (
                    <div className="mt-2 border-l-2 border-amber-300 pl-3">
                      <p className="text-sm font-bold text-amber-900">Next up:</p>
                      <p className="text-sm text-amber-800 italic">{stop.narrative}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
