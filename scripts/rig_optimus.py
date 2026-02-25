"""
Rig Optimus with anatomically-correct zone-based weight assignment.
Each vertex is classified into a body region (head, torso, left arm, right arm,
left leg, right leg) first, then weighted only among bones in that region.

Model coords (from GLTF): Y-up, height ~3.25, Y range -1.78 to 1.47
"""

import bpy
import math
import os
from mathutils import Vector, Euler

INPUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'models', 'optimus.glb')
OUTPUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'models', 'optimus-rigged.glb')

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=os.path.abspath(INPUT))

mesh_obj = None
for obj in bpy.data.objects:
    if obj.type == 'MESH':
        mesh_obj = obj
        break
assert mesh_obj

bbox = [mesh_obj.matrix_world @ Vector(c) for c in mesh_obj.bound_box]
min_x = min(v.x for v in bbox); max_x = max(v.x for v in bbox)
min_y = min(v.y for v in bbox); max_y = max(v.y for v in bbox)
height = max_y - min_y
cx = (min_x + max_x) / 2
hw = (max_x - min_x) / 2

print(f"Verts: {len(mesh_obj.data.vertices)}, Height: {height:.2f}, Y: {min_y:.2f}..{max_y:.2f}")

# Normalized Y: 0 = feet, 1 = top of head
def ny(y): return (y - min_y) / height
# Normalized X: 0 = center, negative = left, positive = right
def nx(x): return (x - cx) / hw if hw > 0 else 0

# --- BONE DEFINITIONS ---
# (name, parent, x_frac, y_frac)
BONE_DEFS = [
    ('Hips',        None,        0,     0.21),
    ('Spine',       'Hips',      0,     0.32),
    ('Spine1',      'Spine',     0,     0.42),
    ('Chest',       'Spine1',    0,     0.55),
    ('Neck',        'Chest',     0,     0.73),
    ('Head',        'Neck',      0,     0.83),
    ('HeadTop',     'Head',      0,     0.98),
    ('L_Shoulder',  'Chest',    -0.42,  0.70),
    ('L_UpperArm',  'L_Shoulder',-0.82, 0.70),
    ('L_LowerArm',  'L_UpperArm',-0.90, 0.50),
    ('L_Hand',      'L_LowerArm',-0.95, 0.33),
    ('R_Shoulder',  'Chest',     0.42,  0.70),
    ('R_UpperArm',  'R_Shoulder', 0.82, 0.70),
    ('R_LowerArm',  'R_UpperArm', 0.90, 0.50),
    ('R_Hand',      'R_LowerArm', 0.95, 0.33),
    ('L_UpperLeg',  'Hips',     -0.22,  0.21),
    ('L_LowerLeg',  'L_UpperLeg',-0.22, 0.11),
    ('L_Foot',      'L_LowerLeg',-0.22, 0.02),
    ('R_UpperLeg',  'Hips',      0.22,  0.21),
    ('R_LowerLeg',  'R_UpperLeg', 0.22, 0.11),
    ('R_Foot',      'R_LowerLeg', 0.22, 0.02),
]

NO_CONNECT = {'L_Shoulder', 'R_Shoulder', 'L_UpperLeg', 'R_UpperLeg'}

def bone_pos(xf, yf):
    return Vector((cx + xf * hw, min_y + yf * height, 0))

children_map = {}
for name, parent, _, _ in BONE_DEFS:
    if parent:
        children_map.setdefault(parent, []).append(name)

# --- CREATE ARMATURE ---
bpy.ops.object.select_all(action='DESELECT')
bpy.ops.object.armature_add(enter_editmode=True, location=(0, 0, 0))
arm_obj = bpy.context.active_object
arm_obj.name = 'Armature'
arm = arm_obj.data

for b in arm.edit_bones:
    arm.edit_bones.remove(b)

bone_refs = {}
for name, parent, xf, yf in BONE_DEFS:
    b = arm.edit_bones.new(name)
    head = bone_pos(xf, yf)
    kids = children_map.get(name, [])
    if kids:
        kx, ky = next((x, y) for n, _, x, y in BONE_DEFS if n == kids[0])
        child_pos = bone_pos(kx, ky)
        d = child_pos - head
        tail = head + d * 0.8 if d.length > 0.01 else head + Vector((0, height*0.05, 0))
    elif 'Foot' in name:
        tail = head + Vector((0, 0, -height*0.04))
    elif 'Hand' in name:
        sign = -1 if 'L_' in name else 1
        tail = head + Vector((sign*height*0.03, -height*0.03, 0))
    else:
        tail = head + Vector((0, height*0.05, 0))
    b.head = head; b.tail = tail
    if parent and parent in bone_refs:
        b.parent = bone_refs[parent]
        b.use_connect = name not in NO_CONNECT
    bone_refs[name] = b

bpy.ops.object.mode_set(mode='OBJECT')

# --- ZONE-BASED WEIGHT ASSIGNMENT ---
print("Zone-based weight assignment...")

# Body region classification thresholds (in normalized Y)
# Approximate from the model's actual proportions:
# Feet: 0-0.06, Lower legs: 0.06-0.16, Upper legs: 0.16-0.27
# Hips: 0.21-0.27, Spine: 0.27-0.55, Chest: 0.55-0.73
# Shoulders: ~0.68-0.73, Arms: X > 0.35 and Y 0.27-0.73
# Neck: 0.73-0.83, Head: 0.83+

# For each region, define which bones can receive weight and Y ranges
# Region: (y_min, y_max, x_condition, bone_list_with_y_ranges)
# bone_list: [(bone_name, y_center, y_radius)]

SPINE_BONES = [
    ('Hips',    0.21, 0.06),
    ('Spine',   0.32, 0.06),
    ('Spine1',  0.42, 0.07),
    ('Chest',   0.55, 0.09),
    ('Neck',    0.73, 0.06),
]

HEAD_BONES = [
    ('Neck',    0.73, 0.06),
    ('Head',    0.83, 0.08),
    ('HeadTop', 0.98, 0.08),
]

L_ARM_BONES = [
    ('L_Shoulder',  0.70, 0.06),
    ('L_UpperArm',  0.70, 0.10),
    ('L_LowerArm',  0.50, 0.12),
    ('L_Hand',      0.33, 0.08),
]

R_ARM_BONES = [
    ('R_Shoulder',  0.70, 0.06),
    ('R_UpperArm',  0.70, 0.10),
    ('R_LowerArm',  0.50, 0.12),
    ('R_Hand',      0.33, 0.08),
]

L_LEG_BONES = [
    ('Hips',        0.21, 0.04),
    ('L_UpperLeg',  0.21, 0.06),
    ('L_LowerLeg',  0.11, 0.06),
    ('L_Foot',      0.02, 0.04),
]

R_LEG_BONES = [
    ('Hips',        0.21, 0.04),
    ('R_UpperLeg',  0.21, 0.06),
    ('R_LowerLeg',  0.11, 0.06),
    ('R_Foot',      0.02, 0.04),
]

for vg in mesh_obj.vertex_groups:
    mesh_obj.vertex_groups.remove(vg)
for mod in mesh_obj.modifiers:
    if mod.type == 'ARMATURE':
        mesh_obj.modifiers.remove(mod)

vg_map = {}
for name, _, _, _ in BONE_DEFS:
    vg_map[name] = mesh_obj.vertex_groups.new(name=name)

mesh = mesh_obj.data
mw = mesh_obj.matrix_world
n_verts = len(mesh.vertices)

for i, vert in enumerate(mesh.vertices):
    vw = mw @ vert.co
    vy = ny(vw.y)  # normalized 0..1
    vx = nx(vw.x)  # normalized, - = left, + = right
    ax = abs(vx)    # absolute x position

    # Classify into body region
    if vy > 0.78:
        # HEAD region
        region_bones = HEAD_BONES
    elif vy > 0.27 and ax > 0.38:
        # ARM region — which side?
        if vx < 0:
            region_bones = L_ARM_BONES
        else:
            region_bones = R_ARM_BONES
    elif vy < 0.27:
        # LEG region — which side?
        if vx < 0:
            region_bones = L_LEG_BONES
        else:
            region_bones = R_LEG_BONES
    else:
        # TORSO/SPINE region
        region_bones = SPINE_BONES
    
    # Within the region, weight by Y-distance to each bone's center
    weights = []
    for bname, by_center, by_radius in region_bones:
        dist = abs(vy - by_center)
        # Gaussian-like falloff
        w = math.exp(-0.5 * (dist / (by_radius + 0.02)) ** 2)
        if w > 0.01:
            weights.append((bname, w))
    
    if not weights:
        # Fallback: closest bone in region
        weights = [(region_bones[0][0], 1.0)]
    
    # Normalize
    total = sum(w for _, w in weights)
    for bname, w in weights:
        nw = w / total
        if nw > 0.01:
            vg_map[bname].add([i], nw, 'REPLACE')
    
    if (i+1) % 20000 == 0:
        print(f"  {i+1}/{n_verts}...")

print(f"  {n_verts}/{n_verts} done!")

# Verify
def _sw(vg, i):
    try: return vg.weight(i)
    except: return 0
for vg in mesh_obj.vertex_groups:
    c = sum(1 for i in range(n_verts) if _sw(vg, i) > 0.01)
    if c > 0:
        print(f"  {vg.name}: {c}")

mesh_obj.parent = arm_obj
mesh_obj.matrix_parent_inverse = arm_obj.matrix_world.inverted()
mod = mesh_obj.modifiers.new('Armature', 'ARMATURE')
mod.object = arm_obj

# === ANIMATIONS ===
S = math.sin; C = math.cos

def create_anim(name, frames, kf_fn):
    action = bpy.data.actions.new(name=name)
    arm_obj.animation_data_create()
    arm_obj.animation_data.action = action
    bpy.ops.object.mode_set(mode='POSE')
    for pb in arm_obj.pose.bones:
        pb.rotation_mode = 'XYZ'
        pb.rotation_euler = Euler((0,0,0))
        pb.location = Vector((0,0,0))
    for f in range(frames + 1):
        bpy.context.scene.frame_set(f)
        kf_fn(((f % frames) / frames) * math.pi * 2, f)
    bpy.ops.object.mode_set(mode='OBJECT')
    for fc in action.fcurves:
        fc.modifiers.new(type='CYCLES')
    return action

def r(name, rx=0, ry=0, rz=0, f=0):
    pb = arm_obj.pose.bones.get(name)
    if pb:
        pb.rotation_euler = Euler((rx, ry, rz))
        pb.keyframe_insert(data_path='rotation_euler', frame=f)

def l(name, x=0, y=0, z=0, f=0):
    pb = arm_obj.pose.bones.get(name)
    if pb:
        pb.location = Vector((x, y, z))
        pb.keyframe_insert(data_path='location', frame=f)

# WALK (30 frames @ 30fps = 1 sec cycle)
def walk(p, f):
    # Legs — full human gait
    r('L_UpperLeg', rx=S(p)*0.45, f=f)
    r('R_UpperLeg', rx=S(p+3.14)*0.45, f=f)
    r('L_LowerLeg', rx=max(0, S(p))*0.55, f=f)
    r('R_LowerLeg', rx=max(0, S(p+3.14))*0.55, f=f)
    r('L_Foot', rx=-S(p)*0.18, f=f)
    r('R_Foot', rx=-S(p+3.14)*0.18, f=f)
    # Arms — natural counter-swing
    r('L_UpperArm', rx=-S(p)*0.35, f=f)
    r('R_UpperArm', rx=-S(p+3.14)*0.35, f=f)
    r('L_LowerArm', rx=-0.25 - max(0, S(p))*0.2, f=f)
    r('R_LowerArm', rx=-0.25 - max(0, S(p+3.14))*0.2, f=f)
    # Torso
    r('Spine', ry=S(p)*0.06, f=f)
    r('Spine1', ry=S(p)*0.03, f=f)
    r('Chest', rz=S(p)*0.04, f=f)
    l('Hips', y=abs(S(p))*0.04, f=f)
    r('Hips', rz=S(p)*0.03, f=f)
    # Head stabilization
    r('Head', ry=-S(p)*0.025, rx=-0.04, f=f)
    r('Neck', ry=-S(p)*0.015, f=f)

walk_a = create_anim('Walk', 30, walk)

# IDLE (60 frames)
def idle(p, f):
    br = S(p)*0.012
    r('Spine', rx=br, f=f)
    r('Spine1', rx=br*0.5, f=f)
    r('Chest', rz=S(p*0.5)*0.006, f=f)
    r('Hips', rz=S(p*0.3)*0.015, f=f)
    l('Hips', y=br*1.5, f=f)
    r('L_UpperArm', rz=0.1, rx=S(p*0.7)*0.025, f=f)
    r('R_UpperArm', rz=-0.1, rx=S(p*0.7+0.5)*0.025, f=f)
    r('L_LowerArm', rx=-0.15, f=f)
    r('R_LowerArm', rx=-0.15, f=f)
    r('Neck', ry=S(p*0.35)*0.06, f=f)
    r('Head', ry=S(p*0.4)*0.12+S(p*1.1)*0.04, rx=S(p*0.6)*0.04, f=f)
    r('L_UpperLeg', rx=S(p*0.2)*0.01, f=f)
    r('R_UpperLeg', rx=-S(p*0.2)*0.01, f=f)

idle_a = create_anim('Idle', 60, idle)

# RUN (20 frames)
def run(p, f):
    r('L_UpperLeg', rx=S(p)*0.65, f=f)
    r('R_UpperLeg', rx=S(p+3.14)*0.65, f=f)
    r('L_LowerLeg', rx=max(0, S(p))*0.85, f=f)
    r('R_LowerLeg', rx=max(0, S(p+3.14))*0.85, f=f)
    r('L_Foot', rx=-S(p)*0.28, f=f)
    r('R_Foot', rx=-S(p+3.14)*0.28, f=f)
    r('L_UpperArm', rx=-S(p)*0.55, f=f)
    r('R_UpperArm', rx=-S(p+3.14)*0.55, f=f)
    r('L_LowerArm', rx=-0.5-max(0,S(p))*0.3, f=f)
    r('R_LowerArm', rx=-0.5-max(0,S(p+3.14))*0.3, f=f)
    r('Spine', rx=-0.1, ry=S(p)*0.07, f=f)
    r('Chest', rz=S(p)*0.05, f=f)
    l('Hips', y=abs(S(p))*0.08, f=f)
    r('Hips', rz=S(p)*0.04, f=f)
    r('Head', rx=-0.06, f=f)

run_a = create_anim('Run', 20, run)

# WORK (40 frames)
def work(p, f):
    r('L_UpperArm', rx=-1.2+S(p*2)*0.18, rz=0.18, f=f)
    r('R_UpperArm', rx=-1.0+S(p*2+0.5)*0.2, rz=-0.18, f=f)
    r('L_LowerArm', rx=-0.65+S(p*3)*0.12, f=f)
    r('R_LowerArm', rx=-0.55+C(p*2.5)*0.14, f=f)
    r('Spine', rx=-0.1, f=f)
    r('Spine1', rx=-0.05, f=f)
    r('Chest', ry=S(p)*0.07, f=f)
    r('Head', rx=-0.18, ry=S(p*0.8)*0.1, f=f)
    l('Hips', y=S(p*2)*0.02, f=f)
    r('L_UpperLeg', rx=-0.02, f=f)
    r('R_UpperLeg', rx=-0.02, f=f)

work_a = create_anim('Work', 40, work)

# WAVE (30 frames)
def wave(p, f):
    r('R_UpperArm', rx=-1.5, rz=-0.35, f=f)
    r('R_LowerArm', rx=-0.35, rz=S(p*2)*0.45, f=f)
    r('L_UpperArm', rz=0.12, f=f)
    r('L_LowerArm', rx=-0.12, f=f)
    r('Neck', ry=0.08, f=f)
    r('Head', rx=-0.1, ry=0.15, f=f)
    r('Spine', rx=0.02, f=f)

wave_a = create_anim('Wave', 30, wave)

print("5 animations created!")

arm_obj.animation_data.action = None
for act in [walk_a, idle_a, run_a, work_a, wave_a]:
    track = arm_obj.animation_data.nla_tracks.new()
    track.name = act.name
    track.strips.new(act.name, start=0, action=act)

bpy.ops.export_scene.gltf(
    filepath=os.path.abspath(OUTPUT),
    export_format='GLB',
    export_animations=True,
    export_skins=True,
    export_all_influences=False,
    export_lights=False,
    export_cameras=False,
)

fsize = os.path.getsize(os.path.abspath(OUTPUT))
print(f"\n✅ {OUTPUT} ({fsize/1024/1024:.1f} MB)")
