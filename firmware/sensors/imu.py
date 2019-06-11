import RTIMU;
import time;
import math;
import sys;

# Define constantes para os angulos:
PITCH = 0;
ROLL  = 1;
YAW   = 2;

class MPU():
    ''' Classe que estabelece a interface entre a biblioteca
        do IMU e o MPU-9250 para obter a orientação do sensor.
    '''
    def __init__(self, config):
        # Inicializa o MPU:
        self.settings = RTIMU.Settings(config);
        self.imu = RTIMU.RTIMU(self.settings);
        if (not self.imu.IMUInit()):
            print("IMU Init Failed");
            sys.exit(1);

        # Configura o MPU-9250:
        self.imu.setSlerpPower(0.02);
        self.imu.setGyroEnable(True);
        self.imu.setAccelEnable(True);
        self.imu.setCompassEnable(True);

        # Tempo de espera necessario entre leituras:
        self.poll_interval = self.imu.IMUGetPollInterval() * 0.001;
        self.last_poll = time.time();
        time.sleep(self.poll_interval);

    def getData(self):
        ''' Retorna uma tupla com os dados do IMU.
            Para garantir que o sensor esteja preparado
            para leitura, o processo e interrompido por
            'self.poll_interval' segundos.
        '''
        data = None;
        if(self.imu.IMURead()):
            data = self.imu.getIMUData()["fusionPose"];
        time.sleep(self.imu.IMUGetPollInterval() * 0.001);
        return data;
            
    def getPitch(self):
        """ Retorna o angulo de pitch em graus. """
        data = self.getData();
        if(data is None):
            return None;
        return math.degrees(data[PITCH]);
            
    def getRoll(self):
        """ Retorna o angulo de roll em graus. """
        data = self.getData();
        if(data is None):
            return None;
        return math.degrees(data[ROLL]);
    
    def getYaw(self):
        """ Retorna o angulo de yaw em graus. """
        data = self.getData();
        if(data is None):
            return None;
        return math.degrees(data[YAW]);
            
if __name__ == "__main__":
    mpu = MPU('IMUCONF');
    
    while True:
        fusionPose = mpu.getData();
        if(fusionPose is None):
            continue;
        print("r: %f p: %f y: %f" % (math.degrees(fusionPose[0]), 
            math.degrees(fusionPose[1]), math.degrees(fusionPose[2])));
        time.sleep(0.02)
        #print(mpu.getYaw());
