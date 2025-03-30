# :man_dancing: PIXEL POSE :man_dancing:
## Team RAJE's Uncommon Hacks 25 Submission

![Members of RAJE](RAJE_members.jpg)
Team RAJE Members: Red Atagi, Eric Harwood, Amanda Murphy, Jamie Shiao

## Overview
_PixelPose has built-in "shrimp"-detection, using a camera feed and MoveNet's body detection with custom polygon reconstruction, to detect when a user's posture might be bad, and encourages them to play our Strike a Pose game! To play, simply load up a user-submitted pose, and try to make the pose within the timer. Users can also submit their own poses and share them with friends and other users, so long as the pose is actually possible to recreate with your body. View the final submission post on DevPost [here](https://devpost.com/software/_pixelpose)!

## Inspiration
As programmers, we are very familiar with bad posture habits, as are many other gamers and computer enthusiasts. In one 2022 study, 70.5% of respondents complained of musculoskeletal discomfort related to "sitting at a table, alongside a prone position whilst using a mobile phone, as well as a latent or floor-sitting posture when using a laptop, whether at a table or not". Additionally, bad posture can lead to chronic pain and other medical problems. Aesthetically, we were also inspired by WiiPlay's Pose Mii, Hole in the Wall, Super Mario Maker and other physical pose-related games for our concept.

## Localhost Instructions
1. First clone the repository locally and `cd` into the main directory in a new terminal
2. Create a virtual environment in the main directory using `python3.12 -m venv myenv` because our MoveNet model requires Python 3.9-3.12.
3. Enter the virtual environment using `myenv\Scripts\activate` or `source myenv/bin/activate` and run `pip install -r requirements.txt`
4. Once the requirements are installed, run `python3 flask_app.py`
4. Open a new terminal and navigate to `backend_nodejs/` and run `node server.js`
5. Open a new terminal and navigate to `react_frontend/my-app/` and run `npm start`
6. The web app should open automatically in your preferred browser on `http://localhost:3000` (if `http://localhost:3000/uncommon-25` opens, just remove the `uncommon-25` part)