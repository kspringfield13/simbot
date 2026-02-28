import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../stores/useStore';
import type { RobotId, RobotInstanceState, WeatherType, RoomNeedState, RoomId, Task } from '../types';
import { ROBOT_IDS } from '../types';

const CHANNEL_NAME = 'simbot-spectator';
const BROADCAST_INTERVAL = 500; // ms
const PRESENCE_INTERVAL = 2000; // ms

// ── Serializable snapshot of sim state ──────────────────────────
export interface SimSnapshot {
  robots: Record<RobotId, RobotInstanceState>;
  activeRobotId: RobotId;
  simMinutes: number;
  simSpeed: number;
  simPeriod: string;
  weather: WeatherType;
  roomNeeds: Record<RoomId, RoomNeedState>;
  tasks: Task[];
  seasonalDecorations: boolean;
  musicEnabled: boolean;
  musicGenreLabel: string;
}

type ChannelMessage =
  | { type: 'state'; snapshot: SimSnapshot; hostId: string }
  | { type: 'presence'; viewerId: string }
  | { type: 'presence_ack'; hostId: string; viewerCount: number }
  | { type: 'viewer_join'; viewerId: string }
  | { type: 'viewer_leave'; viewerId: string };

// ── Unique tab ID ──────────────────────────
const TAB_ID = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// ── Snapshot helpers ──────────────────────────
function captureSnapshot(): SimSnapshot {
  const s = useStore.getState();
  return {
    robots: s.robots,
    activeRobotId: s.activeRobotId,
    simMinutes: s.simMinutes,
    simSpeed: s.simSpeed,
    simPeriod: s.simPeriod,
    weather: s.weather,
    roomNeeds: s.roomNeeds,
    tasks: s.tasks.filter((t) => t.status !== 'completed'),
    seasonalDecorations: s.seasonalDecorations,
    musicEnabled: s.musicEnabled,
    musicGenreLabel: s.musicGenreLabel,
  };
}

function applySnapshot(snapshot: SimSnapshot) {
  const store = useStore.getState();
  // Apply robot states
  for (const id of ROBOT_IDS) {
    const r = snapshot.robots[id];
    if (r) {
      store.setRobotPosition(id, r.position);
      store.setRobotState(id, r.state);
      store.setCurrentAnimation(id, r.currentAnimation);
      store.setRobotMood(id, r.mood);
      store.setRobotBattery(id, r.battery);
      store.setRobotCharging(id, r.isCharging);
      store.setRobotThought(id, r.thought);
      store.setRobotRotationY(id, r.rotationY);
      store.updateRobotNeeds(id, r.needs);
      store.setRobotTarget(id, r.target);
      store.setRobotPath(id, r.path);
      store.setCurrentPathIndex(id, r.currentPathIndex);
    }
  }
  store.setActiveRobotId(snapshot.activeRobotId);
  store.setWeather(snapshot.weather);
}

// ── URL snapshot encoding ──────────────────────────
export function encodeSnapshotToHash(snapshot: SimSnapshot): string {
  const json = JSON.stringify(snapshot);
  const encoded = btoa(unescape(encodeURIComponent(json)));
  return `#spectate=${encoded}`;
}

export function decodeSnapshotFromHash(hash: string): SimSnapshot | null {
  try {
    const match = hash.match(/^#spectate=(.+)$/);
    if (!match) return null;
    const json = decodeURIComponent(escape(atob(match[1])));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// ── Check if we're in spectator mode ──────────────────────────
export function isSpectatorMode(): boolean {
  return window.location.hash.startsWith('#spectate=');
}

// ── Host: broadcasts state to spectators ──────────────────────────
export function useSpectatorHost() {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const viewersRef = useRef<Set<string>>(new Set());
  const viewerCountRef = useRef(0);

  useEffect(() => {
    if (isSpectatorMode()) return;

    try {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channelRef.current = channel;

      // Broadcast state periodically
      const stateInterval = setInterval(() => {
        const snapshot = captureSnapshot();
        const msg: ChannelMessage = { type: 'state', snapshot, hostId: TAB_ID };
        channel.postMessage(msg);
      }, BROADCAST_INTERVAL);

      // Listen for viewers
      channel.onmessage = (event: MessageEvent<ChannelMessage>) => {
        const data = event.data;
        if (data.type === 'viewer_join') {
          viewersRef.current.add(data.viewerId);
          viewerCountRef.current = viewersRef.current.size;
          useStore.setState({ spectatorViewerCount: viewerCountRef.current });
          // Acknowledge
          const ack: ChannelMessage = {
            type: 'presence_ack',
            hostId: TAB_ID,
            viewerCount: viewerCountRef.current,
          };
          channel.postMessage(ack);
        } else if (data.type === 'viewer_leave') {
          viewersRef.current.delete(data.viewerId);
          viewerCountRef.current = viewersRef.current.size;
          useStore.setState({ spectatorViewerCount: viewerCountRef.current });
        } else if (data.type === 'presence') {
          viewersRef.current.add(data.viewerId);
          viewerCountRef.current = viewersRef.current.size;
          useStore.setState({ spectatorViewerCount: viewerCountRef.current });
        }
      };

      return () => {
        clearInterval(stateInterval);
        channel.close();
      };
    } catch {
      // BroadcastChannel not supported
    }
  }, []);
}

// ── Spectator: receives state from host ──────────────────────────
export function useSpectatorViewer() {
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    if (!isSpectatorMode()) return;

    // First check if hash has a static snapshot
    const hashSnapshot = decodeSnapshotFromHash(window.location.hash);
    if (hashSnapshot) {
      applySnapshot(hashSnapshot);
      useStore.setState({ isSpectating: true });
    }

    // Try BroadcastChannel for live sync (same-origin tabs)
    try {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channelRef.current = channel;

      // Announce join
      const joinMsg: ChannelMessage = { type: 'viewer_join', viewerId: TAB_ID };
      channel.postMessage(joinMsg);

      // Send presence pings
      const presenceInterval = setInterval(() => {
        const msg: ChannelMessage = { type: 'presence', viewerId: TAB_ID };
        channel.postMessage(msg);
      }, PRESENCE_INTERVAL);

      channel.onmessage = (event: MessageEvent<ChannelMessage>) => {
        const data = event.data;
        if (data.type === 'state') {
          applySnapshot(data.snapshot);
          useStore.setState({ isSpectating: true, spectatorLive: true });
        } else if (data.type === 'presence_ack') {
          useStore.setState({ spectatorViewerCount: data.viewerCount });
        }
      };

      // Announce leave on unload
      const handleUnload = () => {
        const leaveMsg: ChannelMessage = { type: 'viewer_leave', viewerId: TAB_ID };
        channel.postMessage(leaveMsg);
      };
      window.addEventListener('beforeunload', handleUnload);

      return () => {
        clearInterval(presenceInterval);
        handleUnload();
        window.removeEventListener('beforeunload', handleUnload);
        channel.close();
      };
    } catch {
      // BroadcastChannel not supported — static snapshot only
    }
  }, []);
}

// ── Generate share URL ──────────────────────────
export function useShareUrl() {
  return useCallback(() => {
    const snapshot = captureSnapshot();
    const hash = encodeSnapshotToHash(snapshot);
    const url = `${window.location.origin}${window.location.pathname}${hash}`;
    return url;
  }, []);
}
