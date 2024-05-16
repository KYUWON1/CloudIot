// 초를 시, 분, 초 단위로 변환하는 함수
function convertToTime(seconds) {
  var hours = Math.floor(seconds / 3600);
  var minutes = Math.floor((seconds % 3600) / 60);
  var remainingSeconds = seconds % 60;
  return hours + "시간 " + minutes + "분 " + remainingSeconds + "초";
}

module.exports = {
    convertToTime
}
