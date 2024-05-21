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
  { $sort: { dateTime: 1 } }, // '1'은 오름차순, '-1'은 내림차순을 의미합니다.
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
  //today.setDate(today.getDate() - 1); // fitbit은 어제 날짜까지의 데이터만 제공합니다.
  sevenDaysAgo.setDate(today.getDate() - 7);

  // 오늘 날짜와 7일 전 날짜를 콘솔에 출력합니다.
  console.log("Today's date: " + formatDate(today));
  console.log("Seven days ago: " + formatDate(sevenDaysAgo));

  // 사용할 accessToken
  var accessToken =
    "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyM1MzN0siLCJzdWIiOiJDMlZaSE4iLCJpc3MiOiJGaXRiaXQiLCJ0eXAiOiJhY2Nlc3NfdG9rZW4iLCJzY29wZXMiOiJyc29jIHJlY2cgcnNldCByb3h5IHJudXQgcnBybyByc2xlIHJjZiByYWN0IHJsb2MgcnJlcyByd2VpIHJociBydGVtIiwiZXhwIjoxNzE2MzE4ODkzLCJpYXQiOjE3MTYyOTAwOTN9.AnVJePspdzXgiCmmXmyWME8jOwCad9AwnLqAB_KgP0I"
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
      today
    )}.json`,
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
          res.redirect("/api/getStoredData"); 
        });
    })
    .catch((deviceError) => {
      console.error("Error fetching device data:", deviceError);
      res.status(500).send("Error fetching device data");
    });
}

// 저장된 수면데이터 모두 가져오는 함수
async function getStoredSleepData(req, res) {
  const result = await db
    .getDb()
    .collection("sleepdata")
    .find()
    .sort({ sleepDate: 1 })
    .toArray();
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
        console.log("avgPeriod: " + avgPeriod); // 초단위
        console.log("ToTime: " + ToTime(avgPeriod));

        // rem 데이터를 배열에 추가
        remData.push({
          dateTime: datetime,
          avgPeriod: avgPeriod,
        });
      }
    }
    const remDataEnd = [];
    var totalAvg = 0;

    // remData 배열을 날짜별로 그룹화하기 위한 객체 생성
    const groupedData = remData.reduce((acc, data) => {
      const date = data.dateTime.split("T")[0]; // 날짜만 추출
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(data.avgPeriod); // avgPeriod를 초단위로 저장 (나중에 변환할 예정)
      return acc;
    }, {});

    // 날짜별로 평균 계산
    for (const [date, periods] of Object.entries(groupedData)) {
      const totalPeriod = periods.reduce((sum, period) => sum + period, 0);
      const avgPeriod = Math.floor(totalPeriod / periods.length); // 소수점 이하 버림
      remDataEnd.push({
        dateTime: date,
        avgPeriod: convertToTime(avgPeriod), // 초단위를 시간 문자열로 변환
      });
      totalAvg += avgPeriod;
    }

    // remDataEnd 배열 출력 (디버깅용)
    for (const data of remDataEnd) {
      console.log("remDataEnd:", data);
    }

    totalAvg = parseInt(totalAvg / remDataEnd.length, 10);
    console.log("totalAvg: " + convertToTime(totalAvg));
    // 데이터를 렌더링하기 전에 remData의 avgPeriod를 변환
    remData.forEach(function (data) {
      data.avgPeriod = convertToTime(data.avgPeriod);
    });

    // rem-avg.ejs 뷰에 데이터 전달하여 렌더링
    res.render("rem-avg", {
      remData: remDataEnd,
      totalAvg: convertToTime(totalAvg),
    });
  } catch (error) {
    console.error("Error in renderRemAvg function:", error);
    // 에러 처리 코드 추가
    res.status(500).send("Error rendering rem-avg");
  }
}

// 새로운 API 엔드포인트 생성
async function getTotalRemAvg(req, res) {
  try {
    const dataArray = await db.getDb().collection("sleepdata").aggregate(pipeline).toArray();

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
        console.log("avgPeriod: " + avgPeriod); // 초단위
        console.log("ToTime: " + ToTime(avgPeriod));

        // rem 데이터를 배열에 추가
        remData.push({
          dateTime: datetime,
          avgPeriod: avgPeriod,
        });
      }
    }

    const remDataEnd = [];
    var totalAvg = 0;

    const groupedData = remData.reduce((acc, data) => {
      const date = data.dateTime.split("T")[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(data.avgPeriod);
      return acc;
    }, {});

    for (const [date, periods] of Object.entries(groupedData)) {
      const totalPeriod = periods.reduce((sum, period) => sum + period, 0);
      const avgPeriod = Math.floor(totalPeriod / periods.length);
      remDataEnd.push({
        dateTime: date,
        avgPeriod: convertToTime(avgPeriod),
      });
      totalAvg += avgPeriod;
    }

    totalAvg = parseInt(totalAvg / remDataEnd.length, 10);
    console.log("totalAvg: " + convertToTime(totalAvg));

    res.json({ totalAvg: convertToTime(totalAvg) });
  } catch (error) {
    console.error("Error in /api/total-avg endpoint:", error);
    res.status(500).json({ message: "Error calculating total average" });
  }
};



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
  getTotalRemAvg,
};
