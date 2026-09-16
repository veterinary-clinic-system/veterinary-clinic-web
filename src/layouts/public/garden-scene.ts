import * as THREE from 'three';

/** Decorative scene; no business data or interactive controls live in WebGL. */
export function createGardenScene(host: HTMLDivElement, initialPaused: boolean) {
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: 'low-power',
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1 : 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#edf8e8', 0.035);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 50);
  camera.position.set(0, 0, 14);
  scene.add(new THREE.HemisphereLight('#fff9df', '#497b63', 3));
  const sun = new THREE.DirectionalLight('#fff2d2', 4);
  sun.position.set(-4, 6, 5);
  scene.add(sun);
  const rim = new THREE.DirectionalLight('#ceeddc', 2);
  rim.position.set(6, -2, 3);
  scene.add(rim);

  const shapes = new THREE.Group();
  scene.add(shapes);
  const geometry = new THREE.SphereGeometry(1, 28, 20);
  const materials = ['#bad5a6', '#d9e6b7', '#f3c3a2', '#89b994', '#fff8df'].map(
    (color) =>
      new THREE.MeshPhysicalMaterial({
        color,
        roughness: 0.35,
        metalness: 0.03,
        clearcoat: 0.7,
        clearcoatRoughness: 0.35,
      }),
  );
  const objects: { mesh: THREE.Object3D; x: number; y: number; phase: number }[] = [];
  const addFloating = (mesh: THREE.Object3D, x: number, y: number, z: number, phase: number) => {
    mesh.position.set(x, y, z);
    shapes.add(mesh);
    objects.push({ mesh, x, y, phase });
  };

  // Broad sculptural leaves frame an intentionally empty, readable center.
  for (let i = 0; i < 12; i++) {
    const leaf = new THREE.Mesh(geometry, materials[i % 5]);
    leaf.scale.set(0.32 + (i % 3) * 0.13, 0.95 + (i % 4) * 0.18, 0.17);
    leaf.rotation.set(0.25, (i % 3) * 0.5, (i % 2 ? -1 : 1) * (0.35 + i * 0.13));
    addFloating(
      leaf,
      (i % 2 ? -1 : 1) * (4.7 + (i % 3) * 0.65),
      -3.5 + (i % 6) * 1.32,
      -1 + (i % 3),
      i * 1.3,
    );
  }

  const makePaw = (material: THREE.Material) => {
    const group = new THREE.Group();
    const pad = new THREE.Mesh(geometry, material);
    pad.scale.set(0.53, 0.44, 0.25);
    group.add(pad);
    [
      [-0.57, 0.43],
      [-0.22, 0.76],
      [0.23, 0.76],
      [0.57, 0.43],
    ].forEach(([x, y]) => {
      const toe = new THREE.Mesh(geometry, material);
      toe.position.set(x, y, 0);
      toe.scale.set(0.2, 0.27, 0.2);
      toe.rotation.z = -x * 0.7;
      group.add(toe);
    });
    return group;
  };
  const paw = makePaw(materials[2]);
  paw.rotation.set(0.2, -0.35, -0.4);
  addFloating(paw, -4.7, 2.7, 1.5, 0.5);
  const smallPaw = makePaw(materials[4]);
  smallPaw.scale.setScalar(0.55);
  smallPaw.rotation.set(-0.2, 0.3, 0.5);
  addFloating(smallPaw, 4.2, -2.5, 2, 2);

  const ringGeometry = new THREE.TorusGeometry(1.25, 0.045, 10, 90);
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(ringGeometry, materials[i === 1 ? 2 : 4]);
    ring.rotation.set(0.5, 0.6, i);
    ring.scale.setScalar(i === 2 ? 2.2 : 0.7);
    addFloating(ring, i === 1 ? -5 : 5.2, i === 2 ? 0.5 : 2 - i * 4, -2, i + 3);
  }

  const particlesGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(65 * 3);
  // Deterministic placement keeps StrictMode remounts visually consistent.
  for (let i = 0; i < 65; i++) {
    positions[i * 3] = Math.sin(i * 127.1) * 9;
    positions[i * 3 + 1] = Math.cos(i * 311.7) * 6;
    positions[i * 3 + 2] = -4 + Math.sin(i * 74.7) * 3;
  }
  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particlesMaterial = new THREE.PointsMaterial({
    color: '#fffdf0',
    size: 0.045,
    transparent: true,
    opacity: 0.8,
  });
  const particles = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particles);

  let paused = initialPaused;
  let lost = false;
  let disposed = false;
  let lastFrame = 0;
  let time = 0;
  const pointer = new THREE.Vector2();
  const render = () => renderer.render(scene, camera);
  const tick = (now: number) => {
    if (now - lastFrame < 1000 / 30) return;
    time += Math.min((now - lastFrame) / 1000, 0.05);
    lastFrame = now;
    objects.forEach(({ mesh, x, y, phase }) => {
      mesh.position.y = y + Math.sin(time * 0.35 + phase) * 0.22;
      mesh.position.x = x + Math.cos(time * 0.22 + phase) * 0.12;
      mesh.rotation.y += 0.0015 * Math.sin(time * 0.2 + phase);
    });
    camera.position.x += (pointer.x * 0.35 - camera.position.x) * 0.035;
    camera.position.y += (pointer.y * 0.2 - camera.position.y) * 0.035;
    camera.lookAt(0, 0, 0);
    particles.rotation.z = Math.sin(time * 0.07) * 0.04;
    render();
  };
  const synchronize = () => {
    renderer.setAnimationLoop(null);
    if (disposed || lost || document.hidden) return;
    if (paused) render();
    else {
      lastFrame = performance.now();
      renderer.setAnimationLoop(tick);
    }
  };
  const resize = () => {
    const { width, height } = host.getBoundingClientRect();
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
    // Keep side sculptures at the edges on narrow screens.
    shapes.scale.set(
      width < 768 ? Math.max(0.35, camera.aspect * 0.85) : 1,
      width < 768 ? 0.7 : 1,
      1,
    );
    renderer.setSize(width, height);
    if (!lost) render();
  };
  const move = (event: PointerEvent) => {
    if (paused || event.pointerType !== 'mouse') return;
    pointer.set(
      (event.clientX / window.innerWidth) * 2 - 1,
      1 - (event.clientY / window.innerHeight) * 2,
    );
  };
  const reset = () => pointer.set(0, 0);
  const contextLost = (event: Event) => {
    event.preventDefault();
    lost = true;
    host.dataset.ready = 'false';
    synchronize();
  };
  const contextRestored = () => {
    lost = false;
    host.dataset.ready = 'true';
    resize();
    synchronize();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  window.addEventListener('pointermove', move, { passive: true });
  window.addEventListener('blur', reset);
  document.addEventListener('visibilitychange', synchronize);
  renderer.domElement.addEventListener('webglcontextlost', contextLost);
  renderer.domElement.addEventListener('webglcontextrestored', contextRestored);
  resize();
  synchronize();
  host.dataset.ready = 'true';

  return {
    setPaused(value: boolean) {
      paused = value;
      synchronize();
    },
    dispose() {
      disposed = true;
      renderer.setAnimationLoop(null);
      observer.disconnect();
      window.removeEventListener('pointermove', move);
      window.removeEventListener('blur', reset);
      document.removeEventListener('visibilitychange', synchronize);
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', contextRestored);
      geometry.dispose();
      ringGeometry.dispose();
      particlesGeometry.dispose();
      particlesMaterial.dispose();
      materials.forEach((material) => material.dispose());
      renderer.dispose();
      renderer.domElement.remove();
      delete host.dataset.ready;
    },
  };
}
