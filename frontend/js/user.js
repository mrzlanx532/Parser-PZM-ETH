function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};
var userData = {
    pmz:"",
    balance:""
}
var mdOpen = id => $(id).addClass('is-active');
var mdClose = id => $(id).removeClass('is-active');
function sync(email) {
    if (getUrlParameter('user') != '') {
        var email = getUrlParameter('user');
        $("#user").html(template);
        console.log(email + "rassssss");
        if (email.indexOf(".")) {
            email = email.replace(".","point532");
        }
        console.log(email + "test");
        $.ajax({
            type: 'GET',
            url: location.protocol+`//`+location.host+'/billing/sync/' + email,
            dataType: 'json',
            success: function (json) {
                userBoard();
            }
        });

    } else {

    }
}

function userBoard() {
    if (getUrlParameter('user') != '') {
        var email = getUrlParameter('user');
        $("#user").html(template)
        console.log(email + ' PRIVET')

        $.ajax({
            type: 'GET',
            url: location.protocol+`//`+location.host+'/billing/getUser/' + email,
            dataType: 'json',
            success: function (json) {
                if (json.status == 1) {
                    if (json.liberty == 1) {
                        $("#user").html(templateadmin)
                    }
                    userData.pmz = json.wallets.prizm.inSystemBalance;
                    user.balance = json.balance;

                    if (json.inPull == undefined) {
                        json.inPull = 0;
                    }
                    if (json.wallets.prizm.wallet == undefined) {
                        json.wallets.prizm.wallet = 'Не указан(!)';
                    }
                    if (json.wallets.prizm.publickey == undefined) {
                        json.wallets.prizm.publickey = 'Не указан(!)';
                    }


                    $('#userEmail').html(json.email) 
                    $('#userPoints').html(json.balance)
                    $('#userWallet').html(json.wallets.prizm.wallet) 
                    $('#inSystemBalance').html(json.wallets.prizm.inSystemBalance)
                    $('#inSystemBalanceConvert').html(json.wallets.prizm.inSystemBalance)
                    $('#publicKey').html(json.wallets.prizm.publickey)
                    $('#inPullPrizm').html(json.inPull)
                    $('#ether_wallet').html(json.wallets.ether.wallet)
                    $('#ether_insystem').html(json.wallets.ether.inSystemBalance)
                } else {
                    $('#user').html('<p class="has-text-centered is-size-4 has-text-danger">Пользователь не найден!<br><br></p><p class="has-text-centered is-size-4 has-text-info"><a  href="'+location.protocol+`//`+location.host+'/user/">Создать кошелек</a></p>');
                }
            }
        });

    } else {

    }
}

function getTemplateChangePara(){
    if (getUrlParameter('user') != '') {
        var email = getUrlParameter('user');
        $("#user").html(templateChangePara)
        console.log(email + ' PRIVET')
    }
}

function userBoardPayback() {
    if (getUrlParameter('user') != '') {
        var email = getUrlParameter('user');
        $("#user").html(templateForPayback)
        console.log(email + ' PRIVET')

        $.ajax({
            type: 'GET',
            url: location.protocol+`//`+location.host+'/billing/getUser/' + email,
            dataType: 'json',
            success: function (json) {
                if (json.status == 1) {
                    userData.pmz = json.wallets.prizm.inSystemBalance;
                    user.balance = json.balance;
                    $('#userEmail').html(json.email) 
                    $('#userPoints').html(json.balance)
                    $('#userWallet').html(json.wallets.prizm.wallet) 
                    $('#inSystemBalance').html(json.wallets.prizm.inSystemBalance)
                    $('#publicKey').html(json.wallets.prizm.publickey)
                } else {
                    $('#user').html('<p class="has-text-centered is-size-4 has-text-danger">Пользователь не найден!<br><br></p><p class="has-text-centered is-size-4 has-text-info"><a  href="'+location.protocol+`//`+location.host+'/user/">Создать кошелек</a></p>');
                }
            }
        });

    } else {

    }
}

function login(){

    /*var ciphertext = CryptoJS.AES.encrypt('my message', 'secret key 123');

    var bytes  = CryptoJS.AES.decrypt(ciphertext.toString(), 'secret key 123');
    var plaintext = bytes.toString(CryptoJS.enc.Utf8);

    console.log(ciphertext.toString());
    console.log(plaintext);*/

   var login = $('#login').val();

    if (login == "" || login.indexOf('@') == -1){
      $('#mistake_answer').html('Введите E-mail, например example@mail.ru');
      setTimeout(function() { $('#mistake_answer').html('') }, 2000);
      return false;  
  } 

  $.ajax({
    type: 'GET',
    url: location.protocol+`//`+location.host+'/billing/getUser/' + login, 
    dataType: 'json',
    success: function (json) {
        if(json.status == 1){
            location.href = "/user/?user="+login
        }else{
            initReg(login);
        }
    }
})
}

function initReg(login){
    userData['user'] = login; 
    var template = `
    <p class="has-text-centered is-size-4 has-text-success">Новый пользователь</p>
    <p class="has-text-centered is-size-5">
    <br>
    <label>
    <b>Кошелек PRIZM</b>
    </label>
    </p>
    <br>
    <div class="control">
    <input id="wallet" class="input is-rounded is-large is-primary" type="text" placeholder="Кошелёк">
    <input id="publickey" class="input is-rounded is-large is-primary" type="text" placeholder="Публичный ключ">
    </div>

    
    <p class="has-text-centered is-size-5">
    <br>
    <label>
    <b>Кошелек ETHERIUM</b>
    </label>
    </p>
    <br>
    <div class="control">
    <input id="wallet_eth" class="input is-rounded is-large is-primary" type="text" placeholder="Кошелёк">
    </div>

    <br>
    <p class="buttons is-centered">
    <button onclick="endReg()" class="button is-large is-success">Подтвердить</button>
    </p> 
    `
    $("#user").html(template);
}

function endReg(){
    if($("#wallet").val()== "") return false;
    if($("#publickey").val()== "") return false;
    if($("#wallet_eth").val()== "") return false;

    var wallet = $("#wallet").val();
    var publickey = $("#publickey").val();
    var wallet_eth = $("#wallet_eth").val();

    $.ajax({
        type: 'GET',
        url: location.protocol+`//`+location.host+`/billing/createUser/${userData.user}/prizm/${wallet}/${publickey}/${wallet_eth}`,
        dataType: 'json',
        success: function (json) {
            if(json.status == 1){
                console.log(json)
                location.href = "/user/?user="+userData.user
            } 
        }})

}
function converttopull(){
    if (getUrlParameter('user') != '') {
        var email = getUrlParameter('user');
        $("#user").html(template)
        console.log(email)
        console.log('То что надо '+JSON.stringify(userData.pzm));
        /*`http://pay.migshoping.ru:3000/billing/convert/${email}/prizm/${userData.pmz}`*/
        $.ajax({
            type: 'GET', 
            url: location.protocol+`//`+location.host+`/billing/sentopull/${email}/prizm/${userData.pmz}`,
            dataType: 'json',
            success: function (json) {
                if (json.status == 1) {
                   mdClose("#sendtopull");
                   userBoard();
               } else {
                $('#user').html('<p class="has-text-centered is-size-4 has-text-danger">Что-то пошло не так :( </p>');
            }
        }
    });
    }
}

function convert(){
    if (getUrlParameter('user') != '') {
        var email = getUrlParameter('user');
        $("#user").html(template)
        console.log(email)
        $.ajax({
            type: 'GET',
            url: location.protocol+`//`+location.host+`/billing/convert/${email}/prizm/${userData.pmz}`,
            dataType: 'json',
            success: function (json) {
                if (json.status == 1) {
                   mdClose("#convert");
                   userBoard();
               } else {
                $('#user').html('<p class="has-text-centered is-size-4 has-text-danger">Что-то пошло не так :( </p>');
            }
        }
    });

    } else {

    }
}

function payback(){
    $("#user").html(templateForPayback);
    userBoardPayback();
}

function sendPara(){
    var para = $("#para").val();
    console.log(para);
    $.ajax({
        type: 'GET',
        url: location.protocol+`//`+location.host+`/setpara/${para}`,
        dataType: 'json',
        success: function (json) {
            console.log('Ajax Отправлен');
        }
    });
}

function sendMail(){
    if($("#key").val()== ""){
        alert('Заполните "Ключ"');
        return false;  
    } 
    if($("#field").val()== "")
    {
        alert('Заполните "Поле"');
        return false;
    } 
    email = $("#userEmail").html();
    if (email.indexOf(".")) {
        email = email.replace(".","point532");
    }

    key = $("#key").val();
    field = $("#field").val();
    console.log('email: '+email+' key: '+key+' field: '+field);
    alert("Заявка успешно отправлена");
    $.ajax({
        type: 'GET',
        url: location.protocol+`//`+location.host+`/sendmail/${email}/${key}/${field}`,
        dataType: 'json',
        success: function (json) {
            console.log('Ajax Отправлен');
        }
    });

}

console.log(getUrlParameter('user'))

var templateForPayback = `
<table class="table">
<tbody>
<tr>
<th>Аккаунт</th>
<td><span id="userEmail"><img src="/files/load.gif"></span></td>
</tr>
<tr>
<th>Prizm кошелёк</th>
<td> <span id="userWallet"><img src="/files/load.gif"></span></td>
</tr>
<th>PMZ для конвертации</th>
<td><span id="inSystemBalance"><img src="/files/load.gif"></span></td>
</tr>
<tr>
<th>Публичный ключ</th>
<td> <span id="publicKey"><img src="/files/load.gif"></span></td>
</tr>
<tr>
<th>Ключ</th>
<td><input class="input" id="key"></span></td>
</tr>
<tr>
<th>Поле</th>
<td><input class="input" id="field"></span></td>
</tr>
<tr>
</tbody>
</table>
<br>


<p class="buttons is-centered">
<button class="button is-light" onclick="userBoard()">Назад</button>
<button class="button is-info" onclick="sendMail()">Получить</button>
</p>
</p>
`;

var templateChangePara = `
<p class="buttons is-centered">Установить значение парамайнинга</p>
<input class="input" id="para" type="text"></input><br><br>
<div style="text-align: center;">
<button class="button is-light" onclick="userBoard()">Назад</button>
<button class="button is-warning" onclick="sendPara();">Изменить</button>
</div>
</p>
</p>
`;

var template = `

<table class="table">
<tbody>
<tr>
<th>Аккаунт</th>
<td><span id="userEmail"><img src="/files/load.gif"></span></td>
</tr>
<tr>
<th>Prizm кошелёк</th>
<td> <span id="userWallet"><img src="/files/load.gif"></span></td>
</tr>
<tr>
<th>Публичный ключ</th>
<td> <span id="publicKey"><img src="/files/load.gif"></span></td>
</tr>
<tr>
<th>Баланс PMZ</th>
<td><span id="inSystemBalance"><img src="/files/load.gif"></span></td>
</tr>
<tr>
<th>Баллы</th>
<td><span id="userPoints"><img src="/files/load.gif"></span></td>
</tr>
<tr>
<th>В пуле (0.7% в день)</th>
<td><span id="inPullPrizm">0</span></td>
</tr>
<tr>
<th>Результат парамайнинга</th>
<td><span id="inPullPrizm">50</span></td>
</tr>
<tr>
<th></th>
<td></td>
</tr>
<th>Кошелек Ether</th>
<td><span id="ether_wallet"></span></td>
</tr>
<tr>
<th>Кол-во ETH</th>
<td><span id="ether_insystem"></span></td>
</tr>

</tbody>
</table>

<p class="buttons is-centered">

<button class="button is-success" onclick="mdOpen('#buy2')">Пополнить баланс ETHER</button>
<button class="button is-success" onclick="mdOpen('#buy')">Пополнить баланс PRIZM</button>
<button class="button is-success" onclick="mdOpen('#convert')">Произвести конвертацию</button>
<button class="button is-primary" onclick="mdOpen('#sendtopull')">Отправить в пул</button>
</p>
<p class="buttons is-centered">
<button class="button is-danger" onclick="sync();">Синхронизировать</button>
<button class="button is-light" onclick="window.location = '`+location.protocol+`//`+location.hostname+`/user';">Вернуться в магазин</button>
<button class="button is-light" onclick="payback()">Вернуть PZM</button>

</p>

`

var templateadmin = `

<table class="table">
<tbody>
<tr>
<th>Аккаунт</th>
<td><span id="userEmail"><img src="/files/load.gif"></span></td>
</tr>
<tr>
<th>Баллы</th>
<td><span id="userPoints"><img src="/files/load.gif"></span></td>
</tr>
<tr>
<th>Баланс PMZ</th>
<td><span id="inSystemBalance"><img src="/files/load.gif"></span></td>
</tr>
<tr>
<th>Prizm кошелёк</th>
<td> <span id="userWallet"><img src="/files/load.gif"></span></td>
</tr>
<th>Публичный ключ</th>
<td> <span id="publicKey"><img src="/files/load.gif"></span></td>
</tr>
</tbody>
</table>
<p class="buttons is-centered">
<button class="button is-success" onclick="mdOpen('#buy2')">Пополнить баланс ETHER</button>
<button class="button is-success" onclick="mdOpen('#buy')">Пополнить баланс PRIZM</button>
<button class="button is-success" onclick="mdOpen('#convert')">Произвести конвертацию</button>
</p>
<p class="buttons is-centered">
<button class="button is-danger" onclick="sync();">Синхронизировать</button>
<button class="button is-light" onclick="window.location = '`+location.protocol+`//`+location.host+`/user';">Вернуться в магазин</button>
<button class="button is-light" onclick="payback()">Вернуть PZM</button>
<hr>
<div >
<p style="text-align: center;"><b>Панель администратора</b></p>
</div>
<hr>
<p class="buttons is-centered">
<button class="button is-warning" onclick="getTemplateChangePara();">Изменить парамайнинг</button>
</p>
</p>

`



$(document).ready(function () {
    userBoard()
    var id = 3;
    let currentBalanceWallet;
    console.log(location.host);

    $.ajax({
        type: 'GET',
        url: location.protocol+`//`+location.host+`/info/prizm/balance/PRIZM-GPN2-8CZ7-PNYP-8CEHG`,
        dataType: 'json',
        success: function (json) {
            currentBalanceWallet = json.balance / 100;
            $.ajax({
                type: 'GET',
                url: location.protocol+`//`+location.host+`/getpara/${id}/`,
                dataType: 'json',
                success: function (json) {
                    //console.log('GetPara: '+json[0].count);
                    //console.log('GetPara unix_date:'+json[0].date)

                    let insec = currentBalanceWallet * 0.0014 / 864 / 100 ;
                    //console.log('В секунду:' + insec);

                    insec = insec.toString().substring(0, 10);
                    //console.log('Обрезанная: ' + insec);

                    let currentTimeUnix = Date.now().toString();
                    currentTimeUnix = currentTimeUnix.substring(0, currentTimeUnix.length - 3);

                    let delta = currentTimeUnix - json[0].date;
                    //console.log('Разница во времени: '+delta);

                    let total = delta * insec + json[0].count;
                    total = total.toString().substring(0, 10);


                    $("#currentPara").html('Текущий парамайнинг кошелька: '+total+'P');
                }
            });
        }
    });

    

    

    
})
