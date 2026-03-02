import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { getEffectiveRooms } from './utils/homeLayout';
import { useStore } from './stores/useStore';
import { Room } from './components/scene/Room';

function MinimalScene() {
  const roomLayout = useStore((s) => s.roomLayout);
  const floorPlanId = useStore((s) => s.floorPlanId);

  const effectiveRooms = getEffectiveRooms(
    roomLayout.overrides, roomLayout.addedRooms, roomLayout.deletedRoomIds, floorPlanId,
  );

  return (
    <>
      <ambientLight intensity={1} />
      <directionalLight position={[10, 25, 10]} intensity={1} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#555" />
      </mesh>

      {effectiveRooms.map((room) => (
        <Room key={room.id} room={room} />
      ))}
    </>
  );
}

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#111' }}>
      <Canvas camera={{ position: [0, 30, 30], fov: 50 }}>
        <Suspense fallback={null}>
          <MinimalScene />
        </Suspense>
      </Canvas>
      <div style={{ position: 'fixed', top: 16, left: 16, color: 'white', fontSize: 18, fontWeight: 'bold', background: 'rgba(0,0,0,0.5)', padding: '8px 16px', borderRadius: 8, zIndex: 10 }}>
        Test: Rooms Only
      </div>
    </div>
  );
}

export default App;
