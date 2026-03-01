import { Canvas } from '@react-three/fiber';

function App() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gray-900">
      <Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
        <ambientLight intensity={1} />
        <directionalLight position={[5, 10, 5]} intensity={1} />
        <mesh position={[0, 1, 0]}>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color="orange" />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#555" />
        </mesh>
      </Canvas>
      <div className="fixed top-4 left-4 z-10 text-white text-lg font-bold bg-black/50 px-4 py-2 rounded">
        SimBot WebGL Test
      </div>
    </div>
  );
}

export default App;
