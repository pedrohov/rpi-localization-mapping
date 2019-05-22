import math;

class GridMAP():

    def __init__(self, config):
        self.resolution = config['resolution'];
        self.max_range  = config['max_range'];
        
        # Cria o mapa inicial:
        no_cells = math.ceil(self.max_range / self.resolution);
        self.grid = [[0 for y in range(no_cells)] for x in range(no_cells)];
        #print(self.grid);
        #print(str(len(self.grid)));

if __name__ == "__main__":
    config = {
        "resolution": 10,
        "max_range": 350
    };
    map = GridMAP(config);
    print(len(map.grid[0]));
