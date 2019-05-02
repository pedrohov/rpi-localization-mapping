import RTIMU;
import time;
import math;
import sys;

# MPU config file:
SETTINGS_FILE = "IMUCONF";

class MPU():
    ''' Class for interfacing the low level
        IMU library and extracting the sensor pose.
    '''
    def __init__(self):
        self.settings = RTIMU.Settings(SETTINGS_FILE);
        self.imu = RTIMU.RTIMU(self.settings);
        #print("IMU Name: " + self.imu.IMUName());

        # Initialize the MPU:
        if (not self.imu.IMUInit()):
            print("IMU Init Failed");
            sys.exit(1);

        # Set fusion parameters:
        self.imu.setSlerpPower(0.02);
        self.imu.setGyroEnable(True);
        self.imu.setAccelEnable(True);
        self.imu.setCompassEnable(True);
        
        time.sleep(0.4);

        #self.poll_interval = self.imu.IMUGetPollInterval();
        #print("Recommended Poll Interval: %dmS\n" % self.poll_interval);

    def getData(self):
        ''' Return the MPU data if there is any available. '''
        if(self.imu.IMURead()):
            return self.imu.getIMUData()["fusionPose"];
        
        
if __name__ == "__main__":
    mpu = MPU();
    
    while True:
        fusionPose = mpu.getData();
        if(fusionPose is None):
            continue;
        print("r: %f p: %f y: %f" % (math.degrees(fusionPose[0]), 
            math.degrees(fusionPose[1]), math.degrees(fusionPose[2])));
        time.sleep(mpu.poll_interval * 1.0 / 1000.0);