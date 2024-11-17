//elementi igre: - veličine skalirane prema veličini ekrana - refresh to resize
var ball;
var racket;
const brick_count = 20; //broj cigli
var bricks = [brick_count];

//parametri igre
var game_width = document.documentElement.clientWidth * 1 -2*20;
var game_height = document.documentElement.clientHeight * 1 -1*20-5;
const racket_speed = game_height*0.02;
const ball_speed = game_height*0.012; //konstantna brzina
var ball_angle = Math.floor(Math.random() * (179 - 1 + 1) + 1)  //pod slučajnim kutem
var ball_speed_x = ball_speed * Math.cos(ball_angle);
var ball_speed_y = Math.abs(ball_speed * Math.sin(ball_angle));

var score = 0;
var highscore = 0;
var game_over = false;
var key = '';

//područje igre - canvas
var gameArea = {
  canvas: document.createElement("canvas"),
  start: function(){
    this.canvas.id = "GameCanvas";
    this.canvas.width = game_width; //prekriva cijeli prozor
    this.canvas.height = game_height;
    this.context = this.canvas.getContext("2d")
    document.body.insertBefore(this.canvas , document.body.childNodes[0])
    this.frameNo = 0
    this.interval = setInterval(updateGameArea , 16.7)  //refresh rate 60fps
  },
  stop: function () {
    clearInterval(this.interval)  
  },
  clear: function () {
    this.context.clearRect(0 , 0 , this.canvas.width , this.canvas.height)
  }
}

//započinje odmah nakon učitavanja stranice
function startGame(){
  //loptica inicijalno na središtu palice
  ball = new ball(game_height*0.04, game_height*0.04, "black", game_width/2-game_height*0.04/2, game_height - (game_height*0.07+game_height*0.041))
  //palica crvene boje
  racket = new racket((game_width - (6*5))/5, game_height*0.05, "red", game_width/2-(game_width - (6*5))/10, game_height - game_height*0.07)
  //pozicije cigli(pravokutnici)
  for(var i = 0; i < brick_count; i++){
    var x = (i % 5) * ((game_width - (6*5))/5 + 5) + 5;
    var y = Math.floor(i/5) * (game_height*0.05 + 5) + 5;
    bricks[i] = new brick((game_width - (6*5))/5, game_height*0.05, "orange", x, y)
  }
  if (typeof (Storage) !=="undefined") {
    if (!localStorage.getItem('highscore')){  //najbolji rezultat pohranjen koristeći local storage
      localStorage.setItem('highscore', 0)
      highscore = localStorage.getItem('highscore')
      console.log(highscore)
    } else {
      highscore = localStorage.getItem('highscore')
      console.log(highscore)
    }
  } else {
    console.log("not supported")
  }
  gameArea.start()
}

//loptica
function ball( width , height , color , x , y ) {
  this.width = width
  this.height = height
  this.speed_x = ball_speed_x;
  this.speed_y = -1 * ball_speed_y ;
  this.x = x
  this.y = y ;
  this.update = function () {
    ctx = gameArea.context;
    ctx.save();
    ctx.translate(this.x , this.y);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, this.width , this.height)
    ctx.restore();
  }
  this.newPos = function () {
    //kolizija sa zidovima -> promjena smjera
    if (this.x < 0)
      this.speed_x = -this.speed_x
    else if ((this.x + this.width ) >= game_width)
      this.speed_x = -this.speed_x
    if (this.y < 0)
      this.speed_y = -this.speed_y
    else if ((this.y + this.height ) >= game_height)
      // this.speed_y = -this.speed_y
      game_over = true; //kraj igre ako pređe donji rub

    //kolizija sa palicom -> promjena smjera
    var collis = collision(ball, racket, false)    
    if(collis != null){
      if(collis == 'y'){
          this.speed_y = -this.speed_y;
      }
      if(collis == 'x'){
        this.speed_x = -this.speed_x;
      }
    }

    //kolizija sa ciglama -> promjena smjera
    var changedDirection = false
    for(var i = 0 ; i < bricks.length; i++){
      var collis = collision(ball, bricks[i], true)  
      if(collis != null){
        bricks[i].removed = true
        console.log('removed')
        if(collis == 'y'){
          if(changedDirection==false){
            this.speed_y = -this.speed_y;
            changedDirection = true
          }
        }
        if(collis == 'x'){
          if(changedDirection==false){
            this.speed_x = -this.speed_x;
            changedDirection = true
          }
        }  
      }
    }
    bricks = bricks.filter(b => b.removed==false) //nakon sudara cigla nestaje
    //promjena smjera
    this.x += this.speed_x
    this.y += this.speed_y
  }
}

//palica
function racket( width , height , color , x , y ) {
  this.width = width
  this.height = height;
  this.speed_x = racket_speed;
  this.x = x;
  this.y = y;
  this.update = function () {
    ctx = gameArea.context;
    ctx.save();
    ctx.shadowColor = "black";
    ctx.shadowBlur = 10;  //sjenčanje ruba
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 5;
    ctx.translate(this.x , this.y);
    ctx.fillStyle = color;
    ctx.fillRect(0 , 0 , this.width , this.height)  //pravokutnik crvene boje
    ctx.restore();
  }
  this.newPos = function () {
    if(key == 'left') {  //pritisnuta strelica lijevo
      if((this.x < 0)) {
        this.speed_x = 0;
      } else {
        this.speed_x = -racket_speed;
      }
    } else if(key == 'right') {  //pritisnuta strelica desno
      if(this.x + this.width >= game_width){
        this.speed_x = 0;
      } else {
        this.speed_x = racket_speed;
      }
    } else {
      this.speed_x = 0;
    }
    this.x += this.speed_x;
  }
}

//cigla
function brick( width , height , color , x , y ) {
  this.removed = false
  this.width = width
  this.height = height
  this.x = x;
  this.y = y;
  this.update = function () {
    ctx = gameArea.context;
    ctx.save();
    ctx.shadowColor = "gray";
    ctx.shadowBlur = 10;  //sjenčanje ruba
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 5;
    ctx.translate(this.x , this.y);
    ctx.fillStyle = color;
    ctx.fillRect(0 , 0 , this.width , this.height);  //pravokutnik
    ctx.restore();
  }
}

//ažuriranje prikaza
function updateGameArea () {
  if(!game_over) {
    if(score==brick_count) {
      ctx = gameArea.context;
      ctx.font = "50px Arial"
      var txt = "YOU WON"
      var gradient = ctx.createLinearGradient(game_width/2, game_height/2 , ctx.measureText(txt).width, 50)
      gradient.addColorStop("0", "magenta")
      gradient.addColorStop("0.5", "blue")
      gradient.addColorStop("1.0", "red")
      ctx.fillStyle = gradient
      ctx.fillText(txt, game_width/2+ctx.measureText(txt).width/2, game_height/2) //centrirano pobjeda
    } else {
      gameArea.clear()
      ball.newPos()
      ball.update()
      console.log("(" + ball.speed_x + ", " + ball.speed_y + ")")
      // console.log("(" + ball.x + ", " + ball.y + ")")
      racket.newPos()
      racket.update()
      bricks.forEach(element => {
        element.update();
      });
      if(score > highscore) { //ažuriraj najbolji rezultat
        highscore = score
        localStorage.setItem('highscore', score)
      }
      ctx=gameArea.context
      ctx.font= "30px Arial"
      ctx.textAlign = "end" //poravnanje desno
      var txt_score = "SCORE: " + score + "/" + brick_count
      ctx.fillText(txt_score, game_width-10, 35)  //prikaz trenutnog broja bodova u gornjem desnom kutu
      var txt_highscore = "HIGHSCORE: " + highscore
      ctx.fillText(txt_highscore, game_width-10, 70)  //prikaz maksimalnog broja bodova u gornjem desnom kutu
    }
  }
  else{
    // game over
    if(score > highscore) { //novi najbolji rezultat
      localStorage.setItem('highscore', score)  // HTML5 Web Storage API localStorage
    }
    ctx = gameArea.context;
    ctx.font = "50px Arial"
    var txt = "GAME OVER"
    ctx.fillText(txt, game_width/2+ctx.measureText(txt).width/2, game_height/2) //kraj igre centrirano
  }
}

//korištenje tipkovnice
window.addEventListener('keydown', this.checkDown, false);
function checkDown(e) {
  var code = e.keyCode;
  if(code == 39){ //pritisnuta strelica desno
    key = 'right'
  }
  else if (code == 37){ //pritisnuta strelica lijevo
    key = 'left'
  }
  // console.log(key);
}

window.addEventListener('keyup', this.checkUp, false);
function checkUp(e) {
  key = ''
  // console.log('key up')
}

//kolizija sa ciglama ili palicom - dva pravokutnika
function collision(ball, box, count_score) {
  if(ball.x + ball.width >= box.x && // loptica desno sa pravokutnikom lijevo
    ball.x <= box.x+box.width &&  // loptica lijevo sa pravokutnikom desno
    ball.y + ball.height >= box.y && // loptica dolje sa pravokutnikom gore
    ball.y <= box.y + box.height ) // loptica gore sa pravokutnikom dolje
  { //ako postoji kolizija
    if(count_score){  //sudar sa ciglom -> broj bodova +1
      score++;
    }
    //sudar sa palicom
    if(!count_score && (ball.y+ball.height >= box.y+ball_speed_y)){
      console.log('x')
      return 'x';
    }
    //sudar sa ciglom
    if(count_score){   
      if(ball.speed_y>0 && ball.y+ball.height >= box.y+ball_speed_y){
        console.log('Bx+')
        return 'x';
      } else if (ball.speed_y<0 && ball.y <= box.y+box.height-ball_speed_y){
        console.log('Bx-')
        return 'x';
      } else {
        console.log('By')
        return 'y'}
    }
    console.log('Ry')
    return 'y';
  }
  //nema kolizije
  return null;
}