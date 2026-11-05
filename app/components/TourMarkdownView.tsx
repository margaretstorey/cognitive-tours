'use client';

import type { Tour, Waypoint } from '@/app/lib/types';
import { tourByline } from '@/app/lib/tour-markdown';
import { WAYPOINT_COLORS } from '@/app/lib/waypoint-colors';
import { WaypointTypeIcon } from '@/app/lib/waypoint-icons';
import { useCodeFolder, vscodeLink } from '@/app/lib/code-folder';
import { githubFileLink, isLinkPath, linkLabel, useRepoUrl } from '@/app/lib/repo';

interface TourMarkdownViewProps {
  tour: Tour;
  waypoints: Waypoint[];
  activeStepIndex?: number;
}

export default function TourMarkdownView({ tour, waypoints, activeStepIndex }: TourMarkdownViewProps) {
  const [codeFolder] = useCodeFolder();
  const { repoUrl } = useRepoUrl();
  const waypointMap = new Map(waypoints.map(w => [w.id, w]));

  return (
    <div className="h-full overflow-y-auto p-6 bg-white">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{tour.name}</h1>
        {tourByline(tour) && (
          <p className="text-sm italic text-gray-500 mb-3" data-testid="tour-byline">
            {tourByline(tour)}
          </p>
        )}
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
                    <span className="text-gray-400 font-normal text-sm mr-2">Step {index + 1}:</span>
                    {wp.label}
                    <span className={`ml-2 align-middle inline-flex items-center gap-1 text-xs font-normal px-1.5 py-0.5 rounded border ${WAYPOINT_COLORS[wp.type]}`}>
                      <WaypointTypeIcon type={wp.type} size={12} />
                      {wp.type}
                    </span>
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
                  {wp.filePath?.trim() && (codeFolder && !isLinkPath(wp.filePath) ? (
                    <a
                      href={vscodeLink(codeFolder, wp.filePath) ?? undefined}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 hover:bg-gray-200 block mb-2 font-mono break-all"
                    >
                      {wp.filePath}
                    </a>
                  ) : (
                    // No code folder set in this browser: show the path, not a broken link.
                    <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 block mb-2 font-mono break-all">
                      {wp.filePath}
                    </span>
                  ))}
                  {wp.filePath?.trim() && githubFileLink(repoUrl, wp.filePath) && (
                    <a
                      href={githubFileLink(repoUrl, wp.filePath) ?? undefined}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-700 hover:underline block mb-2"
                    >
                      {linkLabel(githubFileLink(repoUrl, wp.filePath)!)} ↗
                    </a>
                  )}
                  {stop.narrative?.trim() && (
                    <div className="mt-2 border-l-2 border-amber-400 bg-amber-50 pl-3 py-2">
                      <p className="text-sm font-bold text-amber-900">Next stop commentary:</p>
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
