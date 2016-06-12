var canvas, ctx, width, height,
frames = 0, score = 0, best = 0,
currentState, 
states = {
	Splash: 0, Game: 1, Score: 2
},
fgpos=0, 
okbtn,
gap_slider,

bird = {
	x:59,
	y:0,
	frame: 0,
	velocity: 0,
	animation: [0,1,2,1],
	rotation: 0,
	radius: 5,
	gravity: 0.25,
	_jump: 4.6,	

	jump: function(){
		this.velocity = -this._jump;			
	},

	update: function() {
		var n = currentState === states.Splash ? 10 : 5;
		this.frame += !(frames % n) ? 1 : 0; //add 1 to frame every n frames
		this.frame %= this.animation.length;

		if (currentState === states.Splash){
			this.y = height - 280 + 5*Math.cos(frames/10);
			this.rotation = 0;
		}else{
			this.velocity += this.gravity;
			this.y += this.velocity;
			if (this.y >= height-s_fg.height-10){
				this.y = height-s_fg.height-10;
				if (currentState===states.Game){
					currentState = states.Score;
				}
				this.velocity = this._jump;						
			}

			if (this.velocity >= this._jump){
				this.frame = 1;
				this.rotation = Math.min(Math.PI/2,this.rotation+0.2);
			}else{
				this.rotation = -0.3;
			}
		}
	},

	draw: function(ctx){
		ctx.save();
		ctx.translate(this.x,this.y);
		ctx.rotate(this.rotation);		

		var n = this.animation[this.frame];		
		//To make bird rotate on center
		s_bird[n].draw(ctx, -s_bird[n].width/2, -s_bird[n].height/2);
		ctx.restore();
		
	}
}, 
pipes = { 

	_pipes: [],	
	gapsize: 80,		

	reset: function(){
		this._pipes = [];				
	},

	update: function() {
		if (frames % 100 === 0){
			var _y = height - (s_pipeSouth.height+s_fg.height+120+200*Math.random());
			this._pipes.push({
				x: 500,
				y: _y,
				width: s_pipeSouth.width,
				height: s_pipeSouth.height
			})
		}					

		for (var i=0, len = this._pipes.length; i<len; i++){
			var p = this._pipes[i];

			if (i===0){		

				score += p.x===bird.x ? 1:0;			

				var cx = Math.min(Math.max(bird.x, p.x),p.x+p.width); //closest x						
				var cy1 = Math.min(Math.max(bird.y,p.y),p.y+p.height); //South
				var cy2 = Math.min(Math.max(bird.y,p.y+p.height+this.gapsize),p.y+2*p.height+this.gapsize); //North

				var dx = bird.x - cx;
				var dy1 = bird.y - cy1;
				var dy2 = bird.y - cy2;

				var d1 = dx*dx + dy1*dy1;
				var d2 = dx*dx + dy2*dy2;

				var r = bird.radius*bird.radius;

				if (r>d1 || r>d2){													
					currentState = states.Score;							
				}
			}

			p.x -=3;
			if (p.x <-50){
				this._pipes.splice(i,1);
				i--; len--;
			}
		}
		
	},
	draw: function(ctx){
		for (var i=0, len = this._pipes.length; i<len; i++){
			var p = this._pipes[i];
			s_pipeSouth.draw(ctx,p.x,p.y);					
			s_pipeNorth.draw(ctx,p.x,p.y+this.gapsize+p.height)
		}
	}
};
function onpress(evt){
	switch (currentState){
		case states.Splash:
			currentState = states.Game;
			bird.jump();
			break;
		case states.Game: 
			bird.jump();
			break;
		case states.Score:	
			var mx = evt.offsetX, my = evt.offsetY;

			if (mx==null || my==null){
				mx = evt.touches[0].clientX;
				my = evt.touches[0].clientY;
			}

			if (mx>okbtn.x && mx<okbtn.x+okbtn.width && my>okbtn.y && my<okbtn.y+okbtn.height){
				pipes.reset();
				currentState = states.Splash;						
				score = 0;
			}
			break;
	}
}
function main(){	

	canvas = document.getElementById('canvas');

	width = window.innerWidth;
	height = window.innerHeight;			

	var evt = "touchstart";
	if (width >= 500){
		width = 320;
		height = 480;
		canvas.style.border = "1px solid black";
		evt = "mousedown"				
	}	
 	
	canvas.addEventListener(evt, onpress);

	canvas.width = width;
	canvas.height = height;
	ctx = canvas.getContext('2d');

	currentState = states.Splash;

	gap_slider = document.getElementById('pipesize');
	gap_slider.style['margin-top'] = (height-80)+"px";
	gap_slider.style['margin-left'] = (width/2-100)+"px";

	//width/2-30,height-65

	var img = new Image();
	img.onload = function(){				
		initSprites(this);	
		var gapimg = new Image();
		gapimg.src = "res/gap_s.png";
		s_text["gap"] = new Sprite(gapimg,0,0,50,60);

		okbtn = {
			x: (width-s_buttons.Ok.width)/2,
			y: height - 200,
			width: s_buttons.Ok.width,
			height: s_buttons.Ok.height
		}

		run();
	}
	img.src = "res/sheet.png";
}

function run(){
	var loop = function(){
		update();
		render();
		window.requestAnimationFrame(loop,canvas);
	}

	window.requestAnimationFrame(loop,canvas);
}

function update(){			
	frames++;
	if (currentState !== states.Score){
		fgpos = (fgpos-3)%(2*s_fg.width-width);
	}else best = Math.max(best,score);

	if (currentState === states.Game){
		pipes.update();
	}
	else if (currentState === states.Splash){		
		pipes.gapsize = parseInt(gap_slider.value);
	}

	bird.update();			
}

function render(){	
	ctx.fillStyle = s_bg.color;	
	ctx.fillRect(0,0,width,height);

	s_bg.draw(ctx,0,height-s_bg.height);
	s_bg.draw(ctx,s_bg.width,height-s_bg.height);
	
	pipes.draw(ctx);
	bird.draw(ctx);	
	
	s_fg.draw(ctx,fgpos,height-s_fg.height);
	s_fg.draw(ctx,fgpos+s_fg.width,height-s_fg.height);					

	if (currentState === states.Splash){
		s_splash.draw(ctx,width/2-s_splash.width/2,height-300);
		var text = s_text.GetReady;
		text.draw(ctx,width/2-text.width/2,height-380);
		gap_slider.className = "";
		s_text.gap.draw(ctx,width/2-30,height-65);
	}			

	else if (currentState === states.Score){					
		s_text.GameOver.draw(ctx, width/2 - s_text.GameOver.width/2, height-400);
		s_score.draw(ctx, width/2-s_score.width/2, height-340);
		s_numberS.draw(ctx,width/2-47,height-304,score,null,10);
		s_numberS.draw(ctx,width/2-47,height-262,best,null,10);

		s_buttons.Ok.draw(ctx, okbtn.x, okbtn.y);		
	} else{
		gap_slider.className = "hide";	
		s_numberB.draw(ctx,null,20,score,width/2,null);
	}
}

main();