// 05.03 규원 컨트롤러 추가 및 데이터가져오기 및 저장하기, 저장된 데이터 가져오기 함수 추가
// 코드 재정리 
const axios = require("axios");
const db = require("../data/Database");
const formatData = require("../utils/formatData");

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

function convertToTime(seconds) {
  var hours = Math.floor(seconds / 3600);
  var minutes = Math.floor((seconds % 3600) / 60);
  var remainingSeconds = seconds % 60;
  return hours + "시간 " + minutes + "분 " + remainingSeconds + "초";
}

// 날짜를 'YYYY-MM-DD' 형식으로 포맷팅하는 함수
function formatDate(date) {
  return date.toISOString().split("T")[0];
}
// fitbit에서 데이터 가져오는 함수 
function getSleepData(req, res) {
  // 오늘 날짜와 7일 전 날짜를 계산합니다.
  const today = new Date();
  const sevenDaysAgo = new Date(today);

  // 7일을 빼서 7일 전 날짜를 설정합니다.
  sevenDaysAgo.setDate(today.getDate() - 7);

  // 오늘 날짜와 7일 전 날짜를 콘솔에 출력합니다.
  console.log("Today's date: " + formatDate(today));
  console.log("Seven days ago: " + formatDate(sevenDaysAgo));

  // 사용할 accessToken
  var accessToken =
    "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyM1MzN0siLCJzdWIiOiJDMlZaSE4iLCJpc3MiOiJGaXRiaXQiLCJ0eXAiOiJhY2Nlc3NfdG9rZW4iLCJzY29wZXMiOiJyc29jIHJlY2cgcnNldCByb3h5IHJwcm8gcm51dCByc2xlIHJjZiByYWN0IHJyZXMgcmxvYyByd2VpIHJociBydGVtIiwiZXhwIjoxNzE1ODc5NDc2LCJpYXQiOjE3MTU4NTA2NzZ9.WVunstmZg2hPRPdtLPQGfW050XG_v_b9VT_hEvWvS4Y";

  // 디바이스 정보 요청 설정
  const deviceConfig = {
    method: "get",
    url: "https://api.fitbit.com/1.2/user/-/devices.json",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };

  // 수면 정보 요청 설정
  const sleepConfig = {
    method: "get",
    url: `https://api.fitbit.com/1.2/user/-/sleep/date/${formatDate(
      sevenDaysAgo
    )}/${formatDate(today)}.json`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };

  return axios(deviceConfig)
    .then((deviceResponse) => {
      //console.log("Device Data:", JSON.stringify(deviceResponse.data));
      return axios(sleepConfig)
        .then((sleepResponse) => {
          //console.log("Sleep Data:", JSON.stringify(sleepResponse.data));
          const sleepData = {
            deviceId: deviceResponse.data[0].id,
            sleepDate: sleepResponse.data.sleep[0].dateOfSleep,
            asleepTotal: sleepResponse.data.sleep[0].timeInBed,
            asleepMin: sleepResponse.data.sleep[0].minutesAsleep,
            awakeMin: sleepResponse.data.sleep[0].minutesAwake,
            sleepSummary: sleepResponse.data.sleep[0].levels.summary,
            sleepState: sleepResponse.data.sleep[0].levels.data,
          };

          // 업데이트할 필터 설정
          const filter = {
            deviceId: sleepData.deviceId,
            sleepDate: sleepData.sleepDate,
          };

          // 업데이트할 데이터 설정
          const update = {
            $set: sleepData,
          };

          // upsert 옵션을 true로 설정
          const options = {
            upsert: true,
          };
          db.getDb().collection("sleepdata").updateOne(filter, update, options);
          res.render("sleep-data", { sleepData: sleepData });
        })
        .catch((sleepError) => {
          console.error("Error fetching sleep data:", sleepError);
          res.status(500).send("Error fetching sleep data");
        });
    })
    .catch((deviceError) => {
      console.error("Error fetching device data:", deviceError);
      res.status(500).send("Error fetching device data");
    });
}

// 저장된 수면데이터 모두 가져오는 함수
async function getStoredSleepData(req, res) {
  const result = await db.getDb().collection("sleepdata").find().toArray();
  res.render("stored-sleep-data",{result:result});
}

async function getRemAvg(req, res) {
  try {
    const dataArray = await db
      .getDb()
      .collection("sleepdata")
      .aggregate(pipeline)
      .toArray();

    // rem 데이터를 저장할 배열
    const remData = [];
    const timearr = [];
    var avgPeriod = 0;

    // 렌더링에 필요한 데이터를 처리
    for (const data of dataArray) {
      //console.log("sleepdata:", data);
      var datetime = data.dateTime;
      var second = data.seconds;
      timearrobj = ToTimeArr(datetime, second);
      timearr.push(timearrobj);
      console.log("시작시간:" + timearrobj[0] + " 종료시간:" + timearrobj[1]);
      if (!(timearr.length <= 1)) {
        for (let i = 0; i < timearr.length; i++) {
          if (i + 1 == timearr.length) continue;
          var tmp1 = ToSec(timearr[i][1]);
          var tmp2 = ToSec(timearr[i + 1][0]);
          if (tmp2 - tmp1 < 0) continue;
          avgPeriod = avgPeriod + (tmp2 - tmp1);
        }
        avgPeriod = parseInt(avgPeriod / (timearr.length - 1), 10);
        console.log("ToTime: " + ToTime(avgPeriod));

        // rem 데이터를 배열에 추가
        remData.push({
          dateTime: datetime,
          avgPeriod: avgPeriod,
        });
      }
    }
    // 데이터를 렌더링하기 전에 remData의 avgPeriod를 변환
    remData.forEach(function (data) {
      data.avgPeriod = convertToTime(data.avgPeriod);
    });

    // rem-avg.ejs 뷰에 데이터 전달하여 렌더링
    res.render("rem-avg", { remData: remData });
  } catch (error) {
    console.error("Error in renderRemAvg function:", error);
    // 에러 처리 코드 추가
    res.status(500).send("Error rendering rem-avg");
  }
}



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

module.exports = {
  getSleepData,
  getStoredSleepData,
  getRemAvg,
};
