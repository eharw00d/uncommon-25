import tensorflow as tf
import numpy as np
import cv2
import sys, math
import mediapipe as mp

HEIGHT = 1080
WIDTH = 1920

KEYPOINT_EDGE_CONNECTIONS = mp.solutions.pose.POSE_CONNECTIONS

KEYPOINT_NAMES = [
    "nose", "left_eye_inner", "left_eye", "left_eye_outer", "right_eye_inner", "right_eye", "right_eye_outer",
    "left_ear", "right_ear", "mouth_left", "mouth_right", "left_shoulder", "right_shoulder", "left_elbow",
    "right_elbow", "left_wrist", "right_wrist", "left_pinky", "right_pinky", "left_index", "right_index",
    "left_thumb", "right_thumb", "left_hip", "right_hip", "left_knee", "right_knee", "left_ankle", "right_ankle",
    "left_heel", "right_heel", "left_foot_index", "right_foot_index"
]

POLYGON_REGIONS = {
    "torso": ["left_shoulder", "right_shoulder", "right_hip", "left_hip"],
    "upper_torso": ["left_shoulder", "right_shoulder", "nose"],
    "left_arm": ["left_shoulder", "left_elbow", "left_wrist"],
    "right_arm": ["right_shoulder", "right_elbow", "right_wrist"],
    "left_leg": ["left_hip", "left_knee", "left_ankle"],
    "right_leg": ["right_hip", "right_knee", "right_ankle"],
    "head": ["left_ear", "right_ear", "nose"]
}

def draw_prediction_on_image(image, keypoints_with_scores, threshold=0.3):
    height, width, _ = image.shape
    keypoints = keypoints_with_scores[0, 0, :, :]

    for idx, kp in enumerate(keypoints):
        y, x, confidence = kp
        if confidence > threshold:
            cx, cy = int(x * width), int(y * height)
            cv2.circle(image, (cx, cy), 4, (0, 255, 0), -1)

    for p1, p2 in KEYPOINT_EDGE_CONNECTIONS:
        y1, x1, c1 = keypoints[p1]
        y2, x2, c2 = keypoints[p2]
        if c1 > threshold and c2 > threshold:
            pt1 = (int(x1 * width), int(y1 * height))
            pt2 = (int(x2 * width), int(y2 * height))
            cv2.line(image, pt1, pt2, (255, 0, 0), 2)

    return image

def draw_pixel_frames(image):
    height, width, _ = image.shape
    for idx1 in range(width):
        if (idx1 % 120 == 0):
            cv2.line(image, (idx1, 0), (idx1, HEIGHT), (100,100,100), 2)
    for idx2 in range(height):
        if (idx2 % 120 == 0):
            cv2.line(image, (0, idx2), (WIDTH, idx2), (100,100,100), 2)
    return image

def check_frames(image):
    pass

def movenet(input_image):
    input_image_np = input_image.numpy()[0].astype(np.uint8)
    rgb_image = cv2.cvtColor(input_image_np, cv2.COLOR_BGR2RGB)
    results = pose.process(rgb_image)
    keypoints_with_scores = np.zeros((1, 1, 33, 3))

    if results.pose_landmarks:
        for i, landmark in enumerate(results.pose_landmarks.landmark):
            keypoints_with_scores[0, 0, i, 0] = landmark.y
            keypoints_with_scores[0, 0, i, 1] = landmark.x
            keypoints_with_scores[0, 0, i, 2] = landmark.visibility

    return keypoints_with_scores

def poly(image, keypoints, threshold=0.3):
    named_keypoints = {}
    keypoints = keypoints[0, 0, :, :]

    for idx, name in enumerate(KEYPOINT_NAMES):
        y, x, conf = keypoints[idx]
        if conf > threshold:
            named_keypoints[name] = (int(x * WIDTH), int(y * HEIGHT))

    torso_pts = [named_keypoints[pt] for pt in POLYGON_REGIONS["torso"] if pt in named_keypoints]
    if len(torso_pts) >= 3:
        cv2.fillPoly(image, [np.array(torso_pts, dtype=np.int32)], color=(255, 255, 255))

    if "nose" in named_keypoints and ("left_ear" in named_keypoints or "right_ear" in named_keypoints):
        outer_face_point = named_keypoints.get("left_ear") or named_keypoints.get("right_ear")
        nose_point = named_keypoints["nose"]
        radius = int(math.dist(nose_point, outer_face_point))
        cv2.circle(image, nose_point, radius, (255, 255, 255), -1)

    for segment in [
        ("left_shoulder", "left_elbow"), ("right_shoulder", "right_elbow"),
        ("left_elbow", "left_wrist"), ("right_elbow", "right_wrist"),
        ("left_hip", "left_knee"), ("right_hip", "right_knee"),
        ("left_knee", "left_ankle"), ("right_knee", "right_ankle")
    ]:
        p1_name, p2_name = segment
        if p1_name in named_keypoints and p2_name in named_keypoints:
            x1, y1 = named_keypoints[p1_name]
            x2, y2 = named_keypoints[p2_name]
            v = np.array([x2 - x1, y2 - y1])
            v_norm = v / np.linalg.norm(v)
            perp = np.array([-v_norm[1], v_norm[0]])
            box_width = 0.2 * np.linalg.norm(v)
            offset = perp * box_width / 2

            p1a = np.array([x1, y1]) + offset
            p1b = np.array([x1, y1]) - offset
            p2b = np.array([x2, y2]) - offset
            p2a = np.array([x2, y2]) + offset

            box_pts = np.array([p1a, p1b, p2b, p2a], dtype=np.int32).reshape((-1, 1, 2))
            cv2.fillPoly(image, [box_pts], color=(255, 255, 255))

    #neck!
    if all(k in named_keypoints for k in ["nose", "left_shoulder", "right_shoulder"]):
        x_neck = (named_keypoints["left_shoulder"][0] + named_keypoints["right_shoulder"][0]) / 2
        y_neck = (named_keypoints["left_shoulder"][1] + named_keypoints["right_shoulder"][1]) / 2
        cv2.line(image, (int(x_neck), int(y_neck)), (int(named_keypoints["nose"][0]), int(named_keypoints["nose"][1])), (255, 255, 255), 50)

    return image

#game functionality
def gridcheck(image):
    height, width, __ = image.shape
    for idx1 in range(0, height, 120):
        for idx2 in range(0, width, 120):
            start = (idx1, idx2)
            end = (idx1 + 120, idx2 + 120)
            region = image[start[0]:end[0], start[1]:end[1]]
            if np.any(np.all(region == [255, 255, 255], axis=-1)):
                pts = np.array([
                    [start[1], start[0]],
                    [end[1], start[0]],
                    [end[1], end[0]],
                    [start[1], end[0]]
                ], dtype=np.int32)
                cv2.polylines(image, [pts], isClosed=True, color=(0, 255, 0), thickness=2)
    return image





if __name__ == "__main__":
    input_size = 256
    mp_pose = mp.solutions.pose
    pose = mp_pose.Pose(static_image_mode=False, model_complexity=2)

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Cannot open webcam")
        sys.exit(1)

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                print("Can't receive frame.")
                continue

            img_tensor = tf.convert_to_tensor(frame)
            input_image = tf.image.resize_with_pad(img_tensor, input_size, input_size)
            input_image = tf.expand_dims(input_image, axis=0)

            keypoints = movenet(input_image)

            # Separate black canvases
            poly_layer = np.zeros_like(frame)
            poly_layer = poly(poly_layer, keypoints)

            grid_layer = gridcheck(poly_layer)
            pixel_grid_layer = draw_pixel_frames(np.zeros_like(frame))

            skeleton_layer = draw_prediction_on_image(np.zeros_like(frame), keypoints)

            # Combine all layers
            final_overlay = cv2.addWeighted(grid_layer, 1.0, poly_layer, 1.0, 0)
            final_overlay = cv2.addWeighted(final_overlay, 1.0, pixel_grid_layer, 1.0, 0)
            final_overlay = cv2.addWeighted(final_overlay, 1.0, skeleton_layer, 1.0, 0)

            final_overlay = cv2.flip(final_overlay, 1)

            cv2.imshow('Pose Detection', final_overlay)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                print("Exiting via 'q' key.")
                break

    except KeyboardInterrupt:
        print("\nExiting via Ctrl+C...")

    finally:
        cap.release()
        cv2.destroyAllWindows()
        sys.exit(0)
