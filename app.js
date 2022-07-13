const express = require("express");
const morgan = require("morgan");
const path = require("path");
const mongoose = require("mongoose");

// router 등록만 해둠
const userRouter = require("./routes/user");
const diaryRouter = require("./routes/diary");

const app = express();
app.set("port", process.env.PORT || 3000);

mongoose
  .connect(
    `mongodb://${process.env.USER_NAME}:${process.env.PASSWORD}@27017/admin`,
    {
      dbName: process.env.DB_NAME,
      useNewUrlParser: true,
    }
  )
  .then(() => console.log("Database connection OK"))
  .catch((error) => console.log("error :" + error));

app.use(morgan("dev"));
//app.use('/', express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  error.status = 404;
  next(error);
});

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV !== "production" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

app.listen(app.get("port"), () => {
  console.log(app.get("port"), "번 포트에서 대기중");
});
