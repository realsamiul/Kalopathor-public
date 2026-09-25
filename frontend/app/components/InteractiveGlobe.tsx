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

  const focusOnBangladesh = useCallback(() => {
    if (!globeGroupRef.current) return;
    const targetY = -((90.4 + 90) * (Math.PI / 180));
    const targetX = 23.8 * (Math.PI / 180);
    globeGroupRef.current.rotation.y = targetY;
    globeGroupRef.current.rotation.x = targetX * 0.45;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = container.clientWidth;
    const height = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 2000);
    camera.position.set(0, 0, 290);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true, powerPreference: 'high-performance'});
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 2. Starfield Particle Background
    const starCount = 1600;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 1800;
      starPositions[i + 1] = (Math.random() - 0.5) * 1800;
      starPositions[i + 2] = -200 + (Math.random() - 0.5) * 1400;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.2,
      transparent: true,
      opacity: 0.65
    });
    const starPoints = new THREE.Points(starGeo, starMat);
    scene.add(starPoints);

    // 3. Globe Group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;

    // Initial orientation facing Bangladesh
    globeGroup.rotation.y = -((90.4 + 90) * (Math.PI / 180));
    globeGroup.rotation.x = 0.2;

    const GLOBE_RADIUS = 92;

    // 4. Texture Loader with earth-dark
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load('/data/earth-dark.jpg', () => {
      renderer.render(scene, camera);
    });

    const globeGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
    const globeMaterial = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.7,
      metalness: 0.15,
      color: 0xffffff,
      emissive: 0x050811,
      emissiveIntensity: 0.5
    });
    const globeMesh = new THREE.Mesh(globeGeometry, globeMaterial);
    globeGroup.add(globeMesh);

    // 5. Outer Atmospheric Halo
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
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0) * intensity * 0.7;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    globeGroup.add(atmosphereMesh);

    // 6. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 2.0);
    directionalLight1.position.set(220, 160, 200);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight2.position.set(-200, -120, -150);
    scene.add(directionalLight2);

    // 7. Spatial Nodes on Globe
    const markersGroup = new THREE.Group();
    globeGroup.add(markersGroup);

    SPATIAL_POINTS.forEach((pt) => {
      const pos = latLngToVector3(pt.lat, pt.lng, GLOBE_RADIUS, 0.8);

      const markerGeom = new THREE.SphereGeometry(pt.type === 'hub' ? 1.6 : 1.1, 16, 16);
      const markerMat = new THREE.MeshBasicMaterial({color: 0xffffff});
      const markerMesh = new THREE.Mesh(markerGeom, markerMat);
      markerMesh.position.copy(pos);
      markersGroup.add(markerMesh);

      const ringGeom = new THREE.RingGeometry(1.8, 2.5, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.position.copy(pos);
      ringMesh.lookAt(new THREE.Vector3(0, 0, 0));
      markersGroup.add(ringMesh);
    });

    // 8. 3D Trajectory Arcs
    const pFeni = latLngToVector3(23.0159, 91.3976, GLOBE_RADIUS);
    const pDhaka = latLngToVector3(23.8103, 90.4125, GLOBE_RADIUS);
    const pSylhet = latLngToVector3(24.8949, 91.8687, GLOBE_RADIUS);
    const pCtg = latLngToVector3(22.3569, 91.7832, GLOBE_RADIUS);

    const arcPairs = [
      {from: pSylhet, to: pDhaka},
      {from: pDhaka, to: pFeni},
      {from: pFeni, to: pCtg}
    ];

    arcPairs.forEach(({from, to}) => {
      const points = createArcCurve(from, to, 0.18);
      const curveGeo = new THREE.BufferGeometry().setFromPoints(points);
      const curveMat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        linewidth: 1.5,
        transparent: true,
        opacity: 0.65
      });
      const line = new THREE.Line(curveGeo, curveMat);
      globeGroup.add(line);
    });

    // 9. Polar Orbit
    const orbitRadius = GLOBE_RADIUS * 1.24;
    const orbitCurve = new THREE.EllipseCurve(0, 0, orbitRadius, orbitRadius * 0.96, 0, 2 * Math.PI, false, 0);
    const orbitPoints = orbitCurve.getPoints(100);
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(
      orbitPoints.map((p) => new THREE.Vector3(p.x, p.y, 0))
    );
    const orbitMat = new THREE.LineDashedMaterial({
      color: 0xffffff,
      dashSize: 3,
      gapSize: 2,
      transparent: true,
      opacity: 0.4
    });
    const orbitMesh = new THREE.Line(orbitGeo, orbitMat);
    orbitMesh.computeLineDistances();
    orbitMesh.rotation.x = Math.PI / 3;
    orbitMesh.rotation.y = Math.PI / 5;
    globeGroup.add(orbitMesh);

    // 10. Drag & Momentum
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

    // 11. Animation Loop
    let animationFrameId = 0;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (!isDragging) {
        if (autoRotate && globeGroupRef.current) {
          globeGroupRef.current.rotation.y += 0.0016;
        } else if (globeGroupRef.current) {
          velX *= 0.94;
          velY *= 0.94;
          globeGroupRef.current.rotation.y += velX;
          globeGroupRef.current.rotation.x += velY;
          globeGroupRef.current.rotation.x = Math.max(-1.1, Math.min(1.1, globeGroupRef.current.rotation.x));
        }
      }

      // Gentle starfield drift
      starPoints.rotation.y += 0.0001;

      renderer.render(scene, camera);
    };
    animate();

    // 12. Responsive Resize
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', handleResize);

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Line || obj instanceof THREE.Points) {
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
      {/* Three.js Canvas */}
      <div
        ref={containerRef}
        className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing"
      />

      {/* Floating HUD over Globe (Strictly White & Black Typography, No Boxes) */}
      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-6 sm:p-12">
        {/* Top Floating Telemetry & Reset Tool */}
        <div className="flex items-start justify-between">
          <div className="pointer-events-auto flex items-center gap-3">
            <span className="h-1.5 w-1.5 animate-ping rounded-full bg-white" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/90">
              3D ORBITAL MATRIX · 360° SWIVEL
            </span>
          </div>

          <button
            onClick={focusOnBangladesh}
            title="Re-center on Bangladesh"
            className="pointer-events-auto flex items-center gap-2 border-b border-white/30 pb-1 font-mono text-[11px] uppercase tracking-widest text-white transition-all hover:border-white"
          >
            <Compass size={13} />
            <span>Center Bengal Basin</span>
          </button>
        </div>

        {/* Central Gesture Cue (Fades on drag) */}
        {!isInteracting && (
          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            transition={{duration: 1, delay: 0.5}}
            className="pointer-events-none absolute bottom-32 left-1/2 -translate-x-1/2 text-center"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-white/50">
              Drag to swivel globe · Real-time C-Band radar pass
            </span>
          </motion.div>
        )}

        {/* Bottom Floating Stats & Inspector (Clean Minimalist Line Layout) */}
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          {/* Active Sensor Node Text */}
          <div className="pointer-events-auto max-w-md">
            <div className="flex items-center gap-3 text-white">
              <Radio size={13} className="text-white/80" />
              <span className="font-telegraf text-[14px] font-bold uppercase tracking-wider text-white">
                {selectedPoint?.name}
              </span>
              <span className="font-mono text-[10px] text-white/50">
                {selectedPoint?.lat.toFixed(2)}°N, {selectedPoint?.lng.toFixed(2)}°E
              </span>
            </div>
            <p className="mt-1 font-sweetsans text-[13px] text-white/70">
              {selectedPoint?.detail}
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              {SPATIAL_POINTS.map((pt) => (
                <button
                  key={pt.name}
                  onClick={() => setSelectedPoint(pt)}
                  className={`pb-0.5 font-mono text-[10px] uppercase tracking-wider transition-all ${
                    selectedPoint?.name === pt.name
                      ? 'border-b border-white text-white font-bold'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  {pt.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Filter Switcher */}
          <div className="pointer-events-auto flex items-center gap-5 border-b border-white/20 pb-1">
            <button
              onClick={() => setActiveTab('radar')}
              className={`flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider transition-all ${
                activeTab === 'radar' ? 'text-white font-bold border-b-2 border-white pb-1 -mb-1.5' : 'text-white/40 hover:text-white'
              }`}
            >
              <Eye size={12} />
              Radar S1
            </button>
            <button
              onClick={() => setActiveTab('telemetry')}
              className={`flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider transition-all ${
                activeTab === 'telemetry' ? 'text-white font-bold border-b-2 border-white pb-1 -mb-1.5' : 'text-white/40 hover:text-white'
              }`}
            >
              <Radio size={12} />
              Telemetry
            </button>
            <button
              onClick={() => setActiveTab('orbit')}
              className={`flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider transition-all ${
                activeTab === 'orbit' ? 'text-white font-bold border-b-2 border-white pb-1 -mb-1.5' : 'text-white/40 hover:text-white'
              }`}
            >
              <Layers size={12} />
              Orbit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
