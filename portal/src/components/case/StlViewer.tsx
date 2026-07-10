import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface StlViewerProps {
  fileUrl: string;
  className?: string;
}

/** Inline 3D viewer for .stl intraoral scans — orbit/pan/zoom via mouse/touch. */
export function StlViewer({ fileUrl, className = '' }: StlViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      try {
        const [THREE, { STLLoader }, { OrbitControls }] = await Promise.all([
          import('three'),
          import('three/examples/jsm/loaders/STLLoader.js'),
          import('three/examples/jsm/controls/OrbitControls.js'),
        ]);

        if (cancelled || !containerRef.current) return;
        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf1f5f9);

        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 5000);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        scene.add(new THREE.AmbientLight(0xffffff, 0.7));
        const directional = new THREE.DirectionalLight(0xffffff, 0.8);
        directional.position.set(1, 1, 1);
        scene.add(directional);
        const directional2 = new THREE.DirectionalLight(0xffffff, 0.4);
        directional2.position.set(-1, -1, -1);
        scene.add(directional2);

        const loader = new STLLoader();
        const geometry = await loader.loadAsync(fileUrl);
        if (cancelled) {
          renderer.dispose();
          return;
        }

        geometry.computeBoundingBox();
        geometry.center();

        const material = new THREE.MeshStandardMaterial({
          color: 0xe2e8f0,
          metalness: 0.1,
          roughness: 0.6,
        });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        const box = geometry.boundingBox;
        const size = box ? box.getSize(new THREE.Vector3()) : new THREE.Vector3(1, 1, 1);
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        camera.position.set(0, 0, maxDim * 2.2);
        camera.lookAt(0, 0, 0);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;

        let frameId: number;
        const animate = () => {
          frameId = requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
          if (!containerRef.current) return;
          const w = containerRef.current.clientWidth;
          const h = containerRef.current.clientHeight;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        };
        window.addEventListener('resize', handleResize);

        setLoading(false);

        cleanup = () => {
          window.removeEventListener('resize', handleResize);
          cancelAnimationFrame(frameId);
          controls.dispose();
          geometry.dispose();
          material.dispose();
          renderer.dispose();
          if (container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement);
          }
        };
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load 3D model');
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [fileUrl]);

  return (
    <div className={`relative h-72 w-full overflow-hidden rounded-lg bg-slate-100 ${className}`}>
      <div ref={containerRef} className="h-full w-full" />
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Loading 3D model…
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-red-600">
          Couldn't load 3D preview: {error}
        </div>
      )}
    </div>
  );
}
