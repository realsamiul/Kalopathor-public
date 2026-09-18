'use client';

import React, {useEffect, useRef, useState, useCallback} from 'react';
import * as THREE from 'three';

export interface ThreePlatformSceneProps {
  activeStage: number; // 0 to 5
  scrollProgress: number; // 0.0 to 1.0 overall
  onStageSelect?: (stageIndex: number) => void;
  className?: string;
}

export const STAGE_CONFIGS = [
  {
    id: 'orbit',
    num: '01',
    titleEn: 'Orbital SAR Ingestion',
    titleBn: 'অরবিটাল SAR রাডার স্ক্যান',
    tag: 'SENTINEL-1 C-BAND · 30M RESOLUTION',
    camPos: new THREE.Vector3(16, 11, 20),
    lookAt: new THREE.Vector3(0, 0, 0),
    descEn: 'Cloud-penetrating 5.405 GHz radar sweeping through monsoon cloud cover to capture raw VV and VH backscatter across the Bengal basin.',
    descBn: 'বর্ষার ঘন মেঘ ভেদ করে ৫.৪০৫ গিগাহার্জ C-ব্যান্ড রাডারে পুরো অববাহিকার VV ও VH ব্যাকস্ক্যাটার লাইভ ক্যাপচার।'
  },
  {
    id: 'channels',
    num: '02',
    titleEn: '6-Channel Neural Tensor',
    titleBn: '৬-চ্যানেল নিউরাল ডিকম্পোজিশন',
    tag: 'MULTIMODAL DECOMPOSITION · 6.3M PARAMS',
    camPos: new THREE.Vector3(13, 6, 17),
    lookAt: new THREE.Vector3(0, 0.5, 0),
    descEn: 'VV/VH backscatter coupled with Copernicus DEM 90m, HAND relative hydrology, JRC water masks, and dry-season CHANGE composites fed into EfficientNet-B0 U-Net.',
    descBn: 'VV ও VH ব্যাকস্ক্যাটারের সাথে DEM, HAND হাইড্রোলজি, JRC ওয়াটার মাস্ক ও পরিবর্তন ভেক্টর একত্রিত করে U-Net মডেলে বিশ্লেষণ।'
  },
  {
    id: 'inundation',
    num: '03',
    titleEn: '1,199 Inundation Polygons',
    titleBn: '১,১৯৯ প্লাবন পলিগন ভেক্টরাইজেশন',
    tag: 'OPS MODEL d3v4.2 · τ=0.5 · 21,954 KM²',
    camPos: new THREE.Vector3(0, 17, 15),
    lookAt: new THREE.Vector3(0, -1, 0),
    descEn: 'Raw sigmoid probabilities converted to verified vector flood polygons at threshold τ=0.5, mapping 21,954 km² of active surface inundation across Bangladesh.',
    descBn: 'কাঁচা সিগময়েড আউটপুট থেকে τ=০.৫ থ্রেশহোল্ডে ২১,৯৫৪ বর্গ কিমি জুড়ে ১,১৯৯টি নিখুঁত প্লাবন পলিগন ভেক্টরে রূপান্তর।'
  },
  {
    id: 'exposure',
    num: '04',
    titleEn: '64-District Exposure Impact',
    titleBn: '৬৪ জেলা জনসংখ্যা ও ঝুঁকি ম্যাপিং',
    tag: 'WORLDPOP 2024 · 20.5M EXPOSED POPULATION',
    camPos: new THREE.Vector3(14, 13, 16),
    lookAt: new THREE.Vector3(1, 0.5, 0),
    descEn: 'High-resolution 100m population raster cross-referenced with active inundation vectors to calculate exact vulnerable citizens across all 8 divisions.',
    descBn: '১০০ মিটার হাই-রেজোলিউশন জনসংখ্যার তথ্যের সাথে প্লাবন ভেক্টরের মিলনে মোট ২ কোটি ৪ লাখ মানুষের বিপদাপন্নতা নির্ণয়।'
  },
  {
    id: 'gauges',
    num: '05',
    titleEn: '115 FFWC River Telemetry',
    titleBn: '১১৫ FFWC নদী গেজ ও হাইড্রোমেট্রি',
    tag: 'REAL-TIME TELEMETRY + GLOFAS ENSEMBLE',
    camPos: new THREE.Vector3(-13, 9, 16),
    lookAt: new THREE.Vector3(0, 0, 0),
    descEn: 'Physical river gauge heights combined with 10-day GloFAS hydrographs to continuously calibrate satellite detections against river crests.',
    descBn: '১১৫টি নদী স্টেশনের ফিজিক্যাল ওয়াটার লেভেল ও ১০ দিনের GloFAS হাইড্রোমেট্রিক পূর্বাভাসের সাথে স্যাটেলাইট পর্যবেক্ষণের যাচাই।'
  },
  {
    id: 'alert',
    num: '06',
    titleEn: 'Automated CAP 1.2 Dispatch',
    titleBn: 'স্বয়ংক্রিয় CAP ১.২ জরুরি সতর্কবার্তা',
    tag: 'OASIS STANDARD · BILINGUAL DRAFT · G3 GATE',
    camPos: new THREE.Vector3(0, 20, 24),
    lookAt: new THREE.Vector3(0, 0, 0),
    descEn: 'Bilingual alert synthesis with G3 multi-sensor corroboration. Strict "review_required" validation prevents automated false alarms.',
    descBn: 'G3 মাল্টি-সেন্সর সত্যতা যাচাই সাপেক্ষে বাংলা ও ইংরেজিতে জরুরি CAP ১.২ অ্যালার্ট খসড়া প্রস্তুতকরণ।'
  }
];

export default function ThreePlatformScene({
  activeStage,
  scrollProgress,
  onStageSelect,
  className = ''
}: ThreePlatformSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const scrollProgressRef = useRef(scrollProgress);
  useEffect(() => {
    scrollProgressRef.current = scrollProgress;
  }, [scrollProgress]);

  // Group references
  const rootGroupRef = useRef<THREE.Group | null>(null);
  const orbitGroupRef = useRef<THREE.Group | null>(null);
  const channelGroupRef = useRef<THREE.Group | null>(null);
  const inundationGroupRef = useRef<THREE.Group | null>(null);
  const exposureGroupRef = useRef<THREE.Group | null>(null);
  const gaugeGroupRef = useRef<THREE.Group | null>(null);
  const alertGroupRef = useRef<THREE.Group | null>(null);

  // Dynamic animation elements
  const satelliteRef = useRef<THREE.Group | null>(null);
  const radarConeRef = useRef<THREE.Mesh | null>(null);
  const radarRingsRef = useRef<THREE.Group | null>(null);
  const channelPlanesRef = useRef<THREE.Mesh[]>([]);
  const neuralLinesRef = useRef<THREE.LineSegments | null>(null);
  const floodMeshRef = useRef<THREE.Mesh | null>(null);
  const riverStreamsRef = useRef<THREE.Points | null>(null);
  const exposurePillarsRef = useRef<{mesh: THREE.Mesh; targetHeight: number; initialY: number}[]>([]);
  const gaugePinsRef = useRef<THREE.Mesh[]>([]);
  const alertWavesRef = useRef<THREE.Mesh[]>([]);

  // Mouse & interaction state
  const mouseRef = useRef<{x: number; y: number; targetX: number; targetY: number}>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0
  });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({x: 0, y: 0});
  const userRotationRef = useRef({x: 0, y: 0});
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [webGlSupported, setWebGlSupported] = useState(true);

  // Handle pointer movements for subtle parallax tilt
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!mountRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

    if (isDraggingRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      userRotationRef.current.y += dx * 0.005;
      userRotationRef.current.x += dy * 0.005;
      dragStartRef.current = {x: e.clientX, y: e.clientY};
    } else {
      mouseRef.current.targetX = nx * 0.4;
      mouseRef.current.targetY = ny * 0.3;
    }
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDraggingRef.current = true;
    dragStartRef.current = {x: e.clientX, y: e.clientY};
    setIsUserInteracting(true);
  }, []);

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const handleResetView = useCallback(() => {
    userRotationRef.current = {x: 0, y: 0};
    setIsUserInteracting(false);
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check WebGL availability
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) {
        setWebGlSupported(false);
        return;
      }
    } catch {
      setWebGlSupported(false);
      return;
    }

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x040711, 0.02);

    // Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.copy(STAGE_CONFIGS[0].camPos);
    camera.lookAt(STAGE_CONFIGS[0].lookAt);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Root Group
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);
    rootGroupRef.current = rootGroup;

    // -------------------------------------------------------------
    // Lighting
    // -------------------------------------------------------------
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.2);
    dirLight.position.set(20, 30, 20);
    scene.add(dirLight);

    const pointCyan = new THREE.PointLight(0x38bdf8, 3.5, 60);
    pointCyan.position.set(-15, 12, 10);
    scene.add(pointCyan);

    const pointViolet = new THREE.PointLight(0x818cf8, 2.8, 60);
    pointViolet.position.set(15, -8, -10);
    scene.add(pointViolet);

    // -------------------------------------------------------------
    // Cosmic Background Particles & Orbital Dust Field
    // -------------------------------------------------------------
    const dustCount = 450;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    const dustColors = new Float32Array(dustCount * 3);

    for (let i = 0; i < dustCount; i++) {
      const r = 25 + Math.random() * 45;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      dustPos[i * 3] = r * Math.cos(phi) * Math.cos(theta);
      dustPos[i * 3 + 1] = r * Math.sin(phi);
      dustPos[i * 3 + 2] = r * Math.cos(phi) * Math.sin(theta);

      // White/cyan luminous particle palette
      const isCyan = Math.random() > 0.4;
      dustColors[i * 3] = isCyan ? 0.4 : 1.0;
      dustColors[i * 3 + 1] = isCyan ? 0.85 : 1.0;
      dustColors[i * 3 + 2] = 1.0;
    }

    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    dustGeo.setAttribute('color', new THREE.BufferAttribute(dustColors, 3));

    const dustMat = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
    const dustPoints = new THREE.Points(dustGeo, dustMat);
    scene.add(dustPoints);

    // -------------------------------------------------------------
    // STAGE 01: Orbit & Sentinel-1 Satellite & Microwave Radar
    // -------------------------------------------------------------
    const orbitGroup = new THREE.Group();
    rootGroup.add(orbitGroup);
    orbitGroupRef.current = orbitGroup;

    // Digital Earth Globe
    const globeGeo = new THREE.SphereGeometry(6, 48, 48);
    const globeMat = new THREE.MeshStandardMaterial({
      color: 0x07111e,
      roughness: 0.85,
      metalness: 0.2,
      wireframe: false
    });
    const globe = new THREE.Mesh(globeGeo, globeMat);
    orbitGroup.add(globe);

    // Lat/Long Wireframe Shell
    const wireGeo = new THREE.SphereGeometry(6.05, 24, 24);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.15
    });
    const wireShell = new THREE.Mesh(wireGeo, wireMat);
    orbitGroup.add(wireShell);

    // Atmosphere Glow Rim
    const atmosGeo = new THREE.SphereGeometry(6.4, 32, 32);
    const atmosMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide
    });
    const atmos = new THREE.Mesh(atmosGeo, atmosMat);
    orbitGroup.add(atmos);

    // Bangladesh Highlight Beacon on Globe (approx lat 23.7° N, lon 90.4° E)
    const bdLat = (23.7 * Math.PI) / 180;
    const bdLon = (90.4 * Math.PI) / 180;
    const bdR = 6.08;
    const bdX = bdR * Math.cos(bdLat) * Math.sin(bdLon);
    const bdY = bdR * Math.sin(bdLat);
    const bdZ = bdR * Math.cos(bdLat) * Math.cos(bdLon);

    const bdTarget = new THREE.Vector3(bdX, bdY, bdZ);
    const bdMarkerGeo = new THREE.RingGeometry(0.12, 0.45, 24);
    const bdMarkerMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const bdMarker = new THREE.Mesh(bdMarkerGeo, bdMarkerMat);
    bdMarker.position.copy(bdTarget);
    bdMarker.lookAt(bdTarget.clone().multiplyScalar(2));
    orbitGroup.add(bdMarker);

    // Orbit Ring Path
    const orbitCurve = new THREE.EllipseCurve(0, 0, 9.8, 9.8, 0, 2 * Math.PI, false, 0);
    const orbitPoints = orbitCurve.getPoints(100);
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(
      orbitPoints.map((p) => new THREE.Vector3(p.x, p.y * 0.35, p.y * 0.93))
    );
    const orbitMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45
    });
    const orbitLine = new THREE.Line(orbitGeo, orbitMat);
    orbitGroup.add(orbitLine);

    // Sentinel-1 Satellite 3D Model
    const satellite = new THREE.Group();
    satellite.position.set(6.2, 5.8, 5.2);
    orbitGroup.add(satellite);
    satelliteRef.current = satellite;

    // Satellite Bus Body
    const busGeo = new THREE.BoxGeometry(0.9, 0.6, 1.4);
    const busMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.2
    });
    const bus = new THREE.Mesh(busGeo, busMat);
    satellite.add(bus);

    // SAR C-band Antenna Array (Long rectangular planar array)
    const antGeo = new THREE.BoxGeometry(2.8, 0.1, 0.5);
    const antMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      metalness: 0.9
    });
    const antenna = new THREE.Mesh(antGeo, antMat);
    antenna.position.set(0, -0.38, 0.3);
    satellite.add(antenna);

    // Twin Solar Arrays
    const wingGeo = new THREE.BoxGeometry(3.6, 0.05, 0.9);
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      emissive: 0x1e3a8a,
      emissiveIntensity: 0.3,
      metalness: 0.7,
      roughness: 0.3
    });
    const wingLeft = new THREE.Mesh(wingGeo, wingMat);
    wingLeft.position.set(2.4, 0, 0);
    satellite.add(wingLeft);

    const wingRight = new THREE.Mesh(wingGeo, wingMat);
    wingRight.position.set(-2.4, 0, 0);
    satellite.add(wingRight);

    // Satellite blinking beacon LED
    const ledGeo = new THREE.SphereGeometry(0.08, 12, 12);
    const ledMat = new THREE.MeshBasicMaterial({color: 0x22c55e});
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(0, 0.35, 0.7);
    satellite.add(led);

    // Radar Scanning Beam (Translucent cone from satellite to BD target)
    const coneDist = satellite.position.distanceTo(bdTarget);
    const coneGeo = new THREE.CylinderGeometry(0.1, 2.2, coneDist, 24, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    const radarCone = new THREE.Mesh(coneGeo, coneMat);
    // Orient cone along beam line
    radarCone.position.copy(satellite.position.clone().add(bdTarget).multiplyScalar(0.5));
    radarCone.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      bdTarget.clone().sub(satellite.position).normalize()
    );
    orbitGroup.add(radarCone);
    radarConeRef.current = radarCone;

    // Expanding Radar Wavefront Rings
    const radarRings = new THREE.Group();
    radarRings.position.copy(bdTarget);
    radarRings.lookAt(satellite.position);
    orbitGroup.add(radarRings);
    radarRingsRef.current = radarRings;

    for (let i = 0; i < 3; i++) {
      const ringGeo = new THREE.RingGeometry(0.2, 0.3, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.userData = {phase: i / 3};
      radarRings.add(ring);
    }

    // -------------------------------------------------------------
    // STAGE 02: 6-Channel Neural Decomposition Tensor Stack
    // -------------------------------------------------------------
    const channelGroup = new THREE.Group();
    channelGroup.visible = false;
    rootGroup.add(channelGroup);
    channelGroupRef.current = channelGroup;

    const channelColors = [
      0x38bdf8, // Ch 0: VV Backscatter (Cyan)
      0x818cf8, // Ch 1: VH Cross-Polarization (Violet)
      0x10b981, // Ch 2: Copernicus DEM 90m (Emerald)
      0x2dd4bf, // Ch 3: HAND Hydrology (Teal)
      0x3b82f6, // Ch 4: JRC Surface Water (Blue)
      0xf43f5e // Ch 5: Differential CHANGE (Rose)
    ];

    const planeMeshes: THREE.Mesh[] = [];
    const layerSpacing = 1.35;

    for (let i = 0; i < 6; i++) {
      const planeGeo = new THREE.PlaneGeometry(8, 4.8, 16, 10);
      const col = channelColors[i];

      const planeMat = new THREE.MeshStandardMaterial({
        color: col,
        emissive: col,
        emissiveIntensity: 0.25,
        transparent: true,
        opacity: 0.38,
        side: THREE.DoubleSide,
        roughness: 0.2,
        metalness: 0.8
      });

      const plane = new THREE.Mesh(planeGeo, planeMat);
      // Stack along Y and tilt for dramatic 3D isometric view
      const targetY = (i - 2.5) * layerSpacing;
      plane.position.set(0, targetY, 0);
      plane.rotation.x = -Math.PI * 0.32;
      plane.rotation.z = Math.PI * 0.08;

      // Add glowing border edges
      const edgeGeo = new THREE.EdgesGeometry(planeGeo);
      const edgeMat = new THREE.LineBasicMaterial({
        color: col,
        linewidth: 2,
        transparent: true,
        opacity: 0.95
      });
      const edgeLine = new THREE.LineSegments(edgeGeo, edgeMat);
      plane.add(edgeLine);

      channelGroup.add(plane);
      planeMeshes.push(plane);
    }
    channelPlanesRef.current = planeMeshes;

    // Neural Connection Filaments (lines connecting layers to central U-Net cluster)
    const neuralLinePoints: THREE.Vector3[] = [];
    const centerNode = new THREE.Vector3(6.5, 0, 0);

    for (let i = 0; i < 6; i++) {
      const startP = new THREE.Vector3(3.8, (i - 2.5) * layerSpacing, 0);
      neuralLinePoints.push(startP);
      neuralLinePoints.push(centerNode);
    }

    const neuralGeo = new THREE.BufferGeometry().setFromPoints(neuralLinePoints);
    const neuralMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.6
    });
    const neuralLines = new THREE.LineSegments(neuralGeo, neuralMat);
    channelGroup.add(neuralLines);
    neuralLinesRef.current = neuralLines;

    // Central U-Net Neural Node
    const uNetCoreGeo = new THREE.IcosahedronGeometry(0.75, 2);
    const uNetCoreMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.9,
      wireframe: true
    });
    const uNetCore = new THREE.Mesh(uNetCoreGeo, uNetCoreMat);
    uNetCore.position.copy(centerNode);
    channelGroup.add(uNetCore);

    // -------------------------------------------------------------
    // STAGE 03: Inundation Topographic Mesh & 1,199 Polygons
    // -------------------------------------------------------------
    const inundationGroup = new THREE.Group();
    inundationGroup.visible = false;
    rootGroup.add(inundationGroup);
    inundationGroupRef.current = inundationGroup;

    // Topographic Terrain Plane with Delta Elevation
    const terrainGeo = new THREE.PlaneGeometry(16, 12, 64, 48);
    const posAttr = terrainGeo.attributes.position;

    // Procedural delta topography: high northern plateaus sloping down to southern Bay of Bengal
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vy = posAttr.getY(i);
      // North is +vy, South is -vy
      const elevation =
        Math.max(0, (vy + 4) * 0.18) +
        Math.sin(vx * 0.8) * Math.cos(vy * 0.6) * 0.35 +
        Math.sin(vx * 2.1) * 0.15;
      posAttr.setZ(i, elevation);
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x091220,
      roughness: 0.85,
      metalness: 0.15,
      wireframe: false
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.rotation.x = -Math.PI * 0.42;
    terrainMesh.position.set(0, -1, 0);
    inundationGroup.add(terrainMesh);

    // Wireframe Topographic Contour Overlay
    const terrainWireMat = new THREE.MeshBasicMaterial({
      color: 0x1e293b,
      wireframe: true,
      transparent: true,
      opacity: 0.45
    });
    const terrainWire = new THREE.Mesh(terrainGeo, terrainWireMat);
    terrainWire.rotation.x = -Math.PI * 0.42;
    terrainWire.position.set(0, -0.98, 0);
    inundationGroup.add(terrainWire);

    // Glowing Neon Flood Polygon Layer (Extruded dynamic water mesh)
    const floodGeo = new THREE.PlaneGeometry(14, 10, 48, 36);
    const floodPos = floodGeo.attributes.position;
    for (let i = 0; i < floodPos.count; i++) {
      const fx = floodPos.getX(i);
      const fy = floodPos.getY(i);
      // Flood pools in Sylhet haors (east/north) and southern lowlands
      const pool = Math.sin(fx * 1.5 + 1.2) * Math.cos(fy * 1.2) * 0.25;
      floodPos.setZ(i, pool + 0.12);
    }
    floodGeo.computeVertexNormals();

    const floodMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0284c7,
      emissiveIntensity: 0.7,
      transparent: true,
      opacity: 0.65,
      roughness: 0.1,
      metalness: 0.9
    });
    const floodMesh = new THREE.Mesh(floodGeo, floodMat);
    floodMesh.rotation.x = -Math.PI * 0.42;
    floodMesh.position.set(0, -0.85, 0);
    inundationGroup.add(floodMesh);
    floodMeshRef.current = floodMesh;

    // River Flowing Particle Streams (Jamuna, Padma, Meghna)
    const streamCount = 280;
    const streamGeo = new THREE.BufferGeometry();
    const streamPositions = new Float32Array(streamCount * 3);

    for (let i = 0; i < streamCount; i++) {
      const t = i / streamCount;
      // Meandering river curve from North to South Bay
      const rx = Math.sin(t * Math.PI * 2.5) * 2.2 + (Math.random() - 0.5) * 0.6;
      const ry = 4 - t * 8;
      const rz = 0.2 + Math.random() * 0.15;

      streamPositions[i * 3] = rx;
      streamPositions[i * 3 + 1] = ry;
      streamPositions[i * 3 + 2] = rz;
    }

    streamGeo.setAttribute('position', new THREE.BufferAttribute(streamPositions, 3));
    const streamMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.22,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    const riverStreams = new THREE.Points(streamGeo, streamMat);
    riverStreams.rotation.x = -Math.PI * 0.42;
    riverStreams.position.set(0, -0.82, 0);
    inundationGroup.add(riverStreams);
    riverStreamsRef.current = riverStreams;

    // -------------------------------------------------------------
    // STAGE 04: Volumetric District Exposure Pillars (64 Districts)
    // -------------------------------------------------------------
    const exposureGroup = new THREE.Group();
    exposureGroup.visible = false;
    rootGroup.add(exposureGroup);
    exposureGroupRef.current = exposureGroup;

    // Add base terrain grid for exposure
    const expBaseGeo = new THREE.PlaneGeometry(16, 12, 32, 24);
    const expBaseMat = new THREE.MeshStandardMaterial({
      color: 0x060c18,
      roughness: 0.9,
      wireframe: false
    });
    const expBase = new THREE.Mesh(expBaseGeo, expBaseMat);
    expBase.rotation.x = -Math.PI * 0.45;
    expBase.position.set(0, -1.5, 0);
    exposureGroup.add(expBase);

    // Grid wire overlay
    const expGridMat = new THREE.MeshBasicMaterial({
      color: 0x1e293b,
      wireframe: true,
      transparent: true,
      opacity: 0.4
    });
    const expGrid = new THREE.Mesh(expBaseGeo, expGridMat);
    expGrid.rotation.x = -Math.PI * 0.45;
    expGrid.position.set(0, -1.48, 0);
    exposureGroup.add(expGrid);

    // Top Flooded Districts from the Work Report:
    // Sunamganj (792km², 162k pop), Kishoreganj (766km², 98k), Netrakona (735km², 532k),
    // Mymensingh (705km², 641k), Joypurhat (643km², 153k), Habiganj (641km², 64k),
    // Feni (catastrophic anchor 204k), Thakurgaon (623km², 337k), Nawabganj (498km², 728k), Bogra (484km², 115k)
    const districtsData = [
      {name: 'Sunamganj', x: 2.8, z: 1.8, height: 5.6, pop: '162k', col: 0x38bdf8},
      {name: 'Kishoreganj', x: 2.2, z: 0.2, height: 5.2, pop: '98k', col: 0x38bdf8},
      {name: 'Netrakona', x: 1.8, z: 1.4, height: 6.8, pop: '533k', col: 0xf59e0b},
      {name: 'Mymensingh', x: 0.4, z: 1.6, height: 7.2, pop: '642k', col: 0xf43f5e},
      {name: 'Joypurhat', x: -2.8, z: 2.2, height: 4.8, pop: '153k', col: 0x38bdf8},
      {name: 'Habiganj', x: 3.4, z: -0.2, height: 4.6, pop: '64k', col: 0x38bdf8},
      {name: 'Feni', x: 3.2, z: -2.4, height: 8.0, pop: '204k', col: 0xf43f5e}, // Catastrophic anchor
      {name: 'Thakurgaon', x: -4.2, z: 3.8, height: 5.8, pop: '337k', col: 0xf59e0b},
      {name: 'Nawabganj', x: -4.4, z: 1.2, height: 7.5, pop: '728k', col: 0xf43f5e},
      {name: 'Bogra', x: -2.2, z: 1.0, height: 4.5, pop: '115k', col: 0x38bdf8},
      {name: 'Sylhet', x: 4.2, z: 1.5, height: 6.2, pop: '412k', col: 0xf59e0b},
      {name: 'Kurigram', x: -1.8, z: 3.2, height: 5.4, pop: '280k', col: 0x38bdf8}
    ];

    const pillarsList: {mesh: THREE.Mesh; targetHeight: number; initialY: number}[] = [];

    districtsData.forEach((d) => {
      // Hexagonal Volumetric Column
      const colGeo = new THREE.CylinderGeometry(0.35, 0.42, 1, 6);
      const colMat = new THREE.MeshStandardMaterial({
        color: d.col,
        emissive: d.col,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.75,
        roughness: 0.2,
        metalness: 0.7
      });
      const pillar = new THREE.Mesh(colGeo, colMat);
      pillar.position.set(d.x, -1.0, d.z);
      pillar.scale.set(1, 0.05, 1);
      exposureGroup.add(pillar);

      // Glowing Neon Cap Ring
      const capGeo = new THREE.RingGeometry(0.25, 0.45, 16);
      const capMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide
      });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.rotation.x = -Math.PI / 2;
      cap.position.y = 0.51;
      pillar.add(cap);

      pillarsList.push({
        mesh: pillar,
        targetHeight: d.height,
        initialY: -1.5
      });
    });
    exposurePillarsRef.current = pillarsList;

    // -------------------------------------------------------------
    // STAGE 05: 115 FFWC River Telemetry Gauges & Hydrograph
    // -------------------------------------------------------------
    const gaugeGroup = new THREE.Group();
    gaugeGroup.visible = false;
    rootGroup.add(gaugeGroup);
    gaugeGroupRef.current = gaugeGroup;

    // River Network Base Plate
    const riverNetGeo = new THREE.PlaneGeometry(16, 12, 24, 18);
    const riverNetMat = new THREE.MeshStandardMaterial({
      color: 0x060e1d,
      roughness: 0.8
    });
    const riverPlate = new THREE.Mesh(riverNetGeo, riverNetMat);
    riverPlate.rotation.x = -Math.PI * 0.45;
    riverPlate.position.set(0, -1.2, 0);
    gaugeGroup.add(riverPlate);

    // River Gauge Pinned Sensor Beacons (Representing key FFWC stations)
    const gaugeCoords = [
      {name: 'Parshuram (Feni)', x: 3.2, z: -2.3, danger: true},
      {name: 'Sylhet (Surma)', x: 4.1, z: 1.4, danger: true},
      {name: 'Sunamganj (Surma)', x: 2.7, z: 1.9, danger: true},
      {name: 'Bahadurabad (Jamuna)', x: -0.6, z: 2.1, danger: true},
      {name: 'Sirajganj (Jamuna)', x: -1.2, z: 0.8, danger: false},
      {name: 'Goalondo (Padma)', x: -0.2, z: -0.4, danger: false},
      {name: 'Bhairab Bazar (Meghna)', x: 2.1, z: -0.2, danger: true},
      {name: 'Chandpur (Meghna)', x: 1.6, z: -1.8, danger: false},
      {name: 'Chilmari (Brahmaputra)', x: -1.4, z: 3.1, danger: true},
      {name: 'Mohonpur (Kangsha)', x: 1.7, z: 1.6, danger: true},
      {name: 'Manu RB (Manu)', x: 3.8, z: 0.5, danger: false},
      {name: 'Sarail (Titas)', x: 2.5, z: -0.6, danger: false}
    ];

    const pinsList: THREE.Mesh[] = [];

    gaugeCoords.forEach((g) => {
      // Beacon Pin Pole
      const pinGeo = new THREE.CylinderGeometry(0.06, 0.08, 1.4, 8);
      const pinMat = new THREE.MeshStandardMaterial({
        color: g.danger ? 0xf43f5e : 0x22c55e,
        emissive: g.danger ? 0xf43f5e : 0x22c55e,
        emissiveIntensity: 0.6
      });
      const pin = new THREE.Mesh(pinGeo, pinMat);
      pin.position.set(g.x, -0.5, g.z);
      gaugeGroup.add(pin);
      pinsList.push(pin);

      // Warning Shockwave Rings around gauge
      const ringGeo = new THREE.RingGeometry(0.15, 0.35, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: g.danger ? 0xf43f5e : 0x38bdf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = -0.65;
      pin.add(ring);
    });
    gaugePinsRef.current = pinsList;

    // 3D Hydrograph Waveform Ribbon Curve
    const hydroCurvePoints: THREE.Vector3[] = [];
    const stepCount = 50;
    for (let i = 0; i <= stepCount; i++) {
      const u = i / stepCount;
      const hx = (u - 0.5) * 8.5;
      // Rising crest that peaks past the danger line
      const hy = Math.sin(u * Math.PI) * 2.4 + Math.sin(u * Math.PI * 3) * 0.4 - 0.2;
      const hz = Math.cos(u * Math.PI) * 0.8;
      hydroCurvePoints.push(new THREE.Vector3(hx, hy + 1.2, hz));
    }

    const hydroCurve = new THREE.CatmullRomCurve3(hydroCurvePoints);
    const hydroTubeGeo = new THREE.TubeGeometry(hydroCurve, 64, 0.08, 8, false);
    const hydroTubeMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
      roughness: 0.1
    });
    const hydroRibbon = new THREE.Mesh(hydroTubeGeo, hydroTubeMat);
    gaugeGroup.add(hydroRibbon);

    // Red Danger Level Line
    const dangerLinePoints = [
      new THREE.Vector3(-4.5, 2.6, 0),
      new THREE.Vector3(4.5, 2.6, 0)
    ];
    const dangerGeo = new THREE.BufferGeometry().setFromPoints(dangerLinePoints);
    const dangerMat = new THREE.LineDashedMaterial({
      color: 0xf43f5e,
      dashSize: 0.3,
      gapSize: 0.15
    });
    const dangerLine = new THREE.Line(dangerGeo, dangerMat);
    dangerLine.computeLineDistances();
    gaugeGroup.add(dangerLine);

    // -------------------------------------------------------------
    // STAGE 06: Automated CAP 1.2 Dispatch Broadcast
    // -------------------------------------------------------------
    const alertGroup = new THREE.Group();
    alertGroup.visible = false;
    rootGroup.add(alertGroup);
    alertGroupRef.current = alertGroup;

    // Radial Emergency Alert Waves expanding outward
    const wavesList: THREE.Mesh[] = [];
    for (let i = 0; i < 4; i++) {
      const waveGeo = new THREE.RingGeometry(0.5, 0.7, 48);
      const waveMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
      });
      const wave = new THREE.Mesh(waveGeo, waveMat);
      wave.rotation.x = -Math.PI * 0.45;
      wave.position.set(0, -1, 0);
      wave.userData = {phase: i / 4};
      alertGroup.add(wave);
      wavesList.push(wave);
    }
    alertWavesRef.current = wavesList;

    // Floating Holographic CAP 1.2 Alert Module Card
    const capCardGeo = new THREE.BoxGeometry(6.5, 4.2, 0.15);
    const capCardMat = new THREE.MeshStandardMaterial({
      color: 0x0a1122,
      emissive: 0x0284c7,
      emissiveIntensity: 0.25,
      roughness: 0.2,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85
    });
    const capCard = new THREE.Mesh(capCardGeo, capCardMat);
    capCard.position.set(0, 1.8, 2);
    alertGroup.add(capCard);

    // Card Glass Border
    const capBorderGeo = new THREE.EdgesGeometry(capCardGeo);
    const capBorderMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      linewidth: 2
    });
    const capBorder = new THREE.LineSegments(capBorderGeo, capBorderMat);
    capCard.add(capBorder);

    // -------------------------------------------------------------
    // Resize Listener
    // -------------------------------------------------------------
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // -------------------------------------------------------------
    // Animation Loop
    // -------------------------------------------------------------
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const currentLookAt = new THREE.Vector3().copy(STAGE_CONFIGS[0].lookAt);

    const render = () => {
      const elapsed = clock.getElapsedTime();

      // Mouse Parallax Smooth Lerp
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      // Dust Gentle Drift
      if (dustPoints) {
        dustPoints.rotation.y = elapsed * 0.02 + scrollProgressRef.current * 0.2;
      }

      // STAGE 01: Satellite Orbit Motion & Radar Wave Pulse
      if (satelliteRef.current) {
        const satAngle = elapsed * 0.35;
        satelliteRef.current.position.x = 9.8 * Math.cos(satAngle);
        satelliteRef.current.position.y = 5.2 + Math.sin(satAngle * 2) * 1.2;
        satelliteRef.current.position.z = 9.8 * Math.sin(satAngle) * 0.8;
        satelliteRef.current.lookAt(bdTarget);

        if (radarConeRef.current) {
          const coneMid = satelliteRef.current.position.clone().add(bdTarget).multiplyScalar(0.5);
          radarConeRef.current.position.copy(coneMid);
          radarConeRef.current.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            bdTarget.clone().sub(satelliteRef.current.position).normalize()
          );
          // Scale cone length to match satellite distance
          const d = satelliteRef.current.position.distanceTo(bdTarget);
          radarConeRef.current.scale.set(1, d / coneDist, 1);
        }
      }

      // Radar Ground Wavefront Expansion
      if (radarRingsRef.current) {
        radarRingsRef.current.children.forEach((child) => {
          const ring = child as THREE.Mesh;
          const p = ((ring.userData.phase || 0) + elapsed * 0.5) % 1;
          const s = 1 + p * 3.5;
          ring.scale.set(s, s, s);
          (ring.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.85;
        });
      }

      // STAGE 02: Channel Planes Floating & Scanning
      if (channelPlanesRef.current.length > 0) {
        channelPlanesRef.current.forEach((plane, idx) => {
          plane.position.y += Math.sin(elapsed * 1.5 + idx) * 0.003;
        });
        if (neuralLinesRef.current) {
          neuralLinesRef.current.rotation.y = elapsed * 0.05;
        }
      }

      // STAGE 03: Flood Surface Shimmer
      if (floodMeshRef.current) {
        (floodMeshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
          0.6 + Math.sin(elapsed * 2.2) * 0.2;
      }

      // River Particle Streams Flow
      if (riverStreamsRef.current) {
        const riverPos = riverStreamsRef.current.geometry.attributes.position;
        for (let i = 0; i < streamCount; i++) {
          let y = riverPos.getY(i) - 0.045;
          if (y < -4) y = 4;
          riverPos.setY(i, y);
        }
        riverPos.needsUpdate = true;
      }

      // STAGE 04: Exposure Pillars Growth Animation
      if (exposurePillarsRef.current.length > 0) {
        const isExpActive = activeStage === 3;
        exposurePillarsRef.current.forEach(({mesh, targetHeight}) => {
          const targetScaleY = isExpActive ? targetHeight : 0.05;
          mesh.scale.y += (targetScaleY - mesh.scale.y) * 0.08;
          mesh.position.y = -1.5 + mesh.scale.y * 0.5;
        });
      }

      // STAGE 05: Gauge Sensor Beacon Blinks
      if (gaugePinsRef.current.length > 0) {
        gaugePinsRef.current.forEach((pin, idx) => {
          const ring = pin.children[0] as THREE.Mesh | undefined;
          if (ring) {
            const p = (elapsed * 1.2 + idx * 0.3) % 1;
            const s = 1 + p * 2.4;
            ring.scale.set(s, s, s);
            (ring.material as THREE.MeshBasicMaterial).opacity = 1 - p;
          }
        });
      }

      // STAGE 06: Radial Alert Waves
      if (alertWavesRef.current.length > 0) {
        alertWavesRef.current.forEach((wave) => {
          const p = ((wave.userData.phase || 0) + elapsed * 0.35) % 1;
          const s = 0.5 + p * 8.5;
          wave.scale.set(s, s, s);
          (wave.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.75;
        });
      }

      // -------------------------------------------------------------
      // Camera Interpolation & Stage Transitions
      // -------------------------------------------------------------
      const currentConfig = STAGE_CONFIGS[activeStage] || STAGE_CONFIGS[0];
      const targetCamPos = currentConfig.camPos.clone();
      const targetLookAt = currentConfig.lookAt.clone();

      // Add Mouse Tilt Parallax & User Drag Rotation
      targetCamPos.x += mouseRef.current.x * 2.5 + userRotationRef.current.y * 5;
      targetCamPos.y += mouseRef.current.y * 2.0 - userRotationRef.current.x * 4;

      // Smooth Camera Lerp
      camera.position.lerp(targetCamPos, 0.045);
      currentLookAt.lerp(targetLookAt, 0.05);
      camera.lookAt(currentLookAt);

      // Smooth Visibility Fades for Each Group
      const setGroupVisibility = (grp: THREE.Group | null, visible: boolean) => {
        if (!grp) return;
        grp.visible = visible;
      };

      setGroupVisibility(orbitGroupRef.current, activeStage === 0);
      setGroupVisibility(channelGroupRef.current, activeStage === 1);
      setGroupVisibility(inundationGroupRef.current, activeStage === 2);
      setGroupVisibility(exposureGroupRef.current, activeStage === 3);
      setGroupVisibility(gaugeGroupRef.current, activeStage === 4);
      setGroupVisibility(alertGroupRef.current, activeStage === 5);

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [activeStage]);

  // If WebGL is not supported in the user's browser, show a high-aesthetic fallback
  if (!webGlSupported) {
    return (
      <div className={`relative flex items-center justify-center overflow-hidden bg-ink-0 ${className}`}>
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{backgroundImage: "url('/data/earth-dark.jpg')"}}
        />
        <div className="relative z-10 max-w-md rounded-2xl border border-white/10 bg-ink-1/80 p-6 text-center backdrop-blur-xl">
          <div className="font-mono text-[11px] uppercase tracking-widest text-accent">3D Engine Fallback</div>
          <p className="mt-2 text-sm text-white/90">
            WebGL hardware acceleration is active in compatibility mode.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className={`relative h-full w-full cursor-grab active:cursor-grabbing select-none ${className}`}
    >
      {/* HUD Stage Indicator & Drag Reset Affordance */}
      <div className="pointer-events-none absolute bottom-5 left-5 z-20 flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-ink-1/70 px-3 py-1 backdrop-blur-xl">
          <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-accent" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/90">
            3D SCENE ACTIVE · STAGE {STAGE_CONFIGS[activeStage]?.num || '01'}
          </span>
        </div>

        {isUserInteracting && (
          <button
            type="button"
            onClick={handleResetView}
            className="pointer-events-auto rounded-full border border-white/15 bg-white/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-white transition-colors hover:bg-white/20"
          >
            Reset Orbit
          </button>
        )}
      </div>

      {/* Floating 3D Navigation Dots */}
      <div className="pointer-events-auto absolute right-5 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-2 md:flex">
        {STAGE_CONFIGS.map((stg, i) => (
          <button
            key={stg.id}
            type="button"
            onClick={() => onStageSelect?.(i)}
            title={stg.titleEn}
            className={`group flex items-center gap-2 transition-all ${
              activeStage === i ? 'scale-110' : 'opacity-60 hover:opacity-100'
            }`}
          >
            <span
              className={`hidden font-mono text-[9px] uppercase tracking-wider text-white transition-opacity md:inline-block ${
                activeStage === i ? 'opacity-100' : 'opacity-0 group-hover:opacity-75'
              }`}
            >
              {stg.num}
            </span>
            <span
              className={`h-2.5 w-2.5 rounded-full border transition-all ${
                activeStage === i
                  ? 'border-white bg-accent shadow-[0_0_10px_#2dd4bf]'
                  : 'border-white/30 bg-transparent group-hover:border-white'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
