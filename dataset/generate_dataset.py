import math
import random
import csv
import json
import os
from typing import Dict, List, Tuple

LANDMARK_NAMES = [
    "wrist",
    "thumb_cmc", "thumb_mcp", "thumb_ip", "thumb_tip",
    "index_mcp", "index_pip", "index_dip", "index_tip",
    "middle_mcp", "middle_pip", "middle_dip", "middle_tip",
    "ring_mcp", "ring_pip", "ring_dip", "ring_tip",
    "pinky_mcp", "pinky_pip", "pinky_dip", "pinky_tip",
]

def get_canonical_hand(is_left: bool = False, pose: str = "OPEN") -> Dict[str, Tuple[float, float, float]]:
    sx = -1.0 if is_left else 1.0

    def pt(x, y, z):
        return (x * sx, y, z)

    thumb_cmc = pt(-0.040, -0.040, -0.010)
    thumb_mcp = pt(-0.065, -0.080, -0.020)
    index_mcp = pt(-0.040, -0.115, -0.005)
    middle_mcp = pt(0.000, -0.125, -0.003)
    ring_mcp = pt(0.035, -0.115, -0.005)
    pinky_mcp = pt(0.065, -0.095, -0.010)

    joints = {
        "wrist": (0.0, 0.0, 0.0),
        "thumb_cmc": thumb_cmc,
        "thumb_mcp": thumb_mcp,
        "index_mcp": index_mcp,
        "middle_mcp": middle_mcp,
        "ring_mcp": ring_mcp,
        "pinky_mcp": pinky_mcp,
    }

    if pose == "OPEN":
        joints.update({
            "thumb_ip": pt(-0.090, -0.120, -0.025),
            "thumb_tip": pt(-0.110, -0.155, -0.030),
            "index_pip": pt(-0.042, -0.165, -0.008),
            "index_dip": pt(-0.043, -0.200, -0.010),
            "index_tip": pt(-0.044, -0.230, -0.012),
            "middle_pip": pt(0.000, -0.180, -0.006),
            "middle_dip": pt(0.000, -0.220, -0.008),
            "middle_tip": pt(0.000, -0.250, -0.010),
            "ring_pip": pt(0.037, -0.165, -0.008),
            "ring_dip": pt(0.038, -0.200, -0.010),
            "ring_tip": pt(0.039, -0.230, -0.012),
            "pinky_pip": pt(0.068, -0.135, -0.012),
            "pinky_dip": pt(0.070, -0.165, -0.014),
            "pinky_tip": pt(0.072, -0.190, -0.015),
        })

    elif pose == "FIST":
        joints.update({
            "thumb_ip": pt(-0.045, -0.110, 0.025),
            "thumb_tip": pt(-0.010, -0.115, 0.030),
            "index_pip": pt(-0.040, -0.150, 0.025),
            "index_dip": pt(-0.035, -0.135, 0.040),
            "index_tip": pt(-0.030, -0.110, 0.030),
            "middle_pip": pt(0.000, -0.160, 0.025),
            "middle_dip": pt(0.000, -0.140, 0.040),
            "middle_tip": pt(0.000, -0.115, 0.030),
            "ring_pip": pt(0.035, -0.150, 0.025),
            "ring_dip": pt(0.035, -0.135, 0.040),
            "ring_tip": pt(0.030, -0.110, 0.030),
            "pinky_pip": pt(0.060, -0.130, 0.020),
            "pinky_dip": pt(0.055, -0.115, 0.035),
            "pinky_tip": pt(0.050, -0.095, 0.025),
        })

    elif pose == "THUMBS_UP":
        joints.update({
            "thumb_ip": pt(-0.070, -0.130, -0.010),
            "thumb_tip": pt(-0.075, -0.180, -0.015),
            "index_pip": pt(-0.040, -0.145, 0.025),
            "index_dip": pt(-0.035, -0.130, 0.040),
            "index_tip": pt(-0.030, -0.105, 0.030),
            "middle_pip": pt(0.000, -0.155, 0.025),
            "middle_dip": pt(0.000, -0.135, 0.040),
            "middle_tip": pt(0.000, -0.110, 0.030),
            "ring_pip": pt(0.035, -0.145, 0.025),
            "ring_dip": pt(0.035, -0.130, 0.040),
            "ring_tip": pt(0.030, -0.105, 0.030),
            "pinky_pip": pt(0.060, -0.125, 0.020),
            "pinky_dip": pt(0.055, -0.110, 0.035),
            "pinky_tip": pt(0.050, -0.090, 0.025),
        })

    elif pose == "THUMBS_DOWN":
        joints.update({
            "thumb_ip": pt(-0.070, -0.020, -0.010),
            "thumb_tip": pt(-0.075, 0.040, -0.015),
            "index_pip": pt(-0.040, -0.145, 0.025),
            "index_dip": pt(-0.035, -0.130, 0.040),
            "index_tip": pt(-0.030, -0.105, 0.030),
            "middle_pip": pt(0.000, -0.155, 0.025),
            "middle_dip": pt(0.000, -0.135, 0.040),
            "middle_tip": pt(0.000, -0.110, 0.030),
            "ring_pip": pt(0.035, -0.145, 0.025),
            "ring_dip": pt(0.035, -0.130, 0.040),
            "ring_tip": pt(0.030, -0.105, 0.030),
            "pinky_pip": pt(0.060, -0.125, 0.020),
            "pinky_dip": pt(0.055, -0.110, 0.035),
            "pinky_tip": pt(0.050, -0.090, 0.025),
        })

    elif pose == "PEACE":
        joints.update({
            "thumb_ip": pt(-0.045, -0.110, 0.025),
            "thumb_tip": pt(-0.010, -0.115, 0.030),
            "index_pip": pt(-0.050, -0.165, -0.008),
            "index_dip": pt(-0.060, -0.200, -0.010),
            "index_tip": pt(-0.070, -0.230, -0.012),
            "middle_pip": pt(0.020, -0.180, -0.006),
            "middle_dip": pt(0.030, -0.220, -0.008),
            "middle_tip": pt(0.040, -0.250, -0.010),
            "ring_pip": pt(0.035, -0.150, 0.025),
            "ring_dip": pt(0.035, -0.135, 0.040),
            "ring_tip": pt(0.030, -0.110, 0.030),
            "pinky_pip": pt(0.060, -0.130, 0.020),
            "pinky_dip": pt(0.055, -0.115, 0.035),
            "pinky_tip": pt(0.050, -0.095, 0.025),
        })

    elif pose == "ILY":
        joints.update({
            "thumb_ip": pt(-0.090, -0.120, -0.025),
            "thumb_tip": pt(-0.110, -0.155, -0.030),
            "index_pip": pt(-0.042, -0.165, -0.008),
            "index_dip": pt(-0.043, -0.200, -0.010),
            "index_tip": pt(-0.044, -0.230, -0.012),
            "middle_pip": pt(0.000, -0.160, 0.025),
            "middle_dip": pt(0.000, -0.140, 0.040),
            "middle_tip": pt(0.000, -0.115, 0.030),
            "ring_pip": pt(0.035, -0.150, 0.025),
            "ring_dip": pt(0.035, -0.135, 0.040),
            "ring_tip": pt(0.030, -0.110, 0.030),
            "pinky_pip": pt(0.068, -0.135, -0.012),
            "pinky_dip": pt(0.070, -0.165, -0.014),
            "pinky_tip": pt(0.072, -0.190, -0.015),
        })

    elif pose == "POINT":
        joints.update({
            "thumb_ip": pt(-0.045, -0.110, 0.025),
            "thumb_tip": pt(-0.010, -0.115, 0.030),
            "index_pip": pt(-0.042, -0.165, -0.008),
            "index_dip": pt(-0.043, -0.200, -0.010),
            "index_tip": pt(-0.044, -0.235, -0.012),
            "middle_pip": pt(0.000, -0.160, 0.025),
            "middle_dip": pt(0.000, -0.140, 0.040),
            "middle_tip": pt(0.000, -0.115, 0.030),
            "ring_pip": pt(0.035, -0.150, 0.025),
            "ring_dip": pt(0.035, -0.135, 0.040),
            "ring_tip": pt(0.030, -0.110, 0.030),
            "pinky_pip": pt(0.060, -0.130, 0.020),
            "pinky_dip": pt(0.055, -0.115, 0.035),
            "pinky_tip": pt(0.050, -0.095, 0.025),
        })

    elif pose == "PINCH_OK":
        pinch_contact = pt(-0.042, -0.145, 0.010)
        joints.update({
            "thumb_ip": pt(-0.065, -0.125, 0.005),
            "thumb_tip": pinch_contact,
            "index_pip": pt(-0.040, -0.145, -0.005),
            "index_dip": pt(-0.041, -0.145, 0.005),
            "index_tip": pinch_contact,
            "middle_pip": pt(0.000, -0.180, -0.006),
            "middle_dip": pt(0.000, -0.220, -0.008),
            "middle_tip": pt(0.000, -0.250, -0.010),
            "ring_pip": pt(0.037, -0.165, -0.008),
            "ring_dip": pt(0.038, -0.200, -0.010),
            "ring_tip": pt(0.039, -0.230, -0.012),
            "pinky_pip": pt(0.068, -0.135, -0.012),
            "pinky_dip": pt(0.070, -0.165, -0.014),
            "pinky_tip": pt(0.072, -0.190, -0.015),
        })

    elif pose == "FLAT_PALM_UP":
        joints.update({
            "thumb_ip": pt(-0.080, -0.070, 0.010),
            "thumb_tip": pt(-0.100, -0.090, 0.015),
            "index_pip": pt(-0.038, -0.160, 0.005),
            "index_dip": pt(-0.039, -0.190, 0.008),
            "index_tip": pt(-0.040, -0.215, 0.010),
            "middle_pip": pt(0.000, -0.170, 0.005),
            "middle_dip": pt(0.000, -0.205, 0.008),
            "middle_tip": pt(0.000, -0.235, 0.010),
            "ring_pip": pt(0.035, -0.160, 0.005),
            "ring_dip": pt(0.036, -0.190, 0.008),
            "ring_tip": pt(0.037, -0.215, 0.010),
            "pinky_pip": pt(0.065, -0.130, 0.003),
            "pinky_dip": pt(0.067, -0.155, 0.006),
            "pinky_tip": pt(0.069, -0.180, 0.008),
        })

    elif pose == "HOOK":
        joints.update({
            "thumb_ip": pt(-0.045, -0.110, 0.025),
            "thumb_tip": pt(-0.010, -0.115, 0.030),
            "index_pip": pt(-0.042, -0.165, -0.008),
            "index_dip": pt(-0.040, -0.175, 0.025),
            "index_tip": pt(-0.035, -0.150, 0.040),
            "middle_pip": pt(0.000, -0.160, 0.025),
            "middle_dip": pt(0.000, -0.140, 0.040),
            "middle_tip": pt(0.000, -0.115, 0.030),
            "ring_pip": pt(0.035, -0.150, 0.025),
            "ring_dip": pt(0.035, -0.135, 0.040),
            "ring_tip": pt(0.030, -0.110, 0.030),
            "pinky_pip": pt(0.060, -0.130, 0.020),
            "pinky_dip": pt(0.055, -0.115, 0.035),
            "pinky_tip": pt(0.050, -0.095, 0.025),
        })

    elif pose == "CUPPED":
        cluster = pt(0.0, -0.150, 0.025)
        joints.update({
            "thumb_ip": pt(-0.050, -0.120, 0.015),
            "thumb_tip": cluster,
            "index_pip": pt(-0.030, -0.145, 0.010),
            "index_dip": pt(-0.020, -0.155, 0.020),
            "index_tip": cluster,
            "middle_pip": pt(0.000, -0.150, 0.010),
            "middle_dip": pt(0.000, -0.160, 0.020),
            "middle_tip": cluster,
            "ring_pip": pt(0.025, -0.145, 0.010),
            "ring_dip": pt(0.015, -0.155, 0.020),
            "ring_tip": cluster,
            "pinky_pip": pt(0.045, -0.125, 0.010),
            "pinky_dip": pt(0.030, -0.140, 0.018),
            "pinky_tip": cluster,
        })

    else:
        return get_canonical_hand(is_left=is_left, pose="OPEN")

    return joints


def rotate_point(pt, yaw_deg=0.0, pitch_deg=0.0, roll_deg=0.0):
    x, y, z = pt
    rad_p = math.radians(pitch_deg)
    y1 = y * math.cos(rad_p) - z * math.sin(rad_p)
    z1 = y * math.sin(rad_p) + z * math.cos(rad_p)
    x1 = x

    rad_y = math.radians(yaw_deg)
    x2 = x1 * math.cos(rad_y) + z1 * math.sin(rad_y)
    z2 = -x1 * math.sin(rad_y) + z1 * math.cos(rad_y)
    y2 = y1

    rad_r = math.radians(roll_deg)
    x3 = x2 * math.cos(rad_r) - y2 * math.sin(rad_r)
    y3 = x2 * math.sin(rad_r) + y2 * math.cos(rad_r)
    z3 = z2

    return (x3, y3, z3)


SIGN_DEFINITIONS = [
    {
        "sign_name": "HELLO",
        "category": "Greeting",
        "two_handed": 0,
        "dominant_hand": "Right",
        "description": "Open hand with spread fingers waving outward near shoulder level",
        "llm_prompt_summary": "Left: Inactive, Right: Open palm facing forward, fingers extended",
        "left": {"present": False},
        "right": {"present": True, "pose": "OPEN", "wrist": (0.68, 0.62, -0.02), "yaw": 10, "pitch": -5, "roll": -10},
    },
    {
        "sign_name": "YES",
        "category": "Affirmation",
        "two_handed": 0,
        "dominant_hand": "Right",
        "description": "Right hand in thumbs-up gesture pointing upwards affirmatively",
        "llm_prompt_summary": "Left: Inactive, Right: Fist with thumb extended vertically upright",
        "left": {"present": False},
        "right": {"present": True, "pose": "THUMBS_UP", "wrist": (0.64, 0.65, -0.01), "yaw": 5, "pitch": 0, "roll": 0},
    },
    {
        "sign_name": "NO",
        "category": "Negation",
        "two_handed": 0,
        "dominant_hand": "Right",
        "description": "Right hand thumb pointing down in disapproval or rejection",
        "llm_prompt_summary": "Left: Inactive, Right: Fist with thumb extended downward",
        "left": {"present": False},
        "right": {"present": True, "pose": "THUMBS_DOWN", "wrist": (0.65, 0.58, -0.01), "yaw": -5, "pitch": 0, "roll": 0},
    },
    {
        "sign_name": "PEACE",
        "category": "Greeting",
        "two_handed": 0,
        "dominant_hand": "Right",
        "description": "Index and Middle fingers extended in V-shape, others curled",
        "llm_prompt_summary": "Left: Inactive, Right: Index and middle fingers extended in V-shape (Number 2)",
        "left": {"present": False},
        "right": {"present": True, "pose": "PEACE", "wrist": (0.66, 0.63, -0.02), "yaw": 0, "pitch": 0, "roll": -5},
    },
    {
        "sign_name": "I_LOVE_YOU",
        "category": "Emotion",
        "two_handed": 0,
        "dominant_hand": "Right",
        "description": "Thumb, Index, and Pinky fingers extended simultaneously (ASL ILY)",
        "llm_prompt_summary": "Left: Inactive, Right: Thumb, index, and pinky extended, middle and ring curled",
        "left": {"present": False},
        "right": {"present": True, "pose": "ILY", "wrist": (0.65, 0.64, -0.02), "yaw": 0, "pitch": 0, "roll": 0},
    },
    {
        "sign_name": "OK",
        "category": "Agreement",
        "two_handed": 0,
        "dominant_hand": "Right",
        "description": "Thumb and index tips touching in a circle, middle, ring, and pinky extended",
        "llm_prompt_summary": "Left: Inactive, Right: Thumb-index pinch circle, outer 3 fingers extended",
        "left": {"present": False},
        "right": {"present": True, "pose": "PINCH_OK", "wrist": (0.66, 0.62, -0.01), "yaw": 10, "pitch": -5, "roll": 5},
    },
    {
        "sign_name": "POINTING",
        "category": "Directive",
        "two_handed": 0,
        "dominant_hand": "Right",
        "description": "Index finger extended forward directing attention, other fingers folded",
        "llm_prompt_summary": "Left: Inactive, Right: Index extended straight, thumb and other fingers folded",
        "left": {"present": False},
        "right": {"present": True, "pose": "POINT", "wrist": (0.64, 0.66, -0.02), "yaw": 0, "pitch": 0, "roll": 0},
    },
    {
        "sign_name": "STOP",
        "category": "Directive",
        "two_handed": 0,
        "dominant_hand": "Right",
        "description": "Solid closed fist held firmly up indicating stop or wait",
        "llm_prompt_summary": "Left: Inactive, Right: Tight closed fist",
        "left": {"present": False},
        "right": {"present": True, "pose": "FIST", "wrist": (0.65, 0.63, 0.0), "yaw": 0, "pitch": 0, "roll": 0},
    },
    {
        "sign_name": "HELP",
        "category": "Emergency",
        "two_handed": 1,
        "dominant_hand": "Both",
        "description": "Left hand flat palm up as platform, Right hand in thumbs-up fist resting on top",
        "llm_prompt_summary": "Left: Flat palm facing upwards at waist, Right: Thumbs-up fist resting on left palm",
        "left": {"present": True, "pose": "FLAT_PALM_UP", "wrist": (0.43, 0.68, -0.02), "yaw": 15, "pitch": 10, "roll": 20},
        "right": {"present": True, "pose": "THUMBS_UP", "wrist": (0.47, 0.58, -0.01), "yaw": -10, "pitch": 0, "roll": -10},
    },
    {
        "sign_name": "MORE",
        "category": "Basics",
        "two_handed": 1,
        "dominant_hand": "Both",
        "description": "Both hands have all fingertips cupped/pinched together touching at midline",
        "llm_prompt_summary": "Left: Cupped pinch fingers at center, Right: Cupped pinch fingers touching left fingertips",
        "left": {"present": True, "pose": "CUPPED", "wrist": (0.45, 0.64, -0.01), "yaw": 30, "pitch": 0, "roll": 15},
        "right": {"present": True, "pose": "CUPPED", "wrist": (0.55, 0.64, -0.01), "yaw": -30, "pitch": 0, "roll": -15},
    },
    {
        "sign_name": "BOOK",
        "category": "Object",
        "two_handed": 1,
        "dominant_hand": "Both",
        "description": "Both flat hands open with pinky edges touching like an open book",
        "llm_prompt_summary": "Left: Flat open palm tilted right, Right: Flat open palm tilted left, touching at pinkies",
        "left": {"present": True, "pose": "OPEN", "wrist": (0.43, 0.66, -0.01), "yaw": 25, "pitch": 15, "roll": 30},
        "right": {"present": True, "pose": "OPEN", "wrist": (0.57, 0.66, -0.01), "yaw": -25, "pitch": 15, "roll": -30},
    },
    {
        "sign_name": "TOGETHER",
        "category": "Social",
        "two_handed": 1,
        "dominant_hand": "Both",
        "description": "Both hands in thumbs-up fists touching side-by-side at knuckles",
        "llm_prompt_summary": "Left: Fist with thumb up, Right: Fist with thumb up, knuckles touching at center",
        "left": {"present": True, "pose": "THUMBS_UP", "wrist": (0.46, 0.64, -0.01), "yaw": 20, "pitch": 0, "roll": 10},
        "right": {"present": True, "pose": "THUMBS_UP", "wrist": (0.54, 0.64, -0.01), "yaw": -20, "pitch": 0, "roll": -10},
    },
    {
        "sign_name": "HOUSE",
        "category": "Object",
        "two_handed": 1,
        "dominant_hand": "Both",
        "description": "Fingertips of both flat hands touching at an apex angle forming a roof",
        "llm_prompt_summary": "Left: Flat hand angled rightward, Right: Flat hand angled leftward, index/middle tips touching at peak",
        "left": {"present": True, "pose": "OPEN", "wrist": (0.40, 0.68, -0.01), "yaw": 10, "pitch": 0, "roll": 40},
        "right": {"present": True, "pose": "OPEN", "wrist": (0.60, 0.68, -0.01), "yaw": -10, "pitch": 0, "roll": -40},
    },
    {
        "sign_name": "PRAY_RESPECT",
        "category": "Courtesy",
        "two_handed": 1,
        "dominant_hand": "Both",
        "description": "Both flat hands pressed completely together vertically palm-to-palm in front of chest",
        "llm_prompt_summary": "Left: Flat palm facing right, Right: Flat palm facing left, pressed together vertically",
        "left": {"present": True, "pose": "OPEN", "wrist": (0.48, 0.65, 0.0), "yaw": 85, "pitch": 0, "roll": 0},
        "right": {"present": True, "pose": "OPEN", "wrist": (0.52, 0.65, 0.0), "yaw": -85, "pitch": 0, "roll": 0},
    },
    {
        "sign_name": "OPEN",
        "category": "Action",
        "two_handed": 1,
        "dominant_hand": "Both",
        "description": "Both flat hands held apart, palms facing inward opening a wide gate",
        "llm_prompt_summary": "Left: Flat open palm separated to left, Right: Flat open palm separated to right",
        "left": {"present": True, "pose": "OPEN", "wrist": (0.33, 0.63, -0.02), "yaw": 20, "pitch": 0, "roll": 0},
        "right": {"present": True, "pose": "OPEN", "wrist": (0.67, 0.63, -0.02), "yaw": -20, "pitch": 0, "roll": 0},
    },
    {
        "sign_name": "CLOSE",
        "category": "Action",
        "two_handed": 1,
        "dominant_hand": "Both",
        "description": "Both flat hands brought together touching at index finger sides",
        "llm_prompt_summary": "Left: Flat palm at center, Right: Flat palm touching left index side",
        "left": {"present": True, "pose": "OPEN", "wrist": (0.47, 0.64, -0.01), "yaw": 5, "pitch": 0, "roll": 0},
        "right": {"present": True, "pose": "OPEN", "wrist": (0.53, 0.64, -0.01), "yaw": -5, "pitch": 0, "roll": 0},
    },
    {
        "sign_name": "FRIEND",
        "category": "Social",
        "two_handed": 1,
        "dominant_hand": "Both",
        "description": "Both index fingers curved into hooks linked together at center",
        "llm_prompt_summary": "Left: Index hooked facing right, Right: Index hooked interlinked with left index",
        "left": {"present": True, "pose": "HOOK", "wrist": (0.46, 0.64, -0.01), "yaw": 40, "pitch": 0, "roll": 10},
        "right": {"present": True, "pose": "HOOK", "wrist": (0.54, 0.64, -0.01), "yaw": -40, "pitch": 0, "roll": -10},
    },
    {
        "sign_name": "APPLAUD",
        "category": "Social",
        "two_handed": 1,
        "dominant_hand": "Both",
        "description": "Both hands held high above shoulders with open fingers waving (deaf applause)",
        "llm_prompt_summary": "Left: Open hand held high twisting, Right: Open hand held high twisting",
        "left": {"present": True, "pose": "OPEN", "wrist": (0.35, 0.40, -0.03), "yaw": 20, "pitch": -10, "roll": 15},
        "right": {"present": True, "pose": "OPEN", "wrist": (0.65, 0.40, -0.03), "yaw": -20, "pitch": -10, "roll": -15},
    },
    {
        "sign_name": "THANK_YOU",
        "category": "Courtesy",
        "two_handed": 1,
        "dominant_hand": "Right",
        "description": "Right hand flat moving from chin outward, left hand supporting at chest",
        "llm_prompt_summary": "Left: Flat open hand resting near chest, Right: Flat open hand extended forward",
        "left": {"present": True, "pose": "FLAT_PALM_UP", "wrist": (0.42, 0.70, 0.0), "yaw": 10, "pitch": 5, "roll": 10},
        "right": {"present": True, "pose": "OPEN", "wrist": (0.56, 0.55, -0.05), "yaw": -10, "pitch": -15, "roll": 0},
    },
    {
        "sign_name": "PLEASE",
        "category": "Courtesy",
        "two_handed": 1,
        "dominant_hand": "Right",
        "description": "Right hand flat circular rubbing on chest with left hand resting at side",
        "llm_prompt_summary": "Left: Relaxed open hand near waist, Right: Flat palm flat against chest center",
        "left": {"present": True, "pose": "OPEN", "wrist": (0.36, 0.72, 0.01), "yaw": 15, "pitch": 0, "roll": 5},
        "right": {"present": True, "pose": "OPEN", "wrist": (0.52, 0.60, 0.02), "yaw": -15, "pitch": 10, "roll": 10},
    },
]


def generate_sample(sign_def: dict, sample_idx: int) -> dict:
    row = {
        "sample_id": f"SAMP_{sample_idx:05d}",
        "sign_name": sign_def["sign_name"],
        "category": sign_def["category"],
        "two_handed": sign_def["two_handed"],
        "dominant_hand": sign_def["dominant_hand"],
        "description": sign_def["description"],
        "llm_prompt_summary": sign_def["llm_prompt_summary"],
    }

    # Left hand synthesis
    left_cfg = sign_def["left"]
    if left_cfg.get("present"):
        j_tx = random.gauss(0.0, 0.012)
        j_ty = random.gauss(0.0, 0.012)
        j_tz = random.gauss(0.0, 0.008)
        j_yaw = random.gauss(0.0, 3.5)
        j_pitch = random.gauss(0.0, 3.5)
        j_roll = random.gauss(0.0, 3.5)
        scale = random.gauss(1.0, 0.03)

        base_wrist = left_cfg["wrist"]
        wrist_pos = (base_wrist[0] + j_tx, base_wrist[1] + j_ty, base_wrist[2] + j_tz)
        yaw = left_cfg.get("yaw", 0) + j_yaw
        pitch = left_cfg.get("pitch", 0) + j_pitch
        roll = left_cfg.get("roll", 0) + j_roll

        canon = get_canonical_hand(is_left=True, pose=left_cfg["pose"])
        left_pts = {}
        for lm in LANDMARK_NAMES:
            rel = canon[lm]
            j_jx = random.gauss(0.0, 0.002)
            j_jy = random.gauss(0.0, 0.002)
            j_jz = random.gauss(0.0, 0.002)
            rel_jittered = (rel[0] * scale + j_jx, rel[1] * scale + j_jy, rel[2] * scale + j_jz)
            rot = rotate_point(rel_jittered, yaw_deg=yaw, pitch_deg=pitch, roll_deg=roll)
            abs_pt = (
                round(wrist_pos[0] + rot[0], 4),
                round(wrist_pos[1] + rot[1], 4),
                round(wrist_pos[2] + rot[2], 4),
            )
            left_pts[lm] = abs_pt
            row[f"left_{lm}_x"] = abs_pt[0]
            row[f"left_{lm}_y"] = abs_pt[1]
            row[f"left_{lm}_z"] = abs_pt[2]

        row["left_present"] = 1
        t_tip = left_pts["thumb_tip"]
        i_tip = left_pts["index_tip"]
        l_pinch = math.sqrt((t_tip[0]-i_tip[0])**2 + (t_tip[1]-i_tip[1])**2 + (t_tip[2]-i_tip[2])**2)
        row["left_pinch_thumb_index"] = round(l_pinch, 4)
    else:
        row["left_present"] = 0
        row["left_pinch_thumb_index"] = 0.0
        for lm in LANDMARK_NAMES:
            row[f"left_{lm}_x"] = 0.0
            row[f"left_{lm}_y"] = 0.0
            row[f"left_{lm}_z"] = 0.0

    # Right hand synthesis
    right_cfg = sign_def["right"]
    if right_cfg.get("present"):
        j_tx = random.gauss(0.0, 0.012)
        j_ty = random.gauss(0.0, 0.012)
        j_tz = random.gauss(0.0, 0.008)
        j_yaw = random.gauss(0.0, 3.5)
        j_pitch = random.gauss(0.0, 3.5)
        j_roll = random.gauss(0.0, 3.5)
        scale = random.gauss(1.0, 0.03)

        base_wrist = right_cfg["wrist"]
        wrist_pos = (base_wrist[0] + j_tx, base_wrist[1] + j_ty, base_wrist[2] + j_tz)
        yaw = right_cfg.get("yaw", 0) + j_yaw
        pitch = right_cfg.get("pitch", 0) + j_pitch
        roll = right_cfg.get("roll", 0) + j_roll

        canon = get_canonical_hand(is_left=False, pose=right_cfg["pose"])
        right_pts = {}
        for lm in LANDMARK_NAMES:
            rel = canon[lm]
            j_jx = random.gauss(0.0, 0.002)
            j_jy = random.gauss(0.0, 0.002)
            j_jz = random.gauss(0.0, 0.002)
            rel_jittered = (rel[0] * scale + j_jx, rel[1] * scale + j_jy, rel[2] * scale + j_jz)
            rot = rotate_point(rel_jittered, yaw_deg=yaw, pitch_deg=pitch, roll_deg=roll)
            abs_pt = (
                round(wrist_pos[0] + rot[0], 4),
                round(wrist_pos[1] + rot[1], 4),
                round(wrist_pos[2] + rot[2], 4),
            )
            right_pts[lm] = abs_pt
            row[f"right_{lm}_x"] = abs_pt[0]
            row[f"right_{lm}_y"] = abs_pt[1]
            row[f"right_{lm}_z"] = abs_pt[2]

        row["right_present"] = 1
        t_tip = right_pts["thumb_tip"]
        i_tip = right_pts["index_tip"]
        r_pinch = math.sqrt((t_tip[0]-i_tip[0])**2 + (t_tip[1]-i_tip[1])**2 + (t_tip[2]-i_tip[2])**2)
        row["right_pinch_thumb_index"] = round(r_pinch, 4)
    else:
        row["right_present"] = 0
        row["right_pinch_thumb_index"] = 0.0
        for lm in LANDMARK_NAMES:
            row[f"right_{lm}_x"] = 0.0
            row[f"right_{lm}_y"] = 0.0
            row[f"right_{lm}_z"] = 0.0

    if row["left_present"] and row["right_present"]:
        lx, ly, lz = row["left_wrist_x"], row["left_wrist_y"], row["left_wrist_z"]
        rx, ry, rz = row["right_wrist_x"], row["right_wrist_y"], row["right_wrist_z"]
        h_dist = math.sqrt((lx-rx)**2 + (ly-ry)**2 + (lz-rz)**2)
        row["hands_distance"] = round(h_dist, 4)
    else:
        row["hands_distance"] = -1.0

    return row


def build_dataset(samples_per_sign: int = 15, output_csv: str = "dataset/sign_language_dual_hands_dataset.csv"):
    os.makedirs(os.path.dirname(output_csv), exist_ok=True)
    random.seed(42)

    rows = []
    sample_id = 1
    for sign_def in SIGN_DEFINITIONS:
        for _ in range(samples_per_sign):
            rows.append(generate_sample(sign_def, sample_id))
            sample_id += 1

    random.shuffle(rows)
    for idx, r in enumerate(rows, 1):
        r["sample_id"] = f"SAMP_{idx:05d}"

    fieldnames = [
        "sample_id",
        "sign_name",
        "category",
        "two_handed",
        "dominant_hand",
        "left_present",
        "right_present",
        "hands_distance",
        "left_pinch_thumb_index",
        "right_pinch_thumb_index",
    ]
    for lm in LANDMARK_NAMES:
        fieldnames.extend([f"left_{lm}_x", f"left_{lm}_y", f"left_{lm}_z"])
    for lm in LANDMARK_NAMES:
        fieldnames.extend([f"right_{lm}_x", f"right_{lm}_y", f"right_{lm}_z"])

    fieldnames.extend(["description", "llm_prompt_summary"])

    with open(output_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Generated {len(rows)} samples across {len(SIGN_DEFINITIONS)} signs -> {output_csv}")
    print(f"Total features: {len(fieldnames)} columns (126 coordinate features + engineered distance metrics & metadata)")
    return rows


if __name__ == "__main__":
    build_dataset(samples_per_sign=15)
