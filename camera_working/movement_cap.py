import tensorflow as tf
import tensorflow_hub as hub
import numpy as np
import cv2
import sys

KEYPOINT_EDGE_CONNECTIONS = {
    (0, 1): 'm', (0, 2): 'c', (1, 3): 'm', (2, 4): 'c',
    (0, 5): 'm', (0, 6): 'c', (5, 7): 'm', (7, 9): 'm',
    (6, 8): 'c', (8, 10): 'c', (5, 6): 'y', (5, 11): 'm',
    (6, 12): 'c', (11, 12): 'y', (11, 13): 'm', (13, 15): 'm',
    (12, 14): 'c', (14, 16): 'c'
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


def movenet(input_image):
    model = module.signatures['serving_default']
    input_image = tf.cast(input_image, dtype=tf.int32)
    outputs = model(input_image)
    keypoints_with_scores = outputs['output_0'].numpy()
    return keypoints_with_scores


if __name__ == "__main__":
    model_name = "movenet_lightning"
    input_size = 192 if "lightning" in model_name else 256
    module = hub.load(f"https://tfhub.dev/google/movenet/singlepose/{model_name.split('_')[1]}/4")

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

            # Prepare input image for model
            img_tensor = tf.convert_to_tensor(frame)
            input_image = tf.image.resize_with_pad(img_tensor, input_size, input_size)
            input_image = tf.expand_dims(input_image, axis=0)

            # Run inference and draw results
            keypoints = movenet(input_image)
            frame = draw_prediction_on_image(frame, keypoints)

            # Show the frame
            cv2.imshow('MoveNet Pose Detection', frame)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                print("Exiting via 'q' key.")
                break

    except KeyboardInterrupt:
        print("\nExiting via Ctrl+C...")

    finally:
        cap.release()
        cv2.destroyAllWindows()
        sys.exit(0)
    
