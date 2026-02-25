"""
Auto-rig Optimus GLB — manual proximity-based weight assignment.
Envelope weights fail on this mesh, so we compute weights by
distance from each vertex to each bone segment.

Run: ~/.local/blender/blender-4.3.0-linux-x64/blender --background --python scripts/rig_optimus.py
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
assert mesh_obj, "No mesh!"

print(f"Mesh: {mesh_obj.name}, verts: {len(mesh_obj.data.vertices)}")

# World-space bounds
bbox = [mesh_obj.matrix_world @ Vector(c) for c in mesh_obj.bound_box]
min_x = min(v.x for v in bbox); max_x = max(v.x for v in bbox)
min_y = min(v.y for v in bbox); max_y = max(v.y for v in bbox)
min_z = min(v.z for v in bbox); max_z = max(v.z for v in bbox)
height = max_y - min_y
cx = (min_x + max_x) / 2
hw = (max_x - min_x) / 2
print(f"Height: {height:.2f}, Y: {min_y:.2f}..{max_y:.2f}, X: {min_x:.2f}..{max_x:.2f}")

# Bone definitions: (x_fraction_of_half_width, y_fraction_from_bottom)
BONES = {
    'Hips':          (0,     0.21),
    'Spine':         (0,     0.32),
    'Spine1':        (0,     0.42),
    'Chest':         (0,     0.55),
    'Neck':          (0,     0.73),
    'Head':          (0,     0.83),
    'HeadTop':       (0,     0.98),
    'L_Shoulder':    (-0.42, 0.70),
    'L_UpperArm':    (-0.82, 0.70),
    'L_LowerArm':    (-0.82, 0.50),
    'L_Hand':        (-0.82, 0.33),
    'R_Shoulder':    (0.42,  0.70),
    'R_UpperArm':    (0.82,  0.70),
    'R_LowerArm':    (0.82,  0.50),
    'R_Hand':        (0.82,  0.33),
    'L_UpperLeg':    (-0.22, 0.21),
    'L_LowerLeg':    (-0.22, 0.11),
    'L_Foot':        (-0.22, 0.02),
    'R_UpperLeg':    (0.22,  0.21),
    'R_LowerLeg':    (0.22,  0.11),
    'R_Foot':        (0.22,  0.02),
}

HIERARCHY = [
    ('Hips', None),
    ('Spine', 'Hips'),
    ('Spine1', 'Spine'),
    ('Chest', 'Spine1'),
    ('Neck', 'Chest'),
    ('Head', 'Neck'),
    ('HeadTop', 'Head'),
    ('L_Shoulder', 'Chest'),
    ('L_UpperArm', 'L_Shoulder'),
    ('L_LowerArm', 'L_UpperArm'),
    ('L_Hand', 'L_LowerArm'),
    ('R_Shoulder', 'Chest'),
    ('R_UpperArm', 'R_Shoulder'),
    ('R_LowerArm', 'R_UpperArm'),
    ('R_Hand', 'R_LowerArm'),
    ('L_UpperLeg', 'Hips'),
    ('L_LowerLeg', 'L_UpperLeg'),
    ('L_Foot', 'L_LowerLeg'),
    ('R_UpperLeg', 'Hips'),
    ('R_LowerLeg', 'R_UpperLeg'),
    ('R_Foot', 'R_LowerLeg'),
]

NO_CONNECT = {'L_Shoulder', 'R_Shoulder', 'L_UpperLeg', 'R_UpperLeg'}

def pos(name):
    xf, yf = BONES[name]
    return Vector((cx + xf * hw, min_y + yf * height, 0))

# Build children map
children_map = {}
for name, parent in HIERARCHY:
    if parent:
        children_map.setdefault(parent, []).append(name)

# --- CREATE ARMATURE ---
bpy.ops.object.select_all(action='DESELECT')
bpy.ops.object.armature_add(enter_editmode=True, location=(0, 0, 0))
arm_obj = bpy.context.active_object
arm_obj.name = 'Armature'
arm = arm_obj.data
arm.name = 'OptimusRig'

for b in arm.edit_bones:
    arm.edit_bones.remove(b)

bone_refs = {}
for name, parent_name in HIERARCHY:
    b = arm.edit_bones.new(name)
    head = pos(name)
    
    kids = children_map.get(name, [])
    if kids:
        child_pos = pos(kids[0])
        d = child_pos - head
        tail = head + d * 0.8 if d.length > 0.01 else head + Vector((0, height * 0.05, 0))
    elif 'Foot' in name:
        tail = head + Vector((0, 0, -height * 0.04))
    elif 'Hand' in name:
        sign = -1 if 'L_' in name else 1
        tail = head + Vector((sign * height * 0.03, -height * 0.03, 0))
    else:
        tail = head + Vector((0, height * 0.05, 0))
    
    b.head = head
    b.tail = tail
    if parent_name and parent_name in bone_refs:
        b.parent = bone_refs[parent_name]
        b.use_connect = name not in NO_CONNECT
    bone_refs[name] = b

bpy.ops.object.mode_set(mode='OBJECT')

# --- MANUAL WEIGHT ASSIGNMENT ---
print("Computing proximity weights for all vertices...")

# Precompute bone segment data in world space
bone_segments = {}
for bone in arm.bones:
    h = arm_obj.matrix_world @ bone.head_local
    t = arm_obj.matrix_world @ bone.tail_local
    bone_segments[bone.name] = (h, t)

# Remove any existing vertex groups and armature modifiers
for vg in mesh_obj.vertex_groups:
    mesh_obj.vertex_groups.remove(vg)
for mod in mesh_obj.modifiers:
    if mod.type == 'ARMATURE':
        mesh_obj.modifiers.remove(mod)

# Create vertex groups
vg_map = {}
for name, _ in HIERARCHY:
    vg_map[name] = mesh_obj.vertex_groups.new(name=name)

def point_to_segment_dist(p, a, b):
    ab = b - a
    ab_len2 = ab.dot(ab)
    if ab_len2 < 1e-8:
        return (p - a).length
    t = max(0, min(1, (p - a).dot(ab) / ab_len2))
    proj = a + ab * t
    return (p - proj).length

mesh = mesh_obj.data
inv_mat = mesh_obj.matrix_world

bone_names = [name for name, _ in HIERARCHY]
n_verts = len(mesh.vertices)

for i, vert in enumerate(mesh.vertices):
    v_world = inv_mat @ vert.co
    
    # Compute distance to each bone
    dists = []
    for bname in bone_names:
        h, t = bone_segments[bname]
        d = point_to_segment_dist(v_world, h, t)
        dists.append((d, bname))
    
    dists.sort()
    
    # Use inverse-distance weighting for top 4 closest bones
    top = dists[:4]
    
    # Filter out bones that are much farther than the closest
    min_d = top[0][0]
    threshold = min_d * 3.0 + 0.01  # within 3x of closest
    top = [(d, n) for d, n in top if d < threshold]
    
    if len(top) == 1 or top[0][0] < 1e-6:
        vg_map[top[0][1]].add([i], 1.0, 'REPLACE')
    else:
        # Inverse distance^2 weighting
        inv_weights = []
        for d, n in top:
            w = 1.0 / (d * d + 1e-6)
            inv_weights.append((w, n))
        total = sum(w for w, _ in inv_weights)
        for w, n in inv_weights:
            nw = w / total
            if nw > 0.01:
                vg_map[n].add([i], nw, 'REPLACE')
    
    if (i + 1) % 20000 == 0:
        print(f"  {i+1}/{n_verts} vertices weighted...")

print(f"  {n_verts}/{n_verts} vertices weighted!")

# Parent and add armature modifier
mesh_obj.parent = arm_obj
mesh_obj.matrix_parent_inverse = arm_obj.matrix_world.inverted()
mod = mesh_obj.modifiers.new('Armature', 'ARMATURE')
mod.object = arm_obj

# Verify
sample_counts = {}
for vg in mesh_obj.vertex_groups:
    count = 0
    for i in range(n_verts):
        try:
            w = vg.weight(i)
            if w > 0.01:
                count += 1
        except:
            pass
    if count > 0:
        sample_counts[vg.name] = count

print(f"Weight distribution:")
for name, cnt in sorted(sample_counts.items(), key=lambda x: -x[1]):
    print(f"  {name}: {cnt} verts")

# === ANIMATIONS ===
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

S = math.sin
C = math.cos

# WALK (30 frames)
def walk(p, f):
    r('L_UpperLeg', rx=S(p)*0.45, f=f)
    r('R_UpperLeg', rx=S(p+3.14)*0.45, f=f)
    r('L_LowerLeg', rx=max(0,S(p))*0.55, f=f)
    r('R_LowerLeg', rx=max(0,S(p+3.14))*0.55, f=f)
    r('L_Foot', rx=-S(p)*0.15, f=f)
    r('R_Foot', rx=-S(p+3.14)*0.15, f=f)
    r('L_UpperArm', rx=-S(p)*0.35, f=f)
    r('R_UpperArm', rx=-S(p+3.14)*0.35, f=f)
    r('L_LowerArm', rx=-0.2-max(0,S(p))*0.2, f=f)
    r('R_LowerArm', rx=-0.2-max(0,S(p+3.14))*0.2, f=f)
    r('Spine', ry=S(p)*0.06, f=f)
    r('Chest', rz=S(p)*0.04, f=f)
    l('Hips', y=abs(S(p))*0.06, f=f)
    r('Head', ry=-S(p)*0.025, rx=-0.04, f=f)

walk_a = create_anim('Walk', 30, walk)

# IDLE (60 frames)
def idle(p, f):
    br = S(p)*0.012
    r('Spine', rx=br, f=f)
    r('Chest', rz=S(p*0.5)*0.006, f=f)
    r('Hips', rz=S(p*0.3)*0.02, f=f)
    l('Hips', y=br*2, f=f)
    r('L_UpperArm', rz=0.1, rx=S(p*0.7)*0.025, f=f)
    r('R_UpperArm', rz=-0.1, rx=S(p*0.7+0.5)*0.025, f=f)
    r('L_LowerArm', rx=-0.15, f=f)
    r('R_LowerArm', rx=-0.15, f=f)
    r('Head', ry=S(p*0.4)*0.15+S(p*1.1)*0.05, rx=S(p*0.6)*0.05, f=f)

idle_a = create_anim('Idle', 60, idle)

# RUN (20 frames)
def run(p, f):
    r('L_UpperLeg', rx=S(p)*0.65, f=f)
    r('R_UpperLeg', rx=S(p+3.14)*0.65, f=f)
    r('L_LowerLeg', rx=max(0,S(p))*0.85, f=f)
    r('R_LowerLeg', rx=max(0,S(p+3.14))*0.85, f=f)
    r('L_Foot', rx=-S(p)*0.25, f=f)
    r('R_Foot', rx=-S(p+3.14)*0.25, f=f)
    r('L_UpperArm', rx=-S(p)*0.55, f=f)
    r('R_UpperArm', rx=-S(p+3.14)*0.55, f=f)
    r('L_LowerArm', rx=-0.45-max(0,S(p))*0.3, f=f)
    r('R_LowerArm', rx=-0.45-max(0,S(p+3.14))*0.3, f=f)
    r('Spine', rx=-0.1, ry=S(p)*0.07, f=f)
    l('Hips', y=abs(S(p))*0.1, f=f)
    r('Head', rx=-0.06, f=f)

run_a = create_anim('Run', 20, run)

# WORK (40 frames)
def work(p, f):
    r('L_UpperArm', rx=-1.2+S(p*2)*0.18, rz=0.18, f=f)
    r('R_UpperArm', rx=-1.0+S(p*2+0.5)*0.2, rz=-0.18, f=f)
    r('L_LowerArm', rx=-0.65+S(p*3)*0.12, f=f)
    r('R_LowerArm', rx=-0.55+C(p*2.5)*0.14, f=f)
    r('Spine', rx=-0.1, f=f)
    r('Chest', ry=S(p)*0.07, f=f)
    r('Head', rx=-0.18, ry=S(p*0.8)*0.1, f=f)
    l('Hips', y=S(p*2)*0.025, f=f)

work_a = create_anim('Work', 40, work)

# WAVE (30 frames)
def wave(p, f):
    r('R_UpperArm', rx=-1.5, rz=-0.35, f=f)
    r('R_LowerArm', rx=-0.35, rz=S(p*2)*0.45, f=f)
    r('L_UpperArm', rz=0.12, f=f)
    r('L_LowerArm', rx=-0.12, f=f)
    r('Head', rx=-0.12, ry=0.18, f=f)

wave_a = create_anim('Wave', 30, wave)

print("All 5 animations created!")

# Push to NLA
arm_obj.animation_data.action = None
for act in [walk_a, idle_a, run_a, work_a, wave_a]:
    track = arm_obj.animation_data.nla_tracks.new()
    track.name = act.name
    track.strips.new(act.name, start=0, action=act)

# Export
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
print(f"\n✅ Exported: {OUTPUT} ({fsize/1024/1024:.1f} MB)")
