'use client';

import React, {useEffect, useRef} from 'react';
import * as THREE from 'three';

interface PointCoordinate {
  lat: number;
  lng: number;
  name: string;
  type: 'hub' | 'sensor';
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
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const globeMeshRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Dimensions and responsive camera distance
    const width = container.clientWidth;
    const height = container.clientHeight;
    const aspect = width / height;

    const GLOBE_RADIUS = 76;
    const getCameraZ = (a: number) => (a < 1 ? (GLOBE_RADIUS * 3.3) / a : 275);

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 2500);
    camera.position.set(0, 0, getCameraZ(aspect));
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 2. Starfield Particle Background
    const starCount = 1800;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 2200;
      starPositions[i + 1] = (Math.random() - 0.5) * 2200;
      starPositions[i + 2] = -250 + (Math.random() - 0.5) * 1800;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.2,
      transparent: true,
      opacity: 0.7
    });
    const starPoints = new THREE.Points(starGeo, starMat);
    scene.add(starPoints);

    // 3. Globe Group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;

    // Initial orientation facing Bengal Basin
    globeGroup.rotation.y = -((90.4 + 90) * (Math.PI / 180));
    globeGroup.rotation.x = 0.22;

    // 4. Earth Texture & Mesh
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
      emissive: 0x060b17,
      emissiveIntensity: 0.5
    });
    const globeMesh = new THREE.Mesh(globeGeometry, globeMaterial);
    globeMeshRef.current = globeMesh;
    globeGroup.add(globeMesh);

    // 5. Outer Atmospheric Glow
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
          gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0) * intensity * 0.75;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    globeGroup.add(atmosphereMesh);

    // 6. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 2.2);
    directionalLight1.position.set(220, 160, 200);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.85);
    directionalLight2.position.set(-200, -120, -150);
    scene.add(directionalLight2);

    // 7. Spatial Nodes on Globe
    const markersGroup = new THREE.Group();
    globeGroup.add(markersGroup);

    SPATIAL_POINTS.forEach((pt) => {
      const pos = latLngToVector3(pt.lat, pt.lng, GLOBE_RADIUS, 0.8);

      const markerGeom = new THREE.SphereGeometry(pt.type === 'hub' ? 1.5 : 1.0, 16, 16);
      const markerMat = new THREE.MeshBasicMaterial({color: 0xffffff});
      const markerMesh = new THREE.Mesh(markerGeom, markerMat);
      markerMesh.position.copy(pos);
      markersGroup.add(markerMesh);

      const ringGeom = new THREE.RingGeometry(1.6, 2.3, 32);
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

    // 9. Polar Orbit Ring
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

    // 10. Raycasting Precision: SWIVEL ONLY DIRECTLY ON THE GLOBE
    const raycaster = new THREE.Raycaster();
    const pointerVector = new THREE.Vector2();

    const isPointerDirectlyOnGlobe = (clientX: number, clientY: number): boolean => {
      if (!container || !cameraRef.current || !globeMeshRef.current) return false;
      const rect = container.getBoundingClientRect();
      pointerVector.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerVector.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerVector, cameraRef.current);
      const intersects = raycaster.intersectObject(globeMeshRef.current);
      return intersects.length > 0;
    };

    let isDragging = false;
    let isHorizontalDrag = false;
    let startX = 0;
    let startY = 0;
    let prevX = 0;
    let prevY = 0;
    let velX = 0;
    let velY = 0;
    let autoRotate = true;
    let resumeTimeout: NodeJS.Timeout | null = null;

    // Hover effect: grab cursor ONLY when hovering directly on the globe
    const onMouseMoveHover = (e: MouseEvent) => {
      if (isDragging) return;
      if (isPointerDirectlyOnGlobe(e.clientX, e.clientY)) {
        renderer.domElement.style.cursor = 'grab';
      } else {
        renderer.domElement.style.cursor = 'default';
      }
    };

    // Desktop Mouse Drag
    const onMouseDown = (e: MouseEvent) => {
      // ONLY start swiveling if clicking directly on the globe!
      if (!isPointerDirectlyOnGlobe(e.clientX, e.clientY)) return;

      isDragging = true;
      renderer.domElement.style.cursor = 'grabbing';
      autoRotate = false;
      if (resumeTimeout) clearTimeout(resumeTimeout);
      prevX = e.clientX;
      prevY = e.clientY;
      velX = 0;
      velY = 0;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) {
        onMouseMoveHover(e);
        return;
      }
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      prevX = e.clientX;
      prevY = e.clientY;

      velX = dx * 0.0055;
      velY = dy * 0.0055;

      if (globeGroupRef.current) {
        globeGroupRef.current.rotation.y += velX;
        globeGroupRef.current.rotation.x += velY;
        globeGroupRef.current.rotation.x = Math.max(-1.1, Math.min(1.1, globeGroupRef.current.rotation.x));
      }
    };

    const onMouseUp = () => {
      if (!isDragging) return;
      isDragging = false;
      renderer.domElement.style.cursor = 'default';
      resumeTimeout = setTimeout(() => {
        autoRotate = true;
      }, 3000);
    };

    // Mobile Touch: Swivel ONLY when touching directly on the globe; everywhere else scrolls page!
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const tX = e.touches[0].clientX;
        const tY = e.touches[0].clientY;

        // If touch is NOT directly on the globe, let natural page scroll take over
        if (!isPointerDirectlyOnGlobe(tX, tY)) {
          isDragging = false;
          return;
        }

        isDragging = true;
        isHorizontalDrag = false;
        autoRotate = false;
        if (resumeTimeout) clearTimeout(resumeTimeout);
        startX = tX;
        startY = tY;
        prevX = startX;
        prevY = startY;
        velX = 0;
        velY = 0;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const curX = e.touches[0].clientX;
      const curY = e.touches[0].clientY;
      const dx = curX - prevX;
      const dy = curY - prevY;

      if (!isHorizontalDrag) {
        const totalDx = Math.abs(curX - startX);
        const totalDy = Math.abs(curY - startY);
        // On globe, allow swiveling if gesture is rotational/horizontal; if pure vertical flick, release to page scroll
        if (totalDx > 6 && totalDx > totalDy * 0.75) {
          isHorizontalDrag = true;
        } else if (totalDy > 10) {
          isDragging = false;
          autoRotate = true;
          return;
        }
      }

      if (isHorizontalDrag) {
        prevX = curX;
        prevY = curY;
        velX = dx * 0.006;
        velY = dy * 0.006;

        if (globeGroupRef.current) {
          globeGroupRef.current.rotation.y += velX;
          globeGroupRef.current.rotation.x += velY;
          globeGroupRef.current.rotation.x = Math.max(-1.1, Math.min(1.1, globeGroupRef.current.rotation.x));
        }
      }
    };

    const onTouchEnd = () => {
      isDragging = false;
      isHorizontalDrag = false;
      resumeTimeout = setTimeout(() => {
        autoRotate = true;
      }, 3000);
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Passive touch listeners ensure 100% native frictionless vertical scrolling everywhere
    dom.addEventListener('touchstart', onTouchStart, {passive: true});
    window.addEventListener('touchmove', onTouchMove, {passive: true});
    window.addEventListener('touchend', onTouchEnd, {passive: true});
    window.addEventListener('touchcancel', onTouchEnd, {passive: true});

    // 11. Animation Loop
    let animationFrameId = 0;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (!isDragging) {
        if (autoRotate && globeGroupRef.current) {
          globeGroupRef.current.rotation.y += 0.0016;
        } else if (globeGroupRef.current) {
          velX *= 0.93;
          velY *= 0.93;
          globeGroupRef.current.rotation.y += velX;
          globeGroupRef.current.rotation.x += velY;
          globeGroupRef.current.rotation.x = Math.max(-1.1, Math.min(1.1, globeGroupRef.current.rotation.x));
        }
      }

      starPoints.rotation.y += 0.0001;
      renderer.render(scene, camera);
    };
    animate();

    // 12. Responsive Resize
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      const newAspect = w / h;
      cameraRef.current.aspect = newAspect;
      cameraRef.current.position.z = getCameraZ(newAspect);
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (resumeTimeout) clearTimeout(resumeTimeout);

      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      dom.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);

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
    <div
      ref={containerRef}
      className="h-full w-full select-none flex items-center justify-center overflow-hidden"
    />
  );
}
