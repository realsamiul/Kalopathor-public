'use client';

import React, {useEffect, useRef, useState, useCallback} from 'react';
import * as THREE from 'three';
import {motion} from 'framer-motion';
import {Compass, Radio, Eye, Layers} from 'lucide-react';

interface PointCoordinate {
  lat: number;
  lng: number;
  name: string;
  type: 'hub' | 'sensor' | 'pass';
  detail: string;
}

const SPATIAL_POINTS: PointCoordinate[] = [
  {lat: 23.0159, lng: 91.3976, name: 'Feni Basin (Epicenter)', type: 'hub', detail: 'd3v4.2 IoU 0.5338 · 184k Pop'},
  {lat: 23.8103, lng: 90.4125, name: 'Dhaka Command Center', type: 'hub', detail: 'FFWC Telemetry Ingestion Node'},
  {lat: 24.8949, lng: 91.8687, name: 'Sylhet Haor Basin', type: 'sensor', detail: 'Upstream Transboundary Flash Risk'},
  {lat: 22.3569, lng: 91.7832, name: 'Chittagong Coastal Shelf', type: 'sensor', detail: 'Tidal Fluvial Backwater Surcharging'},
  {lat: 24.4534, lng: 89.7008, name: 'Sirajganj (Jamuna)', type: 'sensor', detail: 'Braided River Bankline Migration'}
];

// Helper to convert lat/long to 3D Cartesian coordinates on sphere
function latLngToVector3(lat: number, lng: number, radius: number, alt = 0): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const r = radius + alt;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

// Generate curved 3D geodesic arc between two points
function createArcCurve(p1: THREE.Vector3, p2: THREE.Vector3, maxHeight: number): THREE.Vector3[] {
  const distance = p1.distanceTo(p2);
  const mid = p1.clone().add(p2).multiplyScalar(0.5);
  const midLength = mid.length();
  mid.normalize().multiplyScalar(midLength + distance * maxHeight);

  const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
  return curve.getPoints(50);
}

export default function InteractiveGlobe() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedPoint, setSelectedPoint] = useState<PointCoordinate | null>(SPATIAL_POINTS[0]);
  const [isInteracting, setIsInteracting] = useState(false);
  const [activeTab, setActiveTab] = useState<'radar' | 'telemetry' | 'orbit'>('radar');

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);

  // Center to Bangladesh smoothly
  const focusOnBangladesh = useCallback(() => {
    if (!globeGroupRef.current) return;
    // Target rotation where Bangladesh (lat 23.8, lng 90.4) faces camera (+Z)
    const targetY = -((90.4 + 90) * (Math.PI / 180));
    const targetX = 23.8 * (Math.PI / 180);
    globeGroupRef.current.rotation.y = targetY;
    globeGroupRef.current.rotation.x = targetX * 0.5;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = container.clientWidth;
    const height = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(0, 0, 280);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true, powerPreference: 'high-performance'});
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const globeGroup = new THREE.Group();
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;

    // Initial orientation: Bangladesh centered
    globeGroup.rotation.y = -((90.4 + 90) * (Math.PI / 180));
    globeGroup.rotation.x = 0.22;

    const GLOBE_RADIUS = 90;

    // 2. Texture Loader with earth-dark
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load('/data/earth-dark.jpg', () => {
      renderer.render(scene, camera);
    });

    // 3. Globe Sphere
    const globeGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
    const globeMaterial = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.65,
      metalness: 0.2,
      color: 0xe2e8f0,
      emissive: 0x0a101d,
      emissiveIntensity: 0.4
    });
    const globeMesh = new THREE.Mesh(globeGeometry, globeMaterial);
    globeGroup.add(globeMesh);

    // 4. Outer Atmospheric Specular Halo / Glass Sphere (IMG_4965 inspo)
    const atmosphereGeometry = new THREE.SphereGeometry(GLOBE_RADIUS * 1.025, 48, 48);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.68 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.2);
          gl_FragColor = vec4(0.18, 0.83, 0.75, 1.0) * intensity * 0.75;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    globeGroup.add(atmosphereMesh);

    // 5. Specular Inner Ambient Light (Warm Amber / Cyan glow like IMG_4965)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0x2dd4bf, 2.2); // Cyan key
    directionalLight1.position.set(200, 150, 200);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xf59e0b, 1.4); // Warm amber rim
    directionalLight2.position.set(-200, -100, -150);
    scene.add(directionalLight2);

    // 6. Add Spatial Hub Points and Pulsing Beacons
    const markersGroup = new THREE.Group();
    globeGroup.add(markersGroup);

    SPATIAL_POINTS.forEach((pt) => {
      const pos = latLngToVector3(pt.lat, pt.lng, GLOBE_RADIUS, 0.8);

      // Marker Core
      const markerGeom = new THREE.SphereGeometry(pt.type === 'hub' ? 1.6 : 1.1, 16, 16);
      const markerMat = new THREE.MeshBasicMaterial({
        color: pt.type === 'hub' ? 0x2dd4bf : 0xfbbf24
      });
      const markerMesh = new THREE.Mesh(markerGeom, markerMat);
      markerMesh.position.copy(pos);
      markersGroup.add(markerMesh);

      // Pulsing Ring for Feni / Hubs
      const ringGeom = new THREE.RingGeometry(1.8, 2.6, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: pt.type === 'hub' ? 0x2dd4bf : 0x818cf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.position.copy(pos);
      ringMesh.lookAt(new THREE.Vector3(0, 0, 0));
      markersGroup.add(ringMesh);
    });

    // 7. Add 3D Trajectory Arcs (IMG_4967 inspo)
    const pFeni = latLngToVector3(23.0159, 91.3976, GLOBE_RADIUS);
    const pDhaka = latLngToVector3(23.8103, 90.4125, GLOBE_RADIUS);
    const pSylhet = latLngToVector3(24.8949, 91.8687, GLOBE_RADIUS);
    const pCtg = latLngToVector3(22.3569, 91.7832, GLOBE_RADIUS);

    const arcPairs = [
      {from: pSylhet, to: pDhaka, color: 0x818cf8},
      {from: pDhaka, to: pFeni, color: 0x2dd4bf},
      {from: pFeni, to: pCtg, color: 0xfbbf24}
    ];

    arcPairs.forEach(({from, to, color}) => {
      const points = createArcCurve(from, to, 0.18);
      const curveGeo = new THREE.BufferGeometry().setFromPoints(points);
      const curveMat = new THREE.LineBasicMaterial({
        color,
        linewidth: 2,
        transparent: true,
        opacity: 0.75
      });
      const line = new THREE.Line(curveGeo, curveMat);
      globeGroup.add(line);
    });

    // 8. Sentinel-1 Polar Orbital Pass Ring
    const orbitRadius = GLOBE_RADIUS * 1.25;
    const orbitCurve = new THREE.EllipseCurve(0, 0, orbitRadius, orbitRadius * 0.96, 0, 2 * Math.PI, false, 0);
    const orbitPoints = orbitCurve.getPoints(100);
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(
      orbitPoints.map((p) => new THREE.Vector3(p.x, p.y, 0))
    );
    const orbitMat = new THREE.LineDashedMaterial({
      color: 0x2dd4bf,
      dashSize: 3,
      gapSize: 2,
      transparent: true,
      opacity: 0.45
    });
    const orbitMesh = new THREE.Line(orbitGeo, orbitMat);
    orbitMesh.computeLineDistances();
    orbitMesh.rotation.x = Math.PI / 3;
    orbitMesh.rotation.y = Math.PI / 5;
    globeGroup.add(orbitMesh);

    // 9. Interactive Touch / Mouse Drag Rotation & Inertia
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let velX = 0;
    let velY = 0;
    let autoRotate = true;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      autoRotate = false;
      setIsInteracting(true);
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
      velX = 0;
      velY = 0;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouseX;
      const dy = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      velX = dx * 0.005;
      velY = dy * 0.005;

      if (globeGroupRef.current) {
        globeGroupRef.current.rotation.y += velX;
        globeGroupRef.current.rotation.x += velY;
        // Limit X pitch to prevent flipping upside down
        globeGroupRef.current.rotation.x = Math.max(-1.1, Math.min(1.1, globeGroupRef.current.rotation.x));
      }
    };

    const onPointerUp = () => {
      isDragging = false;
      setTimeout(() => {
        setIsInteracting(false);
        autoRotate = true;
      }, 3500);
    };

    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // 10. Animation Loop
    let animationFrameId = 0;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (!isDragging) {
        if (autoRotate && globeGroupRef.current) {
          globeGroupRef.current.rotation.y += 0.0018;
        } else if (globeGroupRef.current) {
          velX *= 0.94;
          velY *= 0.94;
          globeGroupRef.current.rotation.y += velX;
          globeGroupRef.current.rotation.x += velY;
          globeGroupRef.current.rotation.x = Math.max(-1.1, Math.min(1.1, globeGroupRef.current.rotation.x));
        }
      }

      // Atmospheric rotation & pulse
      atmosphereMesh.rotation.y -= 0.0006;

      renderer.render(scene, camera);
    };
    animate();

    // 11. Responsive Resize
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Skill cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', handleResize);

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Line) {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach((m) => m.dispose());
            } else {
              obj.material.dispose();
            }
          }
        }
      });
      renderer.dispose();
      if (dom.parentElement) {
        dom.parentElement.removeChild(dom);
      }
    };
  }, []);

  return (
    <div className="relative h-full w-full select-none overflow-hidden">
      {/* Three.js Canvas Container */}
      <div
        ref={containerRef}
        className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing"
      />

      {/* Floating HUD & Inspo Tabs (IMG_4966 & IMG_4967 style) */}
      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-6 sm:p-10">
        {/* Top Floating Telemetry & Reset Tool */}
        <div className="flex items-start justify-between">
          <div className="glass pointer-events-auto flex items-center gap-2 rounded-full px-3.5 py-1.5 backdrop-blur-md">
            <span className="h-2 w-2 animate-ping rounded-full bg-accent" />
            <span className="font-mono text-[10.5px] uppercase tracking-widest text-mist-1">
              3D ORBITAL RADAR MATRIX
            </span>
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
            <button
              onClick={focusOnBangladesh}
              title="Re-center on Bangladesh"
              className="glass group flex h-9 items-center gap-2 rounded-xl px-3 font-mono text-[11px] text-mist-2 transition-all hover:border-accent hover:text-accent"
            >
              <Compass size={14} className="transition-transform group-hover:rotate-45" />
              <span>Center Bengal Basin</span>
            </button>
          </div>
        </div>

        {/* Central Gesture Cue (Fades on drag) */}
        {!isInteracting && (
          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            transition={{duration: 1, delay: 0.5}}
            className="pointer-events-none absolute bottom-28 left-1/2 -translate-x-1/2 text-center"
          >
            <span className="glass rounded-full px-4 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.25em] text-mist-3 shadow-panel">
              Drag to rotate & swivel · 360° Microwave Globe
            </span>
          </motion.div>
        )}

        {/* Bottom Floating Stats Strip & Inspector (IMG_4966 Inspo) */}
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:items-end">
          {/* Active Sensor Node Badge */}
          <div className="glass-card pointer-events-auto w-full max-w-sm rounded-2xl p-4.5">
            <div className="flex items-center justify-between border-b border-line/60 pb-2.5">
              <span className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-wider text-accent">
                <Radio size={13} /> {selectedPoint?.name}
              </span>
              <span className="font-mono text-[10px] text-mist-3">
                {selectedPoint?.lat.toFixed(2)}°N, {selectedPoint?.lng.toFixed(2)}°E
              </span>
            </div>
            <p className="mt-2 text-[12.5px] text-mist-2">
              {selectedPoint?.detail}
            </p>
            <div className="mt-3 flex gap-1.5">
              {SPATIAL_POINTS.map((pt) => (
                <button
                  key={pt.name}
                  onClick={() => setSelectedPoint(pt)}
                  className={`rounded-md px-2 py-1 font-mono text-[9.5px] transition-all ${
                    selectedPoint?.name === pt.name
                      ? 'bg-accent/20 text-accent border border-accent/40'
                      : 'bg-ink-2/60 text-mist-3 hover:text-mist-1'
                  }`}
                >
                  {pt.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Filter Switcher (Overview, Telemetry, Orbit - IMG_4966) */}
          <div className="glass pointer-events-auto flex items-center gap-1 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('radar')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[11px] uppercase transition-all ${
                activeTab === 'radar' ? 'bg-accent text-ink-0 font-bold' : 'text-mist-3 hover:text-mist-1'
              }`}
            >
              <Eye size={12} />
              Radar S1
            </button>
            <button
              onClick={() => setActiveTab('telemetry')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[11px] uppercase transition-all ${
                activeTab === 'telemetry' ? 'bg-accent text-ink-0 font-bold' : 'text-mist-3 hover:text-mist-1'
              }`}
            >
              <Radio size={12} />
              Telemetry
            </button>
            <button
              onClick={() => setActiveTab('orbit')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[11px] uppercase transition-all ${
                activeTab === 'orbit' ? 'bg-accent text-ink-0 font-bold' : 'text-mist-3 hover:text-mist-1'
              }`}
            >
              <Layers size={12} />
              Orbit Pass
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
