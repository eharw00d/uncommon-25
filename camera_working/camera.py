import os, sys, shutil, subprocess
import cv2
from matplotlib import pyplot as plt



def camera_capture():
    camera = cv2.VideoCapture(0)

    #get a frame from the camera
    while camera.isOpened():
        ret, frame = camera.read()
        cv2.imshow('Webcam', frame)



if __name__ == "__main__":\
    camera_capture()