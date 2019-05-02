function GridMAP(grid, resolution, canvas) {
    this.grid       = grid;
    this.resolution = resolution;
    this.canvas     = canvas;
    this.context    = canvas.getContext("2d");

    this.start_x = 0;
    this.start_y = 0;
    this.zoom    = 2;

    this.draw();
}

GridMAP.prototype.draw = function() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if(this.grid) {
    	this.context.strokeStyle = "rgba(51, 51, 51, 0.3)";
	    this.context.lineWidth = 1;
	    
	    for(let i = this.start_x; i < this.canvas.height; i += this.resolution * this.zoom) {
	    	for(let j = this.start_y; j < this.canvas.width; j += this.resolution * this.zoom) {
	    		this.context.strokeRect(j, i, this.resolution * this.zoom, this.resolution * this.zoom);
	    	}
	    }
    }
    
}

GridMAP.prototype.update = function(data) {

}

GridMAP.prototype.setZoom = function(delta) {
    if(delta > 0)
        this.zoom++;
    else if(this.zoom > 1)
        this.zoom--;

    this.draw();
}

GridMAP.prototype.addXY = function(x, y) {
    this.start_x += x;
    this.start_y += y;
    this.draw();
}

GridMAP.prototype.constructor = GridMAP;