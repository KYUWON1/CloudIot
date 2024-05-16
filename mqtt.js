const mqtt = require("mqtt");
/*const sensorLib = require("node-dht-sensor")*/
const client = mqtt.connect("mqtt://broker.hivemq.com:1883");
const timearr = [];
var avgPeriod = 0;

client.on("connect", () => {
  console.log(client.connected);
  client.subscribe("sleepdata");
});

client.on("message", (sleepdata, message) => {
  var temp = JSON.parse(message);
  var datetime = temp.dateTime;
  var second = temp.seconds;
  timearrobj = ToTimeArr(datetime, second);
  timearr.push(timearrobj);
  console.log(timearrobj[0], timearrobj[1]);
  if (!(timearr.length <= 1)) {
    for (let i = 0; i < timearr.length; i++) {
      if (i + 1 == timearr.length) continue;
      var tmp1 = ToSec(timearr[i][1]);
      var tmp2 = ToSec(timearr[i + 1][0]);
      if (tmp2 - tmp1 < 0) continue;
      avgPeriod = avgPeriod + (tmp2 - tmp1);
    }
    avgPeriod = parseInt(avgPeriod / (timearr.length - 1), 10);
    console.log(ToTime(avgPeriod));
  }
});

function ToTimeArr(datetime, second) {
  var tmp = datetime.split("T");
  var date = tmp[0];
  var time = tmp[1].split(":");
  var hour = parseInt(time[0], 10),
    min = parseInt(time[1], 10),
    sec = parseInt(time[2], 10);
  var start = [hour, min, sec];
  sec = sec + (second % 60);
  if (sec / 60 >= 1) {
    min += 1;
    sec = sec % 60;
  }
  min = parseInt(min + second / 60, 10);
  if (min / 60 >= 1) {
    hour += 1;
    min = min % 60;
  }
  console.log(date);
  var end = [hour, min, sec];
  return [start, end];
}

function ToSec(time) {
  var hour = time[0],
    min = time[1],
    sec = time[2];
  var total;
  total = hour;
  total = total * 60 + min;
  total = total * 60 + sec;
  return total;
}

function ToTime(total) {
  var hour, min, sec;
  sec = total % 60;
  total = (total - sec) / 60;
  min = total % 60;
  hour = (total - min) / 60;
  return [hour, min, sec];
}

/*var temperature
var humidity

var sensor = {
	initialize: function(){
		return sensorLib.initialize(11,4)
	},
	read: function() {
		var readout = sensorLib.read()
		console.log("temperature: "+readout.temperature.toFixed(2)+'C, humidity: '+readout.humidity.toFixed(2)+'%')
		temperature = readout.temperature.toFixed(2)
		humidity = readout.humidity.toFixed(2)
		setTimeout(function(){
			sensor.read()
		}, 1500)
	}
}

if(sensor.initialize()){
	sensor.read()
} else{
	console.warn("Failed to initialize sensor")
}*/
