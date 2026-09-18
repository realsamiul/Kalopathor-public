import {addProtocol, removeProtocol, type RequestParameters} from 'maplibre-gl';
import {gibsTileUrl, TRANSPARENT_PNG, type GibsLayer} from './map-config';
import {logger} from './logger';

export function toArrayBuffer(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

/**
 * GIBS custom protocol: translates MapLibre WebMercator xyz into the GIBS
 * epsg4326 "250m" grid, carrying layer + date in the URL.
 * Shared by the operations console and the landing hero.
 */
export function registerGibsProtocol() {
  addProtocol(
    'gibs',
    async (params: RequestParameters, abortController: AbortController) => {
      try {
        const url = new URL(params.url);
        const layer = url.hostname as GibsLayer;
        const [, date, zs, xs, ys] = url.pathname.split('/');
        const z = Number(zs);
        const x = Number(xs);
        const y = Number(ys);
        const res = await fetch(gibsTileUrl(layer, date, z, x, y), {
          signal: abortController.signal
        });
        if (!res.ok) {
          // Date without coverage: transparent tile so the scrubber survives.
          return {data: toArrayBuffer(TRANSPARENT_PNG)};
        }
        const data = await res.arrayBuffer();
        return {data};
      } catch (err) {
        if ((err as Error)?.name !== 'AbortError') logger.warn('gibs tile error', err);
        return {data: toArrayBuffer(TRANSPARENT_PNG)};
      }
    }
  );
}

export function unregisterGibsProtocol() {
  removeProtocol('gibs');
}
