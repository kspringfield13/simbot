import { Canvas } from '@react-three/fiber';

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1a1a2e' }}>
      <Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
        <ambientLight intensity={1} />
        <directionalLight position={[5, 10, 5]} intensity={1} />
        <mesh position={[0, 1, 0]}>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color="orange" />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#555" />
        </mesh>
      </Canvas>
      <div style={{ position: 'fixed', top: 16, left: 16, color: 'white', fontSize: 18, fontWeight: 'bold', background: 'rgba(0,0,0,0.5)', padding: '8px 16px', borderRadius: 8, zIndex: 10 }}>
        SimBot WebGL Test v3
      </div>
    </div>
  );
}

export default App;
