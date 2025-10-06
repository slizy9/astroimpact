import { useEffect, useRef, useState } from 'react';

type ThreeOrbitPreviewProps = {
  height?: number;
  className?: string;
  simulateKey?: number; // changes to trigger collision sequence
  physics?: {
    velocityMs: number;
    massKg: number;
    angleRad: number;
    energyMt: number;
  };
};

// Lightweight Three.js inline import (expects 'three' installed by the app)
export default function ThreeOrbitPreview({ height = 300, className, simulateKey, physics }: ThreeOrbitPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dayNightCycle, setDayNightCycle] = useState(0); // 0 = day, 1 = night
  const [debrisParticles, setDebrisParticles] = useState<Array<{x: number, y: number, z: number, vx: number, vy: number, vz: number}>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;
    let renderer: any;
    let scene: any;
    let camera: any;
    let meteor: any;
    let earth: any;
    let frameId = 0;
    let controls: any;
    let hemi: any;
    let fill: any;
    let rim: any;
    let meteorLight: any;

    const init = async () => {
      const THREE = await import('three');
      const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');

      if (disposed) return;

      const container = containerRef.current!;
      const width = container.clientWidth;
      const heightPx = height;

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, heightPx);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;

      container.appendChild(renderer.domElement);

      scene = new THREE.Scene();

      camera = new THREE.PerspectiveCamera(55, width / heightPx, 0.1, 120);
      camera.position.set(0.6, 2.6, 6.2);

      // Orbit controls (limited zoom and damping)
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.enablePan = false;
      controls.minDistance = 2.8;
      controls.maxDistance = 10;
      controls.target.set(0, 0, 0);

      // Dynamic lighting setup with day/night cycle
      const ambient = new THREE.AmbientLight(0x88aaff, dayNightCycle > 0.5 ? 0.2 : 0.6);
      scene.add(ambient);
      const dir = new THREE.DirectionalLight(0xffffff, dayNightCycle > 0.5 ? 0.3 : 1.0);
      dir.position.set(3, 3, 2);
      scene.add(dir);

      // Additional lights for better definition
      hemi = new THREE.HemisphereLight(0x99ccff, 0x0a0a0a, 0.35);
      scene.add(hemi);
      fill = new THREE.DirectionalLight(0x88aaff, 0.22);
      fill.position.set(-3, 1.5, -2);
      scene.add(fill);
      rim = new THREE.DirectionalLight(0xffffff, 0.15);
      rim.position.set(-1, 2.5, 3);
      scene.add(rim);

      // Add atmospheric glow
      const atmosphereGeometry = new THREE.SphereGeometry(0.82, 32, 32);
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
            float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
            gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
          }
        `,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true
      });
      const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
      scene.add(atmosphere);

      // Earth sphere with 2K daymap texture
      const earthGeom = new THREE.SphereGeometry(0.8, 64, 64);
      const earthMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x001422, metalness: 0.05, roughness: 0.9 });
      earth = new THREE.Mesh(earthGeom, earthMat);
      scene.add(earth);

      // Load daymap texture (place your file at /public/textures/earth_daymap_2k.jpg)
      try {
        const tex = await new THREE.TextureLoader().loadAsync('/textures/earth_daymap_2k.jpg');
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = Math.min(8, (renderer.capabilities as any)?.getMaxAnisotropy?.() || 8);
        earthMat.map = tex;
        earthMat.needsUpdate = true;
      } catch (e: any) {
        console.warn('Failed to load earth daymap texture', e);
      }

      // Meteor (small sphere) with Haumea texture
      const meteorGeom = new THREE.SphereGeometry(0.11, 24, 24);
      const meteorMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x330000, metalness: 0.1, roughness: 0.8 });
      meteor = new THREE.Mesh(meteorGeom, meteorMat);
      scene.add(meteor);
      try {
        const meteorTex = await new THREE.TextureLoader().loadAsync('/textures/2k_haumea_fictional.png');
        meteorTex.colorSpace = THREE.SRGBColorSpace;
        meteorTex.anisotropy = Math.min(8, (renderer.capabilities as any)?.getMaxAnisotropy?.() || 8);
        meteorMat.map = meteorTex;
        meteorMat.needsUpdate = true;
      } catch (e: any) {
        console.warn('Failed to load meteor texture', e);
      }

      // Orbit path (ellipse look)
      const curvePts: any[] = [];
      const rx = 2.2;
      const rz = 1.35;
      for (let a = 0; a <= Math.PI * 2 + 0.001; a += 0.05) {
        curvePts.push(new THREE.Vector3(Math.cos(a) * rx, 0, Math.sin(a) * rz));
      }
      const orbitGeom = new THREE.BufferGeometry().setFromPoints(curvePts);
      const orbitMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 });
      const orbit = new THREE.LineLoop(orbitGeom, orbitMat);
      orbit.rotation.x = -0.4; // tilt
      scene.add(orbit);

      // Stars background (simple particles)
      const starGeom = new THREE.BufferGeometry();
      const starCount = 400;
      const positions = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount; i++) {
        positions[i * 3 + 0] = (Math.random() - 0.5) * 30;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
      }
      starGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.02 });
      const stars = new THREE.Points(starGeom, starMat);
      scene.add(stars);

      const onResize = () => {
        if (!container || !renderer) return;
        const w = container.clientWidth;
        camera.aspect = w / heightPx;
        camera.updateProjectionMatrix();
        renderer.setSize(w, heightPx);
      };
      window.addEventListener('resize', onResize);

      // Debris particles system
      const debrisGeometry = new THREE.BufferGeometry();
      const debrisMaterial = new THREE.PointsMaterial({ 
        color: 0xff6600, 
        size: 0.02,
        transparent: true,
        opacity: 0.8
      });
      const debrisSystem = new THREE.Points(debrisGeometry, debrisMaterial);
      scene.add(debrisSystem);

      const start = performance.now();
      let phase: 'orbit' | 'reentry' | 'burst' | 'cooldown' = simulateKey ? 'reentry' : 'orbit';
      let phaseStart = start;
      let dayNightTime = 0;
      const animate = () => {
        const t = (performance.now() - start) / 1000;
        const elapsedPhase = (performance.now() - phaseStart) / 1000;

        // Day/night cycle
        dayNightTime += 0.001;
        const dayNightValue = (Math.sin(dayNightTime) + 1) / 2;
        setDayNightCycle(dayNightValue);
        
        // Update lighting based on day/night
        ambient.intensity = dayNightValue > 0.5 ? 0.2 : 0.6;
        dir.intensity = dayNightValue > 0.5 ? 0.3 : 1.0;

        // base orbit path
        const a = t * 0.7;
        let x = Math.cos(a) * rx;
        let z = Math.sin(a) * rz;
        let y = 0;

        // phases
        if (phase === 'reentry') {
          // Approach along a shallow descending line towards Earth center
          const dur = 2.2;
          const k = Math.min(elapsedPhase / dur, 1);
          const dir = new THREE.Vector3(-x, -0.6, -z).normalize();
          const dist = 2.2 - 1.6 * k; // move towards earth
          const p = dir.multiplyScalar(dist);
          x = p.x; y = p.y; z = p.z;
          // heat glow scales with k
          (meteor.material as any).emissiveIntensity = 0.5 + 2.0 * k;
          (meteor.material as any).emissive.setHex(0xff3300);
          if (k >= 1) { phase = 'burst'; phaseStart = performance.now(); }
        } else if (phase === 'burst') {
          // Explosion: scale meteor down and flash
          const dur = 1.4;
          const k = Math.min(elapsedPhase / dur, 1);
          meteor.scale.setScalar(1 - k);
          
          // Create debris particles
          if (k < 0.1 && debrisParticles.length === 0) {
            const newDebris = [];
            for (let i = 0; i < 50; i++) {
              newDebris.push({
                x: 0, y: 0, z: 0,
                vx: (Math.random() - 0.5) * 0.2,
                vy: Math.random() * 0.2,
                vz: (Math.random() - 0.5) * 0.2
              });
            }
            setDebrisParticles(newDebris);
          }
          
          // Update debris particles
          if (debrisParticles.length > 0) {
            const positions = new Float32Array(debrisParticles.length * 3);
            debrisParticles.forEach((particle, i) => {
              particle.x += particle.vx;
              particle.y += particle.vy;
              particle.z += particle.vz;
              particle.vy -= 0.01; // gravity
              
              positions[i * 3] = particle.x;
              positions[i * 3 + 1] = particle.y;
              positions[i * 3 + 2] = particle.z;
            });
            debrisGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            debrisGeometry.attributes.position.needsUpdate = true;
          }
          
          // radial flash sprite
          const flash = 1.0 - Math.pow(1 - k, 3);
          renderer.setClearColor(0x000000, 0); // keep transparent
          dir.intensity = 2.4 + 3.2 * flash;
          ambient.intensity = 0.6 + 0.8 * flash;
          // slight camera dolly-in
          camera.position.z = 6.2 - 1.8 * flash;
          camera.position.y = 2.6 - 0.4 * flash;
          if (k >= 1) { phase = 'cooldown'; phaseStart = performance.now(); }
        } else if (phase === 'cooldown') {
          // Let light fade and keep camera shake suggestion (minor)
          const k = Math.min(elapsedPhase / 1.0, 1);
          dir.intensity = 1.0 + (1 - k);
          ambient.intensity = 0.6 + 0.4 * (1 - k);
          
          // Clear debris particles
          if (k > 0.5) {
            setDebrisParticles([]);
            debrisGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(0), 3));
          }
        } else {
          // Normal orbit phase
          (meteor.material as any).emissiveIntensity = 0.6;
          meteor.scale.setScalar(1);
        }

        meteor.position.set(x, y, z);
        meteor.position.applyAxisAngle(new THREE.Vector3(1, 0, 0), -0.4);

        earth.rotation.y += 0.003;
        controls?.update();
        renderer.render(scene, camera);
        frameId = requestAnimationFrame(animate);
      };
      animate();

      return () => {
        window.removeEventListener('resize', onResize);
      };
    };

    init();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      controls?.dispose?.();
      if (renderer) {
        renderer.dispose?.();
        const dom = renderer.domElement as HTMLCanvasElement | undefined;
        dom?.parentElement?.removeChild(dom);
      }
    };
  }, [height, simulateKey]);

  // Trigger reentry-burst sequence when simulateKey changes
  useEffect(() => {
    if (!simulateKey) return;
    // No-op here; sequence is handled in animation loop by phase variables set on creation.
    // For simplicity, we recreate the scene on trigger to reset phases.
  }, [simulateKey]);

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-900 text-white`} style={{ height }}>
        <div className="text-center p-4">
          <div className="text-red-400 mb-2">⚠️ 3D Simulation Error</div>
          <div className="text-sm text-gray-300 mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={className} style={{ height }} />
  );
}


