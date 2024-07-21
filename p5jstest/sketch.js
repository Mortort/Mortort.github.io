function setup() {
    createCanvas(windowWidth, windowHeight);
    s = new snake;
    s.grow();
    s.update();
}

function snake() {
    this.x = 100;
    this.y = 100;
    this.speed = 5;
    this.xPositions = [100];
    this.yPositions = [100];
    this.color = color(20,240,40);

    this.draw = function(){
        for(let i = 0; i <= this.xPositions.length; i++){
            noStroke();
            fill(this.color);
            circle(this.xPositions[i],this.yPositions[i], 25);
        }
    }

    this.grow = function() {
        this.x = this.xPositions[0];
        this.y = this.yPositions[0];

        // Calculate the direction vector from the current position to the mouse position
        let dx = mouseX - this.x;
        let dy = mouseY - this.y;

        // Calculate the distance to the mouse
        let distance = sqrt(dx * dx + dy * dy);

        // Normalize the direction vector and scale by the desired speed
        let speed = this.speed;
        if (distance > 0) { // Prevent division by zero
            dx = (dx / distance) * speed;
            dy = (dy / distance) * speed;
        }

        // Update positions
        this.xPositions.unshift(this.x + dx);
        this.yPositions.unshift(this.y + dy);
}

    this.update = function(){
        this.xPositions.pop();
        this.yPositions.pop();
    }

}

function draw() {
    background(220);
    s.grow();
    s.update();
    s.draw();
    if(mouseIsPressed){
        s.grow();
    }
}