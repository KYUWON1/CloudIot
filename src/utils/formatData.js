// 날짜를 'YYYY-MM-DD' 형식으로 포맷팅하는 함수
function formatDate(date) {
  return date.toISOString().split("T")[0];
}

module.exports = formatDate;
