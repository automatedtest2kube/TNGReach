import { useEffect, useMemo, useRef, useState } from "react";
import * as atlas from "azure-maps-control";
import "azure-maps-control/dist/atlas.min.css";
import malaysiaStates from "@/admin-original/data/malaysia-states.json";
import { REGIONS, totalSpending, type Category } from "@/admin-original/data/regions";
import { inferAreaFromPoint } from "@/admin-original/data/areas";
import { USERS, type UserProfile, type UserTransaction } from "@/admin-original/data/users";
import { Zap } from "lucide-react";

const MALAYSIA_BOUNDS: [number, number, number, number] = [99.0, 0.8, 119.5, 7.8];
const SOURCE_ID = "malaysia-states-source";
const FILL_LAYER_ID = "malaysia-states-fill";
const BORDER_LAYER_ID = "malaysia-states-border";
const TXN_SOURCE_ID = "malaysia-txn-source";
const TXN_LAYER_ID = "malaysia-txn-layer";
const HOME_SOURCE_ID = "user-home-source";
const HOME_LAYER_ID = "user-home-layer";
const ROUTE_SOURCE_ID = "user-route-source";
const ROUTE_LAYER_ID = "user-route-layer";
const FLOW_SOURCE_ID = "user-flow-source";
const FLOW_LAYER_ID = "user-flow-layer";

// const CHOROPLETH_COLORS = [
//   "#fff6cf", // light yellow (low)
//   "#ffd447", // yellow
//   "#ffbf4d", // light orange
//   "#ffa53a", // dark orange
//   "#f33b1f", // light red
//   "#ae1313", // dark red (high)
// ];

const CHOROPLETH_COLORS = [
  "#F8D94A", // light yellow
  "#F7C932", // golden yellow
  "#F9A52B", // amber
  "#F98C22", // orange
  "#F04A23", // orange-red
  "#9E0B0F"  // deep dark red
];

interface Props {
  categories: Category[];
  onSelectRegion: (state: string | null) => void;
  selectedRegion: string | null;
  filteredRegions?: string[];
  userTransactions?: UserTransaction[];
  onSelectTxn: (t: UserTransaction | null) => void;
  userFilterActive?: boolean;
  activeUser?: UserProfile | null;
}

export const AzureMalaysiaMap = ({
  categories,
  onSelectRegion,
  selectedRegion,
  filteredRegions = [],
  userTransactions,
  onSelectTxn,
  userFilterActive = false,
  activeUser = null,
}: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<atlas.Map | null>(null);
  const hoverHandlerRef = useRef<((e: any) => void) | null>(null);
  const leaveHandlerRef = useRef<((e: any) => void) | null>(null);
  const stateClickHandlerRef = useRef<((e: any) => void) | null>(null);
  const txnClickHandlerRef = useRef<((e: any) => void) | null>(null);
  const txnHoverHandlerRef = useRef<((e: any) => void) | null>(null);
  const txnLeaveHandlerRef = useRef<((e: any) => void) | null>(null);
  const homeHoverHandlerRef = useRef<((e: any) => void) | null>(null);
  const homeLeaveHandlerRef = useRef<((e: any) => void) | null>(null);
  const flowAnimationRef = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [hover, setHover] = useState<
    | { type: "region"; state: string; mx: number; my: number }
    | { type: "txn"; txnId: string; mx: number; my: number }
    | { type: "home"; userId: string; mx: number; my: number }
    | null
  >(null);

  const regionByState = useMemo(() => {
    return new Map(REGIONS.map((r) => [r.state, r]));
  }, []);
  const txnById = useMemo(() => {
    return new Map((userTransactions ?? []).map((t) => [t.id, t]));
  }, [userTransactions]);
  const userById = useMemo(() => {
    return new Map(USERS.map((u) => [u.id, u]));
  }, []);
  const filteredRegionSet = useMemo(() => new Set(filteredRegions), [filteredRegions]);

  const spendingByState = useMemo(() => {
    const m = new Map<string, number>();
    REGIONS.forEach((r) => {
      m.set(r.state, totalSpending(r, categories));
    });
    return m;
  }, [categories]);

  const regionInsights = useMemo(() => {
    const map = new Map<
      string,
      {
        b40Count: number;
        n20Count: number;
        t20Count: number;
        totalUsers: number;
        avgSpendPerUser: number;
        avgTaxValue: number;
        topCategory: string;
        topCategoryPct: number;
      }
    >();

    for (const r of REGIONS) {
      const state = r.state;
      const regionUsers = USERS.filter((u) => u.region === state);
      const txns = (userTransactions ?? []).filter((t) => t.region === state);
      const amounts = txns.map((t) => t.amount);
      const totalAmount = amounts.reduce((s, v) => s + v, 0);

      const b40Count = regionUsers.filter((u) => u.incomeGroup === "B40").length;
      const n20Count = regionUsers.filter((u) => u.incomeGroup === "M40").length;
      const t20Count = regionUsers.filter((u) => u.incomeGroup === "T20").length;
      const totalUsers = regionUsers.length;

      const avgSpendPerUser = totalUsers ? totalAmount / totalUsers : 0;
      const avgTaxValue = txns.length ? totalAmount / txns.length : 0;

      const catTotals = new Map<string, number>();
      for (const t of txns) {
        catTotals.set(t.category, (catTotals.get(t.category) ?? 0) + t.amount);
      }
      let topCategory = "-";
      let topCategoryValue = 0;
      for (const [cat, value] of catTotals.entries()) {
        if (value > topCategoryValue) {
          topCategory = cat;
          topCategoryValue = value;
        }
      }
      const topCategoryPct = totalAmount > 0 ? (topCategoryValue / totalAmount) * 100 : 0;

      map.set(state, {
        b40Count,
        n20Count,
        t20Count,
        totalUsers,
        avgSpendPerUser,
        avgTaxValue,
        topCategory,
        topCategoryPct,
      });
    }
    return map;
  }, [userTransactions]);

  const thresholds = useMemo(() => {
    const vals = Array.from(spendingByState.values());
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return [];
    const step = (max - min) / 6;
    return [1, 2, 3, 4, 5].map((i) => +(min + step * i).toFixed(2));
  }, [spendingByState]);

  const flowRoutes = useMemo(() => {
    if (!activeUser || !userFilterActive || !userTransactions?.length) return [];
    return userTransactions.map((t) => ({
      id: t.id,
      amount: t.amount,
      from: [activeUser.homeLon, activeUser.homeLat] as [number, number],
      to: [t.lon, t.lat] as [number, number],
    }));
  }, [activeUser, userFilterActive, userTransactions]);

  const hashSeed = (s: string) => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0) / 4294967295;
  };

  const curveControlPoint = (
    from: [number, number],
    to: [number, number],
    seed: number
  ): [number, number] => {
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    const distance = Math.hypot(dx, dy);
    if (distance < 0.0001) return [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];

    const nx = -dy / distance;
    const ny = dx / distance;
    const midX = (from[0] + to[0]) / 2;
    const midY = (from[1] + to[1]) / 2;
    const bendSign = seed > 0.5 ? 1 : -1;
    const bendAmount = Math.max(0.08, Math.min(0.45, distance * 0.2));
    return [midX + nx * bendAmount * bendSign, midY + ny * bendAmount * bendSign];
  };

  const quadraticPoint = (
    from: [number, number],
    control: [number, number],
    to: [number, number],
    t: number
  ): [number, number] => {
    const inv = 1 - t;
    const lon = inv * inv * from[0] + 2 * inv * t * control[0] + t * t * to[0];
    const lat = inv * inv * from[1] + 2 * inv * t * control[1] + t * t * to[1];
    return [lon, lat];
  };

  const quadraticPath = (
    from: [number, number],
    control: [number, number],
    to: [number, number],
    segments = 28
  ): [number, number][] => {
    const points: [number, number][] = [];
    for (let i = 0; i <= segments; i++) {
      points.push(quadraticPoint(from, control, to, i / segments));
    }
    return points;
  };

  useEffect(() => {
    const key = import.meta.env.VITE_AZURE_MAPS_KEY?.trim();
    if (!key || !containerRef.current || mapRef.current) return;

    const map = new atlas.Map(containerRef.current, {
      authOptions: {
        authType: atlas.AuthenticationType.subscriptionKey,
        subscriptionKey: key,
      },
      center: [102.0, 4.2],
      zoom: 6,
      minZoom: 4,
      maxZoom: 14,
      language: "en-US",
      style: "grayscale_light",
      renderWorldCopies: false,
      maxBounds: MALAYSIA_BOUNDS,
    });

    map.events.add("ready", () => {
      map.setCamera({
        bounds: MALAYSIA_BOUNDS,
        padding: 20,
      });
      setIsMapReady(true);
    });

    map.events.add("error", (e: unknown) => {
      const details =
        typeof e === "object" && e && "error" in e
          ? String((e as { error?: unknown }).error)
          : "Unknown error";
      setError(`Unable to load Azure map. ${details}`);
    });

    mapRef.current = map;
    return () => {
      if (flowAnimationRef.current) {
        cancelAnimationFrame(flowAnimationRef.current);
        flowAnimationRef.current = null;
      }
      map.dispose();
      mapRef.current = null;
      setIsMapReady(false);
      setHover(null);
    };
  }, []);

  useEffect(() => {
    if (!isMapReady || !mapRef.current) return;
    const map = mapRef.current;

    let source = map.sources.getById(SOURCE_ID) as atlas.source.DataSource | undefined;
    if (!source) {
      source = new atlas.source.DataSource(SOURCE_ID);
      map.sources.add(source);
    }

    const features = (malaysiaStates as any).features.map((f: any) => {
      const state = f?.properties?.state as string;
      const region = regionByState.get(state);
      return {
        ...f,
        properties: {
          ...f.properties,
          spending: spendingByState.get(state) ?? 0,
          transactions: region?.transactions ?? 0,
          growth: region?.growth ?? 0,
          isSelected: state === selectedRegion,
          inRegionFilter: filteredRegionSet.size === 0 || filteredRegionSet.has(state),
        },
      };
    });
    source.setShapes(features as any);

    const fillExpr: any =
      thresholds.length === 5
        ? [
            "step",
            ["get", "spending"],
            CHOROPLETH_COLORS[0],
            thresholds[0],
            CHOROPLETH_COLORS[1],
            thresholds[1],
            CHOROPLETH_COLORS[2],
            thresholds[2],
            CHOROPLETH_COLORS[3],
            thresholds[3],
            CHOROPLETH_COLORS[4],
            thresholds[4],
            CHOROPLETH_COLORS[5],
          ]
        : CHOROPLETH_COLORS[0];
    const hasRegionFilter = filteredRegionSet.size > 0;
    const hasRegionSelection = Boolean(selectedRegion);
    const effectiveFillColor: any = hasRegionFilter
      ? [
          "case",
          ["==", ["get", "inRegionFilter"], true],
          userFilterActive ? "#f8fafc" : fillExpr,
          "#e5e7eb",
        ]
      : hasRegionSelection
        ? [
            "case",
            ["==", ["get", "isSelected"], true],
            userFilterActive ? "#f8fafc" : fillExpr,
            "#e5e7eb",
          ]
        : "#f8fafc";
    const effectiveFillOpacity: any = hasRegionFilter
      ? [
          "case",
          ["==", ["get", "inRegionFilter"], true],
          userFilterActive ? 0.28 : 0.72,
          userFilterActive ? 0.1 : 0.2,
        ]
      : hasRegionSelection
        ? [
            "case",
            ["==", ["get", "isSelected"], true],
            userFilterActive ? 0.28 : 0.72,
            userFilterActive ? 0.1 : 0.2,
          ]
        : 0.28;

    let fillLayer = map.layers.getLayerById(FILL_LAYER_ID) as atlas.layer.PolygonLayer | undefined;
    if (!fillLayer) {
      fillLayer = new atlas.layer.PolygonLayer(source, FILL_LAYER_ID, {
        fillColor: effectiveFillColor,
        fillOpacity: effectiveFillOpacity,
      });
      map.layers.add(fillLayer);
    } else {
      fillLayer.setOptions({
        fillColor: effectiveFillColor,
        fillOpacity: effectiveFillOpacity,
      });
    }

    let borderLayer = map.layers.getLayerById(BORDER_LAYER_ID) as atlas.layer.LineLayer | undefined;
    if (!borderLayer) {
      borderLayer = new atlas.layer.LineLayer(source, BORDER_LAYER_ID, {
        strokeColor: [
          "case",
          ["==", ["get", "isSelected"], true],
          "#0f172a",
          hasRegionFilter
            ? [
                "case",
                ["==", ["get", "inRegionFilter"], true],
                "#9ca3af",
                "#d1d5db",
              ]
            : "#9ca3af",
        ] as any,
        strokeWidth: [
          "case",
          ["==", ["get", "isSelected"], true],
          0,
          1,
        ] as any,
      });
      map.layers.add(borderLayer);
    } else {
      borderLayer.setOptions({
        strokeColor: [
          "case",
          ["==", ["get", "isSelected"], true],
          "#0f172a",
          hasRegionFilter
            ? [
                "case",
                ["==", ["get", "inRegionFilter"], true],
                "#9ca3af",
                "#d1d5db",
              ]
            : "#9ca3af",
        ] as any,
        strokeWidth: [
          "case",
          ["==", ["get", "isSelected"], true],
          0,
          1,
        ] as any,
      });
    }

    let txnSource = map.sources.getById(TXN_SOURCE_ID) as atlas.source.DataSource | undefined;
    if (!txnSource) {
      txnSource = new atlas.source.DataSource(TXN_SOURCE_ID);
      map.sources.add(txnSource);
    }
    const txnFeatures = (userTransactions ?? []).map((t) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [t.lon, t.lat],
      },
      properties: {
        txnId: t.id,
        merchant: t.merchant,
        amount: t.amount,
      },
    }));
    txnSource.setShapes(txnFeatures as any);

    const txnColorExpr: any = [
      "step",
      ["get", "amount"],
      "#67e8f9",
      40,
      "#22d3ee",
      80,
      "#2dd4bf",
      130,
      "#f59e0b",
      180,
      "#f97316",
      240,
      "#ef4444",
    ];
    const txnRadiusExpr: any = [
      "step",
      ["get", "amount"],
      4,
      40,
      5,
      80,
      6,
      130,
      7,
      180,
      8,
      240,
      9,
    ];

    let txnLayer = map.layers.getLayerById(TXN_LAYER_ID) as atlas.layer.BubbleLayer | undefined;
    if (!txnLayer) {
      txnLayer = new atlas.layer.BubbleLayer(txnSource, TXN_LAYER_ID, {
        radius: txnRadiusExpr,
        color: txnColorExpr,
        strokeColor: "#ffffff",
        strokeWidth: 1.4,
        blur: 0.6,
        opacity: 0.95,
      });
      map.layers.add(txnLayer);
    } else {
      txnLayer.setOptions({
        radius: txnRadiusExpr,
        color: txnColorExpr,
        strokeColor: "#ffffff",
        strokeWidth: 1.4,
        blur: 0.6,
        opacity: 0.95,
      });
    }

    let homeSource = map.sources.getById(HOME_SOURCE_ID) as atlas.source.DataSource | undefined;
    if (!homeSource) {
      homeSource = new atlas.source.DataSource(HOME_SOURCE_ID);
      map.sources.add(homeSource);
    }
    let routeSource = map.sources.getById(ROUTE_SOURCE_ID) as atlas.source.DataSource | undefined;
    if (!routeSource) {
      routeSource = new atlas.source.DataSource(ROUTE_SOURCE_ID);
      map.sources.add(routeSource);
    }
    let flowSource = map.sources.getById(FLOW_SOURCE_ID) as atlas.source.DataSource | undefined;
    if (!flowSource) {
      flowSource = new atlas.source.DataSource(FLOW_SOURCE_ID);
      map.sources.add(flowSource);
    }

    let homeLayer = map.layers.getLayerById(HOME_LAYER_ID) as atlas.layer.BubbleLayer | undefined;
    if (!homeLayer) {
      homeLayer = new atlas.layer.BubbleLayer(homeSource, HOME_LAYER_ID, {
        radius: 8,
        color: "#2563eb",
        strokeColor: "#ffffff",
        strokeWidth: 2,
      });
      map.layers.add(homeLayer);
    }

    let routeLayer = map.layers.getLayerById(ROUTE_LAYER_ID) as atlas.layer.LineLayer | undefined;
    if (!routeLayer) {
      routeLayer = new atlas.layer.LineLayer(routeSource, ROUTE_LAYER_ID, {
        strokeColor: "#60a5fa",
        strokeWidth: 1.2,
        strokeOpacity: 0.75,
        strokeDashArray: [1, 2],
      });
      map.layers.add(routeLayer);
    }

    let flowLayer = map.layers.getLayerById(FLOW_LAYER_ID) as atlas.layer.BubbleLayer | undefined;
    if (!flowLayer) {
      flowLayer = new atlas.layer.BubbleLayer(flowSource, FLOW_LAYER_ID, {
        radius: 3.5,
        color: "#22d3ee",
        strokeColor: "#ffffff",
        strokeWidth: 1,
        blur: 0.5,
        opacity: 0.9,
      });
      map.layers.add(flowLayer);
    }

    if (flowAnimationRef.current) {
      cancelAnimationFrame(flowAnimationRef.current);
      flowAnimationRef.current = null;
    }

    if (activeUser && userFilterActive && flowRoutes.length > 0) {
      homeSource.setShapes([
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [activeUser.homeLon, activeUser.homeLat],
          },
          properties: { type: "home", userId: activeUser.id },
        },
      ] as any);

      const curvedRoutes = flowRoutes.map((r) => {
        const seed = hashSeed(r.id);
        const control = curveControlPoint(r.from, r.to, seed);
        return {
          ...r,
          control,
          path: quadraticPath(r.from, control, r.to),
        };
      });

      routeSource.setShapes(
        curvedRoutes.map((r) => ({
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: r.path,
          },
          properties: { txnId: r.id, amount: r.amount },
        })) as any
      );

      const particles = curvedRoutes.map((r) => ({
        ...r,
        progress: hashSeed(r.id),
        speed: 0.0025 + Math.min(0.006, r.amount / 80000),
      }));

      const tick = () => {
        const flowFeatures = particles.map((p) => {
          p.progress = (p.progress + p.speed) % 1;
          const [lon, lat] = quadraticPoint(p.from, p.control, p.to, p.progress);
          return {
            type: "Feature",
            geometry: { type: "Point", coordinates: [lon, lat] },
            properties: { txnId: p.id, amount: p.amount },
          };
        });
        flowSource?.setShapes(flowFeatures as any);
        flowAnimationRef.current = requestAnimationFrame(tick);
      };
      tick();
    } else {
      homeSource.setShapes([]);
      routeSource.setShapes([]);
      flowSource.setShapes([]);
    }

    if (!hoverHandlerRef.current) {
      hoverHandlerRef.current = (e: any) => {
        if (userFilterActive) {
          setHover((h) => (h?.type === "region" ? null : h));
          return;
        }
        const shape = e?.shapes?.[0];
        const props = shape?.getProperties?.();
        if (!props) return;
        const state = String(props.state ?? "Unknown");
        const pixel = Array.isArray(e?.pixel)
          ? e.pixel
          : Array.isArray(e?.position)
            ? map.positionsToPixels([e.position])[0]
            : null;
        if (!pixel) return;
        map.getCanvasContainer().style.cursor = "pointer";
        setHover({
          type: "region",
          state,
          mx: Number(pixel[0]),
          my: Number(pixel[1]),
        });
      };
      map.events.add("mousemove", fillLayer as atlas.layer.Layer, hoverHandlerRef.current);
    }

    if (!leaveHandlerRef.current) {
      leaveHandlerRef.current = () => {
        map.getCanvasContainer().style.cursor = "";
        setHover(null);
      };
      map.events.add("mouseleave", fillLayer as atlas.layer.Layer, leaveHandlerRef.current);
    }

    if (!stateClickHandlerRef.current) {
      stateClickHandlerRef.current = (e: any) => {
        const shape = e?.shapes?.[0];
        const props = shape?.getProperties?.();
        const state = props?.state as string | undefined;
        if (!state) return;
        onSelectRegion(props?.isSelected ? null : state);
      };
      map.events.add("click", fillLayer as atlas.layer.Layer, stateClickHandlerRef.current);
    }

    if (!txnClickHandlerRef.current) {
      txnClickHandlerRef.current = (e: any) => {
        const shape = e?.shapes?.[0];
        const props = shape?.getProperties?.();
        const txnId = props?.txnId as string | undefined;
        if (!txnId) return;
        const txn = txnById.get(txnId);
        onSelectTxn(txn ?? null);
      };
      map.events.add("click", txnLayer as atlas.layer.Layer, txnClickHandlerRef.current);
    }

    if (!txnHoverHandlerRef.current) {
      txnHoverHandlerRef.current = (e: any) => {
        const shape = e?.shapes?.[0];
        const props = shape?.getProperties?.();
        const txnId = props?.txnId as string | undefined;
        if (!txnId) return;
        const pixel = Array.isArray(e?.pixel)
          ? e.pixel
          : Array.isArray(e?.position)
            ? map.positionsToPixels([e.position])[0]
            : null;
        if (!pixel) return;
        map.getCanvasContainer().style.cursor = "pointer";
        setHover({
          type: "txn",
          txnId,
          mx: Number(pixel[0]),
          my: Number(pixel[1]),
        });
      };
      map.events.add("mousemove", txnLayer as atlas.layer.Layer, txnHoverHandlerRef.current);
    }

    if (!txnLeaveHandlerRef.current) {
      txnLeaveHandlerRef.current = () => {
        map.getCanvasContainer().style.cursor = "";
        setHover((h) => (h?.type === "txn" ? null : h));
      };
      map.events.add("mouseleave", txnLayer as atlas.layer.Layer, txnLeaveHandlerRef.current);
    }

    if (!homeHoverHandlerRef.current) {
      homeHoverHandlerRef.current = (e: any) => {
        const shape = e?.shapes?.[0];
        const props = shape?.getProperties?.();
        const userId = props?.userId as string | undefined;
        if (!userId) return;
        const pixel = Array.isArray(e?.pixel)
          ? e.pixel
          : Array.isArray(e?.position)
            ? map.positionsToPixels([e.position])[0]
            : null;
        if (!pixel) return;
        map.getCanvasContainer().style.cursor = "pointer";
        setHover({
          type: "home",
          userId,
          mx: Number(pixel[0]),
          my: Number(pixel[1]),
        });
      };
      map.events.add("mousemove", homeLayer as atlas.layer.Layer, homeHoverHandlerRef.current);
    }

    if (!homeLeaveHandlerRef.current) {
      homeLeaveHandlerRef.current = () => {
        map.getCanvasContainer().style.cursor = "";
        setHover((h) => (h?.type === "home" ? null : h));
      };
      map.events.add("mouseleave", homeLayer as atlas.layer.Layer, homeLeaveHandlerRef.current);
    }
  }, [
    isMapReady,
    onSelectRegion,
    onSelectTxn,
    regionByState,
    spendingByState,
    thresholds,
    txnById,
    userTransactions,
    userFilterActive,
    activeUser,
    flowRoutes,
    filteredRegionSet,
  ]);

  if (!import.meta.env.VITE_AZURE_MAPS_KEY) {
    return (
      <div className="h-full w-full flex items-center justify-center px-5 text-center text-sm text-muted-foreground">
        Set <span className="mx-1 font-mono">VITE_AZURE_MAPS_KEY</span> in
        <span className="ml-1 font-mono">.env</span> and restart dev server.
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {(userTransactions?.length ?? 0) > 0 && (
        <div className="absolute top-3 left-3 z-20 flex items-center gap-2 rounded-full bg-card/90 backdrop-blur px-3 py-1.5 shadow-card border border-border animate-fade-in">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          <span className="text-sm font-semibold text-foreground">
            <Zap className="inline h-3 w-3 mr-1 text-accent" />
            {userTransactions?.length ?? 0} user transactions
          </span>
        </div>
      )}

      {!userFilterActive && filteredRegions.length > 0 && (
        <div className="absolute bottom-3 left-3 z-20 rounded-md bg-card/90 backdrop-blur px-3 py-2 shadow-card border border-border">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Spending intensity
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">Low</span>
            <div
              className="h-2 w-32 rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, #fff6cf 0%, #ffd447 20%, #ffbf4d 40%, #ffa53a 60%, #f33b1f 80%, #ae1313 100%)",
              }}
            />
            <span className="text-[10px] text-muted-foreground">High</span>
          </div>
        </div>
      )}
      {(userTransactions?.length ?? 0) > 0 && (
        <div className="absolute bottom-3 right-3 z-20 rounded-md bg-card/90 backdrop-blur px-3 py-2 shadow-card border border-border">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Node amount
          </div>
          <div className="space-y-1 text-[10px]">
            <LegendRow color="#67e8f9" label="< RM 40" />
            <LegendRow color="#22d3ee" label="RM 40 - 79.99" />
            <LegendRow color="#2dd4bf" label="RM 80 - 129.99" />
            <LegendRow color="#f59e0b" label="RM 130 - 179.99" />
            <LegendRow color="#f97316" label="RM 180 - 239.99" />
            <LegendRow color="#ef4444" label=">= RM 240" />
          </div>
        </div>
      )}

      <div ref={containerRef} className="h-full w-full" />
      {hover &&
        (() => {
          if (hover.type === "home") {
            const user = userById.get(hover.userId);
            if (!user) return null;
            return (
              <div
                className="pointer-events-none absolute z-30 rounded-lg border border-border bg-popover/95 backdrop-blur px-3 py-2 shadow-elevated animate-fade-in"
                style={{
                  left: Math.min(hover.mx + 14, (containerRef.current?.clientWidth ?? 600) - 340),
                  top: Math.max(hover.my - 10, 10),
                }}
              >
                <div className="text-sm font-semibold text-popover-foreground">{user.name}</div>
                <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
                  <span className="text-muted-foreground">Name</span>
                  <span className="text-right font-medium text-foreground tabular-nums">{user.name}</span>
                  <span className="text-muted-foreground">Age</span>
                  <span className="text-right font-medium text-foreground tabular-nums">{user.age}</span>
                  <span className="text-muted-foreground">Income Group</span>
                  <span className="text-right font-medium text-foreground tabular-nums">{user.incomeGroup}</span>
                  <span className="text-muted-foreground">IC</span>
                  <span className="text-right font-medium text-foreground tabular-nums">{user.ic}</span>
                  <span className="text-muted-foreground">Home Region</span>
                  <span className="text-right font-medium text-foreground tabular-nums">{user.region}</span>
                </div>
                <div className="my-2 h-px bg-border/70" />
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Subsidies
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
                  {user.subsidies.length === 0 ? (
                    <>
                      <span className="text-muted-foreground">Program</span>
                      <span className="text-right font-medium text-foreground">-</span>
                    </>
                  ) : (
                    user.subsidies.map((s, idx) => (
                      <div key={`${s.name}-${idx}`} className="contents">
                        <span className="text-muted-foreground">{s.name}</span>
                        <span className="text-right font-medium text-foreground tabular-nums">
                          RM {s.amount.toFixed(2)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          }

          if (hover.type === "txn") {
            const txn = txnById.get(hover.txnId);
            if (!txn) return null;
            const dateText = new Date(txn.timestamp).toLocaleString();
            const area = inferAreaFromPoint(txn.region, txn.lon, txn.lat);
            return (
              <div
                className="pointer-events-none absolute z-30 rounded-lg border border-border bg-popover/95 backdrop-blur px-3 py-2 shadow-elevated animate-fade-in"
                style={{
                  left: Math.min(hover.mx + 14, (containerRef.current?.clientWidth ?? 600) - 230),
                  top: Math.max(hover.my - 10, 10),
                }}
              >
                <div className="text-sm font-semibold text-popover-foreground">{txn.merchant}</div>
                <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
                  <span className="text-muted-foreground">Merchant</span>
                  <span className="text-right font-medium text-foreground tabular-nums">
                    {txn.merchant}
                  </span>
                  <span className="text-muted-foreground">Payment Details</span>
                  <span className="text-right font-medium text-foreground tabular-nums">
                    RM {txn.amount.toFixed(2)} Â· {txn.category}
                  </span>
                  <span className="text-muted-foreground">Area</span>
                  <span className="text-right font-medium text-foreground">
                    {area ?? "-"}
                  </span>
                  <span className="text-muted-foreground">Payment Method</span>
                  <span className="text-right font-medium text-foreground">{txn.paymentMethod}</span>
                  <span className="text-muted-foreground">Date/Time</span>
                  <span className="text-right font-medium text-foreground tabular-nums">{dateText}</span>
                  <span className="text-muted-foreground">Wallet Ref</span>
                  <span className="text-right font-medium text-foreground tabular-nums">{txn.reference}</span>
                  <span className="text-muted-foreground">Status</span>
                  <span
                    className={`text-right font-medium capitalize ${
                      txn.status === "completed" ? "text-success" : "text-destructive"
                    }`}
                  >
                    {txn.status}
                  </span>
                  <span className="text-muted-foreground">Transaction No.</span>
                  <span className="text-right font-medium text-foreground tabular-nums">{txn.id}</span>
                </div>
              </div>
            );
          }

          if (hover.type === "region" && userFilterActive) return null;
          const r = regionByState.get(hover.state);
          if (!r) return null;
          const spend = spendingByState.get(hover.state) ?? 0;
          const insight = regionInsights.get(hover.state);
          return (
            <div
              className="pointer-events-none absolute z-30 rounded-lg border border-border bg-popover/95 backdrop-blur px-3 py-2 shadow-elevated animate-fade-in"
              style={{
                left: Math.min(hover.mx + 14, (containerRef.current?.clientWidth ?? 600) - 290),
                top: Math.max(hover.my - 10, 10),
              }}
            >
              <div className="text-sm font-semibold text-popover-foreground">{hover.state}</div>
              <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
                <span className="text-muted-foreground">Spending</span>
                <span className="text-right font-medium text-foreground tabular-nums">
                  RM {spend.toFixed(1)}M
                </span>
                <span className="text-muted-foreground">Transactions</span>
                <span className="text-right font-medium text-foreground tabular-nums">
                  {r.transactions.toLocaleString()}
                </span>
                <span className="text-muted-foreground">Growth</span>
                <span
                  className={`text-right font-medium tabular-nums ${
                    r.growth >= 0 ? "text-success" : "text-destructive"
                  }`}
                >
                  {r.growth >= 0 ? "+" : ""}
                  {r.growth.toFixed(1)}%
                </span>
                <span className="text-muted-foreground">B40</span>
                <span className="text-right font-medium text-foreground tabular-nums">
                  {insight ? insight.b40Count.toLocaleString() : "-"}
                </span>
                <span className="text-muted-foreground">N20</span>
                <span className="text-right font-medium text-foreground tabular-nums">
                  {insight ? insight.n20Count.toLocaleString() : "-"}
                </span>
                <span className="text-muted-foreground">T20</span>
                <span className="text-right font-medium text-foreground tabular-nums">
                  {insight ? insight.t20Count.toLocaleString() : "-"}
                </span>
                <span className="text-muted-foreground">Total Users</span>
                <span className="text-right font-medium text-foreground tabular-nums">
                  {insight ? insight.totalUsers.toLocaleString() : "-"}
                </span>
                <span className="text-muted-foreground">Avg spend/User</span>
                <span className="text-right font-medium text-foreground tabular-nums">
                  {insight ? `RM ${insight.avgSpendPerUser.toFixed(2)}` : "-"}
                </span>
                <span className="text-muted-foreground">Top category</span>
                <span className="text-right font-medium text-foreground">
                  {insight ? `${insight.topCategory} ${insight.topCategoryPct.toFixed(1)}%` : "-"}
                </span>
              </div>
            </div>
          );
        })()}
      {error && (
        <div className="pointer-events-none absolute bottom-2 left-2 right-2 rounded bg-destructive/90 px-2 py-1 text-[11px] text-destructive-foreground">
          {error}
        </div>
      )}
    </div>
  );
};

function LegendRow({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full border border-white/70"
        style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
      />
      <span className="tabular-nums">{label}</span>
    </div>
  );
}


