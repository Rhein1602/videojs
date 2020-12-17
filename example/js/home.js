


function getInfomation()
{
    /*var url = location.search; //获取url中"?"符后的字串
    var theRequest = new Object();
    if (url.indexOf("?") != -1) {
        var str = url.substr(1);
        strs = str.split("&");
        for(var i = 0; i < strs.length; i ++) {
            theRequest[strs[i].split("=")[0]]=decodeURI(strs[i].split("=")[1]);
        }
    }*/
    var httpRequest = new XMLHttpRequest();//第一步：创建需要的对象
    httpRequest.open('POST', 'http://8.131.81.241/qunzhi/home.php', true); //第二步：打开连接
    httpRequest.setRequestHeader("Content-type","application/x-www-form-urlencoded");//设置请求头 注：post方式必须设置请求头（在建立连接后设置请求头）
    httpRequest.send('path=here');//发送请求 将情头体写在send中
    var list;
    /**
    * 获取数据后的处理程序
    */
                
    httpRequest.onreadystatechange = function () {//请求后的回调接口，可将请求成功后要执行的程序写在其中
        if (httpRequest.readyState == 4 && httpRequest.status == 200) {//验证请求是否发送成功
            var json = httpRequest.responseText;//获取到服务端返回的数据
            console.log(json);
            list = JSON.parse(json);
            var str = "";
            var i =0;
        console.log(list);
        for(;i<list.length;i++)
        {
            str = str+'<li class="video-list"><a href="video.html?id='+list[i].id+'"><img src="image/video/'+list[i].imgpath+'" class="video-img" alt=""><p class="video-name">'+list[i].name+'</p></a></li>';
        }

        $('#video-list').html(str);
        // $('#vlist').html(str);
        var st="";
        if(i%3==0){
            i=i*100+200;
            st=st+i+"px";
        }else{
            i=i%3+1;
            i=i*300+200;
            st=st+i+"px";
        }
        document.getElementById('vlist').style.height=st;
    
            
        }
    }
}
$(document).ready(function(){

    getInfomation();

});