import { ROUTE_TYPE_COLORS, ROUTE_TYPE_SHORT, type RouteType } from "@/types/route";

interface RouteBadgeProps {
  routeType: RouteType;
  isCanon?: boolean;
}

/**
 * Small colored pill label for a route's type. Canon routes get a brighter
 * fill; others use a subtle tinted background with the type color text.
 */
export default function RouteBadge({ routeType, isCanon = false }: RouteBadgeProps) {
  const color = ROUTE_TYPE_COLORS[routeType];
  const label = ROUTE_TYPE_SHORT[routeType];

  if (isCanon) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-white"
        style={{ backgroundColor: color }}
      >
        ◆ {label} · Canon
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.1em]"
      style={{
        backgroundColor: `${color}1A`,
        color,
      }}
    >
      {label}
    </span>
  );
}
