var IMAGE_LIST=[ 
	{
		id : 'background',
		url : 'images/background.png'
	},
	{
		id: 'player1',
		url: 'images/player1.png'
	},
	{
		id: 'player2',
		url: 'images/player2.png'
	},
	{
		id: 'player3',
		url: 'images/player3.png'
	},
	{
		id: 'loading',
		url: 'images/loading.gif'
	}
];

//初始化
var jf = jsFilm({
	container:'film',
	mode: 'dom',
	imagesList: IMAGE_LIST,
	onstart: function() {
		console.log('loading');
	},
	onready: function() {
		console.log('onready');
		main();
	}
});

function main() {

	var bgSprite = jf.Sprite( 'background' );

	var stage = jf.Stage().width( bgSprite.width() ).height( bgSprite.height() );
	var bgLayer = jf.Layer().width( bgSprite.width() ).height( bgSprite.height() );

	bgLayer.add( bgSprite );
	stage.add( bgLayer );

	var player = jf.Sprite( 'player1' ,{ width:68, height: 68, x:650, y:410 } );
	bgLayer.add( player );

	player.do(function() {
		intervalChangeFace( this.container, ['player2','player3','player1'], 100);
	});
	
	bgSprite.moveTo( -11100, 0, 3);

	// jf.speed(10);

	jf.play();


	//动画开始
	// jf.speed(1)
	// 	.timeline({
	// 		1: function() {
	// 			player.do(function() {
	// 				intervalChangeFace( this.container, ['player2','player3','player1'], 100);
	// 			});
	// 		},
	// 		2000: function(){
	// 			bgSprite.moveTo( -11100, 0, 3);
	// 		}
	// 	});

// main 函数结束的最后一个括号
}







function getImageUrlById( id ) {
	for( var i = 0, l = IMAGE_LIST.length; i < l; i += 1 ) {
		if( IMAGE_LIST[i].id === id ) {
			return IMAGE_LIST[i].url;
		}
	}
}

function changeFace( container, id ) {
	var url = getImageUrlById(id);
	container.style['background-image'] = 'url("'+ url +'")';
}

function intervalChangeFace( container, imagesIdList, interval) {
	var l = imagesIdList.length;
	var num = 0;
	return setInterval(function(){
		num += 1;
		if( num > l ) {
			num = 1;
		}
		changeFace( container, imagesIdList[num -1]);
	}, interval);
}
