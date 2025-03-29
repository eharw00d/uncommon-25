import tensorflow as tf
import tensorflow_hub as hub
import numpy as np
import cv2
import sys, math


HEIGHT = 1080
WIDTH = 1920

KEYPOINT_EDGE_CONNECTIONS = {
    (0, 1): 'm', (0, 2): 'c', (1, 3): 'm', (2, 4): 'c',
    (0, 5): 'm', (0, 6): 'c', (5, 7): 'm', (7, 9): 'm',
    (6, 8): 'c', (8, 10): 'c', (5, 6): 'y', (5, 11): 'm',
    (6, 12): 'c', (11, 12): 'y', (11, 13): 'm', (13, 15): 'm',
    (12, 14): 'c', (14, 16): 'c'
}

KEYPOINT_NAMES = [
    "nose", "left_eye", "right_eye", "left_ear", "right_ear",
    "left_shoulder", "right_shoulder", "left_elbow", "right_elbow",
    "left_wrist", "right_wrist", "left_hip", "right_hip",
    "left_knee", "right_knee", "left_ankle", "right_ankle"
]

POLYGON_REGIONS = {
    "torso": ["left_shoulder", "right_shoulder", "right_hip", "left_hip",],
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

    for (p1, p2), color in KEYPOINT_EDGE_CONNECTIONS.items():
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
    ...

def movenet(input_image):
    model = module.signatures['serving_default']
    input_image = tf.cast(input_image, dtype=tf.int32)
    outputs = model(input_image)
    keypoints_with_scores = outputs['output_0'].numpy()
    return keypoints_with_scores


def poly(image, keypoints, threshold=0.3):
    named_keypoints = {}
    keypoints = keypoints[0, 0, :, :]  # shape: (17, 3)

    for idx, name in enumerate(KEYPOINT_NAMES):
        y, x, conf = keypoints[idx]
        if conf > threshold:
            named_keypoints[name] = (int(x * WIDTH), int(y * HEIGHT))

    #draw torso
    torso_pts = [named_keypoints[pt] for pt in POLYGON_REGIONS["torso"] if pt in named_keypoints]
    if len(torso_pts) >= 3:
        cv2.fillPoly(image, [np.array(torso_pts, dtype=np.int32)], color=(256, 256, 256))

    # #draw top
    # uptr_pts = [named_keypoints[pt] for pt in POLYGON_REGIONS["upper_torso"] if pt in named_keypoints]
    # if len(uptr_pts) >= 3:
    #     cv2.fillPoly(image, [np.array(uptr_pts, dtype=np.int32)], color=(256, 256, 256))

    face_circle = [named_keypoints[pt] for pt in POLYGON_REGIONS["head"] if pt in named_keypoints]
    if "nose" in named_keypoints and ("left_ear" in named_keypoints or "right_ear" in named_keypoints):
        outer_face_point = named_keypoints.get("left_ear") or named_keypoints.get("right_ear")
        nose_point = named_keypoints["nose"]
        radius = int(math.dist(nose_point, outer_face_point))
        cv2.circle(image, nose_point, radius, (256, 256, 256), -1)

    for shoulder, elbow in [("left_shoulder", "left_elbow"), ("right_shoulder", "right_elbow")]:
        if shoulder in named_keypoints and elbow in named_keypoints:
            x1, y1 = named_keypoints[shoulder]
            x2, y2 = named_keypoints[elbow]
            v = np.array([x2 - x1, y2 - y1])
            v_norm = v / np.linalg.norm(v)
            perp = np.array([-v_norm[1], v_norm[0]])
            box_width = 0.2 * np.linalg.norm(v)
            offset = perp * box_width / 2

            p1 = np.array([x1, y1]) + offset
            p2 = np.array([x1, y1]) - offset
            p3 = np.array([x2, y2]) - offset
            p4 = np.array([x2, y2]) + offset

            box_pts = np.array([p1, p2, p3, p4], dtype=np.int32).reshape((-1, 1, 2))
            cv2.fillPoly(image, [box_pts], color=(256, 256, 256))

    for elbow, wrist in [("left_elbow", "left_wrist"), ("right_elbow", "right_wrist")]:
            if elbow in named_keypoints and wrist in named_keypoints:
                x1, y1 = named_keypoints[elbow]
                x2, y2 = named_keypoints[wrist]
                v = np.array([x2 - x1, y2 - y1])
                v_norm = v / np.linalg.norm(v)
                perp = np.array([-v_norm[1], v_norm[0]])
                box_width = 0.2 * np.linalg.norm(v)
                offset = perp * box_width / 2

                p1 = np.array([x1, y1]) + offset
                p2 = np.array([x1, y1]) - offset
                p3 = np.array([x2, y2]) - offset
                p4 = np.array([x2, y2]) + offset

                box_pts = np.array([p1, p2, p3, p4], dtype=np.int32).reshape((-1, 1, 2))
                cv2.fillPoly(image, [box_pts], color=(256, 256, 256))

    for hip, knee in [("left_hip", "left_knee"), ("right_hip", "right_knee")]:
        if hip in named_keypoints and knee in named_keypoints:
            x1, y1 = named_keypoints[hip]
            x2, y2 = named_keypoints[knee]
            v = np.array([x2 - x1, y2 - y1])
            v_norm = v / np.linalg.norm(v)
            perp = np.array([-v_norm[1], v_norm[0]])
            box_width = 0.2 * np.linalg.norm(v)
            offset = perp * box_width / 2

            p1 = np.array([x1, y1]) + offset
            p2 = np.array([x1, y1]) - offset
            p3 = np.array([x2, y2]) - offset
            p4 = np.array([x2, y2]) + offset

            box_pts = np.array([p1, p2, p3, p4], dtype=np.int32).reshape((-1, 1, 2))
            cv2.fillPoly(image, [box_pts], color=(256, 256, 256))

    for knee, ankle in [("left_knee", "left_ankle"), ("right_knee", "right_ankle")]:
            if knee in named_keypoints and ankle in named_keypoints:
                x1, y1 = named_keypoints[knee]
                x2, y2 = named_keypoints[ankle]
                v = np.array([x2 - x1, y2 - y1])
                v_norm = v / np.linalg.norm(v)
                perp = np.array([-v_norm[1], v_norm[0]])
                box_width = 0.2 * np.linalg.norm(v)
                offset = perp * box_width / 2

                p1 = np.array([x1, y1]) + offset
                p2 = np.array([x1, y1]) - offset
                p3 = np.array([x2, y2]) - offset
                p4 = np.array([x2, y2]) + offset

                box_pts = np.array([p1, p2, p3, p4], dtype=np.int32).reshape((-1, 1, 2))
                cv2.fillPoly(image, [box_pts], color=(256, 256, 256))


    return image



if __name__ == "__main__":
    model_name = "movenet_thunder"
    if "thunder" in model_name:
        input_size = 256
    elif "lightning" in model_name:
        input_size = 192
    module = hub.load(f"https://tfhub.dev/google/movenet/singlepose/{model_name.split('_')[1]}/4")

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Cannot open webcam")
        sys.exit(1)

    try:
        while True:
            ret, frame = cap.read()
            edges = cv2.Canny(cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY), 100, 200)
            edges_colored = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)

            if not ret:
                print("Can't receive frame.")
                continue

            # Prepare input image for model
            img_tensor = tf.convert_to_tensor(frame)
            input_image = tf.image.resize_with_pad(img_tensor, input_size, input_size)
            input_image = tf.expand_dims(input_image, axis=0)

            # Run inference and draw results
            keypoints = movenet(input_image)



            overlay = np.zeros_like(frame)
            overlay = draw_pixel_frames(overlay)
            overlay = draw_prediction_on_image(overlay, keypoints)
            overlay = poly(overlay, keypoints)


            # Show the frame
            cv2.imshow('MoveNet Pose Detection', overlay)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                print("Exiting via 'q' key.")
                break

    except KeyboardInterrupt:
        print("\nExiting via Ctrl+C...")

    finally:
        cap.release()
        cv2.destroyAllWindows()
        sys.exit(0)
