<?php

$lol = true;

date_default_timezone_set('Etc/GMT-3');

$currentTime = date("H:i:s");

$ch = curl_init("https://a-routes.com:3000/updatepercent/point532");
curl_setopt($ch,CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch,CURLOPT_CONNECTTIMEOUT, 1);
curl_setopt($ch,CURLOPT_TIMEOUT, 1);
$not_important = curl_exec($ch);
curl_close($ch);
echo $not_important;

sleep(2000);

?>