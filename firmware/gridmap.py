class GridMAP():

    def __init__(self, config):
        self.grid = [[0 for y in range(config['height'])] for x in range(config['width'])];
        self.resolution = config['resolution'];

if __name__ == "__main__":
    config = {
        "width": 100,
        "height": 50,
        "resolution": 10
    };
    map = GridMAP(config);
    print(len(map.grid[0]));