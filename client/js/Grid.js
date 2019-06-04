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
    this.robot_poses = [{x: 1, y: 3}];
    this.isRoutingForRobot = false;

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

    /*this.initialize({
        map_size: [ 40, 40 ],
        robot_pose: { x: 20, y: 20, orientation: 0 },
        map_data:
            [ [ 24, 20, false, -90 ],
              [ 13, 20, true, 90 ],
              [ 20, 38, true, 0 ] ],
        command: 'robot_socket',
        resolution: 10,
        max_range: 400,
        map_resize: [0, 0, 0, 0]
    });*/
    //this.update([[24,20,false,-90],[13,20,true,90],[20,38,true,0]], {"x":20,"y":20,"orientation":0})
    //this.resize([3, 1, 0, 0])
    //this.draw()
}


GridMAP.prototype.constructor = GridMAP;

GridMAP.prototype.draw = function() {
    /* Renderiza a matriz atual no canvas.
     * Se nao existir nenhuma matriz, enche a tela com quadriculados.
     * Se existir uma matriz, preenche cada celula de acordo com a probabilidade,
     * de ocupacao da celula.
     */
    if(!this.context)
        return;

    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.strokeStyle = "rgba(51, 51, 51, 0.3)";
    this.context.lineWidth = 1;

    // Preenche o canvas com uma matriz vazia se nao existir dados:
    if(!this.grid) {
	    for(let i = 0; i < this.canvas.height; i += this.resolution * this.zoom)
	    	for(let j = 0; j < this.canvas.width; j += this.resolution * this.zoom)
	    		this.context.strokeRect(j, i, this.resolution * this.zoom, this.resolution * this.zoom);
    }
    // Desenha o mapa:
    else {
        let rows = this.grid[0].length;
        let columns = this.grid.length;
        let resolution = this.resolution * this.zoom;
        let start_x = this.canvas.width / 2 - rows * resolution / 2;
        let start_y = this.canvas.height / 2 - columns * resolution / 2;

        for(let i = 0; i < this.grid.length; i++) {
            for(let j = 0; j < this.grid[i].length; j++) {
                // Celula selecionada:
                if(this.getHoverCell(i, j))
                    this.context.fillStyle = 'rgba(0, 0, 0, 0.6)';
                // Celula ocupada:
                else if(this.grid[i][j] > 0.5)
                    this.context.fillStyle = '#333333';
                // Celula livre:
                else if(this.grid[i][j] < 0.5)
                    this.context.fillStyle = '#FFFFFF';
                // Celula desconhecida:
                else
                    this.context.fillStyle = '#D3D3D3';

                // Desenha a celula atual:
                this.context.fillRect(j * resolution + start_x, i * resolution + start_y, resolution, resolution);
                this.context.strokeRect(j * resolution + start_x, i * resolution + start_y, resolution, resolution);
            }
        }

        // Desenha a posicao inicial:
        let current_pos = this.getCurrentPose();
        this.context.fillStyle = 'red';
        if(current_pos) {
            this.context.beginPath();
            this.context.arc(current_pos.x * resolution + start_x + resolution * 0.5, current_pos.y * resolution + start_y + resolution * 0.5, resolution / 4, 0, 2 * Math.PI);
            this.context.fill();
        }

        // Desenha as rotas:
        this.drawPathResult();
    }
}

GridMAP.prototype.drawPathResult = function() {
    let rows = this.grid[0].length;
    let columns = this.grid.length;
    let resolution = this.resolution * this.zoom;
    let start_x = this.canvas.width / 2 - rows * resolution / 2;
    let start_y = this.canvas.height / 2 - columns * resolution / 2;
    this.context.fillStyle = '#60d3ff';
    this.context.strokeStyle = "rgb(150,150,150)";
    this.context.lineWidth = 1;
    if(this.expanded) { 
        for(let i = 0; i < this.expanded.length; i++) {
            for(let j = 0; j < this.expanded[0].length; j++) {
                if(this.expanded[i][j] > -1) {
                    this.context.fillRect(j * resolution + start_x, i * resolution + start_y, resolution, resolution);
                    this.context.strokeRect(j * resolution + start_x, i * resolution + start_y, resolution, resolution);
                }
            }
        }
    }
    if(this.start) {
        this.context.fillStyle = '#ffaf30';
        this.context.fillRect(this.start.y * resolution + start_x, this.start.x * resolution + start_y, resolution, resolution);
    }
    if(this.end) {
        this.context.fillStyle = '#ffaf30';
        this.context.fillRect(this.end.y * resolution + start_x, this.end.x * resolution + start_y, resolution, resolution);
    }
    if(this.path) {
        this.context.strokeStyle = 'rgb(255, 30, 30)';
        this.context.lineWidth = 4 * this.zoom;
        this.context.beginPath();
        this.context.moveTo(this.path[0][1] * resolution + start_x + resolution * 0.5, this.path[0][0] * resolution + start_y + resolution * 0.5);
        for(let i = 1; i < this.path.length; i++) {
            this.context.lineTo(this.path[i][1] * resolution + start_x + resolution * 0.5, this.path[i][0] * resolution + start_y + resolution * 0.5);
        }
        this.context.stroke();
    }
}


/*
 *  MAPEAMENTO
 */
 GridMAP.prototype.initialize = function(data) {
    /* Cria a matriz inicial de acordo com
     * os dados recebidos.
     * A matriz inicial leva em consideracao
     * a posicao inicial do robo e o alcance dos sensores.
     */
    this.robot_poses.push(data.robot_pose);
    this.resolution = data.resolution;
    this.max_range  = data.max_range;
    this.no_cells   = Math.ceil(this.max_range / this.resolution);
    
    this.grid = [];
    for(let i = 0; i < data.map_size[0]; i++) {
        this.grid[i] = [];
        for(let j = 0; j < data.map_size[1]; j++) {
            this.grid[i][j] = 0.5;
        }
    }

    // Atualiza o mapa:
    this.update(data);
    this.draw();
}

GridMAP.prototype.update = function(data) {
    /* Atualiza a probabilidade das celulas da matriz com novos dados.
     * Adiciona a posicao atual do veiculo a array de posicoes.
     */
    if(!this.grid)
        return;

    // Ajusta o tamanho da matriz:
    this.resize(data.map_resize);
    
    // Obtem a posicao atual do robo:
    let new_pose = data.robot_pose;
    this.robot_poses.push(new_pose);

    this.grid[new_pose.y][new_pose.x] = (this.grid[new_pose.y][new_pose.x] + 0) / 2;

    // Atualiza o estado do mapa:
    data.map_data.forEach((data, index) => {
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
        x -= Math.floor(Math.cos(orientation));
        y += Math.floor(Math.sin(orientation));
        while((x != new_pose.x) || (y != new_pose.y)) {
            this.grid[y][x] = (0 + this.grid[y][x]) / 2;
            x -= Math.floor(Math.cos(orientation));
            y += Math.floor(Math.sin(orientation));
        }
    });

    this.draw();
}


/*
 *  PLANEJAMENTO DE ROTAS
 */
GridMAP.prototype.search = function(method) {
    /* Algoritmo de busca generico.
     * Altera o modo de manipulacao da lista de acordo com
     * o metodo passado. Por exemplo, retirar sempre o primeiro
     * nodo para examinar, ou retirar sempre o nodo com menor custo.
     */

    // Limpa a rota anterior:
    this.path = null;
    this.expanded = null;

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
    let heuristic = this.createDistanceMatrix(this.end);
    console.log(heuristic)

    // Marca a posicao inicial como visitada:
    closed[this.start.x][this.start.y] = 1;

    // Cria uma lista de posicoes a serem visitadas:
    let x = this.start.x;
    let y = this.start.y;
    let g = 0;
    let h = heuristic[x][y];
    let f = g + h;

    // A tupla utilizada pelo algoritmo A*
    // possui o valor da heuristica e da funcao
    // f = g + h:
    let open;
    if(method === 'A*')
        open = [[f, g, h, x, y]];
    else
        open = [[g, x, y]];

    // Inicia a busca.
    // Se estiver mapeando para o robo
    // nao exibe a animacao:
    let counter = 0;    
    if(this.isRoutingForRobot)
        this.findPath(open, closed, action, counter, heuristic, method);
    else
        this.findPathAnimated(open, closed, action, counter, heuristic, method);
}

GridMAP.prototype.findPath = function(open, closed, action, counter, heuristic, method) {
    let found = false;

    while(!found) {
        // Se nao houver uma posicao para expandir, nao existe solucao:
        if(open.length === 0) {
            this.start = null;
            this.end   = null;
            this.expanded = null;
            return false;
        }
        
        // Ordena os elementos pelo valor de 'g':
        let next = null;
        if(method === 'A*' || method === 'Greedy') {
            open.sort((a, b) => {
                if (a[0] < b[0]) return -1;
                if (a[0] > b[0]) return 1;
                return 0;
            });
            next = open.shift();
        } 
        else if(method === 'Breadth-First')
            next = open.shift();
        else if(method === 'Depth-First')
            next = open.pop();

        // O formato da tupla e diferente
        // para o A*, que precisa do valor da
        // heurista acrescido do valor de 'g':
        if(method === 'A*') {
            g = next[2];
            x = next[3];
            y = next[4];
        } else {
            g = next[0];
            x = next[1];
            y = next[2];
        }

        // Checa se a posicao atual e a posicao-alvo.
        // Se for o algoritmo de busca termina.
        // O caminho pode ser tracado ao avaliar a acao
        // tomada em cada celula:
        if(x === this.end.x && y === this.end.y) {
            return this.createPath(action);
        }
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
                        // Formata a tupla de acordo com o tipo de algoritmo:
                        if(method === 'A*') {
                            let h2 = g2 + heuristic[x2][y2];
                            let f2 = g2 + h2;
                            open.push([f2, g2, h2, x2, y2]);
                        }
                        else{
                            open.push([g2, x2, y2]);
                        }
                        closed[x2][y2] = 1;
                        action[x2][y2] = index;
                    }
                }
            });
        }
    }
}

GridMAP.prototype.findPathAnimated = function(open, closed, action, counter, heuristic, method) {
    let _this = this;

    setTimeout(function() {
        // Se nao houver uma posicao para expandir, nao existe solucao:
        if(open.length === 0) {
            _this.start = null;
            _this.end   = null;
            _this.expanded = null;
            return false;
        }
        
        // Ordena os elementos pelo valor de 'g':
        let next = null;
        if(method === 'A*' || method === 'Greedy') {
            open.sort((a, b) => {
                if (a[0] < b[0]) return -1;
                if (a[0] > b[0]) return 1;
                return 0;
            });
            next = open.shift();
        } 
        else if(method === 'Breadth-First')
            next = open.shift();
        else if(method === 'Depth-First')
            next = open.pop();

        if(method === 'A*') {
            g = next[2];
            x = next[3];
            y = next[4];
        } else {
            g = next[0];
            x = next[1];
            y = next[2];
        }

        // Checa se a posicao atual e a posicao-alvo:
        // Checa se a posicao atual e a posicao-alvo:
        if(x === _this.end.x && y === _this.end.y) {
            return _this.createPath(action);
        }
        else {
            // Atualiza a matriz de expansoes:
            _this.expanded[x][y] = counter;
            counter += 1;

            // Expande a posicao atual:
            _this.moves.forEach((move, index) => {
                let x2 = x + move[0];
                let y2 = y + move[1];

                // Checa se a posicao expandida e valida:
                if(x2 >= 0 && x2 < _this.grid.length &&
                    y2 >= 0 && y2 < _this.grid[0].length) {
                    // Checa se a posicao expandida ainda nao foi checada:
                    if(closed[x2][y2] === 0 && _this.grid[x2][y2] < 0.5) {
                        let g2 = g + 1;

                        if(method === 'A*') {
                            let h2 = g2 + heuristic[x2][y2];
                            let f2 = g2 + h2;
                            open.push([f2, g2, h2, x2, y2]);
                        }
                        else{
                            open.push([g2, x2, y2]);
                        }

                        closed[x2][y2] = 1;
                        action[x2][y2] = index;
                    }
                }
            });

            _this.drawPathResult();
            _this.findPathAnimated(open, closed, action, counter, heuristic, method)
        }
    }, 10);
}

GridMAP.prototype.createPath = function(actions) {
    /* Calcula a rota atraves das acoes tomadas durante
     * o algoritmo de busca. Retorna a rota e atualiza o caminho
     * 'this.path' para ser acessado posteriormente.
     */

    // Cria o caminho:
    let x = this.end.x;
    let y = this.end.y;
    this.path = [[x, y]];
    while((x !== this.start.x) || (y !== this.start.y)) {
        let x2 = x - this.moves[actions[x][y]][0];
        let y2 = y - this.moves[actions[x][y]][1];
        this.path.unshift([x2, y2]);
        x = x2;
        y = y2;
    }

    // Adiciona a posicao inicial:
    this.path.unshift([this.start.x, this.start.y]);
    this.drawPathResult();

    // Reseta variaveis utilizadas para criacao do caminho:
    this.start = null;
    this.end   = null;

    return this.path;
}

GridMAP.prototype.goTo = function(cell) {
    /* Cria uma rota para que o veiculo va ate a celula 'cell'.
     * Utiliza o algoritmo de busca A* por padrao.
     */

    // Utiliza a posicao atual do robo como inicio:
    let robotPose = this.getCurrentPose();
    if(!robotPose || !this.isOpen({x: cell.y, y: cell.x}))
        return;

    this.start = {x: robotPose.y, y: robotPose.x};

    // Utiliza a posicao do mouse como celula-alvo:
    this.end = {x: cell.y, y: cell.x};

    // Chama o algoritmo de roteamento:
    this.search('A*');

    this.draw();
}


/*
 *  AJUSTE DO TAMANHO DA MATRIZ
 */
GridMAP.prototype.resize = function(size_adjustment) {

    // Adiciona linhas no inicio da matriz:
    let new_lines = size_adjustment[1];
    for(let i = 0; i < new_lines; i++) {
        new_row = [];
        for(let j = 0; j < this.grid[0].length; j++)
            new_row[j] = 0.5;
        this.grid.unshift(new_row);
    }

    let new_columns = size_adjustment[0];
    this.grid.forEach((row, index) => {
        for(let i = 0; i < new_columns; i++) {
            row.unshift(0.5);
        }
    });

    // Adiciona linhas no fim da matriz:
    new_lines = size_adjustment[3];
    console.log('new lines: ', new_lines)
    for(let i = 0; i < new_lines; i++) {
        new_row = [];
        for(let j = 0; j < this.grid[i].length; j++)
            new_row[j] = 0.5;
        this.grid.push(new_row);
    }

    // Adiciona colunas no fim da matriz:
    new_columns = size_adjustment[2];
    this.grid.forEach((row, index) => {
        for(let i = 0; i < new_columns; i++)
            row[row.length] = 0.5;
    });

    /*if(this.robot_poses.length === 0)
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
    new_lines   *= -1;*/
    this.correctRobotPoses({ new_columns: size_adjustment[0], new_lines: size_adjustment[1] });
}

GridMAP.prototype.correctRobotPoses = function(offset) {
    this.robot_poses.forEach((pose, index) => {
        pose.x += offset.new_columns;
        pose.y += offset.new_lines;
    });
}

GridMAP.prototype.getCurrentPose = function() {
    /* Retorna a posicao atual do veiculo.
     * Se nao houver nenhuma posicao retorna nulo.
     */
	if(this.robot_poses.length > 0)
        return this.robot_poses[this.robot_poses.length - 1];
    return null;
}



/*
 *  METODOS AUXILIARES
 */
GridMAP.prototype.setZoom = function(delta) {
    /* Atualiza o zoom do mapa.
     * Delta assume os valores -100 ou 100,
     * de acordo com o movimento da roda do mouse.
     */
    this.zoom = this.zoom * Math.pow(1.2, delta / 100);
}

GridMAP.prototype.isOpen = function(cell) {
    /* Retorna 'true' se a celula estiver livre. */
    if(!this.grid)
        return false;

    if(this.grid[cell.x][cell.y] < 0.5)
        return true;
    return false;
}

GridMAP.prototype.isHovering = function(x, y) {
    /* Determina se o mouse esta sobre uma celula.
     * 'this.hover_cell' e usado para desenhar o efeito de hover.
     */
    this.hover_cell = this.getCellAtMouse(x, y);
}

GridMAP.prototype.getHoverCell = function(i, j) {
    /* Informa se o mouse esta sobre a celula com indices 'i' e 'j'*/
    if(!this.hover_cell)
        return false;
    else if(this.hover_cell.x === j && this.hover_cell.y === i)
        return true;
    return false;
}

GridMAP.prototype.fillCell = function(x, y, edit) {
    /* Edita uma celula do mapa. */
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
    /* Verifica se a matriz tem alguma celula
     * com probabilidade diferente de 0.5.
     */
    if(!this.grid)
        return false;

    for(let i = 0; i < this.grid.length; i++)
        for(let j = 0; j < this.grid[i].length; j++)
            if(this.grid[i][j] !== 0.5)
                return true;

    return false;
}

GridMAP.prototype.getCellAtMouse = function(x, y) {
    /* Calcula qual celula do mapa pertence a posicao x, y. */
    if(!this.grid)
        return;

    let resolution = this.resolution * this.zoom;
    let start_x    = this.canvas.width / 2 - this.grid[0].length * resolution / 2;
    let start_y    = this.canvas.height / 2 - this.grid.length * resolution / 2;

    let x_map = Math.floor((x - start_x) / resolution);
    let y_map = Math.floor((y - start_y) / resolution);

    if(this.grid && x_map < this.grid[0].length
        && y_map < this.grid.length
        && x_map >= 0 && y_map >= 0) {
        return { x: x_map, y: y_map };
    }

    // Celula esta fora da grid:
    return null;
}

GridMAP.prototype.createDistanceMatrix = function(cell) {
    /* Cria uma matriz de distancia entre a posicao 
     * fornecida e cada celula da matriz.
     * Esta matriz e utilizada como heuristica para
     * o algoritmo de busca A*.
     */
    let matrix = [];
    for(let i = 0; i < this.grid.length; i++) {
        matrix[i] = [];
        for(let j = 0; j < this.grid[0].length; j++)
            matrix[i][j] = Math.abs(cell.x - i) + Math.abs(cell.y - j);
    }
    return matrix;
}


/*
 *  METODOS DE BUSCA SEPARADOS
 *  Substituidos por search(method).
*/
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

GridMAP.prototype.depthSearch = function() {
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

        let next = open.pop();
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

GridMAP.prototype.breadthSearch = function() {
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

        let next = open.shift();
        g = next[0];
        x = next[1];
        y = next[2];

        // Atualiza a matriz de expansoes:
        this.expanded[x][y] = counter;
        counter += 1;

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

GridMAP.prototype.constructor = GridMAP;