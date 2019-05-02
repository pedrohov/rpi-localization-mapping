import json;
import sys;
import RPi.GPIO as GPIO;
from pathlib import Path;

sys.path.insert(0, str(Path().absolute()) + '/sensors/');
GPIO.setwarnings(False);

from client_socket import *;
from controller    import *;
from infrared      import *;
from odometer      import *;
from gridmap       import *;
from sonar         import *;
from imu           import *;

class Robot():

    def __init__(self, config):
        # Create the robot's posterior and current position:
        self.posterior = {
            "x": config['robot']['x'],
            "y": config['robot']['y'],
            "orientation": config['robot']['orientation'],
        }
        self.current = {
            "x": config['robot']['x'],
            "y": config['robot']['y'],
            "orientation": config['robot']['orientation'],
        }
        
        # Instantiate the map:
        print('Create map.');
        self.map = GridMAP(config['map']);
        self.resolution = config['map']['resolution'];
        
        # Instantiate the motor control:
        print('Motor setup.');
        motors = config['motors'];
        self.motor_controller = Controller(motors['top_left'][0],
                                           motors['top_left'][1],
                                           motors['bottom_left'][0],
                                           motors['bottom_left'][1],
                                           motors['top_right'][0],
                                           motors['top_right'][1],
                                           motors['bottom_right'][0],
                                           motors['bottom_right'][1]);
        
        # Instantiate the inertial measurement unit:
        print('IMU setup.');
        self.imu = MPU();
        #print(self.imu.getData());
        
        # Instantiate distance measurement sensors:
        print('Sensor setup.');
        measurement = config['measurement'];
        self.front_sonar = Sonar.create(measurement['front']['pins']);
        self.left_sonar = Sonar.create(measurement['left']['pins']);
        self.right_ir = Infrared(measurement['right']['pins']);
        
        # Instantiate odometer:
        print('Odometer setup.');
        self.odometer = Odometer(config['odometry']);
        
        # Connect to the server:
        print('Connecting to ' + config['server']['ip'] + ':' + config['server']['port']);
        try:
            self.socket = ClientSocket(config['server']['ip'], config['server']['port']);
            self.socket.start();
        except:
            print('Connection refused.');
            exit();
            
    def forward(self):
        pass;
    
    def move_left(self):
        pass;
    
    def move_right(self):
        pass;
    
    def sense(self):
        """ Get sensor data. """
        pass;
    
    def move(self):
        """ Decides which movement to execute. """
        pass;
    
    def localize(self):
        """ Update current location. """
        pass;
    
    def map(self):
        """ Update map. """
        pass;
    
    def SLAM(self):
        pass;
    
    def send_data(self):
        """ Send the current state of the robot
            to the server.
        """
        pass;

if __name__ == "__main__":
    try:
        config_file = open('CONFIG.json', 'r');
        config = json.loads(config_file.read());
        
        robot = Robot(config);
        GPIO.cleanup();
    except json.JSONDecodeError:
        print('Invalid configuration file.');
    except KeyboardInterrupt:
        GPIO.cleanup();