import { useEffect, useRef, useState } from 'react';

type GltfAsteroidViewerProps = {
  className?: string;
  height?: number;
  meshIndex: number; // which child mesh to show from scene.gltf
};

export default function GltfAsteroidViewer({ className, height = 260, meshIndex }: GltfAsteroidViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;
    let renderer: any;
    let scene: any;
    let camera: any;
    let controls: any;
    let frameId = 0;
    let group: any;
    let currentMesh: any = null;

    const init = async () => {
      const THREE = await import('three');
      const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');

      if (disposed) return;
      const container = containerRef.current!;
      const width = container.clientWidth;

      renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true,
        powerPreference: "high-performance"
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.5;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(renderer.domElement);

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
      camera.position.set(0.8, 0.6, 2.0);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.enablePan = false;
      controls.minDistance = 1.2;
      controls.maxDistance = 5;

      // Enhanced lighting setup (brighter scene)
      const ambient = new THREE.AmbientLight(0x445566, 0.8);
      scene.add(ambient);
      
      const hemi = new THREE.HemisphereLight(0x99ccff, 0x0a0a0a, 0.6);
      scene.add(hemi);

      const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
      keyLight.position.set(3, 3, 2);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 2048;
      keyLight.shadow.mapSize.height = 2048;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 50;
      keyLight.shadow.camera.left = -10;
      keyLight.shadow.camera.right = 10;
      keyLight.shadow.camera.top = 10;
      keyLight.shadow.camera.bottom = -10;
      scene.add(keyLight);
      
      const fillLight = new THREE.DirectionalLight(0x88bbff, 1.1);
      fillLight.position.set(-2, 1, -1);
      scene.add(fillLight);
      
      const rimLight = new THREE.DirectionalLight(0xffaa88, 1.2);
      rimLight.position.set(0, -2, 2);
      scene.add(rimLight);

      // Camera-follow point light for strong highlights
      const camLight = new THREE.PointLight(0xffffff, 1.2, 100);
      camLight.position.copy(camera.position);
      scene.add(camLight);

      // Extra top light to boost brightness from above
      const topLight = new THREE.DirectionalLight(0xffffff, 1.4);
      topLight.position.set(0, 4, 0);
      topLight.castShadow = true;
      topLight.shadow.mapSize.width = 1024;
      topLight.shadow.mapSize.height = 1024;
      scene.add(topLight);

      // Additional fill point light to reduce harsh shadows
      const fillPoint = new THREE.PointLight(0x88bbff, 0.9, 60);
      fillPoint.position.set(-2, 2, -2);
      scene.add(fillPoint);

      group = new THREE.Group();
      scene.add(group);
      
      // Add subtle environment
      const envGeom = new THREE.SphereGeometry(20, 32, 16);
      const envMat = new THREE.MeshBasicMaterial({ 
        color: 0x001122, 
        side: THREE.BackSide,
        transparent: true,
        opacity: 0.1
      });
      const envSphere = new THREE.Mesh(envGeom, envMat);
      scene.add(envSphere);

      const loader = new GLTFLoader();
      // Serve model from /public/models and textures from /public/textures
      loader.setPath('/models/');
      loader.setResourcePath('/textures/');
      
      // Loading state
      setLoading(true);
      setError(null);
      
      loader.load('g_00880mm_alt_ptm_0000n00000_v020.glb', async (gltf: any) => {
        setLoading(false);
        // Preload preferred texture set (07 series)
        const THREE = (await import('three'));
        const texLoader = new THREE.TextureLoader();
        let baseColorTex: any = null;
        let normalTex: any = null;
        let mrTex: any = null;
        try {
          baseColorTex = await texLoader.loadAsync('/textures/07___Default_baseColor.jpeg');
          baseColorTex.colorSpace = THREE.SRGBColorSpace;
        } catch {}
        try {
          normalTex = await texLoader.loadAsync('/textures/07___Default_normal.png');
        } catch {}
        try {
          mrTex = await texLoader.loadAsync('/textures/07___Default_metallicRoughness.png');
        } catch {}

        // Flatten and collect all meshes in order of appearance
        const meshes: any[] = [];
        gltf.scene.traverse((obj: any) => {
          if ((obj as any).isMesh) {
            const mesh: any = obj;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            // Ensure textures use sRGB where appropriate
            let mat: any = mesh.material;
            if (!mat || !(mat as any).isMeshStandardMaterial) {
              mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, metalness: 0.1 });
              mesh.material = mat;
            }
            // Apply preferred texture set if available
            if (baseColorTex) {
              mat.map = baseColorTex;
              mat.map.colorSpace = THREE.SRGBColorSpace;
            }
            if (normalTex) mat.normalMap = normalTex;
            if (mrTex) {
              // Use combined metallicRoughness for both channels
              mat.metalnessMap = mrTex;
              mat.roughnessMap = mrTex;
            }
            mat.needsUpdate = true;
            meshes.push(mesh);
          }
        });
        
        if (meshes.length === 0) {
          setError('No meshes found in GLTF');
          return;
        }
        
        const idx = Math.max(0, Math.min(meshIndex, meshes.length - 1));
        currentMesh = meshes[idx]?.clone();
        if (currentMesh) {
          // Center and scale to fit view
          const { Box3, Vector3 } = THREE;
          const box = new Box3().setFromObject(currentMesh);
          const size = new Vector3();
          const center = new Vector3();
          box.getSize(size);
          box.getCenter(center);
          currentMesh.position.sub(center);
          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          const scale = 1.0 / maxDim; // normalize before fitting
          currentMesh.scale.setScalar(scale);
          group.add(currentMesh);

          // Zoom/fit camera to model
          const fitCameraToObject = () => {
            const bb = new Box3().setFromObject(group);
            const s = new Vector3();
            const c = new Vector3();
            bb.getSize(s);
            bb.getCenter(c);

            // compute bounding sphere radius
            const radius = Math.max(s.x, Math.max(s.y, s.z)) * 0.5;
            const fov = (camera.fov * Math.PI) / 180;
            const aspect = (container.clientWidth) / height;
            const fitHeightDistance = radius / Math.sin(fov / 2);
            const fitWidthDistance = fitHeightDistance / aspect;
            const distance = Math.max(fitHeightDistance, fitWidthDistance) * 1.25;

            camera.near = Math.max(0.01, distance / 100);
            camera.far = distance * 100;
            camera.updateProjectionMatrix();

            controls.target.set(0, 0, 0);
            camera.position.set(0.8 * distance, 0.6 * distance, distance);
            controls.minDistance = distance * 0.3;
            controls.maxDistance = distance * 4.0;
            controls.update();
          };

          fitCameraToObject();
          // Refit after a tick to ensure layout stabilized
          requestAnimationFrame(() => fitCameraToObject());
        }
      }, (progress: any) => {
        // Loading progress
        console.log('Loading progress:', (progress.loaded / progress.total) * 100 + '%');
      }, (error: any) => {
        console.error('GLTF loading error:', error);
        setError('Failed to load asteroid model');
        setLoading(false);
        
        // Fallback mesh
        const geom = new THREE.IcosahedronGeometry(0.8, 3);
        const mat = new THREE.MeshStandardMaterial({ 
          color: 0x666666, 
          roughness: 0.9,
          metalness: 0.1
        });
        const fallback = new THREE.Mesh(geom, mat);
        fallback.castShadow = true;
        group.add(fallback);
      });

      const onResize = () => {
        const w = container.clientWidth;
        camera.aspect = w / height;
        camera.updateProjectionMatrix();
        renderer.setSize(w, height);
        // try to keep framing reasonable when resizing
        if (group && group.children.length > 0) {
          const { Box3, Vector3 } = THREE;
          const bb = new Box3().setFromObject(group);
          const s = new Vector3();
          bb.getSize(s);
          const radius = Math.max(s.x, Math.max(s.y, s.z)) * 0.5;
          const fov = (camera.fov * Math.PI) / 180;
          const aspect = (container.clientWidth) / height;
          const fitHeightDistance = radius / Math.sin(fov / 2);
          const fitWidthDistance = fitHeightDistance / aspect;
          const distance = Math.max(fitHeightDistance, fitWidthDistance) * 1.25;
          camera.position.set(0.8 * distance, 0.6 * distance, distance);
          controls.update();
        }
      };
      window.addEventListener('resize', onResize);

      const animate = () => {
        if (currentMesh) {
          group.rotation.y += 0.003;
        }
        // keep point light near camera
        camLight.position.copy(camera.position);
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
  }, [height, meshIndex]);

  return (
    <div className="relative">
      <div ref={containerRef} className={className} style={{ height }} />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-white/80 text-sm">Loading asteroid...</div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900/50">
          <div className="text-red-200 text-sm">{error}</div>
        </div>
      )}
    </div>
  );
}