function GridMAP(canvas) {
	// Canvas:
    this.canvas     = canvas;
    this.context    = canvas.getContext("2d");

    // Grid map:
    this.grid       = null;
	this.resolution = 10;
    this.no_cells   = null;
    this.max_range  = null;

    // Robot:
    this.robot_poses = [];

    // UI:
    this.zoom = 2;
    this.hover_cell = null;

    // A* data:
    this.start = null;
    this.end   = null;

    //this.draw();
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

GridMAP.prototype.resize = function() {
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
    }
    
    window.requestAnimationFrame(this.draw);
}

GridMAP.prototype.update = function(map_data, new_pose) {

    if(!this.grid)
        return;

    // Atualiza o tamanho da matriz:
    this.resize();
    
    // Obtem a posicao atual do robo:
    this.robot_poses.push(new_pose);

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
        console.log(new_data)
        console.log(y);
        console.log(this.grid.length)
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

    console.log(this.grid)

    //this.draw();
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

    let x_map = Math.floor((x - start_x) / resolution);
    let y_map = Math.floor((y - start_y) / resolution);

    if(this.grid && x_map < this.grid[0].length
        && y_map < this.grid.length
        && x_map >= 0 && y_map >= 0) {
        console.log(this.hover_cell);
        return { x: x_map, y: y_map };
    }

    return null;
}

GridMAP.prototype.constructor = GridMAP;