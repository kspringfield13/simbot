import { useState } from 'react';
import { useStore } from '../../stores/useStore';

type DocsTab = 'overview' | 'behaviors' | 'skins' | 'examples';

const panelStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
  background: 'rgba(0,0,0,0.85)', zIndex: 200,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

const contentStyle: React.CSSProperties = {
  background: '#1a1a2e', border: '1px solid #333', borderRadius: 12,
  width: '90vw', maxWidth: 820, maxHeight: '85vh', overflow: 'hidden',
  display: 'flex', flexDirection: 'column', color: '#e0e0e0',
};

const headerStyle: React.CSSProperties = {
  padding: '16px 20px', borderBottom: '1px solid #333',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
};

const tabBarStyle: React.CSSProperties = {
  display: 'flex', gap: 4, padding: '8px 16px', borderBottom: '1px solid #222',
  background: '#151525',
};

const bodyStyle: React.CSSProperties = {
  flex: 1, overflow: 'auto', padding: '16px 20px', fontSize: 14, lineHeight: 1.7,
};

const codeBlockStyle: React.CSSProperties = {
  background: '#0d0d1a', border: '1px solid #333', borderRadius: 6,
  padding: '12px 16px', fontFamily: 'monospace', fontSize: 13,
  whiteSpace: 'pre-wrap', overflowX: 'auto', margin: '8px 0 16px',
};

const tableStyle: React.CSSProperties = {
  width: '100%', borderCollapse: 'collapse', margin: '8px 0 16px', fontSize: 13,
};

const thStyle: React.CSSProperties = {
  textAlign: 'left', padding: '8px 12px', borderBottom: '2px solid #444',
  color: '#8b5cf6', fontWeight: 600,
};

const tdStyle: React.CSSProperties = {
  padding: '6px 12px', borderBottom: '1px solid #222',
};

function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
        background: active ? '#8b5cf6' : 'transparent',
        color: active ? '#fff' : '#888', fontSize: 13, fontWeight: active ? 600 : 400,
      }}
    >
      {label}
    </button>
  );
}

function OverviewDocs() {
  return (
    <div>
      <h3 style={{ color: '#8b5cf6', margin: '0 0 12px' }}>Modding API Overview</h3>
      <p>
        The SimBot Modding API lets you create custom <strong>behaviors</strong> and <strong>skins</strong> for robots.
        Mods are stored in your browser's localStorage and can be toggled on/off at any time.
      </p>

      <h4 style={{ color: '#60a5fa', marginTop: 20 }}>Two Mod Types</h4>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Type</th>
            <th style={thStyle}>Purpose</th>
            <th style={thStyle}>API</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tdStyle}><code>behavior</code></td>
            <td style={tdStyle}>Custom robot logic via JavaScript hooks</td>
            <td style={tdStyle}><code>registerBehavior()</code></td>
          </tr>
          <tr>
            <td style={tdStyle}><code>skin</code></td>
            <td style={tdStyle}>Custom colors, patterns, and accessories</td>
            <td style={tdStyle}><code>registerSkin()</code></td>
          </tr>
        </tbody>
      </table>

      <h4 style={{ color: '#60a5fa', marginTop: 20 }}>Quick Start</h4>
      <p>1. Open the Mod Manager (puzzle icon in the top-right)</p>
      <p>2. Click <strong>+ Behavior</strong> or <strong>+ Skin</strong> to create a new mod</p>
      <p>3. Write your code or pick a template, then save</p>
      <p>4. Toggle the mod on/off in the gallery</p>

      <h4 style={{ color: '#60a5fa', marginTop: 20 }}>Safety &amp; Sandboxing</h4>
      <p>Behavior mods run in a restricted sandbox:</p>
      <ul style={{ paddingLeft: 20 }}>
        <li>No access to <code>window</code>, <code>document</code>, <code>fetch</code>, or <code>eval</code></li>
        <li>Robot state is frozen (read-only) &mdash; you cannot mutate it</li>
        <li>Max 10 actions and 5 messages per execution</li>
        <li>Code limited to 2,000 characters</li>
        <li>No infinite loops (<code>while</code>, <code>for(;;)</code>)</li>
      </ul>
    </div>
  );
}

function BehaviorDocs() {
  return (
    <div>
      <h3 style={{ color: '#8b5cf6', margin: '0 0 12px' }}>registerBehavior API</h3>

      <h4 style={{ color: '#60a5fa' }}>Function Signature</h4>
      <div style={codeBlockStyle}>
{`registerBehavior({
  name: string,          // Unique mod name
  description: string,   // What this mod does
  hook: BehaviorHook,    // When to fire: 'onTask' | 'onIdle' | 'onEvent'
  targetRobot: RobotId | 'all',  // 'sim' | 'chef' | 'sparkle' | 'all'
  priority: (ctx) => number,     // Higher = runs first (0-100)
  action: (ctx) => void          // Your behavior code
})`}
      </div>

      <h4 style={{ color: '#60a5fa', marginTop: 20 }}>Hooks</h4>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Hook</th>
            <th style={thStyle}>Fires When</th>
            <th style={thStyle}>Use Case</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tdStyle}><code>onTask</code></td>
            <td style={tdStyle}>Robot starts or finishes a task</td>
            <td style={tdStyle}>Modify task behavior, add speed boosts</td>
          </tr>
          <tr>
            <td style={tdStyle}><code>onIdle</code></td>
            <td style={tdStyle}>Robot has no current task</td>
            <td style={tdStyle}>Dance, wander, idle animations</td>
          </tr>
          <tr>
            <td style={tdStyle}><code>onEvent</code></td>
            <td style={tdStyle}>Game events (low battery, social, etc.)</td>
            <td style={tdStyle}>Custom reactions to game events</td>
          </tr>
        </tbody>
      </table>

      <h4 style={{ color: '#60a5fa', marginTop: 20 }}>Context Object</h4>
      <p>Your code receives a <code>robot</code> context with the following properties:</p>
      <div style={codeBlockStyle}>
{`robot = {
  id: 'sim' | 'chef' | 'sparkle',
  battery: number,      // 0-100
  mood: string,         // 'content' | 'focused' | 'tired' | ...
  state: string,        // 'idle' | 'working' | 'moving' | ...
  needs: {
    energy: number,     // 0-100
    happiness: number,  // 0-100
    social: number,     // 0-100
    boredom: number     // 0-100
  }
}`}
      </div>

      <h4 style={{ color: '#60a5fa', marginTop: 20 }}>Available Functions</h4>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Function</th>
            <th style={thStyle}>Description</th>
            <th style={thStyle}>Example</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tdStyle}><code>action(type, value?)</code></td>
            <td style={tdStyle}>Queue a robot action</td>
            <td style={tdStyle}><code>action("dance", "spin")</code></td>
          </tr>
          <tr>
            <td style={tdStyle}><code>say(message)</code></td>
            <td style={tdStyle}>Display a speech bubble</td>
            <td style={tdStyle}><code>say("Hello world!")</code></td>
          </tr>
        </tbody>
      </table>

      <h4 style={{ color: '#60a5fa', marginTop: 20 }}>Action Types</h4>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Action</th>
            <th style={thStyle}>Value</th>
            <th style={thStyle}>Effect</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style={tdStyle}><code>dance</code></td><td style={tdStyle}><code>"shuffle" | "spin" | "wave" | "bounce"</code></td><td style={tdStyle}>Play dance animation</td></tr>
          <tr><td style={tdStyle}><code>set_speed</code></td><td style={tdStyle}><code>number</code> (0.5 - 3)</td><td style={tdStyle}>Change movement speed</td></tr>
          <tr><td style={tdStyle}><code>pause</code></td><td style={tdStyle}><code>number</code> (seconds)</td><td style={tdStyle}>Pause before next task</td></tr>
          <tr><td style={tdStyle}><code>rest</code></td><td style={tdStyle}>none</td><td style={tdStyle}>Take a rest break</td></tr>
          <tr><td style={tdStyle}><code>rush_task</code></td><td style={tdStyle}>none</td><td style={tdStyle}>Complete task faster</td></tr>
          <tr><td style={tdStyle}><code>set_threshold</code></td><td style={tdStyle}><code>number</code> (0-100)</td><td style={tdStyle}>Set cleanliness threshold</td></tr>
          <tr><td style={tdStyle}><code>seek_friend</code></td><td style={tdStyle}>none</td><td style={tdStyle}>Move toward another robot</td></tr>
          <tr><td style={tdStyle}><code>stealth</code></td><td style={tdStyle}><code>true | false</code></td><td style={tdStyle}>Toggle stealth mode</td></tr>
          <tr><td style={tdStyle}><code>particle</code></td><td style={tdStyle}><code>"confetti" | "shadow"</code></td><td style={tdStyle}>Spawn particle effect</td></tr>
          <tr><td style={tdStyle}><code>prefer_occupied_rooms</code></td><td style={tdStyle}>none</td><td style={tdStyle}>Prioritize rooms with others</td></tr>
        </tbody>
      </table>
    </div>
  );
}

function SkinDocs() {
  return (
    <div>
      <h3 style={{ color: '#8b5cf6', margin: '0 0 12px' }}>registerSkin API</h3>

      <h4 style={{ color: '#60a5fa' }}>Function Signature</h4>
      <div style={codeBlockStyle}>
{`registerSkin({
  name: string,          // Unique skin name
  description: string,   // What this skin looks like
  colors: {
    body: string,        // Hex color for robot body
    accent: string,      // Hex color for accent parts
    glow: string         // Hex color for emissive glow
  },
  emissive: {
    intensity: number,   // Glow strength (0 - 1)
    pattern: SkinPattern // 'solid' | 'stripes' | 'dots' | ...
  },
  accessories: Accessory[],       // Optional add-ons
  targetRobot: RobotId | 'all'   // Which robot(s) to apply to
})`}
      </div>

      <h4 style={{ color: '#60a5fa', marginTop: 20 }}>Color Properties</h4>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Property</th>
            <th style={thStyle}>Type</th>
            <th style={thStyle}>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style={tdStyle}><code>bodyColor</code></td><td style={tdStyle}>hex string</td><td style={tdStyle}>Primary robot body color</td></tr>
          <tr><td style={tdStyle}><code>accentColor</code></td><td style={tdStyle}>hex string</td><td style={tdStyle}>Secondary/highlight color</td></tr>
          <tr><td style={tdStyle}><code>glowColor</code></td><td style={tdStyle}>hex string</td><td style={tdStyle}>Emissive glow effect color</td></tr>
        </tbody>
      </table>

      <h4 style={{ color: '#60a5fa', marginTop: 20 }}>Patterns</h4>
      <table style={tableStyle}>
        <thead>
          <tr><th style={thStyle}>Pattern</th><th style={thStyle}>Description</th></tr>
        </thead>
        <tbody>
          <tr><td style={tdStyle}><code>solid</code></td><td style={tdStyle}>Clean single-color finish</td></tr>
          <tr><td style={tdStyle}><code>stripes</code></td><td style={tdStyle}>Horizontal racing stripes</td></tr>
          <tr><td style={tdStyle}><code>dots</code></td><td style={tdStyle}>Polka dot pattern</td></tr>
          <tr><td style={tdStyle}><code>camo</code></td><td style={tdStyle}>Military camouflage</td></tr>
          <tr><td style={tdStyle}><code>gradient</code></td><td style={tdStyle}>Smooth color fade</td></tr>
          <tr><td style={tdStyle}><code>circuit</code></td><td style={tdStyle}>Circuit board traces</td></tr>
          <tr><td style={tdStyle}><code>chevron</code></td><td style={tdStyle}>V-shaped chevron bands</td></tr>
          <tr><td style={tdStyle}><code>diamond</code></td><td style={tdStyle}>Diamond grid overlay</td></tr>
        </tbody>
      </table>

      <h4 style={{ color: '#60a5fa', marginTop: 20 }}>Accessories</h4>
      <table style={tableStyle}>
        <thead>
          <tr><th style={thStyle}>Type</th><th style={thStyle}>Description</th></tr>
        </thead>
        <tbody>
          <tr><td style={tdStyle}><code>hat</code></td><td style={tdStyle}>Headwear accessory</td></tr>
          <tr><td style={tdStyle}><code>antenna</code></td><td style={tdStyle}>Antenna/aerial attachment</td></tr>
          <tr><td style={tdStyle}><code>shield</code></td><td style={tdStyle}>Armor shield overlay</td></tr>
          <tr><td style={tdStyle}><code>trail</code></td><td style={tdStyle}>Movement particle trail</td></tr>
        </tbody>
      </table>

      <div style={codeBlockStyle}>
{`// Accessory format
{ type: 'hat' | 'antenna' | 'shield' | 'trail', color: '#hexcolor' }`}
      </div>
    </div>
  );
}

function ExampleDocs() {
  return (
    <div>
      <h3 style={{ color: '#8b5cf6', margin: '0 0 12px' }}>Example Mods</h3>

      <h4 style={{ color: '#60a5fa' }}>Dance Party (Behavior)</h4>
      <p>Makes robots dance with random moves whenever they're idle.</p>
      <div style={codeBlockStyle}>
{`// Hook: onIdle | Target: all robots
var dances = ["shuffle", "spin", "wave", "bounce"];
var pick = dances[Math.floor(Math.random() * dances.length)];
action("dance", pick);
if (Math.random() < 0.5) {
  say("Party time!");
} else {
  say("Can't stop, won't stop dancing!");
}
action("particle", "confetti");`}
      </div>

      <h4 style={{ color: '#60a5fa', marginTop: 20 }}>Speedster (Behavior)</h4>
      <p>Doubles robot speed and rushes through tasks.</p>
      <div style={codeBlockStyle}>
{`// Hook: onTask | Target: all robots
action("set_speed", 2);
say("Gotta go fast!");
if (robot.state === "working") {
  action("rush_task");
  say("Zoom zoom zoom!");
}`}
      </div>

      <h4 style={{ color: '#60a5fa', marginTop: 20 }}>Neon Racer (Skin)</h4>
      <p>Electric blue with neon glow and racing stripes.</p>
      <div style={codeBlockStyle}>
{`registerSkin({
  name: 'Neon Racer',
  colors: {
    body: '#0066ff',
    accent: '#00ffcc',
    glow: '#00ffff'
  },
  emissive: { intensity: 0.8, pattern: 'stripes' },
  accessories: [
    { type: 'trail', color: '#00ffff' },
    { type: 'antenna', color: '#00ffcc' }
  ],
  targetRobot: 'all'
})`}
      </div>

      <h4 style={{ color: '#60a5fa', marginTop: 20 }}>Stealth Bot (Skin)</h4>
      <p>Dark matte finish with camo pattern and red accents.</p>
      <div style={codeBlockStyle}>
{`registerSkin({
  name: 'Stealth Bot',
  colors: {
    body: '#1a1a2e',
    accent: '#e94560',
    glow: '#e94560'
  },
  emissive: { intensity: 0.4, pattern: 'camo' },
  accessories: [
    { type: 'antenna', color: '#e94560' }
  ],
  targetRobot: 'all'
})`}
      </div>

      <h4 style={{ color: '#60a5fa', marginTop: 20 }}>Ninja Bot (Behavior + Skin combo)</h4>
      <p>Silent, fast, and dark. Pair the behavior with the skin for full effect.</p>
      <div style={codeBlockStyle}>
{`// Behavior — Hook: onTask
action("set_speed", 1.5);
action("stealth", true);
if (robot.state === "idle") {
  say("...");
} else {
  if (Math.random() < 0.15) {
    say("Silent. Efficient. Done.");
  }
}
action("particle", "shadow");`}
      </div>

      <h4 style={{ color: '#60a5fa', marginTop: 20 }}>Import / Export</h4>
      <p>Share mods with others using the JSON import/export feature in the Mod Manager.</p>
      <div style={codeBlockStyle}>
{`// Exported mod format (JSON)
[
  {
    "id": "mod-1234567890-abc123",
    "name": "My Custom Mod",
    "type": "behavior",
    "hook": "onIdle",
    "code": "action(\\"dance\\", \\"spin\\");",
    "targetRobot": "all",
    "enabled": true,
    ...
  }
]`}
      </div>
    </div>
  );
}

export function ModdingDocsPanel() {
  const show = useStore((s) => s.showModdingDocs);
  const setShow = useStore((s) => s.setShowModdingDocs);
  const [tab, setTab] = useState<DocsTab>('overview');

  if (!show) return null;

  return (
    <div style={panelStyle} onClick={() => setShow(false)}>
      <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>{'\uD83D\uDCDA'}</span>
            <span style={{ fontSize: 16, fontWeight: 700 }}>Modding API Docs</span>
          </div>
          <button
            type="button"
            onClick={() => setShow(false)}
            style={{ background: 'none', border: 'none', color: '#888', fontSize: 20, cursor: 'pointer' }}
          >
            {'\u2715'}
          </button>
        </div>

        <div style={tabBarStyle}>
          <Tab label="Overview" active={tab === 'overview'} onClick={() => setTab('overview')} />
          <Tab label="Behaviors" active={tab === 'behaviors'} onClick={() => setTab('behaviors')} />
          <Tab label="Skins" active={tab === 'skins'} onClick={() => setTab('skins')} />
          <Tab label="Examples" active={tab === 'examples'} onClick={() => setTab('examples')} />
        </div>

        <div style={bodyStyle}>
          {tab === 'overview' && <OverviewDocs />}
          {tab === 'behaviors' && <BehaviorDocs />}
          {tab === 'skins' && <SkinDocs />}
          {tab === 'examples' && <ExampleDocs />}
        </div>
      </div>
    </div>
  );
}
