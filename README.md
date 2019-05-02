# RPi Simultaneous Localization and Mapping

### 1. Introduction

### 2. Requirements
Required Python packages:
* RPi.GPIO v0.6.5;
* RTIMULib v7.2.1;
* websocket_client_py3 v0.15.0.

Required JavaScript modules:
* ws v7.0.0
* jQuery v3.2.1

### 3. Pin Connection

### 4. Configuration
The project folder must contain a CONFIG.json file that specifies pin connection for I/O and odometry parameters.
```
{
    "pin_mode": "GPIO",
    "map": {
        "width": 100,
        "height": 100,
        "resolution": 10
    },
    "robot": {
        "x": 50,
        "y": 50,
        "orientation": 0
    },
    "measurement": {
            "front": {
                    "type": "sonar",
                    "pins": [10]
            },
            "left": {
                    "type": "sonar",
                    "pins": [4, 17]		
            },
            "right": {
                    "type": "infrared",
                    "pins": [9]		
            }
    },
    "odometry": {
        "pin": 21,
        "count_per_revolution": 20,
        "wheel_circumference": 42.73
    },
    "motors": {
        "top_left": [11, 5],
        "top_right": [26, 19],
        "bottom_left": [22, 27],
        "bottom_right": [6, 13]
    },
    "server": {
        "ip": "192.168.0.102",
        "port": "8080"
    }
}

```

### 5. Unit Testing
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