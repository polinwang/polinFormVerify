/* 
 *	Desc 	: 表单验证类
 *	Auth 	: polin.wang
 *	Time 	: 2017/04/28
 *	Version : v1.0.0
 *	调用	: $$.init();
 *	$$.init(
 *		[
 *			{'id':'email','lang':'邮箱','patt':'email','url':'http://abc.com/test.php','notice':'请填写Email','errMsg':'邮箱格式不正确'},
 *			{'id':'username','patt':/\w+/,'url':'http://abc.com/test.php','notice':'请填写用户名'},
 *		]
 *	);
 *	
 *	参数说明:
 *			showOk : 全局参数 验证成功后是否显示 正确的标示
 *			{
 *				
 *	 			id		: 要验证表单的ID (必须)	
 *	 			lang	: 当前表单对应的汉字名称
 *	 			patt	: 验证表单的正则 可以自定义表达式也可以用 polinFormVerify中定义的
 *					已定义的正则 : { email,username,phone,tele,qq,date,datetime,url,number,password }
 *				url		: 发送ajax验证的URL
 *					 注 : ajax验证是 服务端必须返回json字符串
 *				notice	: 目标onfocus时的提示信息
 *				errMsg	: 验证错误时的提示信息
 *				okMsg	: 验证成功时的提示信息
 *				verifyErrMsg	: form submit 验证错误时的提示信息（会被覆盖）
 *				sameWith: 相同于某个字段的值的ID (通常用户验证两次密码是否相同)
 *				sameErrMsg	: sameWith验证失败的提示信息
 *				offsetLeft	: 原来的基础上向左偏移 Left - offsetLeft
 *				offsetRight	: 原来的基础上向左偏移 Left + offsetRight
 *				offsetTop	: 原来的基础上向左偏移 Top - offsetLeft
 *				offsetBottom: 原来的基础上向左偏移 Top + offsetBottom
 *			}
 *
 */
(function(){
	$$ = pfv = polinFormVerify = {
		showOk : true,
		IMG_PATH : 'images/',
		Params : {},
		verifyObj : [],
		objs : {},
		init : function(params){
			_S = this;
			var s = 0;
			for(var i in params){
				if(_S.isset(params[i]) && _S.isObject(params[i])){
					sObj = params[i];
					this.listener(sObj);
					_S.verifyObj[s] = sObj;
					s++;
				}
			}
			_S.globalVerify();
			return _S;
		},
		config : function ( p ){
			_S = this;
			if(_S.isset(p) && _S.isObject(p)){
				for(var k in p){
					if(_S.isset(_S[k])){
						_S[k] = p[k];
					}else{
						_S.Params[k] = p[k];
					}
				}
			}
			return _S;
		},
		listener : function(o){
			var b;
			b = _S.getObj(o);
			_S.addListen(b,'focus',function(){
				if(_S.isset(b.data.focusFn)){
					eval("b.data.focusFn(o)");
				}
				_S.warnMsg(b,b.data.notice);
			});
			_S.addListen(b,'blur',function(){
				_S.verify(b);
			});
		},
		addListen : function (target, eventType, handler){
			if(_S.isNull(target)){
				return Self;
			}
			
			if (target.addEventListener) {   //监听IE9，谷歌和火狐
				target.addEventListener(eventType, handler, false);
			} else if (target.attachEvent) {  //IE
				target.attachEvent("on" + eventType, handler);
			} else {
				target["on" + eventType] = handler;
			}
			return _S;
		},
		globalVerify : function(){
			_S.addListen(_S.getCurrForm(),'submit',function(event){
				for(var i in _S.verifyObj){
					if(_S.isset(_S.verifyObj[i])){
						sObj = _S.getObj(_S.verifyObj[i]);
						if(!_S.isset(sObj.data.verifyResult)){
							if(_S.verify(sObj) === true){
								continue;
							}else{
								_S.stopDefault(event);
								break;
							}
						}else if(sObj.data.verifyResult !== true){
							_S.errorMsg(sObj,sObj.data.verifyErrMsg);
							_S.stopDefault(event);
							break;
						}
					}
				}
			});
		},
		formStopSubmit : function(o){
			_S.addListen(_S.getCurrForm(o),'submit',function(event){ _S.stopDefault(event); });
			// _S.getCurrForm(o).addEventListener('submit',function(event){ _S.stopDefault(event); });
		},
		getCurrForm : function(o){
			cObj = _S.isset(o) && _S.isObject(o) ? o : _S.firstObj();
			f = true;
			while(f){
				if(_S.isset(cObj.parentNode) && !_S.isNull(cObj.parentNode)){
					cObj = cObj.parentNode;
					if(cObj.nodeName == 'FORM'){
						f = false;
						break;
					}
				}
			}
			return cObj;
		},
		verify : function (o){
			Value = _S.trim(o.value); 
			if(!Value){
				_S.verifyError(o,_S.getLang(o)+'不能为空');
				return false;
			}
			
			if(_S.isset(o.data.blurFn)){
				eval("o.data.blurFn(o)");
			}
			// 正则
			if(_S.isset(o.data.patt)){
				if(_S.isString(o.data.patt) && _S.isPattFunc(o.data.patt)){
					var tmpPatt = _S.execPattFunc(o);
					if(tmpPatt === false){
						_S.verifyError(o,o.data.errMsg);
						return false;
					}else if(tmpPatt !== true){
						if(!tmpPatt.test(Value)){
							_S.verifyError(o,o.data.errMsg);
							return false;
						}
					}
				}else{
					if(!o.data.patt.test(Value)){
						_S.verifyError(o,o.data.errMsg);
						return false;
					}
				}
			}
			
			if(_S.isset(o.data.sameWith)){
				sameObj = _S.getObjById(o.data.sameWith);
				if(_S.isObject(sameObj)){
					if(_S.trim(sameObj.value) !== Value){
						_S.verifyError(o,o.data.sameErrMsg);
						return false;
					}
				}
			}
			// ajax
			if(_S.isset(o.data.url)){
				var K = _S.isset(o.data.ajaxKey) ? o.data.ajaxKey : o['name'];
				sendObj = eval('({"'+K+'":"'+Value+'"})');
				_sendObj = {};
				if(_S.isset(o.data.ajaxParams) && _S.isObject(o.data.ajaxParams)){
					for(var _k in o.data.ajaxParams){
						var _v = false;
						try {
							_v = eval("o.data.ajaxParams[_k]()");
						} catch(err) {
							_v = o.data.ajaxParams[_k];
						}
						sendObj[_k] = _v;
					}
				}
				
				_S.ajax('get',o.data.url,sendObj,function(ret){
					ret = eval("("+ret+")");
					if(ret.status != 'succ'){
						var errorMsg = ret.msg ? ret.msg : o.data.sameErrMsg;
						_S.verifyError(o,errorMsg);
						return false;
					}else if(ret.status == 'succ'){
						
					}else{
						_S.setObjVerifyResult(o,false);
						_S.errorMsg(o,'未知错误');
						return false;
					}
				},function(error){
					_S.setObjVerifyResult(o,false);
					console.log(error);
					_S.errorMsg(o,'未知错误，服务验证请求失败');
					return false;
				});
			}
			
			// 最后的成功提示
			if(_S.showOk){
				_S.okMsg(o,_S.msg(o,o.data.okMsg,''));
			}else{
				_S.hideMsg(o);
			}
			_S.setObjVerifyResult(o);
			return true;
		},
		getValue : function(id){
			if(!_S.isset(_S.objs[id])){
				_S.getObj({'id':id});
			}
			return _S.isset(_S.objs[id].value) ? _S.objs[id].value : '';
		},
		stopDefault : function ( e ) { 
			 if ( e && e.preventDefault ) 
				e.preventDefault(); 
			else 
				window.event.returnValue = false; 
				
			return false; 
		},
		getLang : function(o){
			return _S.isset(o.data.lang) ? o.data.lang : o.name;
		},
		isObject : function (o){
			return typeof(o) === 'object' ? true : false;
		},
		isNull : function(o){
			return _S.isset(o) && o === null ? true : false;
		},
		isset : function(s){
			try{
				return typeof(s) === 'undefined' ? false : true;
			}catch(e){
				return false;
			}
		},
		isString : function(s){
			return typeof(s) === 'string' ? true : false;
		},
		isFunction : function(s){
			return typeof(s) === 'function' ? true : false;
		},
		isNumeric : function(s){
			return typeof(s) === 'number' ? true : false;
		},
		isPattFunc : function(s){
			return _S.isFunction(eval('_S.'+s+'Pattern')) ? true : false;
		},
		execPattFunc : function(o){
			return eval('_S.'+o.data.patt+'Pattern(o)');
		},
		firstObj : function(){
			return _S.eqObj(0);
		},
		eqObj : function(n){
			if(!_S.isNumeric(n)){
				return {};
			}
			if(!_S.isset(_S.verifyObj[n])){
				return {};
			}
			var sObj = _S.verifyObj[n];
			if(_S.isset(_S.objs[sObj.id])){
				return _S.objs[sObj.id];
			}
			return {};
		},
		getObjById : function(id){
			if(_S.isset(_S.objs[id])){
				return _S.objs[id];
			}
			return false;
		},
		getObj : function(o){
			if(!_S.isset(_S.objs[o.id])){
				var obj = document.getElementById(o.id);
				if(_S.isNull(obj)){
					return false;
				}
				obj.data = o;
				_S.objs[o.id] = obj;
				return obj;
			}else{
				return _S.objs[o.id];
			}
			
		},
		setObjAttr : function(o,Attr){
			sObj = _S.getObj(o);
			for(var s in Attr){
				sObj.data[s] = Attr[s];
			}
			_S.objs[o.id] = sObj;
		},
		setObjVerifyResult : function(o,error,msg){
			if(!_S.isset(error)){
				var Attr = {'verifyResult':true,'Value':o.value};
			}else{
				msg = _S.msg(o,msg,_S.getLang(o)+'验证未通过');
				var Attr = {'verifyResult':false,'Value':o.value,'verifyErrMsg':msg};
			}
			_S.setObjAttr(o,Attr);
		},
		verifyError : function(o,msg){
			_S.setObjVerifyResult(o,false,msg);
			_S.errorMsg(o,msg);
		},
		errorMsg : function(obj,msg){
			_S.message(_S.msg(obj,msg,'error!'),'error',obj);
		},
		okMsg : function(obj,msg){
			_S.message(msg,'ok',obj);
		},
		warnMsg : function(obj,msg){
			_S.message(_S.msg(obj,msg),'warn',obj);
		},
		hideMsg : function(obj){
			nodeList = obj.parentNode.childNodes;
			var patt = /^OBJECT_MESSAGE_\d+/;
			for(var i in nodeList){
				cNode = nodeList[i];
				if(cNode.nodeName == 'DIV' && cNode.className == 'OBJECT-Msg' && patt.test(cNode.id)){
					obj.parentNode.removeChild(cNode);
				}
			}
		},
		msg : function(obj,msg,defaultMsg){
			defaultMsg = _S.isset(defaultMsg) ? defaultMsg : '';
			return msg = !_S.isset(msg) || !_S.trim(msg) ? ((!_S.isset(obj.data.msg) || !_S.trim(obj.data.msg)) ? defaultMsg : obj.data.msg) : msg;
		},
		emailPattern : function(){
			return /^[a-zA-z0-9][a-zA-Z0-9_\-\.]*@([a-zA-Z0-9]+[_\-\.])+[a-zA-Z]{2,4}$/;
		},
		usernamePattern : function(){
			return /^[a-zA-Z0-9_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]+$/;
		},
		phonePattern : function(){
			return /^1\d{10}$/;
		},
		telePattern : function(){
			return /^((\(\d{2,3}\))|(\d{3}\-))?(\(0\d{2,3}\)|0\d{2,3}-)?[1-9]\d{6,7}(\-\d{1,4})?$/gi;
		},
		qqPattern : function(){
			return /^\d{5,12}$/;
		},
		datePattern : function(){
			return /^\d{4}-\d{1,2}-\d{1,2}$/gi;
		},
		datetimePattern : function(){
			return /^\d{4}-\d{1,2}-\d{1,2}\s\d+:\d+:\d+$/gi;
		},
		urlPattern : function(){
			return /^http[s]{0,1}:\/\/[A-Za-z0-9]+\.[A-Za-z0-9]+[\/=\?%\-&_~`@[\]\':+!]*([^<>\"\"])*$/gi;
		},
		numberPattern : function(){
			return /^\d+$/gi;
		},
		passwordPattern : function(){
			return /.{6,}$/gi;
		},
		notNullPattern : function(){
			return /.+$/gi;
		},
		idCardPattern : function (o) {
			var reg = /^(^[1-9]\d{7}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])\d{3}$)|(^[1-9]\d{5}[1-9]\d{3}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])((\d{4})|\d{3}[Xx])$)$/;
			var card = o.value;
			if (card != "") {
				if (reg.test(card)) {
					if (card.length == 18) {
						var idCardWi = new Array(7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2);
						//将前17位加权因子保存在数组里
						var idCardY = new Array(1, 0, 10, 9, 8, 7, 6, 5, 4, 3, 2);
						//这是除以11后，可能产生的11位余数、验证码，也保存成数组
						var idCardWiSum = 0;
						//用来保存前17位各自乖以加权因子后的总和
						for (var i = 0; i < 17; i++) {
							idCardWiSum += card.substring(i, i + 1) * idCardWi[i];
						}
						var idCardMod = idCardWiSum % 11;
						var idCardLast = card.substring(17);
						//如果等于2，则说明校验码是10，身份证号码最后一位应该是X
						if (idCardMod == 2) {
							if (idCardLast == "X" || idCardLast == "x") {
								return true;
							} else {
								return false;
							}
						} else {
							//用计算出的验证码与最后一位身份证号码匹配，如果一致，说明通过，否则是无效的身份证号码
							if (idCardLast == idCardY[idCardMod]) {
								return true;
							} else {
								return false;
							}
						}
					}
				} else {
					return false;
				}
			} else {
				return false;
			}
		},
		trim : function(s){
			return s.replace(/(^\s*)|(\s*$)/g,'');
		},
		addStyle : function(obj,styleString){
			try{
				// obj.style = styleString;
				obj.setAttribute("style",styleString);
			}catch(e){
				// ie 必须用 element.style.cssText
				obj.style.cssText = styleString;
			}
			return obj;
		},
		// 创建信息提示框
		message : function(msg,msgType,obj){
			_S.hideMsg(obj);
			obj.parentNode.style.position = 'relative';
			var Div = document.createElement('div');
			Div.id = 'OBJECT_MESSAGE_'+Math.random().toString().replace('0.','');
			Div.className = 'OBJECT-Msg';
			var src = msgType == 'error' ? 'icon/fail.png' : (msgType == 'ok' ? 'icon/succ.png' : (msgType == 'warn' ? 'icon/warn.png' : false));
			if(src){
				Img = document.createElement('img');
				Img.src = _S.IMG_PATH+src;
				imgStyle = 'width:18px;height:18px;vertical-align:middle;';
				Img = _S.addStyle(Img,imgStyle);
				Div.appendChild(Img);
			}
			P = document.createElement('p');
			pStyle = 'display:inline-block;line-height:20px;padding:0;margin:0;font-size:15px;text-indent: 8px;';
			P.innerText = msg;
			P = _S.addStyle(P,pStyle);
			Div.appendChild(P);
			switch(_S.Params.position){
				case 'bottom' :
					Top = (obj.offsetTop + obj.offsetHeight + 10);
					
					if(_S.isset(obj.data.offsetBottom) && _S.isNumeric(parseInt(obj.data.offsetBottom))){
						Top += parseInt(obj.data.offsetBottom);
					}
					if(_S.isset(obj.data.offsetTop) && _S.isNumeric(parseInt(obj.data.offsetTop))){
						Top -= parseInt(obj.data.offsetTop);
					}
					Left = (obj.offsetWidth+obj.offsetLeft+10) / 2;
					if(_S.isset(obj.data.offsetRight) && _S.isNumeric(parseInt(obj.data.offsetRight))){
						Left += parseInt(obj.data.offsetRight);
					}
					if(_S.isset(obj.data.offsetLeft) && _S.isNumeric(parseInt(obj.data.offsetLeft))){
						Left -= parseInt(obj.data.offsetLeft);
					}
					break;
				default :
					Top = (obj.offsetTop + (obj.offsetHeight-30)/2);
					if(_S.isset(obj.data.offsetBottom) && _S.isNumeric(parseInt(obj.data.offsetBottom))){
						Top += parseInt(obj.data.offsetBottom);
					}
					if(_S.isset(obj.data.offsetTop) && _S.isNumeric(parseInt(obj.data.offsetTop))){
						Top -= parseInt(obj.data.offsetTop);
					}
					Left = obj.offsetWidth+obj.offsetLeft+10;
					if(_S.isset(obj.data.offsetRight) && _S.isNumeric(parseInt(obj.data.offsetRight))){
						Left += parseInt(obj.data.offsetRight);
					}
					if(_S.isset(obj.data.offsetLeft) && _S.isNumeric(parseInt(obj.data.offsetLeft))){
						Left -= parseInt(obj.data.offsetLeft);
					}
					break;
			}
			divStyle = 'line-height:25px;-webkit-box-shadow:0 0 10px rgba(0,0,0,.5);-moz-box-shadow:0 0 10px rgba(0,0,0,.5);box-shadow:0 0 10px rgba(0,0,0,.5);';
			divStyle += 'border-radius:5px;-webkit-border-radius:5px;-moz-border-radius:5px;';
			divStyle += 'background:#fff;white-space:nowrap;padding:3px 10px;position:absolute;top:'+Top+'px;left:'+Left+'px;';
			Div = _S.addStyle(Div,divStyle);
			obj.parentNode.appendChild(Div);
			return false;
		},
		// ajax
		ajax : function(type, url, data, success, failed){
			// 创建ajax对象
			var xhr = null;
			if(window.XMLHttpRequest){
				xhr = new XMLHttpRequest();
			} else {
				xhr = new ActiveXObject('Microsoft.XMLHTTP')
			}
		 
			var type = type.toUpperCase();
			// 用于清除缓存
			var random = Math.random();
			
			if(typeof data == 'object'){
				var str = '';
				for(var key in data){
					str += key+'='+data[key]+'&';
				}
				data = str.replace(/&$/, '');
			}
			
			if(type == 'GET'){
				var r = /\?/;
				var f = r.test(url) ? '&' : '?';
				if(data){
					xhr.open('GET', url + f + data, true);
				} else {
					xhr.open('GET', url + f +'t=' + random, true);
				}
				xhr.send();
			} else if(type == 'POST'){
				xhr.open('POST', url, true);
				// 如果需要像 html 表单那样 POST 数据，请使用 setRequestHeader() 来添加 http 头。
				xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
				xhr.send(data);
			}
			// 处理返回数据
			xhr.onreadystatechange = function(){
				if(xhr.readyState == 4){
					if(xhr.status == 200){
						success(xhr.responseText);
					} else {
						if(failed){
							failed(xhr.status);
						}
					}
				}
			}
		}
	}
})(window);