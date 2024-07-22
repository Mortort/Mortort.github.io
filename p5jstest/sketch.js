function setup() {
    createCanvas(windowWidth, windowHeight);
    s = new snake;
    s.newdir();
    s.grow();
    s.update();
    a = new apple;
    a.eat();

    // Detect if the device is mobile
    isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
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

    this.newdir = function(){
        this.x = this.xPositions[0];
        this.y = this.yPositions[0];

        // Calculate the direction vector from the current position to the mouse position
        this.dx = mouseX - this.x;
        this.dy = mouseY - this.y;

        // Calculate the distance to the mouse
        let distance = sqrt(this.dx * this.dx + this.dy * this.dy);

        // Normalize the direction vector and scale by the desired speed
        let speed = this.speed;
        if (distance > 0) { // Prevent division by zero
            this.dx = (this.dx / distance) * speed;
            this.dy = (this.dy / distance) * speed;
        }
    }
    this.grow = function() {
        this.x = this.xPositions[0];
        this.y = this.yPositions[0];

        // Update positions
        this.xPositions.unshift(this.x + this.dx);
        this.yPositions.unshift(this.y + this.dy);
}

    this.update = function(){
        this.xPositions.pop();
        this.yPositions.pop();
    }

}

function apple(){
    this.x;
    this.y;

    this.eat = function(){
        this.x = random(10,windowWidth-10);
        this.y = random(10,windowHeight-10)
    }
    this.draw = function(){
        fill(color(255,0,0));
        circle(this.x,this.y,25);
    }
}

function draw() {
    background(220);
    if(isMobile){
        if(mouseIsPressed){
            s.newdir();
        }   
    } else {
        s.newdir();
    }
    s.grow();
    s.update();
    s.draw();
    a.draw();
    if(dist(s.x, s.y, a.x, a.y)<25){
        a.eat();
        for(let i = 0; i<5; i++){
            s.grow();
        }
    }
}