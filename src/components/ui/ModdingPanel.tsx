import { useState, useCallback, useMemo, useRef } from 'react';
import { useStore } from '../../stores/useStore';
import type { RobotMod, BehaviorMod, SkinMod, SkinPattern, RobotId, SkinAccessory, ModType, BehaviorHook } from '../../types';
import { ROBOT_IDS } from '../../types';
import {
  EXAMPLE_BEHAVIOR_MODS,
  EXAMPLE_SKIN_MODS,
  ACCESSORY_CATALOG,
  SKIN_PATTERNS,
  validateModCode,
  executeBehaviorMod,
} from '../../config/modding';
import {
  loadMods,
  saveMods,
  generateModId,
} from '../../utils/modStorage';

// ── Sub-views ────────────────────────────────────────────

type PanelView = 'gallery' | 'behavior-editor' | 'skin-editor' | 'test-result';

// ── Component ────────────────────────────────────────────

export function ModdingPanel() {
  const show = useStore((s) => s.showModdingPanel);
  const setShow = useStore((s) => s.setShowModdingPanel);
  const robots = useStore((s) => s.robots);
  const activeRobotId = useStore((s) => s.activeRobotId);

  const [view, setView] = useState<PanelView>('gallery');
  const [mods, setMods] = useState<RobotMod[]>(() => loadMods());

  // Behavior editor state
  const [editingModId, setEditingModId] = useState<string | null>(null);
  const [behaviorName, setBehaviorName] = useState('');
  const [behaviorDesc, setBehaviorDesc] = useState('');
  const [behaviorCode, setBehaviorCode] = useState('');
  const [behaviorTarget, setBehaviorTarget] = useState<RobotId | 'all'>('all');
  const [behaviorHook, setBehaviorHook] = useState<BehaviorHook>('onTask');
  const [codeError, setCodeError] = useState<string | null>(null);

  // Skin editor state
  const [skinName, setSkinName] = useState('');
  const [skinDesc, setSkinDesc] = useState('');
  const [skinBodyColor, setSkinBodyColor] = useState('#3b82f6');
  const [skinAccentColor, setSkinAccentColor] = useState('#8b5cf6');
  const [skinGlowColor, setSkinGlowColor] = useState('#60a5fa');
  const [skinPattern, setSkinPattern] = useState<SkinPattern>('solid');
  const [skinAccessories, setSkinAccessories] = useState<SkinAccessory[]>([]);
  const [skinTarget, setSkinTarget] = useState<RobotId | 'all'>('all');

  // Test result state
  const [testResult, setTestResult] = useState<{ actions: { type: string; value?: number | string }[]; messages: string[]; error?: string } | null>(null);

  // Import/export
  const importInputRef = useRef<HTMLInputElement>(null);

  const exportMods = useCallback(() => {
    const json = JSON.stringify(mods, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simbot-mods-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [mods]);

  const importMods = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (!Array.isArray(parsed)) return;
        const imported: RobotMod[] = parsed
          .filter((m: RobotMod) => m.type === 'behavior' || m.type === 'skin')
          .map((m: RobotMod) => ({
            ...m,
            id: generateModId(), // assign new IDs to avoid collisions
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }));
        if (imported.length > 0) {
          const updated = [...imported, ...mods].slice(0, 50);
          setMods(updated);
          saveMods(updated);
        }
      } catch {
        // invalid JSON — silently ignore
      }
      // reset input so same file can be re-imported
      if (importInputRef.current) importInputRef.current.value = '';
    };
    reader.readAsText(file);
  }, [mods]);

  // Filter state
  const [filterType, setFilterType] = useState<ModType | 'all'>('all');

  const filteredMods = useMemo(() => {
    if (filterType === 'all') return mods;
    return mods.filter((m) => m.type === filterType);
  }, [mods, filterType]);

  const activeBehaviorCount = useMemo(
    () => mods.filter((m) => m.type === 'behavior' && m.enabled).length,
    [mods],
  );
  const activeSkinCount = useMemo(
    () => mods.filter((m) => m.type === 'skin' && m.enabled).length,
    [mods],
  );

  const resetBehaviorEditor = useCallback(() => {
    setEditingModId(null);
    setBehaviorName('');
    setBehaviorDesc('');
    setBehaviorCode('');
    setBehaviorTarget('all');
    setBehaviorHook('onTask');
    setCodeError(null);
  }, []);

  const resetSkinEditor = useCallback(() => {
    setEditingModId(null);
    setSkinName('');
    setSkinDesc('');
    setSkinBodyColor('#3b82f6');
    setSkinAccentColor('#8b5cf6');
    setSkinGlowColor('#60a5fa');
    setSkinPattern('solid');
    setSkinAccessories([]);
    setSkinTarget('all');
  }, []);

  const openBehaviorEditor = useCallback((mod?: BehaviorMod) => {
    if (mod) {
      setEditingModId(mod.id);
      setBehaviorName(mod.name);
      setBehaviorDesc(mod.description);
      setBehaviorCode(mod.code);
      setBehaviorTarget(mod.targetRobot);
      setBehaviorHook(mod.hook);
    } else {
      resetBehaviorEditor();
    }
    setCodeError(null);
    setView('behavior-editor');
  }, [resetBehaviorEditor]);

  const openSkinEditor = useCallback((mod?: SkinMod) => {
    if (mod) {
      setEditingModId(mod.id);
      setSkinName(mod.name);
      setSkinDesc(mod.description);
      setSkinBodyColor(mod.bodyColor);
      setSkinAccentColor(mod.accentColor);
      setSkinGlowColor(mod.glowColor);
      setSkinPattern(mod.pattern || 'solid');
      setSkinAccessories([...mod.accessories]);
      setSkinTarget(mod.targetRobot);
    } else {
      resetSkinEditor();
    }
    setView('skin-editor');
  }, [resetSkinEditor]);

  const saveBehaviorMod = useCallback(() => {
    if (!behaviorName.trim()) {
      setCodeError('Name is required');
      return;
    }
    const validation = validateModCode(behaviorCode);
    if (!validation.valid) {
      setCodeError(validation.error || 'Invalid code');
      return;
    }
    setCodeError(null);

    const now = Date.now();
    if (editingModId) {
      const updated = mods.map((m) =>
        m.id === editingModId
          ? { ...m, name: behaviorName, description: behaviorDesc, code: behaviorCode, hook: behaviorHook, targetRobot: behaviorTarget, updatedAt: now }
          : m,
      );
      setMods(updated);
      saveMods(updated as RobotMod[]);
    } else {
      const newMod: BehaviorMod = {
        id: generateModId(),
        name: behaviorName,
        description: behaviorDesc,
        type: 'behavior',
        hook: behaviorHook,
        code: behaviorCode,
        targetRobot: behaviorTarget,
        enabled: false,
        createdAt: now,
        updatedAt: now,
      };
      const updated = [newMod, ...mods];
      setMods(updated);
      saveMods(updated);
    }
    resetBehaviorEditor();
    setView('gallery');
  }, [behaviorName, behaviorDesc, behaviorCode, behaviorHook, behaviorTarget, editingModId, mods, resetBehaviorEditor]);

  const saveSkinMod = useCallback(() => {
    if (!skinName.trim()) return;
    const now = Date.now();
    if (editingModId) {
      const updated = mods.map((m) =>
        m.id === editingModId
          ? { ...m, name: skinName, description: skinDesc, bodyColor: skinBodyColor, accentColor: skinAccentColor, glowColor: skinGlowColor, pattern: skinPattern, accessories: skinAccessories, targetRobot: skinTarget, updatedAt: now }
          : m,
      );
      setMods(updated);
      saveMods(updated as RobotMod[]);
    } else {
      const newMod: SkinMod = {
        id: generateModId(),
        name: skinName,
        description: skinDesc,
        type: 'skin',
        bodyColor: skinBodyColor,
        accentColor: skinAccentColor,
        glowColor: skinGlowColor,
        pattern: skinPattern,
        accessories: skinAccessories,
        targetRobot: skinTarget,
        enabled: false,
        createdAt: now,
        updatedAt: now,
      };
      const updated = [newMod, ...mods];
      setMods(updated);
      saveMods(updated);
    }
    resetSkinEditor();
    setView('gallery');
  }, [skinName, skinDesc, skinBodyColor, skinAccentColor, skinGlowColor, skinPattern, skinAccessories, skinTarget, editingModId, mods, resetSkinEditor]);

  const toggleModEnabled = useCallback((modId: string) => {
    const updated = mods.map((m) =>
      m.id === modId ? { ...m, enabled: !m.enabled, updatedAt: Date.now() } as RobotMod : m,
    );
    setMods(updated);
    saveMods(updated);
  }, [mods]);

  const deleteMod = useCallback((modId: string) => {
    const updated = mods.filter((m) => m.id !== modId);
    setMods(updated);
    saveMods(updated);
  }, [mods]);

  const testBehaviorMod = useCallback((mod: BehaviorMod) => {
    const robotState = robots[activeRobotId];
    const result = executeBehaviorMod(mod.code, {
      robot: {
        id: activeRobotId,
        battery: robotState.battery,
        mood: robotState.mood,
        state: robotState.state,
        needs: { ...robotState.needs },
      },
      hook: mod.hook,
    });
    setTestResult(result);
    setView('test-result');
  }, [robots, activeRobotId]);

  const loadExampleBehavior = useCallback((index: number) => {
    const example = EXAMPLE_BEHAVIOR_MODS[index];
    setBehaviorName(example.name);
    setBehaviorDesc(example.description);
    setBehaviorCode(example.code);
    setBehaviorTarget(example.targetRobot);
    setBehaviorHook(example.hook);
    setCodeError(null);
  }, []);

  const loadExampleSkin = useCallback((index: number) => {
    const example = EXAMPLE_SKIN_MODS[index];
    setSkinName(example.name);
    setSkinDesc(example.description);
    setSkinBodyColor(example.bodyColor);
    setSkinAccentColor(example.accentColor);
    setSkinGlowColor(example.glowColor);
    setSkinPattern(example.pattern || 'solid');
    setSkinAccessories([...example.accessories]);
    setSkinTarget(example.targetRobot);
  }, []);

  const toggleAccessory = useCallback((type: string) => {
    setSkinAccessories((prev) => {
      const exists = prev.find((a) => a.type === type);
      if (exists) return prev.filter((a) => a.type !== type);
      return [...prev, { type: type as SkinAccessory['type'], color: skinAccentColor }];
    });
  }, [skinAccentColor]);

  if (!show) return null;

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setShow(false)}
      />

      {/* Panel */}
      <div className="relative z-10 flex h-[85vh] w-[720px] max-w-[95vw] flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-gray-900/95 to-gray-950/95 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20 text-xl">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-violet-400">
                <path d="M12 3l1.912 5.813h6.123l-4.974 3.613 1.912 5.813L12 14.626l-4.973 3.613 1.912-5.813-4.974-3.613h6.123z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Robot Mod Workshop</h2>
              <p className="text-xs text-gray-400">
                {activeBehaviorCount} behavior{activeBehaviorCount !== 1 ? 's' : ''} active
                {' / '}
                {activeSkinCount} skin{activeSkinCount !== 1 ? 's' : ''} active
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShow(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            X
          </button>
        </div>

        {/* Navigation */}
        {view === 'gallery' && (
          <div className="flex items-center gap-2 border-b border-white/5 px-6 py-3">
            <button
              type="button"
              onClick={() => openBehaviorEditor()}
              className="rounded-lg bg-violet-500/20 px-3 py-1.5 text-xs font-medium text-violet-300 transition-colors hover:bg-violet-500/30"
            >
              + New Behavior
            </button>
            <button
              type="button"
              onClick={() => openSkinEditor()}
              className="rounded-lg bg-cyan-500/20 px-3 py-1.5 text-xs font-medium text-cyan-300 transition-colors hover:bg-cyan-500/30"
            >
              + New Skin
            </button>
            <div className="mx-1 h-4 w-px bg-white/10" />
            <button
              type="button"
              onClick={exportMods}
              disabled={mods.length === 0}
              className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:bg-white/10 disabled:opacity-30"
              title="Export all mods as JSON"
            >
              Export
            </button>
            <button
              type="button"
              onClick={() => importInputRef.current?.click()}
              className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:bg-white/10"
              title="Import mods from JSON"
            >
              Import
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept=".json"
              onChange={importMods}
              className="hidden"
            />
            <div className="flex-1" />
            {/* Filter */}
            <div className="flex gap-1 rounded-lg bg-white/5 p-0.5">
              {(['all', 'behavior', 'skin'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilterType(f)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    filterType === f
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'behavior' ? 'Behaviors' : 'Skins'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {view === 'gallery' && (
            <GalleryView
              mods={filteredMods}
              onToggle={toggleModEnabled}
              onDelete={deleteMod}
              onEditBehavior={(m) => openBehaviorEditor(m as BehaviorMod)}
              onEditSkin={(m) => openSkinEditor(m as SkinMod)}
              onTest={testBehaviorMod}
            />
          )}

          {view === 'behavior-editor' && (
            <BehaviorEditorView
              name={behaviorName}
              setName={setBehaviorName}
              description={behaviorDesc}
              setDescription={setBehaviorDesc}
              code={behaviorCode}
              setCode={setBehaviorCode}
              target={behaviorTarget}
              setTarget={setBehaviorTarget}
              hook={behaviorHook}
              setHook={setBehaviorHook}
              error={codeError}
              isEditing={!!editingModId}
              onSave={saveBehaviorMod}
              onCancel={() => { resetBehaviorEditor(); setView('gallery'); }}
              onLoadExample={loadExampleBehavior}
            />
          )}

          {view === 'skin-editor' && (
            <SkinEditorView
              name={skinName}
              setName={setSkinName}
              description={skinDesc}
              setDescription={setSkinDesc}
              bodyColor={skinBodyColor}
              setBodyColor={setSkinBodyColor}
              accentColor={skinAccentColor}
              setAccentColor={setSkinAccentColor}
              glowColor={skinGlowColor}
              setGlowColor={setSkinGlowColor}
              pattern={skinPattern}
              setPattern={setSkinPattern}
              accessories={skinAccessories}
              toggleAccessory={toggleAccessory}
              target={skinTarget}
              setTarget={setSkinTarget}
              isEditing={!!editingModId}
              onSave={saveSkinMod}
              onCancel={() => { resetSkinEditor(); setView('gallery'); }}
              onLoadExample={loadExampleSkin}
            />
          )}

          {view === 'test-result' && testResult && (
            <TestResultView
              result={testResult}
              onBack={() => setView('gallery')}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Gallery View ────────────────────────────────────────────

function GalleryView({
  mods,
  onToggle,
  onDelete,
  onEditBehavior,
  onEditSkin,
  onTest,
}: {
  mods: RobotMod[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEditBehavior: (mod: BehaviorMod) => void;
  onEditSkin: (mod: SkinMod) => void;
  onTest: (mod: BehaviorMod) => void;
}) {
  if (mods.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 text-4xl opacity-50">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="mx-auto h-16 w-16 text-gray-600">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        </div>
        <p className="text-sm text-gray-400">No mods yet. Create a behavior script or custom skin to get started!</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {mods.map((mod) => (
        <ModCard
          key={mod.id}
          mod={mod}
          onToggle={() => onToggle(mod.id)}
          onDelete={() => onDelete(mod.id)}
          onEdit={() => mod.type === 'behavior' ? onEditBehavior(mod as BehaviorMod) : onEditSkin(mod as SkinMod)}
          onTest={mod.type === 'behavior' ? () => onTest(mod as BehaviorMod) : undefined}
        />
      ))}
    </div>
  );
}

// ── Mod Card ────────────────────────────────────────────

function ModCard({
  mod,
  onToggle,
  onDelete,
  onEdit,
  onTest,
}: {
  mod: RobotMod;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onTest?: () => void;
}) {
  const isBehavior = mod.type === 'behavior';

  return (
    <div className={`group rounded-xl border p-4 transition-all ${
      mod.enabled
        ? isBehavior
          ? 'border-violet-500/30 bg-violet-500/5'
          : 'border-cyan-500/30 bg-cyan-500/5'
        : 'border-white/5 bg-white/[0.02] hover:border-white/10'
    }`}>
      <div className="flex items-start gap-3">
        {/* Type badge */}
        <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm ${
          isBehavior ? 'bg-violet-500/20 text-violet-400' : 'bg-cyan-500/20 text-cyan-400'
        }`}>
          {isBehavior ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <circle cx="13.5" cy="6.5" r="2.5" />
              <path d="M17 2H7a5 5 0 0 0 0 10h10a5 5 0 0 0 0-10z" />
              <path d="M12 12v10" />
            </svg>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">{mod.name}</span>
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
              isBehavior ? 'bg-violet-500/20 text-violet-300' : 'bg-cyan-500/20 text-cyan-300'
            }`}>
              {isBehavior ? 'behavior' : 'skin'}
            </span>
            {isBehavior && (
              <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-mono text-emerald-300">
                {(mod as BehaviorMod).hook}
              </span>
            )}
            {mod.targetRobot !== 'all' && (
              <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-gray-300">
                {mod.targetRobot}
              </span>
            )}
          </div>
          {mod.description && (
            <p className="mt-0.5 text-xs text-gray-400">{mod.description}</p>
          )}

          {/* Skin preview */}
          {mod.type === 'skin' && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex gap-1">
                <div className="h-5 w-5 rounded-full border border-white/10" style={{ backgroundColor: (mod as SkinMod).bodyColor }} title="Body" />
                <div className="h-5 w-5 rounded-full border border-white/10" style={{ backgroundColor: (mod as SkinMod).accentColor }} title="Accent" />
                <div className="h-5 w-5 rounded-full border border-white/10 shadow-sm" style={{ backgroundColor: (mod as SkinMod).glowColor, boxShadow: `0 0 6px ${(mod as SkinMod).glowColor}` }} title="Glow" />
              </div>
              {(mod as SkinMod).pattern && (mod as SkinMod).pattern !== 'solid' && (
                <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-gray-300">
                  {(mod as SkinMod).pattern}
                </span>
              )}
              {(mod as SkinMod).accessories.length > 0 && (
                <span className="text-xs text-gray-500">
                  {(mod as SkinMod).accessories.map((a) => {
                    const cat = ACCESSORY_CATALOG.find((c) => c.type === a.type);
                    return cat?.emoji || a.type;
                  }).join(' ')}
                </span>
              )}
            </div>
          )}

          {/* Behavior code preview */}
          {mod.type === 'behavior' && (
            <pre className="mt-2 max-h-16 overflow-hidden rounded-md bg-black/30 px-2 py-1.5 text-[11px] leading-tight text-gray-400">
              {(mod as BehaviorMod).code.slice(0, 120)}{(mod as BehaviorMod).code.length > 120 ? '...' : ''}
            </pre>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-shrink-0 items-center gap-1">
          {onTest && (
            <button
              type="button"
              onClick={onTest}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-green-400"
              title="Test mod"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </button>
          )}
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
            title="Edit mod"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onToggle}
            className={`rounded-lg p-1.5 transition-colors ${
              mod.enabled
                ? 'text-green-400 hover:bg-white/10 hover:text-green-300'
                : 'text-gray-500 hover:bg-white/10 hover:text-gray-300'
            }`}
            title={mod.enabled ? 'Disable' : 'Enable'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              {mod.enabled ? (
                <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></>
              ) : (
                <><path d="M13.73 21a2 2 0 0 1-3.46 0" /><path d="M18.63 13A17.89 17.89 0 0 1 18 8" /><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14" /><path d="M18 8a6 6 0 0 0-9.33-5" /><line x1="1" y1="1" x2="23" y2="23" /></>
              )}
            </svg>
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
            title="Delete mod"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Behavior Editor ────────────────────────────────────────────

const HOOK_OPTIONS: { value: BehaviorHook; label: string; desc: string }[] = [
  { value: 'onTask', label: 'onTask', desc: 'Runs when robot starts a task' },
  { value: 'onIdle', label: 'onIdle', desc: 'Runs when robot is idle' },
  { value: 'onEvent', label: 'onEvent', desc: 'Runs on game events' },
];

function BehaviorEditorView({
  name,
  setName,
  description,
  setDescription,
  code,
  setCode,
  target,
  setTarget,
  hook,
  setHook,
  error,
  isEditing,
  onSave,
  onCancel,
  onLoadExample,
}: {
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  code: string;
  setCode: (v: string) => void;
  target: RobotId | 'all';
  setTarget: (v: RobotId | 'all') => void;
  hook: BehaviorHook;
  setHook: (v: BehaviorHook) => void;
  error: string | null;
  isEditing: boolean;
  onSave: () => void;
  onCancel: () => void;
  onLoadExample: (index: number) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">
          {isEditing ? 'Edit Behavior Mod' : 'New Behavior Mod'}
        </h3>
        <button type="button" onClick={onCancel} className="text-xs text-gray-400 hover:text-white">
          Cancel
        </button>
      </div>

      {/* Examples */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-400">Load Example</label>
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLE_BEHAVIOR_MODS.map((ex, i) => (
            <button
              key={ex.name}
              type="button"
              onClick={() => onLoadExample(i)}
              className="rounded-md bg-violet-500/10 px-2 py-1 text-[11px] text-violet-300 transition-colors hover:bg-violet-500/20"
            >
              {ex.name}
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-400">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My awesome behavior..."
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500/50"
          maxLength={50}
        />
      </div>

      {/* Description */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-400">Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What does this behavior do?"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500/50"
          maxLength={120}
        />
      </div>

      {/* Target Robot */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-400">Target Robot</label>
        <div className="flex gap-1.5">
          {(['all', ...ROBOT_IDS] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTarget(id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                target === id
                  ? 'bg-violet-500/30 text-violet-200 ring-1 ring-violet-500/50'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {id === 'all' ? 'All Robots' : id.charAt(0).toUpperCase() + id.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Hook Selector */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-400">Hook (when this mod fires)</label>
        <div className="flex gap-1.5">
          {HOOK_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setHook(opt.value)}
              title={opt.desc}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium font-mono transition-colors ${
                hook === opt.value
                  ? 'bg-emerald-500/30 text-emerald-200 ring-1 ring-emerald-500/50'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="mt-1 text-[10px] text-gray-500">{HOOK_OPTIONS.find((o) => o.value === hook)?.desc}</p>
      </div>

      {/* Code Editor with Syntax Highlighting */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-400">
          Behavior Script
          <span className="ml-2 font-normal text-gray-500">
            Available: robot.battery, robot.mood, robot.needs, action(), say()
          </span>
        </label>
        <SyntaxHighlightedEditor
          value={code}
          onChange={setCode}
          placeholder={`// Write your behavior script here\nif (robot.battery < 20) {\n  action("charge");\n  say("Low battery!");\n}`}
        />
        <div className="mt-1 flex items-center justify-between">
          <span className="text-[10px] text-gray-500">{code.length}/2000 chars</span>
          {error && <span className="text-xs text-red-400">{error}</span>}
        </div>
      </div>

      {/* API Reference */}
      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
        <h4 className="mb-2 text-xs font-medium text-gray-300">API Reference</h4>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <span className="font-mono text-violet-300">robot.battery</span>
            <span className="ml-1 text-gray-500">0-100</span>
          </div>
          <div>
            <span className="font-mono text-violet-300">robot.mood</span>
            <span className="ml-1 text-gray-500">string</span>
          </div>
          <div>
            <span className="font-mono text-violet-300">robot.state</span>
            <span className="ml-1 text-gray-500">'idle'|'walking'|'working'</span>
          </div>
          <div>
            <span className="font-mono text-violet-300">robot.needs.energy</span>
            <span className="ml-1 text-gray-500">0-100</span>
          </div>
          <div>
            <span className="font-mono text-violet-300">action(type, val?)</span>
            <span className="ml-1 text-gray-500">trigger action</span>
          </div>
          <div>
            <span className="font-mono text-violet-300">say(msg)</span>
            <span className="ml-1 text-gray-500">robot thought</span>
          </div>
        </div>
        <h4 className="mb-1.5 mt-3 text-xs font-medium text-gray-300">Hooks</h4>
        <div className="space-y-1 text-[11px]">
          <div><span className="font-mono text-emerald-300">onTask</span> <span className="text-gray-500">- fires when robot starts/finishes a task</span></div>
          <div><span className="font-mono text-emerald-300">onIdle</span> <span className="text-gray-500">- fires when robot enters idle state</span></div>
          <div><span className="font-mono text-emerald-300">onEvent</span> <span className="text-gray-500">- fires on game events (visitors, weather, etc.)</span></div>
        </div>
      </div>

      {/* Save button */}
      <button
        type="button"
        onClick={onSave}
        className="w-full rounded-lg bg-violet-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-500"
      >
        {isEditing ? 'Update Behavior' : 'Save Behavior'}
      </button>
    </div>
  );
}

// ── Skin Editor ────────────────────────────────────────────

function SkinEditorView({
  name,
  setName,
  description,
  setDescription,
  bodyColor,
  setBodyColor,
  accentColor,
  setAccentColor,
  glowColor,
  setGlowColor,
  pattern,
  setPattern,
  accessories,
  toggleAccessory,
  target,
  setTarget,
  isEditing,
  onSave,
  onCancel,
  onLoadExample,
}: {
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  bodyColor: string;
  setBodyColor: (v: string) => void;
  accentColor: string;
  setAccentColor: (v: string) => void;
  glowColor: string;
  setGlowColor: (v: string) => void;
  pattern: SkinPattern;
  setPattern: (v: SkinPattern) => void;
  accessories: SkinAccessory[];
  toggleAccessory: (type: string) => void;
  target: RobotId | 'all';
  setTarget: (v: RobotId | 'all') => void;
  isEditing: boolean;
  onSave: () => void;
  onCancel: () => void;
  onLoadExample: (index: number) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">
          {isEditing ? 'Edit Skin' : 'New Custom Skin'}
        </h3>
        <button type="button" onClick={onCancel} className="text-xs text-gray-400 hover:text-white">
          Cancel
        </button>
      </div>

      {/* Examples */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-400">Load Example</label>
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLE_SKIN_MODS.map((ex, i) => (
            <button
              key={ex.name}
              type="button"
              onClick={() => onLoadExample(i)}
              className="rounded-md bg-cyan-500/10 px-2 py-1 text-[11px] text-cyan-300 transition-colors hover:bg-cyan-500/20"
            >
              {ex.name}
            </button>
          ))}
        </div>
      </div>

      {/* Name & Description */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-400">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My custom skin..."
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-cyan-500/50"
            maxLength={50}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-400">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A cool look..."
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-cyan-500/50"
            maxLength={120}
          />
        </div>
      </div>

      {/* Color Pickers */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-400">Colors</label>
        <div className="flex items-center gap-4">
          <ColorPicker label="Body" value={bodyColor} onChange={setBodyColor} />
          <ColorPicker label="Accent" value={accentColor} onChange={setAccentColor} />
          <ColorPicker label="Glow" value={glowColor} onChange={setGlowColor} />
        </div>
      </div>

      {/* Pattern Selector */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-400">Pattern</label>
        <div className="grid grid-cols-4 gap-1.5">
          {SKIN_PATTERNS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPattern(p.value)}
              title={p.desc}
              className={`rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                pattern === p.value
                  ? 'bg-cyan-500/30 text-cyan-200 ring-1 ring-cyan-500/50'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Live Preview */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-400">Preview</label>
        <div className="flex items-center justify-center rounded-xl border border-white/5 bg-black/30 py-6">
          <SkinPreview
            bodyColor={bodyColor}
            accentColor={accentColor}
            glowColor={glowColor}
            pattern={pattern}
            accessories={accessories}
          />
        </div>
      </div>

      {/* Accessories */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-400">Accessories</label>
        <div className="flex gap-2">
          {ACCESSORY_CATALOG.map((acc) => {
            const active = accessories.some((a) => a.type === acc.type);
            return (
              <button
                key={acc.type}
                type="button"
                onClick={() => toggleAccessory(acc.type)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  active
                    ? 'bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-500/40'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <span>{acc.emoji}</span>
                <span>{acc.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Target Robot */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-400">Target Robot</label>
        <div className="flex gap-1.5">
          {(['all', ...ROBOT_IDS] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTarget(id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                target === id
                  ? 'bg-cyan-500/30 text-cyan-200 ring-1 ring-cyan-500/50'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {id === 'all' ? 'All Robots' : id.charAt(0).toUpperCase() + id.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Save button */}
      <button
        type="button"
        onClick={onSave}
        className="w-full rounded-lg bg-cyan-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-cyan-500"
      >
        {isEditing ? 'Update Skin' : 'Save Skin'}
      </button>
    </div>
  );
}

// ── Syntax Highlighted Editor ────────────────────────────────────────────

const HIGHLIGHT_RULES: { pattern: RegExp; className: string }[] = [
  { pattern: /\/\/.*$/gm, className: 'text-gray-500' },                          // comments
  { pattern: /\b(if|else|return|const|let|var|true|false|null)\b/g, className: 'text-purple-400' }, // keywords
  { pattern: /\b(action|say)\b/g, className: 'text-yellow-300' },                // API functions
  { pattern: /\brobot\b/g, className: 'text-cyan-300' },                         // robot context
  { pattern: /\b(Math\.random|Math\.floor|Math\.ceil|Math\.round)\b/g, className: 'text-blue-300' }, // Math
  { pattern: /("[^"]*"|'[^']*')/g, className: 'text-emerald-300' },              // strings
  { pattern: /\b(\d+\.?\d*)\b/g, className: 'text-orange-300' },                 // numbers
  { pattern: /(\.\w+)/g, className: 'text-sky-300' },                            // property access
];

function highlightCode(code: string): string {
  if (!code) return '';
  // Escape HTML
  let html = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Apply highlights in priority order using markers to prevent re-matching
  const markers: { start: number; end: number; replacement: string }[] = [];

  for (const rule of HIGHLIGHT_RULES) {
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match;
    while ((match = regex.exec(html)) !== null) {
      // Check if overlapping with an existing marker
      const s = match.index;
      const e = s + match[0].length;
      const overlaps = markers.some(
        (m) => (s >= m.start && s < m.end) || (e > m.start && e <= m.end),
      );
      if (!overlaps) {
        markers.push({
          start: s,
          end: e,
          replacement: `<span class="${rule.className}">${match[0]}</span>`,
        });
      }
    }
  }

  // Sort markers by start position descending so replacement doesn't shift indices
  markers.sort((a, b) => b.start - a.start);
  for (const m of markers) {
    html = html.slice(0, m.start) + m.replacement + html.slice(m.end);
  }

  return html;
}

function SyntaxHighlightedEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);

  const syncScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  const highlighted = useMemo(() => highlightCode(value), [value]);

  return (
    <div className="relative h-48 rounded-lg border border-white/10 bg-black/40 focus-within:border-violet-500/50">
      {/* Highlighted underlay */}
      <pre
        ref={highlightRef}
        className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words px-3 py-2 font-mono text-xs leading-relaxed"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: highlighted || `<span class="text-gray-600">${placeholder.replace(/</g, '&lt;')}</span>` }}
      />
      {/* Transparent textarea on top for editing */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={syncScroll}
        className="absolute inset-0 h-full w-full resize-none bg-transparent px-3 py-2 font-mono text-xs leading-relaxed text-transparent caret-green-300 outline-none"
        spellCheck={false}
        maxLength={2000}
      />
    </div>
  );
}

// ── Color Picker ────────────────────────────────────────────

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <label className="relative cursor-pointer">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
        <div
          className="h-8 w-8 rounded-lg border border-white/20 shadow-inner"
          style={{ backgroundColor: value }}
        />
      </label>
      <div>
        <div className="text-[10px] text-gray-500">{label}</div>
        <div className="font-mono text-[11px] text-gray-300">{value}</div>
      </div>
    </div>
  );
}

// ── Skin Preview SVG ────────────────────────────────────────────

function SkinPreview({
  bodyColor,
  accentColor,
  glowColor,
  pattern = 'solid',
  accessories,
}: {
  bodyColor: string;
  accentColor: string;
  glowColor: string;
  pattern?: SkinPattern;
  accessories: SkinAccessory[];
}) {
  const hasHat = accessories.some((a) => a.type === 'hat');
  const hasAntenna = accessories.some((a) => a.type === 'antenna');
  const hasShield = accessories.some((a) => a.type === 'shield');
  const hasTrail = accessories.some((a) => a.type === 'trail');

  return (
    <svg viewBox="0 0 120 140" className="h-32 w-28">
      {/* Glow */}
      <defs>
        <radialGradient id="robotGlow">
          <stop offset="0%" stopColor={glowColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={glowColor} stopOpacity="0" />
        </radialGradient>
        {/* Pattern definitions */}
        {pattern === 'stripes' && (
          <pattern id="patStripes" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(0)">
            <rect width="8" height="4" fill={bodyColor} />
            <rect y="4" width="8" height="4" fill={accentColor} opacity="0.4" />
          </pattern>
        )}
        {pattern === 'dots' && (
          <pattern id="patDots" width="10" height="10" patternUnits="userSpaceOnUse">
            <rect width="10" height="10" fill={bodyColor} />
            <circle cx="5" cy="5" r="2" fill={accentColor} opacity="0.5" />
          </pattern>
        )}
        {pattern === 'camo' && (
          <pattern id="patCamo" width="16" height="16" patternUnits="userSpaceOnUse">
            <rect width="16" height="16" fill={bodyColor} />
            <circle cx="4" cy="4" r="5" fill={accentColor} opacity="0.25" />
            <circle cx="12" cy="10" r="4" fill={accentColor} opacity="0.15" />
            <circle cx="8" cy="14" r="3" fill={glowColor} opacity="0.1" />
          </pattern>
        )}
        {pattern === 'gradient' && (
          <linearGradient id="patGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={bodyColor} />
            <stop offset="100%" stopColor={accentColor} />
          </linearGradient>
        )}
        {pattern === 'circuit' && (
          <pattern id="patCircuit" width="12" height="12" patternUnits="userSpaceOnUse">
            <rect width="12" height="12" fill={bodyColor} />
            <line x1="0" y1="6" x2="12" y2="6" stroke={accentColor} strokeWidth="0.5" opacity="0.4" />
            <line x1="6" y1="0" x2="6" y2="12" stroke={accentColor} strokeWidth="0.5" opacity="0.4" />
            <circle cx="6" cy="6" r="1.5" fill={accentColor} opacity="0.5" />
            <circle cx="0" cy="0" r="1" fill={glowColor} opacity="0.3" />
          </pattern>
        )}
        {pattern === 'chevron' && (
          <pattern id="patChevron" width="12" height="8" patternUnits="userSpaceOnUse">
            <rect width="12" height="8" fill={bodyColor} />
            <path d="M0 8 L6 4 L12 8" fill="none" stroke={accentColor} strokeWidth="1.5" opacity="0.4" />
          </pattern>
        )}
        {pattern === 'diamond' && (
          <pattern id="patDiamond" width="10" height="10" patternUnits="userSpaceOnUse">
            <rect width="10" height="10" fill={bodyColor} />
            <path d="M5 0 L10 5 L5 10 L0 5 Z" fill="none" stroke={accentColor} strokeWidth="0.8" opacity="0.35" />
          </pattern>
        )}
      </defs>
      <circle cx="60" cy="70" r="50" fill="url(#robotGlow)" />

      {/* Trail */}
      {hasTrail && (
        <>
          <circle cx="45" cy="115" r="4" fill={glowColor} opacity="0.2" />
          <circle cx="55" cy="120" r="3" fill={glowColor} opacity="0.15" />
          <circle cx="65" cy="118" r="5" fill={glowColor} opacity="0.25" />
          <circle cx="75" cy="122" r="3" fill={glowColor} opacity="0.1" />
        </>
      )}

      {/* Body */}
      <rect x="30" y="55" width="60" height="50" rx="12" fill={patternFill(pattern, bodyColor)} />
      {/* Head */}
      <rect x="35" y="25" width="50" height="35" rx="10" fill={patternFill(pattern, bodyColor)} />
      {/* Eyes */}
      <circle cx="48" cy="40" r="5" fill={glowColor} />
      <circle cx="72" cy="40" r="5" fill={glowColor} />
      <circle cx="48" cy="40" r="2.5" fill="white" />
      <circle cx="72" cy="40" r="2.5" fill="white" />
      {/* Mouth */}
      <rect x="47" y="50" width="26" height="3" rx="1.5" fill={accentColor} />
      {/* Accent stripe */}
      <rect x="32" y="72" width="56" height="4" rx="2" fill={accentColor} opacity="0.7" />
      {/* Arms */}
      <rect x="18" y="60" width="12" height="30" rx="6" fill={accentColor} />
      <rect x="90" y="60" width="12" height="30" rx="6" fill={accentColor} />
      {/* Legs */}
      <rect x="38" y="105" width="14" height="20" rx="5" fill={accentColor} />
      <rect x="68" y="105" width="14" height="20" rx="5" fill={accentColor} />

      {/* Hat */}
      {hasHat && (
        <>
          <rect x="30" y="15" width="60" height="14" rx="4" fill={accentColor} />
          <rect x="42" y="5" width="36" height="14" rx="3" fill={accentColor} />
        </>
      )}

      {/* Antenna */}
      {hasAntenna && (
        <>
          <line x1="60" y1="25" x2="60" y2="8" stroke={accentColor} strokeWidth="2" />
          <circle cx="60" cy="6" r="4" fill={glowColor} />
        </>
      )}

      {/* Shield */}
      {hasShield && (
        <path
          d="M 8 65 L 8 85 Q 8 95 18 90 L 8 65 Z"
          fill={accentColor}
          opacity="0.8"
        />
      )}
    </svg>
  );
}

/** Map pattern to SVG fill value */
function patternFill(pattern: SkinPattern, fallback: string): string {
  const map: Record<string, string> = {
    solid: fallback,
    stripes: 'url(#patStripes)',
    dots: 'url(#patDots)',
    camo: 'url(#patCamo)',
    gradient: 'url(#patGradient)',
    circuit: 'url(#patCircuit)',
    chevron: 'url(#patChevron)',
    diamond: 'url(#patDiamond)',
  };
  return map[pattern] || fallback;
}

// ── Test Result View ────────────────────────────────────────────

function TestResultView({
  result,
  onBack,
}: {
  result: { actions: { type: string; value?: number | string }[]; messages: string[]; error?: string };
  onBack: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Test Results</h3>
        <button type="button" onClick={onBack} className="text-xs text-gray-400 hover:text-white">
          Back to Gallery
        </button>
      </div>

      {result.error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
          <p className="text-xs font-medium text-red-400">Error</p>
          <p className="mt-1 font-mono text-xs text-red-300">{result.error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
        <p className="mb-2 text-xs font-medium text-gray-300">
          Actions triggered ({result.actions.length})
        </p>
        {result.actions.length === 0 ? (
          <p className="text-xs text-gray-500">No actions triggered</p>
        ) : (
          <div className="space-y-1">
            {result.actions.map((a, i) => (
              <div key={i} className="flex items-center gap-2 rounded-md bg-white/5 px-2 py-1">
                <span className="font-mono text-xs text-green-400">{a.type}</span>
                {a.value !== undefined && (
                  <span className="font-mono text-xs text-gray-400">= {String(a.value)}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
        <p className="mb-2 text-xs font-medium text-gray-300">
          Robot messages ({result.messages.length})
        </p>
        {result.messages.length === 0 ? (
          <p className="text-xs text-gray-500">No messages</p>
        ) : (
          <div className="space-y-1">
            {result.messages.map((msg, i) => (
              <div key={i} className="rounded-md bg-white/5 px-2 py-1">
                <span className="text-xs text-cyan-300">&quot;{msg}&quot;</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
