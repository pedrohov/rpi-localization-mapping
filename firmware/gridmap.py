import math;

class GridMAP():

    def __init__(self, config):
        self.resolution = config['resolution'];
        self.max_range  = config['max_range'];
        
        # Cria o mapa inicial:
        self.no_cells = math.ceil(self.max_range / self.resolution);
        self.grid = [[0.5 for y in range(self.no_cells)] for x in range(self.no_cells)];
        
    def update(self, map_data, robot_pose):
        """ Atualiza a posicao das celulas do mapa
            que foram recebidas em 'data'.
            A atualizacao e a media entre a nova medida e a medida anterior.
            O resultado e a probabilidade de ocupacao de cada celula.
        """
        for data in map_data:
            # Nova medicao:
            new_data = 0;
            
            # Se existir um obstaculo:
            if(data[2] is True):
                new_data = 1;
            
            # Atualiza a probabilidade da celula:
            y, x = data[0], data[1];
            self.grid[y][x] = (new_data + self.grid[y][x]) / 2;
            
            # Atualiza a probabilidade das demais celulas:
            orientation = math.radians(data[3]);
            x += math.floor(math.cos(orientation)) * -1;
            y += math.floor(math.sin(orientation));
            while((x != robot_pose['x']) or (y != robot_pose['y'])):
                self.grid[y][x] = (0 + self.grid[y][x]) / 2;
                x += math.floor(math.cos(orientation)) * -1;
                y += math.floor(math.sin(orientation));
                
        
    def resize(self, robot_pose):
        """ Atualiza o tamanho do mapa de acordo com a posicao do veiculo.
            Se o alcance maximo definido pelo mapa for menor que a distancia
            entre as bordas do mapa e a posicao do veiculo, sao adicionadas
            novas linhas e novas colunas.
            Retorna a quantidade de linhas e colunas adicionadas antes
            da posicao do veiculo para corrigir sua pose.
        """
        # Adiciona linhas no fim da matriz:
        new_lines = robot_pose['y'] + self.no_cells;
        if(new_lines > len(self.grid)):
            for i in range(new_lines - len(self.grid)):
                self.grid.append([0.5] * len(self.grid[0]));
        
        # Adiciona linhas no inicio da matriz:
        new_lines = robot_pose['y'] - self.no_cells;
        if(new_lines < 0):
            for i in range(new_lines * -1):
                self.grid.insert(0, [0.5] * len(self.grid[0]));
                
        # Adiciona colunas no fim da matriz:
        new_columns = robot_pose['x'] + self.no_cells;
        if(new_columns > len(self.grid[0])):
            for row in self.grid:
                row += [0.5] * (new_columns - len(row));
                
        # Adiciona colunas no inicio da matriz:
        new_columns = robot_pose['x'] - self.no_cells;
        if(new_columns < 0):
            for row in self.grid:
                row = ([0.5] * (new_columns * -1)) + row;
                
        return (new_columns, new_lines);
    
    def __str__(self):
        """ Retorna uma string com a probabilidade de cada celula. """
        result = "";
        for row in self.grid:
            result += ''.join(str(cell) + '\t' for cell in row) + "\n";
        return result;

if __name__ == "__main__":
    config = {
        "resolution": 10,
        "max_range": 30
    };
    map = GridMAP(config);
    map.update([(2, 0, True, 180)], {'x': 2, 'y': 2});
    print(map);
    print(len(map.grid[0]));
