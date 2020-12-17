
var loginflag=false;
var id;
var name ;
var flag = false;
var strs;
var list;//存储反馈的视频列表
var locallist;//本地列表
var mylisr;//存储请求得到的列表
var islocal = false;
var srclist = new Array;
var player;
var localimg ="image/localimg.png"
function getInfomation()
{
    var url = location.search; //获取url中"?"符后的字串
    var theRequest = new Object();
    if (url.indexOf("?") != -1) {
        var str = url.substr(1);
        strs = str.split("&");
        for(var i = 0; i < strs.length; i ++) {
            theRequest[strs[i].split("=")[0]]=decodeURI(strs[i].split("=")[1]);
        }
    }
    
    var httpRequest = new XMLHttpRequest();//第一步：创建需要的对象
    httpRequest.open('POST', 'http://8.131.81.241/qunzhi/video.php', true); //第二步：打开连接
    httpRequest.setRequestHeader("Content-type","application/x-www-form-urlencoded");//设置请求头 注：post方式必须设置请求头（在建立连接后设置请求头）
    httpRequest.send('id='+theRequest['id']);//发送请求 将情头体写在send中
    
    /**
    * 获取数据后的处理程序
    */

    httpRequest.onreadystatechange = function () {//请求后的回调接口，可将请求成功后要执行的程序写在其中
        if (httpRequest.readyState == 4 && httpRequest.status == 200) {//验证请求是否发送成功
            var json = httpRequest.responseText;//获取到服务端返回的数据
            console.log(json);
            list = JSON.parse(json);
            console.log(list);
            var j=0;
            var st = "";
            for(;j<list.length;j++)
            {  
              //js循环产生<li>标签，id为视频序号
              st = st+ '<li class="video-list" id="'+j+'" ><img src="image/video/'+list[j].imgpath+'" class="video-img" alt=""><p class="video-name">'+list[j].title+'</p></a></li>';  
              // addli(st);
              var item = {
                    src : list[j].videopath,
                    type : list[j].type,
                    poster : list[j].imgpath,
                    title : list[j].title
                }
                srclist[j] = item;//更新单个视频源
               
                // srclist[j].src=list[j].vediopath;
                // srclist[j].type='video/mp4';
                // srclist[j].poster=list[j].imgpath;
                // srclist[j].title=list[j].title;
            //         src: 'E:/视频资源/钢铁侠/1.mp4',
            //         type: 'video/mp4',
            //         poster: '//vjs.zencdn.net/v/oceans.png',
            //         title: '钢铁侠1'
            }
             $('#video-list1').html(st);//在video-list1生成列表
            console.log(srclist);//反馈更新完的视频源
            //初始化player
            initailPlayer();
            /**
            * 对于<li>的click和onclick方法的设置
            */
            var li=document.getElementById("video-list1").getElementsByTagName("li");//获取video-list1中的全部<li>
            if(li!=null){
              console.log("li:"+li.length);
            }
            for(let i=0;i<li.length;i++){
              li[i].onclick=function(){
                //alert(li[i].id);
                changevideo(i);//通过i改变片源
              }
            }
            
            for(j=0;j<list.length;j++){
              $("#"+j).click(function(){//设置选中状态
                $(this).siblings('li').removeClass('selected');// 删除其他兄弟元素的样式
                $(this).addClass('selected'); // 添加当前元素的样式
              })
            }
            //保证初始状态第一集被选中
            $("#0").trigger('click');
            
        }
    };
}

$(document).ready(function(){

  // $body = (window.opera) ? (document.compatMode == "CSS1Compat" ? $('html') : $('body')) : $('html,body');// 这行是 Opera 的补丁, 少了它 Opera 是直接用跳的而且画面闪烁 by willin
  
  //getInfomation();
    initailPlayer();
    //$('#total_layout').css('display','none');//隐藏视频组件
    
});

//初始化player的函数
function initailPlayer(){
    console.log("???");
    // var player = videojs('example_video_1');
    // player.addChild('TitleBar', {'text': "title test"});
    // player.addChild('BigPlayButton');
    // console.log(player);
    player = videojs('example_video_1', {
      inactivityTimeout: 1000,
      TitleBar: {
        'text':'无视频'
      },
      sourcesOrder:true,
      controls: true, // 是否显示控制条
      poster: localimg, // 视频封面图地址
      preload: 'auto',
      autoplay: false,
      //fluid: true, // 自适应宽高
      language: 'zh-CN', // 设置语言
      muted: false, // 是否静音
      //inactivityTimeout: false,
      controlBar: { // 设置控制条组件
        //设置控制条里面组件的相关属性及显示与否
        // 'currentTimeDisplay':true,
        // 'timeDivider':true,
        // 'durationDisplay':true,
        // 'remainingTimeDisplay':false,
        // volumePanel: {
        //   inline: false,
        // },
        
        /* 使用children的形式可以控制每一个控件的位置，以及显示与否 */
        children: [
          {name: 'playToggle'}, // 播放按钮
          {name: 'PlayNext'},
          {name: 'currentTimeDisplay'}, // 当前已播放时间
          {name: 'progressControl'}, // 播放进度条
          {name: 'durationDisplay'}, // 总时间
          {name: 'audioTrackButton'},
          { // 倍数播放
            name: 'playbackRateMenuButton',
            'playbackRates': [0.5, 1, 1.5, 2, 2.5]
          },
          {
            name: 'volumePanel', // 音量控制
            inline: false, // 不使用水平方式
          },
          {name: 'AutoPlayNext'},
          {name: 'FullscreenToggle'} // 全屏

        ]
      },
      sources: srclist
        // sources:[ // 视频源
        //     {
        //         src: 'E:/视频资源/钢铁侠/1.mp4',
        //         type: 'video/mp4',
        //         poster: '//vjs.zencdn.net/v/oceans.png',
        //         title: '钢铁侠1'
        //     },{
        //       src: 'E:/视频资源/钢铁侠/2.mp4',
        //         type: 'video/mp4',
        //         poster: '//vjs.zencdn.net/v/oceans.png',
        //         title: '钢铁侠2'
        //     },{
        //       src: 'E:/视频资源/钢铁侠/3.mp4',
        //         type: 'video/mp4',
        //         poster: '//vjs.zencdn.net/v/oceans.png',
        //         title: '钢铁侠3'
        //     }
        // ]
      }, function (){
        console.log('视频可以播放了',this);
      });

      //$('#total_layout').css('display','block');//显示视频组件
      //$('#total_layout').css('display','none');//隐藏视频组件
      player.on(player,'ended',ended);
      player.controlBar.PlayNext.on(player.controlBar.PlayNext,'click',playnext);
      player.controlBar.AutoPlayNext.on(player.controlBar.AutoPlayNext,'click',changeauto);

}

var isauto=true;//记录是否自动播放
var index = 0;//来确定当前播放的视频
/*
自动播放的监听器函数
视频播放结束，若处于自动播放状态则改变index为下一视频
*/
function ended(){
  if(isauto){
    if(index==srclist.length-1){
      index=0//若到达最后一个视频则置零
    }else{
      index=index+1;  
    }
    //$("#"+index).trigger('click');
    $("#"+index).siblings().removeClass('selected');// 删除其他兄弟元素的样式
    $("#"+index).addClass('selected'); // 添加当前元素的样式
    
}
  console.log('ended: '+index);//反馈变更
}
/*
播放下一集的监听器函数
用户主动切换下一集则改变当前播放的index值，并且改变选择列表中的选择情况
*/
function playnext(){
  if(index==srclist.length-1){
    index=0//若到达最后一个视频则置零
  }else{
    index=index+1;  
  }
  //$("#"+index).trigger('click');//模拟点击事件，启用后每一次使用播放下一集按钮都会切换播放源
  $("#"+index).siblings().removeClass('selected');// 删除其他兄弟元素的样式
  $("#"+index).addClass('selected'); // 添加当前元素的样式
  console.log('playnext: '+index);//反馈变更
  //$('#divContainer').scrollToID("#"+index);
  var top1=$("#"+index).position().top;
  console.log("top:"+top1);
  //  $('video_list').scrollToTop(top);
   $("video_list").animate({scrollTop: top1},"speed");
   var top2=$("video_list").scrollTop();
   console.log("top2:"+top2);
  
}

/*
切换自动播放按钮的监听器函数
每一次切换状态，isauto的值随之改变
*/
function changeauto(){
  isauto=!isauto;
  console.log('new isauto: '+isauto);//反馈改变
}

/*
用于添加li的函数，并同时进行单击事件的设置
由于会产生双层<li>对象，而未启用
*/
function addli(string,a) {//添加li
  var li = $("<li>");
  li.html(string);
  li.click(function(){//每一个li的单击事件
    $(this).siblings('li').removeClass('selected');// 删除其他兄弟元素的样式
    $(this).addClass('selected'); // 添加当前元素的样式
    // index=$(this).id;
    // console.log(index);
  });
  $('#video-list1').append(li);
  
}

/*
此处为监听器，监听单击事件的目标id
*/
document.getElementById("video-list1").addEventListener("click",function(e){
 
  console.log("change:"+e.target.id);
  
  })

  /*
此函数用来更改player的片源，在点击序列中某一集的时候触发，将该集置为播放列表头部，总循环顺序不变
传入参数a为选中的集数
*/
function changevideo(a){
    var sss=new Array;
    var j;
    for(j=0;j<srclist.length;j++){
          var item = {
            src : srclist[a].src,
            type : srclist[a].type,
            poster : srclist[a].poster,
            title : srclist[a].title
          }
        sss[j]=item;//更新新的片源队列
        a++;
        if(a==srclist.length){//如果到队列末尾，将a置零，从头继续
          a=0;
        }
    }
    console.log(sss);//显示更新后的序列
    //更新
    player.options_.sources=sss;
    player.pause();
    player.src(sss[0]);
    player.TitleBar.updateTextContent(sss[0].title);
    player.load();
    //player.play();
}

function dealFiles(){
  var fileObjs = document.getElementById("putfiles").files;
  // console.info(files);
  var url = null;
  var st="";
  var newlist = [];
  var j=0;
  if(fileObjs!=null){
    for(var i=0;i<fileObjs.length;i++){
      var str=fileObjs[i].webkitRelativePath.toString();
        if(str.endsWith("mp4")||str.endsWith("mp3")){
          if (window.createObjcectURL != undefined) { 
            url = window.createOjcectURL(fileObjs[i]); 
            console.log("1")
          } else if (window.URL != undefined) { 
            url = window.URL.createObjectURL(fileObjs[i]); 
            console.log("2")
          } else if (window.webkitURL != undefined) { 
            url = window.webkitURL.createObjectURL(fileObjs[i]);
            console.log("3")
          } 

          st = st+ '<li class="video-list" id="'+j+'" ><img src="'+localimg+'" class="video-img" alt=""><p class="video-name">'+fileObjs[i].name+'</p></a></li>';  
          
          var item = {
            src : url,
            type : fileObjs[i].type,
            poster : localimg,
            title : fileObjs[i].name
          }
          console.log(fileObjs[i].name);
          newlist[j] = item;
          j++;
        }
      console.info(fileObjs[i]);
    }
    console.log(st);
    $('#video-list1').html(st);
    var li=document.getElementById("video-list1").getElementsByTagName("li");//获取video-list1中的全部<li>
    for(let z=0;z<li.length;z++){
      li[z].onclick=function(){
        //alert(li[z].id);
        changevideo(z);//通过i改变片源
        index=z;
      }
    }
    
    for(let j=0;j<li.length;j++){
      $("#"+j).click(function(){//设置选中状态
        $(this).siblings('li').removeClass('selected');// 删除其他兄弟元素的样式
        $(this).addClass('selected'); // 添加当前元素的样式
      })
    }
   srclist=newlist;
   console.log(srclist);
   
   $('#total_layout').css('display','block');//显示视频组件
   $("#0").trigger('click');
  }else{
    alert("no video");
  }
  
 //$('#total_layout').css('display','none');//隐藏视频组件
//  changeallvideo(url)
  // for(var file of selectFiles){
  //     //console.log(file.webkitRelativePath);
  //     //console.log(file.path);
  //     console.info(file);

  //     changeallvideo(1,path)
  // }
  // initailPlayer();
  
}

function dealFile(){
  // var selectFiles = document.getElementById("putfile").files;
  // var path = document.getElementById("putfile").value;
  // console.log("path:"+path);
  //try

  var url = null; 
  var fileObjs = document.getElementById("putfile").files;
  console.info(fileObjs);
  var st="";
  var newlist = [];
  for(var i=0;i<fileObjs.length;i++){
    if (window.createObjcectURL != undefined) { 
        url = window.createOjcectURL(fileObjs[i]); 
        console.log("1")
    } else if (window.URL != undefined) { 
        url = window.URL.createObjectURL(fileObjs[i]); 
        console.log("2")
    } else if (window.webkitURL != undefined) { 
        url = window.webkitURL.createObjectURL(fileObjs[i]);
        console.log("3")
    } 
    
    st = st+ '<li class="video-list" id="'+i+'" ><img src="'+localimg+'" class="video-img" alt=""><p class="video-name">'+fileObjs[i].name+'</p></a></li>';  
    
    var item = {
        src : url,
        type : fileObjs[i].type,
        poster : localimg,
        title : fileObjs[i].name
    }
    console.log(fileObjs[i].name);
    newlist[i] = item;
  }
  console.log(st);
  $('#video-list1').html(st);
  var li=document.getElementById("video-list1").getElementsByTagName("li");//获取video-list1中的全部<li>
  for(let z=0;z<li.length;z++){
    li[z].onclick=function(){
      //alert(li[z].id);
      changevideo(z);//通过i改变片源
      index=z;
    }
  }
  
  for(let j=0;j<li.length;j++){
    $("#"+j).click(function(){//设置选中状态
      $(this).siblings('li').removeClass('selected');// 删除其他兄弟元素的样式
      $(this).addClass('selected'); // 添加当前元素的样式
    })
  }
  srclist=newlist;
  console.log("srclist"+srclist);
 
 $('#total_layout').css('display','block');//显示视频组件
 //$('#total_layout').css('display','none');//隐藏视频组件
//  changeallvideo(url)
  // for(var file of selectFiles){
  //     //console.log(file.webkitRelativePath);
  //     //console.log(file.path);
  //     console.info(file);

  //     changeallvideo(1,path)
  // }
  // initailPlayer();
  $("#0").trigger('click');
}
function heightToTop(ele){
  //ele为指定跳转到该位置的DOM节点
  let root = document.body;
  let height = 0;
  do{
      height += ele.offsetTop;
      ele = ele.offsetParent;
  }while( ele !== root )
  return height;
}
function clickfiles(){
  $("#putfiles").trigger('click')
}
function clickfile(){
  $("#putfile").trigger('click')
}
   