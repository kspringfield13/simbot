import { useCallback, useMemo, useState } from 'react';
import { useStore } from '../../stores/useStore';
import { getFloorPlan, saveFloorPlanId } from '../../config/floorPlans';
import { saveCustomFloorPlan } from '../../utils/proceduralFloorPlan';
import type { FloorPlanPreset } from '../../config/floorPlans';
import type { CustomRobot } from '../../config/crafting';
import {
  GALLERY_FLOOR_PLANS,
  GALLERY_ROBOT_BUILDS,
  loadSharedCreations,
  deleteSharedCreation,
  createShareUrl,
  exportFloorPlan,
  exportRobotBuild,
  type SharedCreation,
} from '../../utils/sharing';

type Tab = 'floor-plans' | 'robot-builds' | 'my-shares';

export function CommunityGallery() {
  const showCommunityGallery = useStore((s) => s.showCommunityGallery);
  const setShowCommunityGallery = useStore((s) => s.setShowCommunityGallery);
  const addNotification = useStore((s) => s.addNotification);
  const floorPlanId = useStore((s) => s.floorPlanId);
  const customRobots = useStore((s) => s.customRobots);

  const [tab, setTab] = useState<Tab>('floor-plans');
  const [copied, setCopied] = useState<string | null>(null);

  const myShares = useMemo(() => loadSharedCreations(), [showCommunityGallery]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLoadFloorPlan = useCallback((plan: FloorPlanPreset) => {
    // Save as custom floor plan so it persists
    saveCustomFloorPlan({ ...plan, id: plan.id.startsWith('gallery-') ? plan.id : `shared-${Date.now()}` });
    const id = plan.id.startsWith('gallery-') ? plan.id : `shared-${Date.now()}`;
    const savedPlan = { ...plan, id };
    saveCustomFloorPlan(savedPlan);
    saveFloorPlanId(savedPlan.id);
    useStore.setState({ floorPlanId: savedPlan.id });
    addNotification({ type: 'success', title: 'Floor Plan Loaded', message: `"${plan.name}" is now active. Refresh to see changes.` });
    setShowCommunityGallery(false);
  }, [addNotification, setShowCommunityGallery]);

  const handleLoadRobotBuild = useCallback((robot: CustomRobot) => {
    const existing = useStore.getState().customRobots;
    // Don't add duplicates
    if (existing.some((r) => r.id === robot.id)) {
      addNotification({ type: 'warning', title: 'Already Added', message: `"${robot.name}" is already in your robot builds.` });
      return;
    }
    const newRobot = { ...robot, id: `imported-${Date.now()}`, deployed: false };
    useStore.setState({ customRobots: [...existing, newRobot] });
    // Save to localStorage
    try {
      const craftingRaw = localStorage.getItem('simbot-crafting');
      const crafting = craftingRaw ? JSON.parse(craftingRaw) : { ownedParts: [], customRobots: [] };
      crafting.customRobots = [...(crafting.customRobots || []), newRobot];
      localStorage.setItem('simbot-crafting', JSON.stringify(crafting));
    } catch { /* ignore */ }
    addNotification({ type: 'success', title: 'Robot Build Loaded', message: `"${robot.name}" added to your crafting panel.` });
  }, [addNotification]);

  const handleCopyShareUrl = useCallback(async (content: ReturnType<typeof exportFloorPlan>) => {
    const url = createShareUrl(content);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(content.name);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      window.prompt('Copy this share link:', url);
    }
  }, []);

  const handleShareCurrentFloorPlan = useCallback(async () => {
    const plan = getFloorPlan(floorPlanId);
    const content = exportFloorPlan(plan);
    await handleCopyShareUrl(content);
  }, [floorPlanId, handleCopyShareUrl]);

  const handleShareRobotBuild = useCallback(async (robot: CustomRobot) => {
    const content = exportRobotBuild(robot);
    await handleCopyShareUrl(content);
  }, [handleCopyShareUrl]);

  const handleDeleteShare = useCallback((id: string) => {
    deleteSharedCreation(id);
    // Force re-render by toggling
    setShowCommunityGallery(false);
    setTimeout(() => setShowCommunityGallery(true), 0);
  }, [setShowCommunityGallery]);

  if (!showCommunityGallery) return null;

  const tabClass = (t: Tab) =>
    `px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
      tab === t
        ? 'bg-white/10 text-white border-b-2 border-cyan-400'
        : 'text-gray-400 hover:text-white hover:bg-white/5'
    }`;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={() => setShowCommunityGallery(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="mx-4 flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-white/10 bg-gray-900/95 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-white">Community Gallery</h2>
            <p className="text-xs text-gray-400">Browse, share, and load floor plans & robot builds</p>
          </div>
          <button
            type="button"
            onClick={() => setShowCommunityGallery(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-white/5 px-4 pt-2">
          <button type="button" className={tabClass('floor-plans')} onClick={() => setTab('floor-plans')}>
            Floor Plans
          </button>
          <button type="button" className={tabClass('robot-builds')} onClick={() => setTab('robot-builds')}>
            Robot Builds
          </button>
          <button type="button" className={tabClass('my-shares')} onClick={() => setTab('my-shares')}>
            My Shares ({myShares.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {tab === 'floor-plans' && (
            <div className="space-y-3">
              {/* Share current floor plan */}
              <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-cyan-300">Share Your Current Floor Plan</span>
                    <p className="text-xs text-gray-400">Currently using: {getFloorPlan(floorPlanId).name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleShareCurrentFloorPlan}
                    className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-300 transition-colors hover:bg-cyan-400/20"
                  >
                    {copied === getFloorPlan(floorPlanId).name ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
              </div>

              {/* Gallery examples */}
              <h3 className="mt-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Example Floor Plans</h3>
              {GALLERY_FLOOR_PLANS.map((item) => (
                <GalleryCard
                  key={item.name}
                  name={item.name}
                  description={item.description}
                  type="floor-plan"
                  onLoad={() => handleLoadFloorPlan(item.content.data as FloorPlanPreset)}
                  onShare={() => handleCopyShareUrl(item.content)}
                  isCopied={copied === item.name}
                />
              ))}
            </div>
          )}

          {tab === 'robot-builds' && (
            <div className="space-y-3">
              {/* Share user's custom robots */}
              {customRobots.length > 0 && (
                <>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Your Robot Builds</h3>
                  {customRobots.map((robot) => (
                    <GalleryCard
                      key={robot.id}
                      name={robot.name}
                      description={`Parts: ${robot.headId}, ${robot.bodyId}, ${robot.armsId}, ${robot.legsId}`}
                      type="robot-build"
                      onShare={() => handleShareRobotBuild(robot)}
                      isCopied={copied === robot.name}
                    />
                  ))}
                  <div className="my-3 border-t border-white/5" />
                </>
              )}

              {/* Gallery examples */}
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Example Robot Builds</h3>
              {GALLERY_ROBOT_BUILDS.map((item) => (
                <GalleryCard
                  key={item.name}
                  name={item.name}
                  description={item.description}
                  type="robot-build"
                  onLoad={() => handleLoadRobotBuild(item.content.data as CustomRobot)}
                  onShare={() => handleCopyShareUrl(item.content)}
                  isCopied={copied === item.name}
                />
              ))}
            </div>
          )}

          {tab === 'my-shares' && (
            <div className="space-y-3">
              {myShares.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  No shared creations yet. Share a floor plan or robot build to see it here.
                </div>
              ) : (
                myShares.map((share) => (
                  <MyShareCard
                    key={share.id}
                    share={share}
                    onCopy={() => handleCopyShareUrl(share.content)}
                    onDelete={() => handleDeleteShare(share.id)}
                    isCopied={copied === share.content.name}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Card components ──────────────────────────────────────────

function GalleryCard({
  name,
  description,
  type,
  onLoad,
  onShare,
  isCopied,
}: {
  name: string;
  description: string;
  type: 'floor-plan' | 'robot-build';
  onLoad?: () => void;
  onShare: () => void;
  isCopied: boolean;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3 transition-colors hover:bg-white/8">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-base">{type === 'floor-plan' ? '\u{1F3E0}' : '\u{1F916}'}</span>
            <span className="text-sm font-medium text-white">{name}</span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-gray-400">{description}</p>
        </div>
        <div className="flex gap-1.5">
          {onLoad && (
            <button
              type="button"
              onClick={onLoad}
              className="rounded-lg border border-green-400/30 bg-green-400/10 px-3 py-1.5 text-xs font-medium text-green-300 transition-colors hover:bg-green-400/20"
            >
              Load
            </button>
          )}
          <button
            type="button"
            onClick={onShare}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              isCopied
                ? 'border-green-400/50 bg-green-400/20 text-green-300'
                : 'border-white/20 bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            {isCopied ? 'Copied!' : 'Share'}
          </button>
        </div>
      </div>
    </div>
  );
}

function MyShareCard({
  share,
  onCopy,
  onDelete,
  isCopied,
}: {
  share: SharedCreation;
  onCopy: () => void;
  onDelete: () => void;
  isCopied: boolean;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-base">{share.type === 'floor-plan' ? '\u{1F3E0}' : '\u{1F916}'}</span>
            <span className="text-sm font-medium text-white">{share.name}</span>
            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-gray-400">
              {share.type === 'floor-plan' ? 'Floor Plan' : 'Robot Build'}
            </span>
          </div>
          <p className="mt-1 text-[10px] text-gray-500">
            Shared {new Date(share.sharedAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={onCopy}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              isCopied
                ? 'border-green-400/50 bg-green-400/20 text-green-300'
                : 'border-white/20 bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            {isCopied ? 'Copied!' : 'Copy Link'}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg border border-red-400/20 bg-red-400/5 px-2 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-400/15"
            title="Delete"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
