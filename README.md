# RPi Simultaneous Localization and Mapping

### 1. Introduction
Mapping and localization are necessary for the comprehension of autonomous vehicles
about the environment they are in, allowing these vehicles to navigate without colliding
with obstacles. However, a map is necessary to estimate the vehicle’s pose, and the pose is
necessary for creating a representation of the map. The problem of estimating both the
map’s state and the robot’s pose is called SLAM (Simultaneous Localization and Mapping).
With the popularization of electronic prototyping platforms and microelectromechanical
systems, it is possible to develop robots using low cost components. In this work, a prototype of a autonomous vehicle was developed using concepts of simultaneous localization
and mapping to aid the navigation and to create a representation of the environment.
The developed map is represented by a two-dimensional occupancy grid that provides
information about the occupancy probability of specific regions in the map with a precision
of centimeters.


### 2. Requirements
Required Python packages:
* RPi.GPIO v0.6.5;
* RTIMULib v7.2.1;
* websocket_client_py3 v0.15.0.

Required JavaScript modules:
* ws v7.0.0
* jQuery v3.2.1

### 3. Configuration
The project folder must contain a CONFIG.json file that specifies pin connection for I/O and odometry parameters.
The file uses the following structure:
```
{
    "pin_mode": "GPIO",
    "map": {
        "resolution": 10.0,
        "max_range": 400.0
    },
    "robot": {
        "x": 0,
        "y": 0,
        "orientation": 0,
		"measurement": {
				"front": {
						"type": "sonar",
						"pins": [10],
						"center_offset": 14,
						"orientation": 0,
						"max_range": 300,
						"min_range": 10
				},
				"left": {
						"type": "sonar",
						"pins": [4, 17],
						"center_offset": 7,
						"orientation": 90,
						"max_range": 300,
						"min_range": 10
				},
				"right": {
						"type": "infrared",
						"pins": [9],
						"center_offset": 7,
						"orientation": -90,
						"range": 25
				}
		},
		"odometry": {
			"pin": 21,
			"count_per_revolution": 50,
			"wheel_circumference": 42.73,
			"encoder_circumference": 4.08
		},
		"motors": {
			"top_left": [11, 5],
			"top_right": [26, 19],
			"bottom_left": [22, 27],
			"bottom_right": [6, 13]
		}
	},
    "server": {
        "ip": "192.168.0.100",
        "port": "8080"
    }
}


```

### 4. Unit Testing
To run unit tests, execute the script for the corresponding sensor/motor.
The following files have unit tests built-in:
* odometer.py
* hc_sr04.py
* parallax_pin.py
* sonar.py
* infrared.py
* imu.py
* motor.py
* controller.py

### 5. Usage
1. Start the server:
```
node server.js
```

2. Start the slam script inside the firmware folder:
```
python3 firmware/slam.py
```

3. Open and connect at least one client.
