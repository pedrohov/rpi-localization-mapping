import json, sys, time, math;
import RPi.GPIO as GPIO;
from pathlib import Path;

sys.path.insert(0, str(Path().absolute()) + '/sensors/');
GPIO.setwarnings(False);

from controller    import *;
from infrared      import *;
from odometer      import *;
from sonar         import *;
from imu           import *;

# Define controles do veiculo:
FORWARD      = "Z1";
ROTATE_LEFT  = "Z2";
ROTATE_RIGHT = "Z3";

class Robot():
    """ Classe responsavel por gerenciar todos os sensores e atuadores.
        O Robo implementa funcoes para movimentacao e sensoriamento,
        define quais movimentos podem ser executados e realiza a interface
        entre os sensores e o Slam.
    """
    def __init__(self, config, map_config):
        # Cria a posicao inicial do robo.
        # O robo sempre se posiciona no meio do mapa inicial
        # e constroi o mapa em relacao a esta posicao.
        # x = Coluna da matriz em que o robo esta.
        # y = Linha da matriz. 
        coords = self.getIniXY(map_config);
        self.pose = {
            "x": coords[0],
            "y": coords[1],
            "orientation": config['orientation'],
        }
        self.resolution = map_config['resolution'];
        
        # Configura os motores:
        #print('Motor setup.');
        motors = config['motors'];
        self.motor_controller = Controller(motors['top_left'][0],
            motors['top_left'][1],
            motors['bottom_left'][0],
            motors['bottom_left'][1],
            motors['top_right'][0],
            motors['top_right'][1],
            motors['bottom_right'][0],
            motors['bottom_right'][1]);
        
        # Configura a Unidade de Medicao Inercial:
        #print('IMU setup.');
        self.imu = MPU('IMUCONF');
        #print(self.imu.getData());
        
        # Configura os sensores de distancia:
        #print('Sensor setup.');
        self.sensors = {};
        for (key, sensor) in config['measurement'].items():
            if(sensor["type"] == "infrared"):
                self.sensors[key] = Infrared(sensor);
            else:
                self.sensors[key] = Sonar.create(sensor);
        
        # Configura o odometro:
        #print('Odometer setup.');
        self.odometer = Odometer(config['odometry']);
            
        # Proximo controle a ser executado:
        self.next_control = None;
        
    def update(self, odometry):
        distance = odometry['distance'];
        orientation = math.radians(self.pose['orientation']);
        
        # Calcula a nova posicao do robo na matriz:
        if(distance >= 0):
            self.pose['x'] += int(distance * math.cos(orientation) / self.resolution);
            self.pose['y'] += int(distance * math.sin(orientation) * -1 / self.resolution);
            
        # Atualiza a orientacao do robo:
        self.pose['orientation'] = odometry['orientation'];
        for key, sensor in self.sensors.items():
            sensor.updateOrientation(odometry['orientation']);
            print(key, sensor.orientation);
        
        return self.pose;
        
    def correctPose(self, correction):
        """ Ajusta a posicao do robo em relacao ao mapa atualizado. """
        if(correction[0] > 0):
            self.pose['x'] += correction[0];
        if(correction[1] > 0):
            self.pose['y'] += correction[1];
        return self.pose;
        
    def canMoveForward(self):
        distance = self.sensors["front"].getData();
        if(distance <= self.sensors["front"].min_range):
            return False;
        return True;
            
    def forward(self):
        time_ini = time.time();
		
        # Inicia a contagem do odometro:
        self.odometer.init();
		
        # Envia o comando para mover para frente:
        self.motor_controller.forward();
		
        # Termina a contagem quando a distancia for
        # igual a distancia de uma celula:
        distance = 0;
        while(distance < self.resolution):
            distance = self.odometer.getOdometry()["distance"];
		
        odometry_data = self.odometer.stop();
        self.motor_controller.stop();
		
        # Tempo gasto para executar o comando:
        elapsed = time.time() - time_ini;
		
        return { "distance": distance, "time": elapsed, "orientation": self.pose['orientation'] };
    
    def rotateLeft(self):
        # Codigo com IMU:
        #orientation = self.calcOrientation();
        #target = orientation + 90;
        #self.motor_controller.rotateLeft();
        #while(orientation < target):
            #orientation = self.imu.getYaw();
            #print(orientation);
        #self.motor_controller.stop();
        
        time_ini = time.time();
        self.motor_controller.rotateLeft(0.4);
        
        # Tempo gasto para executar o comando:
        elapsed = time.time() - time_ini;
        
        orientation = (self.pose['orientation'] + 90) % 360;
        
        return { "distance": -1, "orientation": orientation, "time": elapsed };
    
    def rotateRight(self):
        time_ini = time.time();
        self.motor_controller.rotateRight(0.4);
        
        # Tempo gasto para executar o comando:
        elapsed = time.time() - time_ini;
        
        orientation = (self.pose['orientation'] - 90) % 360;
        
        return { "distance": -1, "orientation": orientation, "time": elapsed };
    
    def sense(self):
        """ Le dados dos sensores.
            Retorna um dicionario com a informacao necessaria
            para a etapa de associacao de dados.
        """
        readings = {};
        for key, sensor in self.sensors.items():
            readings[key] = sensor.getInfo();
            
        return readings;
    
    def move(self, control):
        """ Decide qual sera o proximo controle a ser executado.
            Retorna False se nao puder executar o controle.
            Retorna dados da odometria se o controle for executado.
        """
        if(control is None):
            return False;
		
        odometry = {};	
        if(control == FORWARD):
            odometry = self.forward();
        elif(control == ROTATE_LEFT):
            odometry = self.rotateLeft();
        elif(control == ROTATE_RIGHT):
            odometry = self.rotateRight();
            
        return odometry;
        
    def calcOrientation(self):
        """ Le a orientacao do MPU.
            Faz leituras ate receber uma valida.
        """
        orientation = self.imu.getYaw();
        while(orientation is None):
            orientation = self.imu.getYaw();
        return orientation;
        
    def getIniXY(self, map_config):
        """ Determina as celulas do centro do mapa. """
        no_cells = math.floor(map_config['max_range'] / (map_config['resolution'] * 2));
        return (no_cells, no_cells);
        
    def cleanup(self):
        """ Libera os GPIOs utilizados pelo veiculo.
            Termina quaisquer threads em execucao.
        """
        if(self.odometer is not None):
            self.odometer.kill();
        GPIO.cleanup();

if __name__ == "__main__":
    try:
        config_file = open('CONFIG.json', 'r');
        config = json.loads(config_file.read());
        
        robot = Robot(config['robot'], config['map']);
        print(robot.sense());
        print(robot.move(ROTATE_LEFT));
        #print(robot.move(FORWARD));
        robot.cleanup();
    except json.JSONDecodeError:
        print('Invalid configuration file.');
        GPIO.cleanup();
    except KeyboardInterrupt:
        GPIO.cleanup();
