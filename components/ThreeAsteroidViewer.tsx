import { useEffect, useRef } from 'react';

type ThreeAsteroidViewerProps = {
  className?: string;
  height?: number;
  name: string;
  sizeMeters?: number; // approximate longest dimension
  seed?: number;
};

export default function ThreeAsteroidViewer({ className, height = 260, name, sizeMeters = 1000, seed = 1 }: ThreeAsteroidViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    let renderer: any;
    let scene: any;
    let camera: any;
    let controls: any;
    let rock: any;
    let frameId = 0;

    const init = async () => {
      const THREE = await import('three');
      const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');

      if (disposed) return;
      const container = containerRef.current!;
      const width = container.clientWidth;

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      container.appendChild(renderer.domElement);

      scene = new THREE.Scene();

      camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
      camera.position.set(0.8, 0.6, 2.0);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.enablePan = false;
      controls.minDistance = 1.4;
      controls.maxDistance = 4;

      // Lights
      scene.add(new THREE.AmbientLight(0x8899aa, 0.7));
      const key = new THREE.DirectionalLight(0xffffff, 1.0);
      key.position.set(2, 2, 1);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0x88bbff, 0.6);
      rim.position.set(-2, 1, -1);
      scene.add(rim);

      // Procedural irregular rock based on seed
      const rng = (() => {
        let s = (seed * 9301 + 49297) % 233280;
        return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
      })();
      const radius = 0.6; // viewer units
      const geom = new THREE.IcosahedronGeometry(radius, 3);
      const pos = geom.attributes.position as any;
      for (let i = 0; i < pos.count; i++) {
        const nx = pos.getX(i);
        const ny = pos.getY(i);
        const nz = pos.getZ(i);
        const r = Math.sqrt(nx * nx + ny * ny + nz * nz);
        const jitter = 0.85 + rng() * 0.35; // 0.85..1.2
        pos.setXYZ(i, (nx / r) * radius * jitter, (ny / r) * radius * jitter, (nz / r) * radius * jitter);
      }
      pos.needsUpdate = true;
      geom.computeVertexNormals();

      const mat = new THREE.MeshStandardMaterial({ color: 0x9a8776, roughness: 0.95, metalness: 0.05 });
      rock = new THREE.Mesh(geom, mat);
      scene.add(rock);

      // Grid/ground fade for context
      const grid = new THREE.GridHelper(6, 24, 0x224466, 0x112233);
      (grid.material as any).transparent = true;
      (grid.material as any).opacity = 0.15;
      grid.position.y = -1.0;
      scene.add(grid);

      const onResize = () => {
        const w = container.clientWidth;
        camera.aspect = w / height;
        camera.updateProjectionMatrix();
        renderer.setSize(w, height);
      };
      window.addEventListener('resize', onResize);

      const animate = () => {
        rock.rotation.y += 0.0035;
        controls.update();
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
  }, [height, name, sizeMeters, seed]);

  return (
    <div ref={containerRef} className={className} style={{ height }} />
  );
}


