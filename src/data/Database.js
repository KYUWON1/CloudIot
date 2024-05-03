// 05.03 규원 데이터 베이스 설정추가 (로컬)

const mongodb = require("mongodb");

const MongoClient = mongodb.MongoClient;

let database;

async function connectToDatabase() {
  const client = await MongoClient.connect("mongodb://localhost:27017");
  database = client.db("fitbit");
}

function getDb() {
  if (!database) {
    throw { message: "Database not connected" };
  }
  return database;
}

module.exports = {
  connectToDatabase,
  getDb,
};
