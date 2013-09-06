function jsFilm( options ) {

	/*******************************************
	*    全部参数
	*******************************************/
	G_options = {

		//容器，可以是id，element 或者 jquery选择的元素，但是只会取出第一个
		container: options.container || document.body,

		//模式选择 dom 或者 canvas
		mode: options.mode || 'canvas',

		//加载图片的资源，每个值中有 id 和 图片的 url ， 如： 
		// var IMAGE_LIST=[{
		//     id : "map",
		//     url : "images/baidu.gif"
		// }];
		imagesList: options.imagesList || [],

		//资源加载之前要做
		onstart: options.onstart,

		//资源加载完成
		onready: options.onready,

		//动画帧频，默认每秒60帧
		FPS: options.FPS || 60
	};

	/*******************************************
	*    全部变量
	********************************************/

	//对象
	//将会暴露出去的对象，上面绑定方法。
	var JF = {};
	//全局唯一的舞台，只能被生成一次
	var G_Stage;
	//全局的Sprite类
	var G_Sprite;
	//全部图层，按照 zIndex 索引
	var G_layerList = {};
	//加载的图片资源对象
	var G_loadImagesList = {};
	//全局获取id
	var G_idFlag = 0;
	//全局速度
	var G_speed = 1;
	//记录当前时间
	var G_timeNow = 0;
	//想要去的时间
	var G_timeEnd;
	//存储全局计时器
	var G_timer;
	//所有计时器的队列
	var G_timerList = [];
	//全局时间线
	var G_timelineList = {};
	//全局动画队列
	var G_animationList = [];

	/*******************************************
	*    基本方法
	********************************************/
	function createId() {
		G_idFlag += 1;
		return 'wangxiao' + new Date().getTime() + G_idFlag;
	}

	function getElement( container ) {
		if( typeof container === 'string' ) {
			container = document.getElementById( container );
		} else if( typeof container === 'object' ) {
			//判断是否是 jquery 对象
			if( container[0] ) {
				container = container[0];
			}
		}
		return container;
	}

	function changeStyle( element, name, value ) {
		if( window.jQuery ) {
			window.jQuery(element).css( name, value );
		} else if( window.$ ) {
			window.$(element).css( name, value );
		} else {
			element.style[ name ] = value;
		}
	}

	function createCanvas( opts ) {
		opts = opts || {};
		opts = {
			width: opts.width || 0,
			height: opts.height || 0,
			container: opts.container || null 
		};
		var canvas = document.createElement('canvas');
		canvas.setAttribute('width', opts.width );
		canvas.setAttribute('height', opts.height );
		if( opts.container ) {
			opts.container = getElement( opts.container );
			opts.container.appendChild(canvas);
		}
		return canvas;
	}
	
	function createDom( opts ) {
		opts = {
			id: opts.id,
			width: opts.width || 0,
			height: opts.height || 0,
			x: opts.x || 0,
			y: opts.y || 0,
			container: opts.container || null 
		};
		var element = document.createElement('div');
		if( opts.id ) {
			element.id = opts.id;
		}
		changeStyle( element, 'width', opts.width + 'px' );
		changeStyle( element, 'height', opts.height + 'px' );
		changeStyle( element, 'top', opts.y + 'px' );
		changeStyle( element, 'left', opts.x + 'px' );

		if( opts.container ) {
			opts.container = getElement( opts.container );
			opts.container.appendChild(element);
		}
		return element;
	}

	function delFromListById( id, list ) {
		for( var i = 0 , l = list.length ; i < l ; i += 1 ) {
			if( list[i].id === id ) {
				list.splice( i, 1 );
				return list;
			}
		}
	}

	function pauseAnimationById( id, list ) {
		for( var i = 0 , l = list.length ; i < l ; i += 1 ) {
			if( list[i].id === id ) {
				list[i].isPause = true;
			}
		}
		return list;
	}

	function playAnimationById( id, list ) {
		for( var i = 0 , l = list.length ; i < l ; i += 1 ) {
			if( list[i].id === id ) {
				list[i].isPause = false;
			}
		}
		return list;
	}

	//图片加载函数,  callback为当所有图片加载完毕后的回调函数。
	JF.loadImage = function( imagesList, callback ) {
		var images = {};
		var num = imagesList.length;
		var i = 0;
		setImage();
		function setImage(){
			if( i < num ){
				var img = imagesList[i];
				images[ img.id ] = new Image();		
				images[ img.id ].src = img.url;
				images[ img.id ].onload = images[ img.id ].onerror = function( event ){
					i += 1;
					setImage();
				};
			} else {
				if ( typeof callback === 'function' ) {
					callback.apply( this, arguments );
				}
			}
		}
		return images;
	};

	/*******************************************
	*    全局计时器
	********************************************/
	JF.time = function( time ) {
		if( arguments.length === 0) {
			return G_timeNow;
		} else {
			JF.play();
			G_speed = 1000;
			G_timeEnd = time;
			return this;
		}
	};

	JF.timeline = function( timeline ) {
		if( arguments.length === 0) {
			return G_timelineList;
		} else {
			for(var t in timeline) {
				G_timelineList[t] = timeline[t];
			}
		}
		return JF;
	};

	/*******************************************
	*    框架方法
	********************************************/
	JF.play = function () {
		var interval = Math.floor(1000 / G_options.FPS);
		G_timer = setInterval( function() {

			//如果到了想要去的时间
			if( (typeof G_timeEnd !== 'undefined') && (G_timeEnd === G_timeNow) ) {
				JF.pause();
			}

			G_timeNow += (interval * G_speed);
			// TODO: 绘制一切
			// drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)
			for( var i = 0 , l = G_animationList.length ; i < l ; i += 1 ) {
				if( G_animationList[i] && !G_animationList[i].isPause ){
					G_animationList[i].element[ G_animationList[i].fun ]();
				}
			}

			for(var t = G_timeNow - (interval * G_speed), n = G_timeNow; t < n; t += 1 ) {
				if(G_timelineList[t]) {
					G_timelineList[t].call(JF);
				}
			}

		}, interval );
		return JF;
	};

	JF.pause = function () {
		clearInterval(G_timer);
		return JF;
	};

	JF.speed = function( speed ){
		if( arguments.length === 0 ){
			return G_speed;
		} else {
			G_speed = speed;
			return JF;
		}
	};

	JF.destory = function() {
		//TODO:调用所有的 destory
		var container = getElement( G_options.container );
		container.removeChild( G_Stage.container );
	};
	/*******************************************
	*    舞台方法
	********************************************/
	JF.Stage = function( opts ) {
		
		//舞台只能被生成一次
		if ( G_Stage ) {
			return G_Stage;
		}

		var allDelayTime = 0;
		opts = opts || {};
		opts = {

			//canvas默认宽、高
			width: opts.width || 300,
			height: opts.height || 150,
			x: opts.x || 0,
			y: opts.y || 0,
			container: getElement( G_options.container )
		};

		G_Stage = {
			id: 'wangxiao',
			container: opts.container,
			width: function ( width ) {
				var me = this;
				if( typeof width === 'undefined' ) {
					return opts.width;
				}else{
					setTimeout(function() {
						opts.width = width;
						switch( G_options.mode ) {
							case 'canvas':
							break;
							case 'dom':
								changeStyle( me.container, 'width', width + 'px');
							break;
						}
					}, allDelayTime );
					return this;
				}
			},
			height: function ( height ) {
				var me = this;
				if( typeof height === 'undefined' ) {
					return opts.height;
				}else{
					setTimeout(function() {
						opts.height = height;
						switch( G_options.mode ) {
							case 'canvas':
							break;
							case 'dom':
								changeStyle( me.container, 'height', height + 'px' );
							break;
						}
					}, allDelayTime );
					return this;
				}		
			},
			// 按照 zIndex 索引
			add: function ( layer ) {
				var me = this;
				setTimeout(function() {
					if ( !G_layerList[ 'zIndex' + layer.zIndex() ] ) {
						G_layerList[ 'zIndex' + layer.zIndex() ] = [];
					}
					if ( G_options.mode === 'dom' ) {
						changeStyle( layer.container, 'position', 'relative' );
						changeStyle( layer.container, 'left', layer.position().x + 'px' );
						changeStyle( layer.container, 'top', layer.position().y + 'px' );
						changeStyle( layer.container, 'overflow', 'hidden' );
						me.container.appendChild( layer.container );
					}
					G_layerList[ 'zIndex' + layer.zIndex() ].push( layer );
				}, allDelayTime );
				return this;
			},
			remove: function ( layer ) {
				setTimeout(function() {
					delFromListById( layer.id, G_layerList[ 'zIndex' + layer.zIndex() ] );
					if( G_options.mode === 'dom' && layer.container ) {
						this.container.removeChild( layer.container );
					}
				}, allDelayTime );
				return this;
			},
			delay: function ( delayTime ) {
				allDelayTime += delayTime;
				return this;
			},
			clearDelay: function() {
				allDelayTime = 0;
				return this;
			}
		};

		var createG_Stage = function( mode ) {
			switch ( mode) {
				case 'canvas':
					createCanvas( opts );
				break;
				case 'dom':
					G_Stage.container = createDom( opts );
					changeStyle( G_Stage.container, 'position', 'relative');
					changeStyle( G_Stage.container, 'overflow', 'hidden');
				break;
			}
		};

		createG_Stage( G_options.mode );
		G_Stage.play = JF.play;
		G_Stage.pause = JF.pause;
		return G_Stage;
	};

	/*******************************************
	*    元素管理
	********************************************/
	JF.Sprite = function ( imgId, opts ) {
		
		//目标位置
		var destinationX;
		var destinationY;
		//移动速度
		var moveSpeedX;
		var moveSpeedY;
		//当前的宽和高
		var thisWidth;
		var thisHeight;
		//当前的位置
		var thisX;
		var thisY;
		//当前的 z-index
		var thisZIndex;
		//当前的延时动画时间
		var allDelayTime;
		//该sprite本身的动画队列，根据动画名称做索引
		var animationIdList;
		//添加在该 sprite 上面的 sprite 队列
		var spriteList;

		G_Sprite = function ( imgId, opts ) {
			
			//TODO: 支持传入 dom
			this.id = imgId || createId();
			opts = opts || {};
			if( typeof imgId === 'string' ) {
				if(G_loadImagesList[imgId]) {
					thisWidth = opts.width || G_loadImagesList[imgId].width;
					thisHeight = opts.height || G_loadImagesList[imgId].height;
				} else{
					thisWidth = opts.width || G_options.width;
					thisHeight = opts.height || G_options.height;
				}
			} else if( typeof imgId === 'object' ) {
				thisWidth = imgId.width || G_options.width;
				thisHeight = imgId.height || G_options.height;
			} else {
				thisWidth = G_options.width;
				thisHeight = G_options.height;
			}
			thisX = opts.x || 0;
			thisY = opts.y || 0;
			thisZIndex = opts.zIndex || 0;
			allDelayTime = 0;
			spriteList = {};
			animationIdList = {};
			spriteG_animationList = [];
			switch( G_options.mode ) {
				case 'canvas':
					this.container = null;
				break;
				case 'dom':
					this.container = createDom({
						id: this.id,
						width: thisWidth,
						height: thisHeight,
						x: thisX,
						y: thisY
					});
				break;
			}
		};

		G_Sprite.prototype = {
			// 按照 zIndex 索引
			add: function ( sprite ) {
				var me = this;
				setTimeout(function() {
					if ( !spriteList[ 'zIndex' + sprite.zIndex() ] ) {
						spriteList[ 'zIndex' + sprite.zIndex() ] = [];
					}
					if ( G_options.mode === 'dom' ) {
						if( G_loadImagesList[ sprite.id ] ) {
							changeStyle( sprite.container, 'background', 'url(' + G_loadImagesList[ sprite.id ].src + ') no-repeat 0px 0px' );
						}
						changeStyle( sprite.container, 'position', 'absolute' );
						changeStyle( sprite.container, 'overflow', 'hidden' );
						me.container.appendChild( sprite.container );
					}
					spriteList[ 'zIndex' + sprite.zIndex() ].push( sprite );
				}, allDelayTime );
				return this;
			},
			remove: function ( sprite ) {
				var me = this;
				setTimeout(function() {
					delFromListById( sprite.id, spriteList[ 'zIndex' + sprite.zIndex() ] );
					if( G_options.mode === 'dom' ) {
						me.container.removeChild( sprite.container );
					}
				}, allDelayTime );
				return this;
			},
			zIndex: function( zIndex ) {
				var me = this;
				if ( arguments.length === 0 ) {
					return thisZIndex;
				} else {
					setTimeout(function() {
						thisZIndex = zIndex;
						if( G_options.mode === 'dom' ) {
							me.container.style['z-index'] = zIndex;
						}
					}, allDelayTime );
					return this;
				}
			},
			width: function ( width ) {
				var me = this;
				if( typeof width === 'undefined' ) {
					return thisWidth;
				}else{
					var setWidth = function() {
						thisWidth = width;
						switch( G_options.mode ) {
							case 'canvas':
							break;
							case 'dom':
								changeStyle( me.container, 'width', width + 'px' );
							break;
						}
					};
					if( allDelayTime === 0) {
						setWidth();
					} else {
						setTimeout( setWidth , allDelayTime );
					}
					return this;
				}
			},
			height: function ( height ) {
				var me = this;
				if( typeof height === 'undefined' ) {
					return thisHeight;
				}else{
					var setHight = function() {
						thisHeight = height;
						switch( G_options.mode ) {
							case 'canvas':
							break;
							case 'dom':
								changeStyle( me.container, 'height', height + 'px' );
							break;
						}
					};
					if( allDelayTime === 0) {
						setHight();
					} else {
						setTimeout( setHight , allDelayTime );
					}
					return this;
				}		
			},
			position: function( opts ) {
				if( arguments.length === 0 ) {
					return { x: thisX, y: thisY };
				} else {
					var me = this;
					setTimeout(function(){
						thisX = opts.x || thisX;
						thisY = opts.y || thisY;
						if( G_options.mode === 'dom' ) {
							changeStyle( me.container, 'top', thisY + 'px' );
							changeStyle( me.container, 'left', thisX + 'px');
						}
					}, allDelayTime );
					return this;
				}
			},
			move: function( xLength, yLength, speedX, speedY, fun ) {
				var me = this;
				me.moveTo( thisX + xLength, thisY + yLength, speedX, speedY, fun );
				return this;
			},
			//speed 定义为每次刷新的步长
			moveTo: function( x, y, speedX, speedY, fun ) {
				var me = this;
				//此时内部调用
				if( arguments.length === 0 ) {
					
					//修正x
					if( Math.abs( destinationX - thisX ) < (moveSpeedX * G_speed) ){
						thisX = destinationX;
					} else if( thisX < destinationX ) {
						thisX += (moveSpeedX * G_speed);
					} else if( thisX > destinationX ) {
						thisX -= (moveSpeedX * G_speed);
					}
					//修正y
					if( Math.abs( destinationY - thisY ) < (moveSpeedY * G_speed) ){
						thisY = destinationY;
					} else if( thisY < destinationY ) {
						thisY += (moveSpeedY * G_speed);
					} else if( thisY > destinationY ) {
						thisY -= (moveSpeedY * G_speed);
					}
					if( G_options.mode === 'dom' ){
						changeStyle( me.container, 'left', thisX + 'px');
						changeStyle( me.container, 'top', thisY + 'px');
					}

					//move动作结束
					if( (thisX === destinationX) && (thisY === destinationY) ) {
						if( animationIdList.moveTo && animationIdList.moveTo.callback ) {
							animationIdList.moveTo.callback();
						}
						delFromListById( animationIdList.moveTo.id, G_animationList );
						// TODO：这里有个bug，同一个动画可能会有多个。
						// animationIdList.moveTo = null;
					}

				} else {

					//增加全局速度
					speedX *= G_speed;

					if(arguments.length === 4) {
						if( typeof speedY !== 'number' ) {
							fun = speedY;
						} else {
							speedY *= G_speed;
						}
					}

					if( (arguments.length === 3) || (arguments.length === 4) ) {
						speedY = speedX;
					}

					//外部调用
					setTimeout(function() {
						switch( G_options.mode ) {
							case 'canvas':
							break;
							case 'dom':
								destinationX = x;
								destinationY = y;
								moveSpeedX = Math.abs( speedX );
								moveSpeedY = Math.abs( speedY );
							break;
						}
						var animationObject = {
							id: createId() + me.id,
							element: me,
							//标示动作
							fun: 'moveTo',
							//标示动画状态
							isPause: false
						};
						//存储当前动画信息到全局
						G_animationList.push( animationObject );
						//类中的动画信息记录
						animationIdList.moveTo = {
							id: animationObject.id,
							callback: fun
						};

					}, allDelayTime );
				}

				return this;
			},

			//传入 action ，想停止的动作
			pause: function( action ) {
				if( action ){
					if( action === 'move' ){
						action = 'moveTo';
					}
					if(animationIdList[action]) {
						var id = animationIdList[action].id;
						pauseAnimationById( id, G_animationList );
					}
				} else {
					for( var i in animationIdList ) {
						pauseAnimationById( animationIdList[i].id, G_animationList );
					}
				}
				return this;
			},
			play: function( action ) {
				if( action ){
					if( action === 'move' ){
						action = 'moveTo';
					}
					if(animationIdList[action]) {
						var id = animationIdList[action].id;
						playAnimationById( id, G_animationList );
					}
				} else {
					for( var i in animationIdList ) {
						playAnimationById( animationIdList[i].id, G_animationList );
					}
				}
				return this;
			},
			delay: function( delayTime ) {
				if( arguments.length === 0) {
					return allDelayTime;
				} else {
					allDelayTime += ( delayTime / G_speed );
					return this;
				}
			},
			clearDelay: function() {
				allDelayTime = 0;
				return this;
			},
			doThis: function( fun ) {
				if( fun ) {
					var me = this;
					setTimeout(function(){
						fun.apply(me);	
					}, allDelayTime );
				}
				return this;
			},
			destory: function(){
				for( var i in this ) {
					this[ i ] = null;
				}
				this.destory = true;
				return this;
			}
		};

		return new G_Sprite( imgId, opts );
	};
	/*******************************************
	*    图层管理
	********************************************/
	JF.Layer = function( opts ) {
		//目标位置
		var destinationX;
		var destinationY;
		//移动速度
		var moveSpeedX;
		var moveSpeedY;
		//当前的宽和高
		var thisWidth;
		var thisHeight;
		//当前的位置
		var thisX;
		var thisY;
		//当前的 z-index
		var thisZIndex;
		//当前的延时动画时间
		var allDelayTime;
		//该sprite本身的动画队列
		var spriteG_animationList;
		//添加在该 sprite 上面的 sprite 队列
		var spriteList;

		function Layer( opts ) {
			this.id = createId();
			opts = opts || {};
			thisWidth = opts.width || G_Stage.width() ;
			thisHeight = opts.height || G_Stage.height();
			thisX = opts.x || 0;
			thisY = opts.y || 0;
			thisZIndex = opts.zIndex || 0;
			spriteList = {};
			allDelayTime = 0;
			switch( G_options.mode ) {
				case 'canvas':
					this.container = null;
				break;
				case 'dom':
					this.container = createDom({
						width: thisWidth,
						height: thisHeight,
						x: thisX,
						y: thisY
					});
				break;
			}
		}

		Layer.prototype = G_Sprite.prototype;
		return new Layer( opts );
	};

	/*******************************************
	*    框架自身逻辑
	********************************************/
	G_options.onstart();
	G_loadImagesList = JF.loadImage( G_options.imagesList, G_options.onready );

	return JF;
}