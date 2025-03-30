from flask import Flask, Response, jsonify
import cv2
import tensorflow as tf
import numpy as np
import mediapipe as mp
import sys, random, json
import math
from flask_cors import CORS

app = Flask(__name__)
global test_array
# Configure CORS to allow specific origins (your React app)
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "http://localhost:3004", "*"]}}, supports_credentials=True)

# Constants from your original code - EXACTLY as in your file
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

frame_counter = 0

# Initialize scrolling dot data
NUM_DOTS = 80  # more dots!
dot_particles = []

for _ in range(NUM_DOTS):
    dot_particles.append({
        "x": random.randint(0, WIDTH),
        "y": random.randint(0, HEIGHT),
        "speed": random.uniform(1.0, 4.0),
        "radius": random.randint(2, 5),
        "gray": random.randint(60, 120),
        "direction": random.choice([-1, 1])  # -1 = leftward, 1 = rightward
    })

# Initialize MediaPipe Pose
mp_pose = mp.solutions.pose
pose = mp_pose.Pose(static_image_mode=False, model_complexity=2)

# Open the webcam
cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("Cannot open webcam")
    sys.exit(1)

input_size = 256


# Functions from your original code - EXACTLY as they appeared
def draw_prediction_on_image(image, keypoints_with_scores, threshold=0.3):
    height, width, _ = image.shape
    keypoints = keypoints_with_scores[0, 0,:,:]

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
            cv2.line(image, (idx1, 0), (idx1, HEIGHT), (50, 50, 50), 2)
    for idx2 in range(height):
        if (idx2 % 120 == 0):
            cv2.line(image, (0, idx2), (WIDTH, idx2), (50, 50, 50), 2)
    return image

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
    keypoints = keypoints[0, 0,:,:]

    for idx, name in enumerate(KEYPOINT_NAMES):
        y, x, conf = keypoints[idx]
        if conf > threshold:
            named_keypoints[name] = (int(x * WIDTH), int(y * HEIGHT))

    glow_layer = np.zeros_like(image)

    # Torso
    torso_pts = [named_keypoints[pt] for pt in POLYGON_REGIONS["torso"] if pt in named_keypoints]
    if len(torso_pts) >= 3:
        cv2.fillPoly(glow_layer, [np.array(torso_pts, dtype=np.int32)], color=(0, 255, 255))
        cv2.fillPoly(image, [np.array(torso_pts, dtype=np.int32)], color=(255, 255, 255))

    # Face circle
    if "nose" in named_keypoints and ("left_ear" in named_keypoints or "right_ear" in named_keypoints):
        outer_face_point = named_keypoints.get("left_ear") or named_keypoints.get("right_ear")
        nose_point = named_keypoints["nose"]
        radius = int(math.dist(nose_point, outer_face_point))
        cv2.circle(glow_layer, nose_point, radius, (0, 255, 255), -1)
        cv2.circle(image, nose_point, radius, (255, 255, 255), -1)

    # Limbs
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
            cv2.fillPoly(glow_layer, [box_pts], color=(0, 255, 255))
            cv2.fillPoly(image, [box_pts], color=(255, 255, 255))

    # Neck
    if all(k in named_keypoints for k in ["nose", "left_shoulder", "right_shoulder"]):
        x_neck = (named_keypoints["left_shoulder"][0] + named_keypoints["right_shoulder"][0]) / 2
        y_neck = (named_keypoints["left_shoulder"][1] + named_keypoints["right_shoulder"][1]) / 2
        cv2.line(glow_layer, (int(x_neck), int(y_neck)), (int(named_keypoints["nose"][0]), int(named_keypoints["nose"][1])), (0, 255, 255), 50)
        cv2.line(image, (int(x_neck), int(y_neck)), (int(named_keypoints["nose"][0]), int(named_keypoints["nose"][1])), (255, 255, 255), 50)

    # --- Helmet (with glow) ---
    if all(k in named_keypoints for k in ["nose", "left_ear", "right_ear"]):
        nose = named_keypoints["nose"]
        left_ear = named_keypoints["left_ear"]
        right_ear = named_keypoints["right_ear"]

        helmet_center = nose
        helmet_radius = int(max(math.dist(nose, left_ear), math.dist(nose, right_ear)) * 1.6)

        # Glow layer gets the outer glow
        cv2.circle(glow_layer, helmet_center, int(helmet_radius * 0.75), (0, 255, 255), thickness=6)

        # Main image gets the solid helmet
        cv2.circle(image, helmet_center, int(helmet_radius * 0.75), (255, 255, 255), thickness=-1)
    
    # --- Palm Rings (1 per hand, proportional to forearm) ---
    for side in ["left", "right"]:
        wrist = f"{side}_wrist"
        elbow = f"{side}_elbow"
        if wrist in named_keypoints and elbow in named_keypoints:
            cx, cy = named_keypoints[wrist]
            ex, ey = named_keypoints[elbow]

            forearm_len = math.dist((cx, cy), (ex, ey))
            ring_radius = int(forearm_len * 0.2)

            # White ring on main image
            cv2.circle(image, (cx, cy), ring_radius, (255, 255, 255), thickness=4)

            # Optional glow on glow layer
            cv2.circle(glow_layer, (cx, cy), ring_radius, (0, 255, 255), thickness=6)

    # Blur for glow
    blurred_glow = cv2.GaussianBlur(glow_layer, (51, 51), sigmaX=0, sigmaY=0)

    # Overlay glow onto image
    image = cv2.addWeighted(image, 1.0, blurred_glow, 0.6, 0)

    return image


def draw_scrolling_dots(image):
    for dot in dot_particles:
        x, y = int(dot["x"]), int(dot["y"])
        radius = dot["radius"]
        color = (dot["gray"], dot["gray"], dot["gray"])
        cv2.circle(image, (x, y), radius, color, -1)
    return image


def load_pose_database(filename='db.json'):
    try:
        with open(filename, 'r') as file:
            data = json.load(file)
        return data
    except Exception as e:
        print(f"Error loading pose database: {e}")
        return None

# Get a random binary pose array from the database
def get_random_pose_array():
    data = load_pose_database()

    # Select a random pose from the database
    random_pose = random.choice(data['poses'])
    
    # Extract the drawnPose (binary array)
    pose_array = random_pose['drawnPose']
    
    # Print which pose ID was selected
    print(f"Selected pose ID: {random_pose['id']}")
    
    return pose_array

# Initialize test_array with a random pose from the database
test_array = get_random_pose_array()



# game functionality
def gridcheck(image):
    global test_array  # Add this line to the beginning of gridcheck
    
    height, width, _ = image.shape
    grid_size = 120
    grid_color = (0, 200, 0)
    thickness = 2

    white_mask = np.all(image == [255, 255, 255], axis=-1)

    rows = height // grid_size
    cols = width // grid_size

    # Create a transparent overlay image for half transparency
    overlay = image.copy()

    for row in range(rows):
        for col in range(cols):
            x = col * grid_size
            y = row * grid_size

            # Check corresponding cell in test_array (you might need to scale or adjust based on resolution)
            test_row = min(row * len(test_array) // rows, len(test_array) - 1)
            test_col = min(col * len(test_array[0]) // cols, len(test_array[0]) - 1)
            
            if test_array[test_row][test_col] == 1:  # Color red if the cell value is 1
                cv2.rectangle(overlay, (x, y), (x + grid_size, y + grid_size), (80, 80, 0), thickness=-1)

            region = white_mask[y:y + grid_size, x:x + grid_size]
            has_white = np.any(region)

            if not has_white:
                continue

            # Check neighbors: if any side borders a non-white region, draw that side
            # Top
            if row == 0 or not np.any(white_mask[(row - 1) * grid_size:row * grid_size, x:x + grid_size]):
                cv2.line(image, (x, y), (x + grid_size, y), grid_color, thickness)
            # Bottom
            if row == rows - 1 or not np.any(white_mask[(row + 1) * grid_size:(row + 2) * grid_size, x:x + grid_size]):
                cv2.line(image, (x, y + grid_size), (x + grid_size, y + grid_size), grid_color, thickness)
            # Left
            if col == 0 or not np.any(white_mask[y:y + grid_size, (col - 1) * grid_size:col * grid_size]):
                cv2.line(image, (x, y), (x, y + grid_size), grid_color, thickness)
            # Right
            if col == cols - 1 or not np.any(white_mask[y:y + grid_size, (col + 1) * grid_size:(col + 2) * grid_size]):
                cv2.line(image, (x + grid_size, y), (x + grid_size, y + grid_size), grid_color, thickness)

    # Apply half transparency by blending the overlay with the original image
    alpha = 0.5  # 50% transparency
    cv2.addWeighted(overlay, alpha, image, 1 - alpha, 0, image)

    return image



# Flask routes for API endpoints
@app.route('/')
def index():
    # Add CORS headers to this response explicitly
    response = jsonify({"status": "success", "message": "Pose Detection Server is running"})
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "*")
    response.headers.add("Access-Control-Allow-Methods", "*")
    return response


@app.route('/status')
def status():
    # Another endpoint for status checks
    response = jsonify({"status": "success", "message": "Server is active"})
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "*")
    response.headers.add("Access-Control-Allow-Methods", "*")
    return response


def generate_frames():
    global frame_counter, test_array
    score_print_interval = 30  # Print score every 30 frames (about once per second at 30fps)
    pose_change_interval = 30 * 30  # Change pose every 30 seconds (assuming 30fps)
    
    while True:
        ret, frame = cap.read()
        if not ret:
            print("Can't receive frame.")
            continue

        frame = cv2.resize(frame, (WIDTH, HEIGHT))
        
        img_tensor = tf.convert_to_tensor(frame)
        input_image = tf.image.resize_with_pad(img_tensor, input_size, input_size)
        input_image = tf.expand_dims(input_image, axis=0)

        keypoints = movenet(input_image)

        poly_layer = np.zeros_like(frame)
        poly_layer = poly(poly_layer, keypoints)

        # Calculate score
        score_data = get_score(poly_layer)
        
        grid_layer = gridcheck(poly_layer)
        pixel_grid_layer = draw_pixel_frames(np.zeros_like(frame))

        skeleton_layer = draw_prediction_on_image(np.zeros_like(frame), keypoints)

        dots_layer = draw_scrolling_dots(np.zeros_like(frame))

        # Combine all layers
        final_overlay = cv2.addWeighted(grid_layer, 1.0, poly_layer, 1.0, 0)
        final_overlay = cv2.addWeighted(final_overlay, 1.0, pixel_grid_layer, 1.0, 0)
        final_overlay = cv2.addWeighted(final_overlay, 1.0, skeleton_layer, 1.0, 0)
        final_overlay = cv2.addWeighted(final_overlay, 1.0, dots_layer, 1.0, 0)
        
        # Print score to stdout at specified interval to avoid flooding
        if frame_counter % score_print_interval == 0:
            print(f"Score: {score_data['score']} / {score_data['max_possible']} | Boxes: {score_data['boxes_lit']} / {score_data['total_boxes']}")
            
            # Only check for pose change when already printing score to reduce frequency
            if frame_counter > 0 and frame_counter % pose_change_interval == 0:
                try:
                    test_array = get_random_pose_array()
                    print("Changed to new pose!")
                except Exception as e:
                    print(f"Error changing pose: {e}")

        final_overlay = cv2.flip(final_overlay, 1)

        ret, jpeg = cv2.imencode('.jpg', final_overlay)
        if not ret:
            continue

        for dot in dot_particles:
            dot["x"] += dot["speed"] * dot["direction"]

            if dot["x"] < 0 or dot["x"] > WIDTH:
                # Reset off-screen dots
                dot["x"] = 0 if dot["direction"] > 0 else WIDTH
                dot["y"] = random.randint(0, HEIGHT)
                dot["speed"] = random.uniform(1.0, 4.0)
                dot["radius"] = random.randint(2, 5)
                dot["gray"] = random.randint(60, 120)
                dot["direction"] = random.choice([-1, 1])

        frame_counter += 1  # move dots
        frame_bytes = jpeg.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n\r\n')



def get_score(image):
    """
    Calculate score based on highlighted boxes in the image.
    
    Args:
        image: The processed image with highlighted boxes
        
    Returns:
        dict: Score data including points, boxes lit, etc.
    """
    global test_array  # This is critical - declare it's using the global variable
    
    height, width, _ = image.shape
    grid_size = 120
    
    # White mask to detect player's presence (white pixels)
    white_mask = np.all(image == [255, 255, 255], axis=-1)
    
    rows = height // grid_size
    cols = width // grid_size
    
    score = 0
    total_boxes = 0
    
    for row in range(rows):
        for col in range(cols):
            x = col * grid_size
            y = row * grid_size
            
            # Map to test_array coordinates
            test_row = min(row * len(test_array) // rows, len(test_array) - 1)
            test_col = min(col * len(test_array[0]) // cols, len(test_array[0]) - 1)
            
            # Check if this is a box that should be lit up
            if test_array[test_row][test_col] == 1:
                total_boxes += 1
                
                # Check if the player is in this box (white pixels present)
                region = white_mask[y:y + grid_size, x:x + grid_size]
                if np.any(region):
                    score += 10  # Award 10 points for each lit box
    
    score_data = {
        "score": score,
        "max_possible": total_boxes * 10,
        "boxes_lit": score // 10,
        "total_boxes": total_boxes
    }
    
    return score_data

@app.route('/video_feed')
def video_feed():
    response = Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')
    response.headers.add("Access-Control-Allow-Origin", "*")
    return response

@app.route('/get_score')
def score_endpoint():
    """
    Endpoint to get the current score based on the latest processed frame.
    Returns the score as JSON.
    """
    ret, frame = cap.read()
    if not ret:
        return jsonify({"error": "Could not capture frame"}), 500
    
    frame = cv2.resize(frame, (WIDTH, HEIGHT))
    
    img_tensor = tf.convert_to_tensor(frame)
    input_image = tf.image.resize_with_pad(img_tensor, input_size, input_size)
    input_image = tf.expand_dims(input_image, axis=0)
    
    keypoints = movenet(input_image)
    
    # Create the poly layer with player's position
    poly_layer = np.zeros_like(frame)
    poly_layer = poly(poly_layer, keypoints)
    
    # Calculate score using the poly_layer
    score_data = get_score(poly_layer)
    
    response = jsonify(score_data)
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "*")
    response.headers.add("Access-Control-Allow-Methods", "*")
    
    return response

# Add preflight response for CORS
@app.route('/get_score', methods=['OPTIONS'])
def options_get_score():
    response = jsonify({'status': 'success'})
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "*")
    response.headers.add("Access-Control-Allow-Methods", "*")
    return response

# Add preflight response for CORS
@app.route('/video_feed', methods=['OPTIONS'])
def options_video_feed():
    response = jsonify({'status': 'success'})
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "*")
    response.headers.add("Access-Control-Allow-Methods", "*")
    return response


if __name__ == "__main__":
    try:
        app.run(host='localhost', port=3003, debug=True, threaded=True)
    except KeyboardInterrupt:
        print("\nExiting via Ctrl+C...")
    finally:
        cap.release()
        sys.exit(0)
