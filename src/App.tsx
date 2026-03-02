import { Canvas } from '@react-three/fiber';
import { Suspense, Component, type ReactNode } from 'react';
import { getEffectiveRooms } from './utils/homeLayout';
import { useStore } from './stores/useStore';
import { Room } from './components/scene/Room';

// Error boundary to catch and display crashes
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ color: 'white', padding: 40, fontFamily: 'monospace', background: '#1a0000', height: '100vh' }}>
          <h1 style={{ color: '#ff4444' }}>SimBot Crashed</h1>
          <p>{this.state.error.message}</p>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, color: '#ff8888', maxHeight: '60vh', overflow: 'auto' }}>
            {this.state.error.stack}
          </pre>
          <button
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            style={{ marginTop: 20, padding: '12px 24px', background: '#ff4444', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 16 }}
          >
            Clear Data &amp; Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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
    <ErrorBoundary>
      <div style={{ width: '100vw', height: '100vh', background: '#111' }}>
        <Canvas camera={{ position: [0, 30, 30], fov: 50 }}>
          <Suspense fallback={null}>
            <MinimalScene />
          </Suspense>
        </Canvas>
        <div style={{ position: 'fixed', top: 16, left: 16, color: 'white', fontSize: 18, fontWeight: 'bold', background: 'rgba(0,0,0,0.5)', padding: '8px 16px', borderRadius: 8, zIndex: 10 }}>
          Test: Rooms + Error Boundary
        </div>
        <button
          onClick={() => { localStorage.clear(); window.location.reload(); }}
          style={{ position: 'fixed', bottom: 16, right: 16, padding: '12px 24px', background: '#ff4444', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, zIndex: 10 }}
        >
          Clear Cache &amp; Reload
        </button>
      </div>
    </ErrorBoundary>
  );
}

export default App;
