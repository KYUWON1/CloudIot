// Axios 모듈을 가져옵니다.
const axios = require("axios");


// 날짜를 'YYYY-MM-DD' 형식으로 포맷팅하는 함수
function formatDate(date) {
  return date.toISOString().split("T")[0];
}

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
    "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyM1MzN0siLCJzdWIiOiJDMlZaSE4iLCJpc3MiOiJGaXRiaXQiLCJ0eXAiOiJhY2Nlc3NfdG9rZW4iLCJzY29wZXMiOiJyc29jIHJlY2cgcnNldCByb3h5IHJudXQgcnBybyByc2xlIHJjZiByYWN0IHJsb2MgcnJlcyByd2VpIHJociBydGVtIiwiZXhwIjoxNzE0NzM1MzM1LCJpYXQiOjE3MTQ3MDY1MzV9.n6x1DnP32FxY5sZcBVcPLya7xJ68KGiAMPdMlywVSME";

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
          return {
            deviceId: deviceResponse.data[0].id,
            //total: sleepResponse.data.sleep[0],
            sleepDate: sleepResponse.data.sleep[0].dateOfSleep, // 0번째 배열이 제일 최신배열
            asleepTotal: sleepResponse.data.sleep[0].timeInBed,
            asleepMin: sleepResponse.data.sleep[0].minutesAsleep,
            awakeMin: sleepResponse.data.sleep[0].minutesAwake,
            sleepSummary: sleepResponse.data.sleep[0].levels.summary,
            sleepState: sleepResponse.data.sleep[0].levels.data,
            //sleep[3].levels
          };
        })
        .catch((sleepError) => {
          console.error("Error fetching sleep data:", sleepError);
          throw sleepError; // 오류를 던져 상위 함수에 알림
        });
    })
    .catch((deviceError) => {
      console.error("Error fetching device data:", deviceError);
      throw deviceError; // 오류를 던져 상위 함수에 알림
    });
}


  getSleepData()
    .then((result) => {
      const levels = result;
      console.log(levels);
    })
    .catch((error) => console.error("An error occurred:", error));