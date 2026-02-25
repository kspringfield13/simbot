"""
Auto-rig Optimus GLB with a humanoid armature in Blender headless.
Uses envelope-based weight assignment since auto weights fail on this mesh.

Run: ~/.local/blender/blender-4.3.0-linux-x64/blender --background --python scripts/rig_optimus.py
"""

import bpy
import bmesh
import math
import os
from mathutils import Vector, Euler

INPUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'models', 'optimus.glb')
OUTPUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'models', 'optimus-rigged.glb')

# Clean scene
bpy.ops.wm.read_factory_settings(use_empty=True)

# Import GLB
bpy.ops.import_scene.gltf(filepath=os.path.abspath(INPUT))
print(f"Imported: {INPUT}")

# Find the mesh
mesh_obj = None
for obj in bpy.data.objects:
    if obj.type == 'MESH':
        mesh_obj = obj
        break

if not mesh_obj:
    raise RuntimeError("No mesh found in GLB!")

print(f"Mesh: {mesh_obj.name}, verts: {len(mesh_obj.data.vertices)}")

# Get mesh dimensions in world space
bbox = [mesh_obj.matrix_world @ Vector(corner) for corner in mesh_obj.bound_box]
min_y = min(v.y for v in bbox)
max_y = max(v.y for v in bbox)
min_x = min(v.x for v in bbox)
max_x = max(v.x for v in bbox)
height = max_y - min_y
center_x = (min_x + max_x) / 2
half_width = (max_x - min_x) / 2

print(f"Model height: {height:.2f}, Y range: {min_y:.2f} to {max_y:.2f}, X range: {min_x:.2f} to {max_x:.2f}")

# Bone joint positions as (x_offset_fraction, y_fraction)
# y_fraction is from bottom of model, x is fraction of half-width
BONES = {
    'Hips':          (0,      0.22),
    'Spine':         (0,      0.35),
    'Spine1':        (0,      0.45),
    'Chest':         (0,      0.58),
    'Neck':          (0,      0.75),
    'Head':          (0,      0.85),
    'HeadTop':       (0,      1.0),
    'LeftShoulder':  (-0.45,  0.72),
    'LeftUpperArm':  (-0.85,  0.72),
    'LeftLowerArm':  (-0.85,  0.52),
    'LeftHand':      (-0.85,  0.35),
    'RightShoulder': (0.45,   0.72),
    'RightUpperArm': (0.85,   0.72),
    'RightLowerArm': (0.85,   0.52),
    'RightHand':     (0.85,   0.35),
    'LeftUpperLeg':  (-0.25,  0.22),
    'LeftLowerLeg':  (-0.25,  0.11),
    'LeftFoot':      (-0.25,  0.02),
    'LeftToe':       (-0.25,  0.0),
    'RightUpperLeg': (0.25,   0.22),
    'RightLowerLeg': (0.25,   0.11),
    'RightFoot':     (0.25,   0.02),
    'RightToe':      (0.25,   0.0),
}

def get_pos(name):
    xf, yf = BONES[name]
    return Vector((center_x + xf * half_width, min_y + yf * height, 0))

HIERARCHY = {
    'Hips': None,
    'Spine': 'Hips',
    'Spine1': 'Spine',
    'Chest': 'Spine1',
    'Neck': 'Chest',
    'Head': 'Neck',
    'HeadTop': 'Head',
    'LeftShoulder': 'Chest',
    'LeftUpperArm': 'LeftShoulder',
    'LeftLowerArm': 'LeftUpperArm',
    'LeftHand': 'LeftLowerArm',
    'RightShoulder': 'Chest',
    'RightUpperArm': 'RightShoulder',
    'RightLowerArm': 'RightUpperArm',
    'RightHand': 'RightLowerArm',
    'LeftUpperLeg': 'Hips',
    'LeftLowerLeg': 'LeftUpperLeg',
    'LeftFoot': 'LeftLowerLeg',
    'LeftToe': 'LeftFoot',
    'RightUpperLeg': 'Hips',
    'RightLowerLeg': 'RightUpperLeg',
    'RightFoot': 'RightLowerLeg',
    'RightToe': 'RightFoot',
}

# Create armature
bpy.ops.object.select_all(action='DESELECT')
bpy.ops.object.armature_add(enter_editmode=True, location=(0, 0, 0))
armature_obj = bpy.context.active_object
armature_obj.name = 'Armature'
armature = armature_obj.data
armature.name = 'OptimusRig'

# Remove default bone
for b in armature.edit_bones:
    armature.edit_bones.remove(b)

CHILDREN = {}
for child, parent in HIERARCHY.items():
    if parent:
        CHILDREN.setdefault(parent, []).append(child)

bones_map = {}
for name in HIERARCHY:
    bone = armature.edit_bones.new(name)
    head = get_pos(name)
    
    children = CHILDREN.get(name, [])
    if name == 'HeadTop':
        tail = head + Vector((0, height * 0.05, 0))
    elif 'Toe' in name:
        tail = head + Vector((0, 0, -height * 0.05))
    elif 'Hand' in name:
        sign = -1 if 'Left' in name else 1
        tail = head + Vector((sign * height * 0.03, -height * 0.03, 0))
    elif children:
        child_pos = get_pos(children[0])
        direction = child_pos - head
        if direction.length < 0.01:
            tail = head + Vector((0, height * 0.05, 0))
        else:
            tail = head + direction * 0.8
    else:
        tail = head + Vector((0, height * 0.05, 0))
    
    bone.head = head
    bone.tail = tail
    
    parent_name = HIERARCHY[name]
    if parent_name and parent_name in bones_map:
        bone.parent = bones_map[parent_name]
        # Don't connect limb roots to parent
        no_connect = {'LeftShoulder', 'RightShoulder', 'LeftUpperLeg', 'RightUpperLeg'}
        bone.use_connect = name not in no_connect
    
    # Set envelope distance for weight painting
    bone.envelope_distance = height * 0.12
    if 'Hand' in name or 'Toe' in name or 'Foot' in name:
        bone.envelope_distance = height * 0.06
    elif 'Head' in name:
        bone.envelope_distance = height * 0.1
    
    bones_map[name] = bone

bpy.ops.object.mode_set(mode='OBJECT')

# Parent mesh to armature with envelope weights (more reliable than auto)
bpy.ops.object.select_all(action='DESELECT')
mesh_obj.select_set(True)
armature_obj.select_set(True)
bpy.context.view_layer.objects.active = armature_obj
bpy.ops.object.parent_set(type='ARMATURE_ENVELOPE')
print("Envelope weight paint applied!")

# Check if vertex groups were created
vg_count = len(mesh_obj.vertex_groups)
print(f"Vertex groups created: {vg_count}")

if vg_count == 0:
    print("WARNING: Envelope weights failed, doing manual proximity-based assignment...")
    
    # Manual weight assignment by vertex position
    bone_positions = {}
    for bone in armature.bones:
        head_world = armature_obj.matrix_world @ bone.head_local
        tail_world = armature_obj.matrix_world @ bone.tail_local
        bone_positions[bone.name] = (head_world, tail_world)
    
    # Create vertex groups
    for bone_name in HIERARCHY:
        if bone_name not in [vg.name for vg in mesh_obj.vertex_groups]:
            mesh_obj.vertex_groups.new(name=bone_name)
    
    # For each vertex, find closest 2 bones and assign weights
    mesh = mesh_obj.data
    for i, vert in enumerate(mesh.vertices):
        v_world = mesh_obj.matrix_world @ vert.co
        
        distances = []
        for bone_name, (bhead, btail) in bone_positions.items():
            # Distance to bone segment
            bone_vec = btail - bhead
            bone_len = bone_vec.length
            if bone_len < 0.001:
                dist = (v_world - bhead).length
            else:
                t = max(0, min(1, (v_world - bhead).dot(bone_vec) / (bone_len * bone_len)))
                closest = bhead + bone_vec * t
                dist = (v_world - closest).length
            distances.append((dist, bone_name))
        
        distances.sort()
        
        # Top 2 bones
        d1, name1 = distances[0]
        d2, name2 = distances[1]
        
        if d1 < 0.001:
            w1, w2 = 1.0, 0.0
        else:
            total = d1 + d2
            w1 = 1.0 - (d1 / total)
            w2 = 1.0 - (d2 / total)
            wsum = w1 + w2
            w1 /= wsum
            w2 /= wsum
        
        vg1 = mesh_obj.vertex_groups[name1]
        vg1.add([i], w1, 'REPLACE')
        if w2 > 0.01:
            vg2 = mesh_obj.vertex_groups[name2]
            vg2.add([i], w2, 'REPLACE')
    
    # Re-parent
    mesh_obj.parent = armature_obj
    mod = mesh_obj.modifiers.get('Armature')
    if not mod:
        mod = mesh_obj.modifiers.new('Armature', 'ARMATURE')
    mod.object = armature_obj
    print("Manual weight assignment complete!")

# Verify skinning
has_weights = False
for vg in mesh_obj.vertex_groups:
    # Check if any vertices are in this group
    for i, v in enumerate(mesh_obj.data.vertices):
        try:
            w = vg.weight(i)
            if w > 0:
                has_weights = True
                break
        except RuntimeError:
            continue
    if has_weights:
        break

print(f"Has skin weights: {has_weights}")

# === ANIMATIONS ===
def create_animation(name, frame_count, keyframe_fn):
    action = bpy.data.actions.new(name=name)
    armature_obj.animation_data_create()
    armature_obj.animation_data.action = action
    
    bpy.ops.object.mode_set(mode='POSE')
    
    # Reset all pose bones first
    for pb in armature_obj.pose.bones:
        pb.rotation_mode = 'XYZ'
        pb.rotation_euler = Euler((0, 0, 0))
        pb.location = Vector((0, 0, 0))
    
    for frame in range(frame_count + 1):
        bpy.context.scene.frame_set(frame)
        t = (frame % frame_count) / frame_count
        keyframe_fn(t, frame)
    
    bpy.ops.object.mode_set(mode='OBJECT')
    
    for fc in action.fcurves:
        fc.modifiers.new(type='CYCLES')
    
    return action

def rot(name, rx=0, ry=0, rz=0, frame=0):
    pb = armature_obj.pose.bones.get(name)
    if not pb:
        return
    pb.rotation_mode = 'XYZ'
    pb.rotation_euler = Euler((rx, ry, rz))
    pb.keyframe_insert(data_path='rotation_euler', frame=frame)

def loc(name, x=0, y=0, z=0, frame=0):
    pb = armature_obj.pose.bones.get(name)
    if not pb:
        return
    pb.location = Vector((x, y, z))
    pb.keyframe_insert(data_path='location', frame=frame)

# WALK (30 frames)
def walk_kf(t, f):
    p = t * math.pi * 2
    rot('LeftUpperLeg', rx=math.sin(p) * 0.4, frame=f)
    rot('RightUpperLeg', rx=math.sin(p + math.pi) * 0.4, frame=f)
    rot('LeftLowerLeg', rx=max(0, math.sin(p)) * 0.5, frame=f)
    rot('RightLowerLeg', rx=max(0, math.sin(p + math.pi)) * 0.5, frame=f)
    rot('LeftFoot', rx=-math.sin(p) * 0.15, frame=f)
    rot('RightFoot', rx=-math.sin(p + math.pi) * 0.15, frame=f)
    rot('LeftUpperArm', rx=-math.sin(p) * 0.3, frame=f)
    rot('RightUpperArm', rx=-math.sin(p + math.pi) * 0.3, frame=f)
    rot('LeftLowerArm', rx=-0.2 - max(0, math.sin(p)) * 0.15, frame=f)
    rot('RightLowerArm', rx=-0.2 - max(0, math.sin(p + math.pi)) * 0.15, frame=f)
    rot('Spine', ry=math.sin(p) * 0.05, frame=f)
    rot('Chest', rz=math.sin(p) * 0.03, frame=f)
    loc('Hips', y=abs(math.sin(p)) * 0.05, frame=f)
    rot('Head', ry=-math.sin(p) * 0.02, rx=-0.03, frame=f)

walk = create_animation('Walk', 30, walk_kf)

# IDLE (60 frames)
def idle_kf(t, f):
    p = t * math.pi * 2
    br = math.sin(p) * 0.01
    rot('Spine', rx=br, frame=f)
    rot('Chest', rz=math.sin(p * 0.5) * 0.005, frame=f)
    rot('Hips', rz=math.sin(p * 0.3) * 0.015, frame=f)
    loc('Hips', y=br * 2, frame=f)
    rot('LeftUpperArm', rz=0.08, rx=math.sin(p * 0.7) * 0.02, frame=f)
    rot('RightUpperArm', rz=-0.08, rx=math.sin(p * 0.7 + 0.5) * 0.02, frame=f)
    rot('LeftLowerArm', rx=-0.12, frame=f)
    rot('RightLowerArm', rx=-0.12, frame=f)
    rot('Head', ry=math.sin(p * 0.4) * 0.12, rx=math.sin(p * 0.6) * 0.04, frame=f)

idle = create_animation('Idle', 60, idle_kf)

# RUN (20 frames)
def run_kf(t, f):
    p = t * math.pi * 2
    rot('LeftUpperLeg', rx=math.sin(p) * 0.6, frame=f)
    rot('RightUpperLeg', rx=math.sin(p + math.pi) * 0.6, frame=f)
    rot('LeftLowerLeg', rx=max(0, math.sin(p)) * 0.8, frame=f)
    rot('RightLowerLeg', rx=max(0, math.sin(p + math.pi)) * 0.8, frame=f)
    rot('LeftFoot', rx=-math.sin(p) * 0.25, frame=f)
    rot('RightFoot', rx=-math.sin(p + math.pi) * 0.25, frame=f)
    rot('LeftUpperArm', rx=-math.sin(p) * 0.5, frame=f)
    rot('RightUpperArm', rx=-math.sin(p + math.pi) * 0.5, frame=f)
    rot('LeftLowerArm', rx=-0.4 - max(0, math.sin(p)) * 0.25, frame=f)
    rot('RightLowerArm', rx=-0.4 - max(0, math.sin(p + math.pi)) * 0.25, frame=f)
    rot('Spine', rx=-0.08, ry=math.sin(p) * 0.06, frame=f)
    loc('Hips', y=abs(math.sin(p)) * 0.08, frame=f)
    rot('Head', ry=-math.sin(p) * 0.03, rx=-0.05, frame=f)

run = create_animation('Run', 20, run_kf)

# WORK (40 frames)
def work_kf(t, f):
    p = t * math.pi * 2
    rot('LeftUpperArm', rx=-1.1 + math.sin(p * 2) * 0.15, rz=0.15, frame=f)
    rot('RightUpperArm', rx=-0.9 + math.sin(p * 2 + 0.5) * 0.18, rz=-0.15, frame=f)
    rot('LeftLowerArm', rx=-0.6 + math.sin(p * 3) * 0.1, frame=f)
    rot('RightLowerArm', rx=-0.5 + math.cos(p * 2.5) * 0.12, frame=f)
    rot('Spine', rx=-0.08, frame=f)
    rot('Chest', ry=math.sin(p) * 0.06, frame=f)
    rot('Head', rx=-0.15, ry=math.sin(p * 0.8) * 0.08, frame=f)
    loc('Hips', y=math.sin(p * 2) * 0.02, frame=f)

work = create_animation('Work', 40, work_kf)

# WAVE (30 frames)
def wave_kf(t, f):
    p = t * math.pi * 2
    rot('RightUpperArm', rx=-1.4, rz=-0.3, frame=f)
    rot('RightLowerArm', rx=-0.3, rz=math.sin(p * 2) * 0.4, frame=f)
    rot('LeftUpperArm', rz=0.1, frame=f)
    rot('LeftLowerArm', rx=-0.1, frame=f)
    rot('Head', rx=-0.1, ry=0.15, frame=f)

wave = create_animation('Wave', 30, wave_kf)

print("All animations created!")

# Push to NLA tracks for export
armature_obj.animation_data.action = None
for action in [walk, idle, run, work, wave]:
    track = armature_obj.animation_data.nla_tracks.new()
    track.name = action.name
    strip = track.strips.new(action.name, start=0, action=action)

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

print(f"\n✅ Exported: {OUTPUT}")
print(f"   Vertex groups: {len(mesh_obj.vertex_groups)}")
print(f"   Animations: 5 (Walk, Idle, Run, Work, Wave)")
