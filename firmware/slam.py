from client_socket import *;
from gridmap       import *;
from robot         import *;
import cProfile;

class Slam():
    def __init__(self, config):
        self.config = config;
        
        # Configura o veiculo:
        self.robot = Robot(config['robot'], config['map']);
                
        # Configura o mapa:
        #print('Create map.');
        self.map = GridMAP(config['map']);
        
        # Determina o proximo controle a ser executado:
        sensor_data = self.robot.sense();
        self.next_control = self.obstacleAvoidance(sensor_data);
        
        # Ajusta o tamanho do mapa:
        self.map.resize(self.robot.pose);
        
        # Faz a primeira leitura e constroi o mapa inicial:
        data = self.dataAssociation(sensor_data, self.robot.pose);        
        self.map.update(data, self.robot.pose);
        self.time = 0;
        
        # Conecta com o servidor:
        print('Connecting to ' + config['server']['ip'] + ':' + config['server']['port']);
        try:
            self.socket = ClientSocket(config['server']['ip'], config['server']['port']);
            self.socket.start();
            # Declara o socket do robo.
            # Envia os primeiros dados:
            self.sendData({
                'command': 'robot_socket',
                'resolution': config['map']['resolution'],
                'max_range': config['map']['max_range'],
                'robot_pose': self.robot.pose,
                'map_data': data,
                'map_size': self.map.getSize(),
                'map_resize': [0, 0, 0, 0]
            });            
            print('Connected.');
        except:
            print('Connection refused.');
            exit();
            
    def obstacleAvoidance(self, sensor_data):
        """ Retorna o proximo controle a ser executado.
            Evita colidir com provaveis obstaculos.
            Da preferencia aos controles na seguinte ordem:
            Mover para frente, girar para a esquerda, girar para a direita.
        """
        # Verifica se ha espaco para mover uma celula para frente:
        if(sensor_data['front']['data'] > sensor_data['front']['min_range']):
            return FORWARD;
        # Verifica se ha espaco a esquerda:
        elif(sensor_data['left']['data'] > sensor_data['left']['min_range']):
            return ROTATE_LEFT;
        # Verifica se ha espaco a direita:
        elif(sensor_data['right']['obstacle_found'] is False):
            return ROTATE_RIGHT;
            
        return None;
            
    def dataAssociation(self, sensor_data, robot_pose):
        """ Transforma as leituras dos sensores em células do mapa.
            A orientacao do robo e do mapa sao feitas no sentido anti-horario.
            0 graus  = sentido positivo de 'x'.
            90 graus = sentido negativo de 'y'.
        """
        data = [];
        for key, info in sensor_data.items():
            # Distancia total e igual a medida mais a 
            # distancia entre o sensor e o centro do veiculo:
            distance = info['data'] + info['offset'];
            
            # Transforma a distancia em numero de celulas do mapa:
            offset = math.ceil(distance / self.map.resolution);
            
            # Encontra a celula alvo do mapa:
            x, y = robot_pose['x'], robot_pose['y'];
            orientation = info['orientation'];
            x += math.floor(offset * math.cos(math.radians(orientation)));
            y += math.floor(offset * math.sin(math.radians(orientation)) * -1);
            
            # Cria tupla com os dados necessarios para mapeamento:
            # Posicao da matriz, se existe um obstaculo, direcao do marco.
            data.append((y, x, info['obstacle_found'], orientation));
        
        return data;
            
    def localization(self, odometry_data):
        """ Atualiza a posicao atual do robo.
            Retorna a posicao atual e a quantidade de linhas
            e de colunas adicionadas ao mapa. 
        """
        robot_pose = self.robot.update(odometry_data);
        print(self.robot.pose);
        correct_pose = self.map.resize(robot_pose);
        print(correct_pose);
        return (self.robot.correctPose(correct_pose), correct_pose);
    
    def mapping(self, data):
        """ Atualiza cada celula do mapa. """
        self.map.update(data, self.robot.pose);
    
    def SLAM(self):
        while(self.next_control is not None):
            # Executa o controle:
            odometry_data = self.robot.move(self.next_control);
            print(odometry_data);
            
            # Atualiza a posicao do veiculo:
            robot_pose = self.localization(odometry_data);
            
            # Faz leitura dos sensores:
            sensor_info = self.robot.sense();
            
            # Associa as leituras as respectivas celulas no mapa:
            sensor_data = self.dataAssociation(sensor_info, robot_pose[0]);
            
            # Atualiza o mapa:
            self.mapping(sensor_data);
            
            # Envia os novos dados ao servidor:
            self.sendData({
                    'command': 'new_robot_data',
                    'robot_pose': robot_pose[0],
                    'map_resize': robot_pose[1],
                    'map_data': sensor_data                    
                });
            
            # Determina o proximo controle:
            self.next_control = self.obstacleAvoidance(sensor_info);
            
        # Informa ao servidor que a aplicacao encerrou:
        self.sendData({ 'command': 'slam_end' });
        print('SLAM end');
    
    def sendData(self, data):
        """ Passa dados para o socket enviar ao servidor. """
        self.socket.send(data);
        
    def cleanup(self):
        self.robot.cleanup();
        self.socket.kill();

if __name__ == "__main__":
    try:
        config_file = open('CONFIG.json', 'r');
        config = json.loads(config_file.read());
        
        slam = Slam(config);
        slam.SLAM();
        slam.cleanup();
        exit();
    except json.JSONDecodeError:
        print('Invalid configuration file.');
        GPIO.cleanup();
    except KeyboardInterrupt:
        GPIO.cleanup();
