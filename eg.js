$$.config({
	'IMG_PATH' : 'http://img.domain.com', // 图片目录
	'position' :'bottom',
	// other config
	'picCodeUrl' :'http://abdc.com/aaa', // 图片验证码地址
	'showOk' : false
}).init(
	[
		{'id':'mobile','lang':'手机号','patt':'phone','notice':'请填写手机号','errMsg':'手机号格式不正确','blurFn':function(obj){
				if(_S.isset(obj.data.Value) && obj.data.Value != obj.value){
					_S.getObj({'id':'piccodeimage'}).src = _S.Params.picCodeUrl + '?'+Math.random();
				}
			}},
		{'id':'code','lang':'图片验证码','patt':/\d+/,'url':'http://abdc.com/bbb','ajaxKey':'code','notice':'请填写图片验证码'},
		{'id':'mobilecode','lang':'手机验证码','patt':/\d+/,'url':'http://abdc.com/ccc','ajaxKey':'code','ajaxParams':{
				"mobile":function(){ return _S.objs['mobile'].value; },		// 获取电话号码
				"piccode":function(){ return _S.objs['code'].value; }		// 获取图片验证码
			},'notice':'请填写手机验证码'}
	]
).addListen(_S.getObj({'id':'piccodeimage'}),'click',function(){
	_S.objs['piccodeimage'].src = _S.Params.picCodeUrl + '?'+Math.random();
});