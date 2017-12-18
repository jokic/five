//棋盘的信息设置
var tableData = {
	size: 15, //设置棋盘的大小
	tablePadding: 20, //设置棋盘的内边距大小
	chessSize: 14, //设置棋子的大小
	chessBoxSize: 20, //棋盘格子大小
	chessData: [], //棋盘的下棋信息
	success: false, //是否已经胜利
	role:false, //role为true是为白棋回合，role为false为黑棋回合
	pveMode: false, //人机模式
	myTurn: false //我的回合，fasle为白棋后手，true为黑棋先手
}

var table = document.getElementById('table');
var tableBG = document.getElementById('table-bg');
	tableBG.style.padding = tableData.tablePadding+ "px";
var tbBtn = document.getElementById('takeBack');
var cancleTbBtn = document.getElementById('cancleTakeBack');
var practiceBtn = document.getElementById('practice');
var pveBtn = document.getElementById('pve');
var tipBox = document.getElementById('tip-box');
var tip = document.getElementById('tip');


//棋盘数据
var chessData = tableData.chessData;
//最后一步的棋子
var lastChess;
//倒数第二个棋子
var nextToLastChess;

// DOM方法的操作—————————————————————————
//创建<tr>
function createTr() {
	return document.createElement("tr")
}

//创建<td>
function createTd() {
	return document.createElement("td")
}

//创建<span> 作为棋子
function createSpan() {
	var chess = document.createElement("span");
	chess.style.width = chess.style.height = tableData.chessSize + "px";
	return chess
}

//画线
function picLine() {
	var size = tableData.size;
	var tableLine = document.createElement("tbody");
	for (var i = 0; i < size - 1; i++) {
		var newTr = createTr();
		for (var j = 0; j < size - 1; j++) {
			newTr.appendChild(createTd())
		}
		tableLine.appendChild(newTr)
	}
	table.appendChild(tableLine);
}

//获取棋盘位置信息
function initPosition() {
	//棋盘左侧位置
	offsetTop = tableBG.offsetTop;
	//棋盘右侧位置
	offsetLeft = tableBG.offsetLeft;
}

//点击棋盘
function clickTable(event) {
	if (tableData.success || !tableData.myTurn) {
		return
	}
	var boxSize = tableData.chessBoxSize; 
	var e = event;
	var clickX = e.clientX - offsetLeft;
	var clickY = e.clientY - offsetTop;
	var xl = clickX % boxSize;
	var yl = clickY % boxSize;
	var x = Math.floor(clickX/boxSize) + (xl>(boxSize/2)?1:0);
	var y = Math.floor(clickY/boxSize) + (yl>(boxSize/2)?1:0);
	if (x >= 0 && y >= 0) {
		setChess(x, y);
	}
}
// DOM方法的操作—————————————————————————

//通用方法——————————————————————————————————————————

//初始化棋盘信息
function initChessData() {
	var size = tableData.size;
	var boxSize = tableData.chessBoxSize; 
	chessData = tableData.chessData = [];
	for (var i = 0; i < size; i++) {
		var newRow = [];
		for (var j = 0; j < size; j++) {
			newRow.push({
				x: (j+1) * boxSize,
				y: (i+1) * boxSize,
				role: null
			})
		}
		chessData.push(newRow)
	}
}

//切换回合
function changeRole(){
	tableData.role = !tableData.role;
	if(tableData.pveMode){
		tableData.myTurn = !tableData.myTurn
	}
}
//获取当前/上回合棋子的颜色
function getRole(other){
	//other为undefined时获取当前回合，为true时获取上回合
	var role = tableData.role;
	if(other){
		role = !role;
	}
	return role?"white":"black"
}

//机器下棋
function mcSetChess() {
	var chess = analyseData();
	console.log(chess);
	setChess(chess.x,chess.y);
}


function weightSet(arr,value){
	var regList = [];
	for (var i = 0; i < arr.length; i++) {
		var reg = arr[i].split("-")[0];
		var pos = Number(arr[i].split("-")[1]);
		regList.push({
			reg: new RegExp(reg),
			pos: pos
		})
	}
	return {
		regList: regList,
		weight: value
	}
}
//分值权衡列表
var weightList = [
	weightSet(["11110-4","11101-3","11011-2","10111-1","01111-0"],10000),
	weightSet(["22220-4","22202-3","22022-2","20222-1","02222-0"],9999),
	weightSet(["011100-4","011010-3","010110-2","001110-1"],1000), //活四
	weightSet(["022200-4","022020-3","020220-2","002220-1"],999),
	weightSet([ "11100-3","11100-4","11010-2","11010-4","11001-2","11001-3",
				"10101-1","10101-3","10011-1","10011-2","01011-0","01011-2",
				"00111-0","00111-1"],150),//死四
	weightSet([ "22200-3","22200-4","22020-2","22020-4","22002-2","22002-3",
				"20202-1","20202-3","20022-1","20022-2","02022-0","02022-2",
				"00222-0","00222-1"],149),
	weightSet(["01100-3","01010-2","00110-1"],100),//活三
	weightSet(["02200-3","02020-2","00220-1"],99),
	weightSet(["11000-2","10100-1","01100-0","00011-2","00101-3","00110-4"],15),//死三
	weightSet(["22000-2","20200-1","02200-0","00022-2","00202-3","00220-4"],14),
	weightSet(["00010-2","01000-2"],10),  //活二
	weightSet(["00020-2","02000-2"],9),
	weightSet(["00010-4","01000-0"],2),  //死二
	weightSet(["00020-4","02000-0"],1)
]
console.log(weightList);
//分析棋盘数据:判断胜率最高的位置，并且讲该位置返回
function analyseData(role) {
	var role = tableData.role;
	//如果是先手的话，先下天元
	console.log(lastChess);
	if(!lastChess){
		return {
			x: Math.ceil(tableData.size/2),
			y: Math.ceil(tableData.size/2)
		}
	}
	var size = tableData.size;
	// 分析权重
	// 活四 *1111* ——1000000最高权限
	// 死四1 *1111或 1111* ——5000
	// 死四2 1*111或111*1 —— 5000
	// 死四3 11*11 —— 5000
	// 活三1 0111*0或 0*1110 ——2500
	// 活三2 *1110*或 *0111* ——1000
	// 死三1 11*00或 00*11 ——1000
	var valueData = [];
	//转换成字符串列表形式来计算1表示当前棋子的颜色，2表示对方的棋子的颜色，0表示为空
	//横向排列
	var rowList = [];
	//竖向排列
	var standList = [];
	//左斜排列
	var leftSkewList = [];
	var leftSkewPosList = [];
	//右斜排列
	var rightSkewList = [];
	var rightSkewPosList = [];
	var role = role?"white":"black";
	console.log(role);
	console.log(chessData);
	//横向排列和竖向排列生成，同时创建权重分析容器
	for(var i = 0; i<size; i++){
		var newRow = [];
		var newList = [];
		var valueList = [];
		for(var j = 0;j<size; j++){
			//横向选择
			if(chessData[i][j].role === null){
				newRow.push(0);
			}else if(chessData[i][j].role == role){
				newRow.push(1);
			}else{
				newRow.push(2);
			}
			//竖向选择
			if(chessData[j][i].role === null){
				newList.push(0);
			}else if(chessData[j][i].role == role){
				newList.push(1);
			}else{
				newList.push(2);
			}
			var chess = {
				x: j+1,
				y: i+1,
				value: 0
			};
			valueList.push(chess)
		} //权重分析的容器
		valueData.push(valueList); 
		rowList.push(newRow.join(""))
		standList.push(newList.join(""));
	}
	//这里获得了棋盘的一维数据模型rowList（横向）和standList（竖向）
	//左斜排列和右斜排列生成
	for (var i = 4; i < 25; i++) {
		var residue = i%14; //size一般为15，获取余数
		var arrLength = i>14?15-residue:i+1;
		var newLeft = [];
		var newRight = [];
		var newLeftPos = [];
		var newRightPos = [];

		for (var j = 0; j < arrLength; j++) {
			var left_x;
			var left_y;
			var right_x;
			var right_y;
			if(i<=14){
				left_y = i - j;
				left_x = j;
				right_x = j;
				right_y = 14 - i + j;　
			}else{
				left_y = 14 - j;
				left_x = j + residue;
				right_x = j + residue;
				right_y = j;　
			}
			// console.log(right_x,right_y,i)
			if(chessData[left_y][left_x].role === null){
				newLeft.push(0);
			}else if(chessData[left_y][left_x].role == role){
				newLeft.push(1);
			}else{
				newLeft.push(2);
			}
			newLeftPos.push({
				y: left_y,
				x: left_x
			})
			if(chessData[right_y][right_x].role === null){
				newRight.push(0);
			}else if(chessData[right_y][right_x].role == role){
				newRight.push(1);
			}else{
				newRight.push(2);
			}
			newRightPos.push({
				y: right_y,
				x: right_x
			})
		}
		leftSkewList.push(newLeft.join(""))
		leftSkewPosList.push(newLeftPos);
		rightSkewList.push(newRight.join(""));
		rightSkewPosList.push(newRightPos);
	}
	//进行正则匹配分析权重
	// console.log(valueData);
	// console.log("横",rowList);
	// console.log("竖",standList);
	console.log("右",rightSkewList);
	console.log("左",leftSkewList);
	for(var i = 0; i<size; i++){
		for (var j = 0; j < weightList.length; j++) {
			var weight = weightList[j].weight
			var regList = weightList[j].regList
			//循环遍历每个权重分析
			for (var o = 0; o < regList.length; o++) {
				if(regList[o].reg.exec(rowList[i])){
					res = regList[o].reg.exec(rowList[i]);
					console.log("横向：",res);
					valueData[i][res.index+regList[o].pos].value += weight;
				}
				if(regList[o].reg.exec(standList[i])){
					res = regList[o].reg.exec(standList[i]);
					console.log("竖向：",res);
					valueData[res.index+regList[o].pos][i].value += weight;
				}
			}
		}
	}
	for(var i = 0; i<21; i++){
		for (var j = 0; j < weightList.length; j++) {
			var weight = weightList[j].weight
			var regList = weightList[j].regList
			//循环遍历每个权重分析
			for (var o = 0; o < regList.length; o++) {
				if(i < 21 && regList[o].reg.exec(leftSkewList[i])){
					res = regList[o].reg.exec(leftSkewList[i]);
					var pos = leftSkewPosList[i][res.index+regList[o].pos]
					console.log("左斜：",res);
					valueData[pos.y][pos.x].value += weight;
				}
				if(i < 21 && regList[o].reg.exec(rightSkewList[i])){
					res = regList[o].reg.exec(rightSkewList[i]);
					var pos = rightSkewPosList[i][res.index+regList[o].pos]
					console.log("右斜：",res);
					valueData[pos.y][pos.x].value += weight;
				}
			}
		}
	}
	console.log(valueData);
	//计算最优的位置
	var max = [];
	for (var i = 0; i < size; i++) {
		for (var j = 0; j < size; j++) {
			if (max.length == 0 || valueData[i][j].value > max[0].value) {
				max = [valueData[i][j]]
			}else if(valueData[i][j].value == max[0].value){
				max.push(valueData[i][j]);
			}
		}
		
	}
	console.log("最优位置",max);
	// for(var i = 0;i<max.length;i++){
	// 	setTest(max[i].x,max[i].y)
	// }
	var chessIndex = Math.floor(Math.random()*max.length);
	return {
		x: max[chessIndex].x,
		y: max[chessIndex].y
	}
	
}

function setTest(x,y){
	var boxSize = tableData.chessBoxSize;
	var chessSize = tableData.chessSize;
	var testChess = document.getElementsByClassName('test');
	testLength = testChess.length;
	for (var i = 0; i < testLength; i++) {
		tableBG.removeChild(testChess[0])
	}
	var chess = createSpan();
	chess.className = "test";
	chess.style.top = y*boxSize-chessSize/2 + "px";
	chess.style.left = x*boxSize-chessSize/2 + "px";
	tableBG.appendChild(chess);
}

//下棋
function setChess(x, y) {
	var x_ = x-1;
	var y_ = y-1;
	disabledBtn(cancleTbBtn);
	var boxSize = tableData.chessBoxSize;
	var chessSize = tableData.chessSize;
	if (chessData[y_][x_].role === null) {
		console.log("下棋位置",x,y,tableData.role)
		//当前位置为空，表示可以下棋
		//获取当前回合棋子颜色
		var role = getRole();
		chessData[y_][x_].role = role;  
		var chess = createSpan();
		chess.className = role;
		chess.style.top = y*boxSize-chessSize/2 + "px";
		chess.style.left = x*boxSize-chessSize/2 + "px";
		//保存下当前和上一个棋子的信息
		if (lastChess) {
			nextToLastChess = lastChess;
			console.log("解开限制")
			disabledBtn(tbBtn,true);
		}
		lastChess = {
			node: chess,
			x: x_,
			y: y_,
			role: role
		}
		tableBG.appendChild(chess);
		if(isSuccess(x,y)){
			tableData.success = true;
			showSuccess(role);
			return
		}
		//更换回合
		changeRole()
		//如果是人机对战，判断是否到机器回合，如果是就交给机器下
		if(tableData.pveMode){
			if(!tableData.myTurn){
				mcSetChess();
			}
		}
	}else{
		console.log("位置有棋子了！");
	}
	console.log(chessData)
}

//悔棋
//一般的悔棋基本上都是在已方回合发起，所以一旦选择悔棋，应该是回退到自己上一回合的状态，也就是需要把最后两次的下棋给还原。
function takeBack() {
	chessData[lastChess.y][lastChess.x].role = null;
	chessData[nextToLastChess.y][nextToLastChess.x].role = null;
	tableBG.removeChild(lastChess.node);
	tableBG.removeChild(nextToLastChess.node);
	disabledBtn(cancleTbBtn,true);
	disabledBtn(tbBtn);
}

//撤销悔棋
function cancleTakeBack() {
	chessData[lastChess.y][lastChess.x].role = getRole(true);
	chessData[nextToLastChess.y][nextToLastChess.x].role = getRole();
	tableBG.appendChild(nextToLastChess.node);
	tableBG.appendChild(lastChess.node);
	disabledBtn(cancleTbBtn);
	disabledBtn(tbBtn,true);
}

//清除所有棋子
function clearChess() {
	var ownChess = document.getElementsByClassName('white');
	ownLength = ownChess.length;
	for (var i = 0; i < ownLength; i++) {
		tableBG.removeChild(ownChess[0])
	}
	var otherChess = document.getElementsByClassName('black');
	otherLength = otherChess.length;
	for (var i = 0; i < otherLength; i++) {
		tableBG.removeChild(otherChess[0])
	}
}

//设置按钮是否可用
function disabledBtn(elm, disabled){
	if(disabled){
		elm.removeAttribute("disabled");
	}else{
		elm.setAttribute("disabled", "disabled");
	}
}

//重新开始
function reStart() {
	//重置棋盘数据
	initChessData();
	//清除所有棋子
	clearChess();
	lastChess = null;
	nextToLastChess = null;
	tableData.success = false;
	tableData.role = false;
	disabledBtn(tbBtn);
	disabledBtn(cancleTbBtn)
	if(tableData.pveMode){
		mcModeStart(true);
	}else{
		practiceStart(true);
	}
}
//练习模式
function practiceStart(needRe){
	showTip("练习模式")
	console.log("开启练习模式");
	tableData.pveMode = false;
	tableData.myTurn = true;
	disabledBtn(practiceBtn)
	disabledBtn(pveBtn,true)
	if(!needRe){
		reStart();
	}
}
//人机模式
function mcModeStart(needRe) {
	var turn = tableData.myTurn = Math.random()>0.5;
	showTip("人机模式，你为" + (turn?"黑棋先手":"白棋后手"))
	console.log("开启人机模式");
	disabledBtn(practiceBtn,true)
	disabledBtn(pveBtn)
	tableData.pveMode = true;
	if(!needRe){
		reStart();
	}
	if(!turn){
		console.log("机器人先手");
		mcSetChess();
	}
}
//判断是否能够胜利
function isSuccess(x,y) {
	var role = getRole();
	var count = 1;
	var x_ = y - 1 ;
	var y_ = x - 1;
	//检查横向是否胜利
	x = x_ - 1;
	while (x >= 0 && chessData[x][y_].role == role){
		count++
		x--;
	}
	x = x_ + 1;
	while (x <= 14 && chessData[x][y_].role == role){
		count ++;
		x++;
	}
	if (count >= 5) {
		return true
	}
	//检查竖向是否胜利
	count = 1;
	y = y_ - 1;
	while (y >= 0 && chessData[x_][y].role == role){
		count++
		y--;
	}
	y = y_ + 1
	while (y <= 14 && chessData[x_][y].role == role){
		count ++;
		y++;
	}
	if (count >= 5) {
		return true
	}
	//判断左斜是否胜利
	count = 1;
	y = y_ - 1;
	x = x_ - 1;
	while (y >= 0 && x >= 0 && chessData[x][y].role == role){
		count++;
		y--;
		x--;
	}
	y = y_ + 1;
	x = x_ + 1;
	while (y <= 14 && x <= 14 && chessData[x][y].role == role){
		count ++;
		y++;
		x++;
	}
	if (count >= 5) {
		return true
	}
	//判断右斜是否胜利
	count = 1;
	y = y_ - 1;
	x = x_ + 1;
	while (y >= 0 && x <= 14 && chessData[x][y].role == role){
		count++;
		y--;
		x++;
	}
	y = y_ + 1;
	x = x_ - 1; 
	while (y <= 14 && x >= 0 && chessData[x][y].role == role){
		count ++;
		y++;
		x--;
	}
	if (count >= 5) {
		return true
	}
	console.log(count,role)
	return false;
}

//胜利后的操作
function showSuccess(role) {
	disabledBtn(cancleTbBtn);
	disabledBtn(tbBtn);
	console.log(role+"赢了");
	showTip(role+"赢了",true);
}
//通用方法——————————————————————————————————————————

//初始化棋盘
function initTable() {
	picLine();
	initPosition();
	initChessData();
	practiceStart();
}
//提示信息
var Timer;
function showTip(text,keep){
	clearTimeout(Timer);
	tip.innerText = text;
	tipBox.style.zIndex = "1";
	tipBox.style.opacity = "1";
	if(keep){
		return
	}
	Timer = setTimeout(function(){	
		hideTip()
	},1000)
}
function hideTip(){
	tipBox.style.opacity = 0;
	Timer = setTimeout(function(){
		tipBox.style.zIndex = "-1";
	},500)
}
//入口程序
initTable();