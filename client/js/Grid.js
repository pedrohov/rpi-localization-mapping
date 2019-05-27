function GridMAP(canvas, grid=null) {
	// Canvas:
    this.canvas     = canvas;
    this.context    = canvas.getContext("2d");

    // Grid map:
    this.grid       = grid;
	this.resolution = 10;
    this.no_cells   = null;
    this.max_range  = null;

    // Robot:
    this.robot_poses = [];

    // UI:
    this.zoom = 1;
    this.hover_cell = null;

    // A* data:
    this.start = null;      // Posicao inicial da rota.
    this.end   = null;      // Posicao de destino.
    this.path  = null;      // Caminho da rota.
    this.expanded = null;   // Celulas expandidas.
    this.moves = [[-1, 0],  // Move para cima,
                  [ 0,-1],  // Move para a esquerda,
                  [ 1, 0],  // Move para baixo,
                  [ 0, 1]]; // Move para a direita. 
    /*this.draw();
    this.start = {x:0,y:0}
    this.end = {x:4,y:this.grid[0].length - 1}
    this.aStar();*/
}


GridMAP.prototype.constructor = GridMAP;

GridMAP.prototype.initialize = function(data) {
    this.robot_poses.push(data.robot_pose);
    this.resolution = data.resolution;
    this.max_range  = data.max_range;
    this.no_cells   = Math.ceil(this.max_range / this.resolution);
    
    this.grid = [];
    for(let i = 0; i < this.no_cells; i++) {
        this.grid[i] = [];
        for(let j = 0; j < this.no_cells; j++) {
            this.grid[i][j] = 0.5;
        }
    }

    // Atualiza o tamanho da matriz:
    this.resize();
    this.draw();
}

GridMAP.prototype.draw = function() {
    if(!this.context)
        return;

    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.strokeStyle = "rgba(51, 51, 51, 0.3)";
    this.context.lineWidth = 1;

    // Fill the canvas with an empty grid if there's no data:
    if(!this.grid) {
	    for(let i = 0; i < this.canvas.height; i += this.resolution * this.zoom)
	    	for(let j = 0; j < this.canvas.width; j += this.resolution * this.zoom)
	    		this.context.strokeRect(j, i, this.resolution * this.zoom, this.resolution * this.zoom);
    }
    // Draw the map: 
    else {
        let rows = this.grid[0].length;
        let columns = this.grid.length;
        let resolution = this.resolution * this.zoom;
        let start_x = this.canvas.width / 2 - rows * resolution / 2;
        let start_y = this.canvas.height / 2 - columns * resolution / 2;

        for(let i = 0; i < this.grid.length; i++) {
            for(let j = 0; j < this.grid[i].length; j++) {
                // Cell is being hovered:
                if(this.getHoverCell(i, j))
                    this.context.fillStyle = 'rgba(0, 0, 0, 0.6)';
                // Cell is occupied:
                else if(this.grid[i][j] > 0.5)
                    this.context.fillStyle = '#333333';
                // Cell is free:
                else if(this.grid[i][j] < 0.5)
                    this.context.fillStyle = '#FFFFFF';
                // Cell is unknown:
                else
                    this.context.fillStyle = '#D3D3D3';

                // Draw current cell:
                this.context.fillRect(j * resolution + start_x, i * resolution + start_y, resolution, resolution);
                this.context.strokeRect(j * resolution + start_x, i * resolution + start_y, resolution, resolution);


                /*this.context.fillStyle = 'blue';
                this.context.font = "20px Arial";
                this.context.fillText(this.grid[i][j], j * resolution + start_x + resolution / 3, i * resolution + start_y + resolution /2 );*/
            }
        }

        // Draw current pose:
        let current_pos = this.getCurrentPose();
        this.context.fillStyle = 'red';
        if(current_pos) {
            this.context.beginPath();
            this.context.arc(current_pos.x * resolution + start_x + resolution * 0.5, current_pos.y * resolution + start_y + resolution * 0.5, resolution / 4, 0, 2 * Math.PI);
            this.context.fill();
        }

        // Draw routes:
        if(this.expanded) { 
            this.context.fillStyle = '#42ccff';
            for(let i = 0; i < this.expanded.length; i++) {
                for(let j = 0; j < this.expanded[0].length; j++) {
                    if(this.expanded[i][j] > -1)
                        this.context.fillRect(j * resolution + start_x, i * resolution + start_y, resolution, resolution);
                }
            }
        }
        if(this.path) {
            this.context.fillStyle = 'red';
            this.path.forEach((coord, index) => {
                this.context.beginPath();
                this.context.arc(coord[1] * resolution + start_x + resolution * 0.5, coord[0] * resolution + start_y + resolution * 0.5, resolution / 4, 0, 2 * Math.PI);
                this.context.fill();
            });
        }
    }
    
    //window.requestAnimationFrame(this.draw);
}

GridMAP.prototype.update = function(map_data, new_pose) {

    if(!this.grid)
        return;

    // Atualiza o tamanho da matriz:
    this.resize();
    
    // Obtem a posicao atual do robo:
    this.robot_poses.push(new_pose);
    console.log(new_pose)

    // Atualiza o estado do mapa:
    map_data.forEach((data, index) => {
        // Nova medicao:
        let new_data = 0;
        
        // Se existir um obstaculo:
        if(data[2] === true)
            new_data = 1;
        
        // Atualiza a probabilidade da celula:
        let x = data[1];
        let y = data[0];
        this.grid[y][x] = (new_data + this.grid[y][x]) / 2;
        
        // Atualiza a probabilidade das demais celulas:
        let orientation = data[3] * Math.PI / 180;
        x += Math.floor(Math.cos(orientation)) * -1;
        y += Math.floor(Math.sin(orientation));
        while((x != new_pose.x) || (y != new_pose.y)) {
            this.grid[y][x] = (0 + this.grid[y][x]) / 2;
            x += Math.floor(Math.cos(orientation)) * -1;
            y += Math.floor(Math.sin(orientation));
        }
    });        

    //console.log(this.grid)

    this.draw();
}

GridMAP.prototype.setPath = function(x, y) {
    pos = this.getCellAtMouse(x, y);
    if(this.start) {
        this.end = {x: pos.y, y: pos.x};
        console.log('começa busca')
        this.aStar();
    } else
        this.start = {x: pos.y, y: pos.x};

    return;
}

GridMAP.prototype.aStar = function() {
    // Inicia todas as posicoes da matriz como nao visitadas (0):
    let closed = [];
    for(let i = 0; i < this.grid.length; i++) {
        closed[i] = [];
        for(let j = 0; j < this.grid[0].length; j++)
            closed[i][j] = 0;
    }

    // Cria uma matriz para informar em qual iteracao a posicao foi expandida:
    this.expanded = [];
    for(let i = 0; i < this.grid.length; i++) {
        this.expanded[i] = [];
        for(let j = 0; j < this.grid[0].length; j++)
            this.expanded[i][j] = -1;
    }

    // Matriz que informa qual movimento foi realizado em cada posicao:
    let action = [];
    for(let i = 0; i < this.grid.length; i++) {
        action[i] = [];
        for(let j = 0; j < this.grid[0].length; j++)
            action[i][j] = -1;
    }

    // Matriz que informa a distancia entre determinada celula e a celula-alvo:
    let heuristic = this.createDistanceMatrix();

    // Marca a posicao inicial como visitada:
    closed[this.start.x][this.start.y] = 1;

    // Cria uma lista de posicoes a serem visitadas:
    let x = this.start.x;
    let y = this.start.y;
    let g = 0;
    let h = heuristic[x][y];
    let f = g + h;
    let open = [[f, g, h, x, y]];

    // Flag para sinalizar quando o alvo e encontrado:
    let found = false;

    // Inicia a busca:
    let counter = 0;

    while(!found) {
        // Se nao houver uma posicao para expandir, nao existe solucao:
        if(open.length === 0) {
            console.log(action)
            return false;
        }

        // Ordena os elementos pelo valor de 'g':
        open.sort((a, b) => {
            if (a[0] < b[0]) return -1;
            if (a[0] > b[0]) return 1;
            return 0;
        });
        let next = open.shift();
        g = next[2];
        x = next[3];
        y = next[4];

        // Checa se a posicao atual e a posicao-alvo:
        // Checa se a posicao atual e a posicao-alvo:
        if(x === this.end.x && y === this.end.y)
            found = true;
        else {
            // Atualiza a matriz de expansoes:
            this.expanded[x][y] = counter;
            counter += 1;

            // Expande a posicao atual:
            this.moves.forEach((move, index) => {
                let x2 = x + move[0];
                let y2 = y + move[1];

                // Checa se a posicao expandida e valida:
                if(x2 >= 0 && x2 < this.grid.length &&
                    y2 >= 0 && y2 < this.grid[0].length) {
                    // Checa se a posicao expandida ainda nao foi checada:
                    if(closed[x2][y2] === 0 && this.grid[x2][y2] < 0.5) {
                        let g2 = g + 1;
                        let h2 = g2 + heuristic[x2][y2];
                        let f2 = g2 + h2;
                        open.push([f2, g2, h2, x2, y2]);
                        closed[x2][y2] = 1;
                        action[x2][y2] = index;
                    }
                }
            });
        }
    }

    // Cria o caminho:
    x = this.end.x;
    y = this.end.y;
    this.path = [[x, y]];
    while((x !== this.start.x) || (y !== this.start.y)) {
        let x2 = x - this.moves[action[x][y]][0];
        let y2 = y - this.moves[action[x][y]][1];
        this.path.unshift([x2, y2]);
        x = x2;
        y = y2;
    }
    this.path.unshift([this.start.x, this.start.y]);
    this.draw();
}

GridMAP.prototype.firstSearch = function() {
    // Inicia todas as posicoes da matriz como nao visitadas (0):
    let closed = [];
    for(let i = 0; i < this.grid.length; i++) {
        closed[i] = [];
        for(let j = 0; j < this.grid[0].length; j++) {
            closed[i][j] = 0;
        }
    }

    // Cria uma matriz para informar em qual iteracao a posicao foi expandida:
    this.expanded = [];
    for(let i = 0; i < this.grid.length; i++) {
        this.expanded[i] = [];
        for(let j = 0; j < this.grid[0].length; j++)
            this.expanded[i][j] = -1;
    }

    // Matriz que informa qual movimento foi realizado em cada posicao:
    let action = [];
    for(let i = 0; i < this.grid.length; i++) {
        action[i] = [];
        for(let j = 0; j < this.grid[0].length; j++)
            action[i][j] = -1;
    }

    // Marca a posicao inicial como visitada:
    closed[this.start.x][this.start.y] = 1;

    // Cria uma lista de posicoes a serem visitadas:
    let x = this.start.x;
    let y = this.start.y;
    let g = 0;
    let open = [[g, x, y]];

    // Flag para sinalizar quando o alvo e encontrado:
    let found = false;

    // Inicia a busca:
    let counter = 0;

    while(!found) {
        /* Se nao houver uma posicao para expandir,
           nao existe solucao. */
        if(open.length == 0)
            return false;

        // Ordena os elementos pelo valor de 'g':
        open.sort((a, b) => {
            if (a[0] < b[0]) return -1;
            if (a[0] > b[0]) return 1;
            return 0;
        });
        let next = open.shift();
        g = next[0];
        x = next[1];
        y = next[2];

        // Atualiza a matriz de expansoes:
        this.expanded[x][y] = counter;
        counter += 1;
        //this.draw();

        // Checa se a posicao atual e a posicao-alvo:
        if(x === this.end.x && y === this.end.y)
            found = true;
        else {
            // Expande a posicao atual:
            this.moves.forEach((move, index) => {
                let x2 = x + move[0];
                let y2 = y + move[1];

                // Checa se a posicao expandida e valida:
                if(x2 >= 0 && x2 < this.grid.length &&
                    y2 >= 0 && y2 < this.grid[0].length) {
                    // Checa se a posicao expandida ainda nao foi checada:
                    if(closed[x2][y2] === 0 && this.grid[x2][y2] < 0.5) {
                        let g2 = g + 1;
                        open.push([g2, x2, y2]);
                        closed[x2][y2] = 1;
                        action[x2][y2] = index;
                    }
                }
            })
        }
    }

    // Cria o caminho:
    x = this.end.x;
    y = this.end.y;
    this.path = [[x, y]];
    while((x !== this.start.x) || (y !== this.start.y)) {
        let x2 = x - this.moves[action[x][y]][0];
        let y2 = y - this.moves[action[x][y]][1];
        this.path.unshift([x2, y2]);
        x = x2;
        y = y2;
    }
    this.path.unshift([this.start.x, this.start.y]);
    this.draw();
}

GridMAP.prototype.createDistanceMatrix = function() {
    let matrix = [];
    for(let i = 0; i < this.grid.length; i++) {
        matrix[i] = [];
        for(let j = 0; j < this.grid[0].length; j++)
            matrix[i][j] = Math.abs(this.end.x - i) + Math.abs(this.end.y - j);
    }

    return matrix;
}

GridMAP.prototype.resize = function() {

    if(this.robot_poses.length === 0)
        return;

    let robot_pose = this.robot_poses[this.robot_poses.length - 1];

    // Adiciona linhas no fim da matriz:
    new_lines = robot_pose.y + this.no_cells;
    if(new_lines > this.grid.length) {
        for(let i = 0; i <= new_lines - this.grid.length; i++) {
            new_row = [];
            for(let j = 0; j < this.grid[i].length; j++)
                new_row[j] = 0.5;
            this.grid.push(new_row);
        }
    }
    
    // Adiciona linhas no inicio da matriz:
    new_lines = robot_pose.y - this.no_cells;
    if(new_lines < 0) {
        for(let i = 0; i < (new_lines * -1); i++) {
            new_row = [];
            for(let j = 0; j < this.grid[0].length; j++)
                new_row[j] = 0.5;
            this.grid.unshift(new_row);
        }
    }
            
    // Adiciona colunas no fim da matriz:
    new_columns = robot_pose.x + this.no_cells;
    if(new_columns >= this.grid[0].length) {
        this.grid.forEach((row, index) => {
            for(let i = row.length; i <= new_columns; i++) {
                row[i] = 0.5;
            }
        });
    }
            
    // Adiciona colunas no inicio da matriz:
    new_columns = robot_pose.x - this.no_cells;
    if(new_columns < 0) {
        this.grid.forEach((row, index) => {
            for(let i = 0; i < (new_columns * -1); i++) {
                row.unshift(0.5);
            }
        });
    }

    new_columns *= -1;
    new_lines   *= -1;        
    map.correctRobotPoses({ new_columns, new_lines });
}

GridMAP.prototype.correctRobotPoses = function(offset) {
    this.robot_poses.forEach((pose, index) => {
        pose.x += offset.new_columns;
        pose.y += offset.new_lines;
    });
}

GridMAP.prototype.setZoom = function(delta) {
	if(delta > 0)
		this.zoom++;
	else if(this.zoom > 1)
		this.zoom--;

	//this.draw();
}

GridMAP.prototype.getCurrentPose = function() {
	if(this.robot_poses.length > 0)
        return this.robot_poses[this.robot_poses.length - 1];
    return null;
}

GridMAP.prototype.isHovering = function(x, y) {
    this.hover_cell = this.getCellAtMouse(x, y);
}

GridMAP.prototype.getHoverCell = function(i, j) {
    if(!this.hover_cell)
        return false;
    else if(this.hover_cell.x === j && this.hover_cell.y === i) {
        return true;
    }

    return false;
}

GridMAP.prototype.fillCell = function(x, y, edit) {
    let cell = this.getCellAtMouse(x, y);
    if(!cell)
        return;

    if(edit === 'obstacle')
        this.grid[cell.y][cell.x] = 1;
    else if(edit === 'free')
        this.grid[cell.y][cell.x] = 0;
    else
        this.grid[cell.y][cell.x] = 0.5;
}

GridMAP.prototype.hasData = function() {
    if(!this.grid)
        return false;

    for(let i = 0; i < this.grid.length; i++)
        for(let j = 0; j < this.grid[i].length; j++)
            if(this.grid[i][j] !== 0.5)
                return true;

    return false;
}

GridMAP.prototype.getCellAtMouse = function(x, y) {

    if(!this.grid)
        return;

    let resolution = this.resolution * this.zoom;
    let start_x = this.canvas.width / 2 - this.grid.length * resolution / 2;
    let start_y = this.canvas.height / 2 - this.grid[0].length * resolution / 2;

    //console.log((x - start_x) / resolution, (y - start_y) / resolution)

    let x_map = Math.floor((x - start_x) / resolution);
    let y_map = Math.floor((y - start_y) / resolution);



    if(x_map === -1)
        x_map = 0;

    //console.log(x_map, y_map)

    if(this.grid && x_map < this.grid[0].length
        && y_map < this.grid.length
        && x_map >= 0 && y_map >= 0) {
        //console.log(this.hover_cell);
        return { x: x_map, y: y_map };
    }

    return null;
}

GridMAP.prototype.constructor = GridMAP;