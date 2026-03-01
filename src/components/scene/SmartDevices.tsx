import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../stores/useStore';
import { DEVICES } from '../../config/devices';
import { Html } from '@react-three/drei';


// ── LIGHT FIXTURE ──────────────────────────────────────────────

function SmartLight({ deviceId, position }: { deviceId: string; position: [number, number, number] }) {
  const on = useStore((s) => s.deviceStates[deviceId]?.on ?? false);
  const coneRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    const period = useStore.getState().simPeriod;
    // Dim lights at night to ~25% brightness, making flashlights meaningful
    const nightDim = period === 'night' ? 0.25 : 1.0;

    if (coneRef.current) {
      const target = on ? 0.18 * nightDim : 0;
      const mat = coneRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity += (target - mat.opacity) * 0.08;
    }
    if (glowRef.current) {
      const target = on ? 0.8 * nightDim : 0;
      glowRef.current.intensity += (target - glowRef.current.intensity) * 0.08;
    }
  });

  return (
    <group position={position}>
      {/* Light fixture body */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.5, 0.2, 16]} />
        <meshStandardMaterial
          color={on ? '#fff8e0' : '#888888'}
          emissive={on ? '#ffdd66' : '#000000'}
          emissiveIntensity={on ? 0.5 : 0}
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>

      {/* Bulb */}
      <mesh position={[0, -0.15, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial
          color={on ? '#fffbe0' : '#666666'}
          emissive={on ? '#ffee88' : '#000000'}
          emissiveIntensity={on ? 1.2 : 0}
          transparent
          opacity={on ? 0.9 : 0.5}
        />
      </mesh>

      {/* Light cone (visible beam) */}
      <mesh ref={coneRef} position={[0, -2.2, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[3.5, 4, 32, 1, true]} />
        <meshBasicMaterial
          color="#fff5d0"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Point light that actually illuminates */}
      <pointLight
        ref={glowRef}
        color="#ffe8c0"
        intensity={0}
        distance={14}
        decay={2}
        position={[0, -0.5, 0]}
      />
    </group>
  );
}

// ── THERMOSTAT ──────────────────────────────────────────────

function Thermostat({ deviceId, position }: { deviceId: string; position: [number, number, number] }) {
  const device = useStore((s) => s.deviceStates[deviceId]);
  const on = device?.on ?? true;
  const temp = device?.temperature ?? 72;

  const tempColor = temp <= 68 ? '#60a0ff' : temp <= 74 ? '#40cc70' : temp <= 78 ? '#ffaa30' : '#ff5040';

  return (
    <group position={position}>
      {/* Wall mount plate */}
      <mesh rotation={[0, 0, 0]}>
        <boxGeometry args={[0.8, 1.0, 0.08]} />
        <meshStandardMaterial
          color="#e0e0e0"
          metalness={0.4}
          roughness={0.3}
        />
      </mesh>

      {/* Display screen */}
      <mesh position={[0, 0.05, 0.05]}>
        <boxGeometry args={[0.6, 0.5, 0.02]} />
        <meshStandardMaterial
          color={on ? '#111111' : '#333333'}
          emissive={on ? tempColor : '#000000'}
          emissiveIntensity={on ? 0.8 : 0}
        />
      </mesh>

      {/* Temperature indicator ring */}
      {on && (
        <mesh position={[0, 0.05, 0.07]}>
          <ringGeometry args={[0.18, 0.22, 32]} />
          <meshBasicMaterial
            color={tempColor}
            transparent
            opacity={0.7}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Floating label */}
      {on && (
        <Html position={[0, 0.6, 0.1]} center distanceFactor={8}>
          <div style={{
            background: 'rgba(0,0,0,0.7)',
            color: tempColor,
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 'bold',
            fontFamily: 'monospace',
            whiteSpace: 'nowrap',
            border: `1px solid ${tempColor}40`,
          }}>
            {temp}°F
          </div>
        </Html>
      )}

      {/* Subtle glow */}
      {on && (
        <pointLight
          color={tempColor}
          intensity={0.15}
          distance={3}
          decay={2}
          position={[0, 0, 0.2]}
        />
      )}
    </group>
  );
}

// ── TV ──────────────────────────────────────────────────────

function SmartTV({ deviceId, position }: { deviceId: string; position: [number, number, number] }) {
  const on = useStore((s) => s.deviceStates[deviceId]?.on ?? false);
  const screenRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;

    if (screenRef.current) {
      const mat = screenRef.current.material as THREE.MeshStandardMaterial;
      if (on) {
        // Animated color cycling for "TV content"
        const t = timeRef.current;
        const r = Math.sin(t * 0.7) * 0.3 + 0.5;
        const g = Math.sin(t * 1.1 + 2) * 0.3 + 0.5;
        const b = Math.sin(t * 0.9 + 4) * 0.3 + 0.5;
        mat.emissive.setRGB(r, g, b);
        mat.emissiveIntensity += (1.5 - mat.emissiveIntensity) * 0.1;
        mat.color.setRGB(r * 0.3, g * 0.3, b * 0.3);
      } else {
        mat.emissiveIntensity += (0 - mat.emissiveIntensity) * 0.1;
        mat.color.setRGB(0.05, 0.05, 0.05);
      }
    }

    if (glowRef.current) {
      const target = on ? 0.6 : 0;
      glowRef.current.intensity += (target - glowRef.current.intensity) * 0.08;
      if (on) {
        const t = timeRef.current;
        const r = Math.sin(t * 0.7) * 0.3 + 0.5;
        const g = Math.sin(t * 1.1 + 2) * 0.3 + 0.5;
        const b = Math.sin(t * 0.9 + 4) * 0.3 + 0.5;
        glowRef.current.color.setRGB(r, g, b);
      }
    }
  });

  return (
    <group position={position}>
      {/* TV screen overlay — positioned on top of the existing tv.glb model */}
      <mesh ref={screenRef} position={[0, 0.2, 0.15]}>
        <planeGeometry args={[2.2, 1.4]} />
        <meshStandardMaterial
          color="#050505"
          emissive="#000000"
          emissiveIntensity={0}
          metalness={0.1}
          roughness={0.2}
        />
      </mesh>

      {/* Static noise overlay when on */}
      {on && (
        <TVStatic position={[0, 0.2, 0.16]} />
      )}

      {/* Ambient glow from TV */}
      <pointLight
        ref={glowRef}
        color="#8090ff"
        intensity={0}
        distance={8}
        decay={2}
        position={[0, 0, 1.5]}
      />
    </group>
  );
}

function TVStatic({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshBasicMaterial;
      // Subtle flickering opacity to simulate screen content
      mat.opacity = 0.08 + Math.sin(timeRef.current * 12) * 0.03 + Math.sin(timeRef.current * 7.3) * 0.02;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={[2.1, 1.3]} />
      <meshBasicMaterial
        color="#ffffff"
        transparent
        opacity={0.08}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

// ── AUTO LIGHT CONTROLLER ──────────────────────────────────

function AutoLightController() {
  const lastPeriodRef = useRef<string>('');

  useFrame(() => {
    const s = useStore.getState();
    const period = s.simPeriod;

    if (period === lastPeriodRef.current) return;
    lastPeriodRef.current = period;

    // Auto-toggle lights based on time of day
    const shouldBeOn = period === 'evening' || period === 'night';

    for (const device of DEVICES) {
      if (device.type !== 'light') continue;
      const current = s.deviceStates[device.id];
      if (!current) continue;

      // Only auto-toggle if user hasn't manually overridden recently
      // Simple: just auto-set based on time period transition
      if (current.on !== shouldBeOn) {
        s.setDeviceOn(device.id, shouldBeOn);
      }
    }
  });

  return null;
}

// ── MAIN EXPORT ──────────────────────────────────────────────

export function SmartDevices() {
  return (
    <>
      <AutoLightController />
      {DEVICES.map((device) => {
        switch (device.type) {
          case 'light':
            return <SmartLight key={device.id} deviceId={device.id} position={device.position} />;
          case 'thermostat':
            return <Thermostat key={device.id} deviceId={device.id} position={device.position} />;
          case 'tv':
            return <SmartTV key={device.id} deviceId={device.id} position={device.position} />;
          default:
            return null;
        }
      })}
    </>
  );
}
