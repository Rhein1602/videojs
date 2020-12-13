<?php
    //$path=$_POST('path');
    $link = mysqli_connect('localhost','qunzhi','123456','qunzhi');
    if ($link->connect_error){
        echo '数据库连接失败！';
        exit(0);
    }
    $sql = "SELECT * FROM video";
    $result =  $link->query($sql);
    while($row = mysqli_fetch_array($result)){
        $ros[]=$row;
        // $ros['id']=$row['id'];
        // $ros['name']=$row['name'];
        // $ros['Introduction']=$row['Introduction'];
        // $ros['number']=$row['number'];
        // $ros['imgpath']=$row['imgpath'];
    }
    // $sql1="SELECT gameID FROM CG WHERE clientID ='$row[id]'"; 
    // $result1 =  $link->query($sql1); 
    // while($row1 = mysqli_fetch_array($result1)){
    //     $sql2="SELECT gameName,picture,gameID FROM game WHERE gameID ='$row1[gameID]'";
    //     $result2 =  $link->query($sql2); 
    //     $ros[]=mysqli_fetch_array($result2);
    // }
    // $row2 = array($row,$ros);
     $json = json_encode($ros,JSON_UNESCAPED_UNICODE);
    echo $json;
?>