// 05.03 규원 index.js 추가
const express = require("express");
const mqtt = require("mqtt");
const path = require("path");

const app = express(); // 오류 수정: express 함수 호출
const db = require("./src/data/Database");
const mainRoute = require("./src/routes/main-route");
const dataRoute = require("./src/routes/get-data-route");

app.set("view engine", "ejs"); //ejs를 view engine으로 사용하겟다
app.set("views", path.join(__dirname, "views"));

app.use(express.static("public"));

app.use(express.urlencoded({ extended: false }));
app.use(express.json()); //json형식의 데이터 체크

// 포트 번호
const port = 3000;

// MQTT 클라이언트 설정
const client = mqtt.connect("mqtt://broker.hivemq.com:1883");

// 클라이언트 연결 및 초기화
client.on("connect", () => {
  console.log("Connected to MQTT broker");
  // 온도 구독
  client.subscribe("temperature");
  // sleepstate값을 보냄
  sendsleepstate();
});

//aggregate함수에 전달할 pipeline, sleepstate 배열을 풀고 sleepstate.level이 rem인 값들만을 db에서 project 포맷으로 가져옴
const pipeline = [
  {
    $unwind: "$sleepState",
  },
  {
    $match: {
      "sleepState.level": "rem",
    },
  },
  {
    $project: {
      dateTime: "$sleepState.dateTime",
      level: "$sleepState.level",
      seconds: "$sleepState.seconds",
    },
  },
];

//db에서 sleepstate 배열의 오브젝트들을 가져와서 보내는 코드
async function sendsleepstate() {
  var aggCursor = db.getDb().collection("sleepdata").aggregate(pipeline);
  for await (const message of aggCursor) {
    console.log("sleepdata:", message);
    client.publish("sleepdata", JSON.stringify(message));
  }
}

// 데이터 라우트 추가
app.use("/",mainRoute);
app.use("/api", dataRoute);

// MQTT 메시지를 받을 때마다 처리
// client.on("message", (temperature, message) => {
//   console.log(`Received message from ${temperature}: ${message.toString()}`);
//   // 받은 메시지를 저장하거나 처리
//   // 예: 최신 온도 데이터를 전역 변수에 저장
//   lastTemperature = message.toString(); // 실제 사용 시 좀 더 복잡한 로직 구현
// });

// 데이터베이스 연결 및 서버 시작
db.connectToDatabase()
  .then(function () {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch(function (error) {
    console.log("DB 연결실패:", error);
  });
