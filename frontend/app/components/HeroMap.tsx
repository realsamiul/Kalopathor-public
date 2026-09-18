'use client';

import {Map as MapLibreMap, addProtocol, removeProtocol, setWorkerUrl, type GeoJSONSource} from 'maplibre-gl';
import {Protocol} from 'pmtiles';
import 'maplibre-gl/dist/maplibre-gl.css';
import {useEffect, useRef, useState} from 'react';
import {GIBS_EVENT_DATE, gibsProtocolUrl} from '@/lib/map-config';
import {registerGibsProtocol, unregisterGibsProtocol} from '@/lib/map-protocols';

interface HeroPolygons {
  bbox: [number, number, number, number];
  polygons: {polygon_id: number; area_km2: number; ring: number[][]}[];
}

/**
 * Cinematic satellite hero: the real GIBS VIIRS scene of the 2024-08-12 SAR
 * pass with the six largest detected polygons, plus a slow camera drift.
 * Renders invisible until the first frame paints (fallback = CSS texture).
 */
export default function HeroMap() {
  const container = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!container.current) return;
    setWorkerUrl('/lib/maplibre-gl-worker.mjs');
    addProtocol('pmtiles', new Protocol().tile);
    registerGibsProtocol();

    const map = new MapLibreMap({
      container: container.current,
      style: {
        version: 8,
        sources: {
          basemap: {
            type: 'raster',
            tiles: [gibsProtocolUrl('basemap', GIBS_EVENT_DATE)],
            tileSize: 512,
            minzoom: 0,
            maxzoom: 9
          },
          flood: {type: 'geojson', data: {type: 'FeatureCollection', features: []}}
        },
        layers: [
          {id: 'bg', type: 'background', paint: {'background-color': '#070b12'}},
          {
            id: 'basemap',
            type: 'raster',
            source: 'basemap',
            paint: {
              'raster-saturation': -0.3,
              'raster-brightness-min': 0.7,
              'raster-brightness-max': 0.82,
              'raster-contrast': 1.12,
              'raster-hue-rotate': -5,
              'raster-fade-duration': 0
            }
          },
          {
            id: 'flood-glow',
            type: 'line',
            source: 'flood',
            paint: {'line-color': '#ef4444', 'line-width': 4, 'line-opacity': 0.35, 'line-blur': 3}
          },
          {
            id: 'flood-fill',
            type: 'fill',
            source: 'flood',
            paint: {'fill-color': '#dc2626', 'fill-opacity': 0.5}
          },
          {
            id: 'flood-line',
            type: 'line',
            source: 'flood',
            paint: {'line-color': '#fca5a5', 'line-width': 1.4, 'line-opacity': 0.9}
          }
        ]
      },
      center: [91.1, 25.1],
      zoom: 6.35,
      minZoom: 5,
      maxZoom: 9,
      attributionControl: {compact: true, customAttribution: 'NASA GIBS · Kalopathor'},
      dragPan: false,
      dragRotate: false,

      scrollZoom: true,
      boxZoom: false,
      doubleClickZoom: false,
      keyboard: false
    });

    let readyFired = false;
    const markReady = () => {
      if (readyFired) return;
      readyFired = true;
      setReady(true);
    };
    map.on('load', markReady);
    map.on('render', markReady);
    const failTimer = setTimeout(() => setFailed(true), 20000);

    // Load the hero polygons
    fetch('/data/hero_polygons.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('hero polys'))))
      .then((d: HeroPolygons) => {
        const src = map.getSource('flood') as GeoJSONSource | undefined;
        src?.setData({
          type: 'FeatureCollection',
          features: d.polygons.map((p) => ({
            type: 'Feature',
            properties: {polygon_id: p.polygon_id, area_km2: p.area_km2},
            geometry: {type: 'Polygon', coordinates: [p.ring]}
          }))
        });
      })
      .catch((err) => console.warn('hero polygons failed', err));

    // Slow cinematic drift (stopped for reduced-motion users)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    if (!reduced) {
      const t0 = performance.now();
      const drift = (now: number) => {
        const t = (now - t0) / 1000;
        const cx = 91.1 + 0.16 * Math.sin((t / 41) * Math.PI * 2);
        const cy = 25.1 + 0.1 * Math.sin((t / 53) * Math.PI * 2 + 1.2);
        const z = 6.35 + 0.22 * Math.sin((t / 67) * Math.PI * 2 + 0.6);
        if (!map.isMoving()) {
          map.easeTo({center: [cx, cy], zoom: z, duration: 2000});
        }
        raf = requestAnimationFrame(drift);
      };
      raf = requestAnimationFrame(drift);
    }

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(failTimer);
      removeProtocol('pmtiles');
      unregisterGibsProtocol();
      map.remove();
    };
  }, []);

  if (failed) return null;

  return (
    <div
      ref={container}
      aria-hidden
      className={`absolute inset-0 transition-opacity duration-[1800ms] ease-out ${
        ready ? 'opacity-100' : 'opacity-0'
      }`}
    />
  );
}
