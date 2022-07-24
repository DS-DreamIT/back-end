const express = require("express");
const morgan = require("morgan");
const path = require("path");
const mongoose = require("mongoose");
const passport = require("passport");
const passportConfig = require("./auth/passport");

require("dotenv").config({ path: ".env" });

const userRouter = require("./routes/users");
const diaryRouter = require("./routes/diaries");

const app = express();
app.set("port", process.env.PORT || 3001);

mongoose
  .connect(
    `mongodb://${process.env.USER_NAME}:${process.env.PASSWORD}@localhost:27017/admin`,
    {
      dbName: "dreamable",
      useNewUrlParser: true,
    }
  )
  .then(() => console.log("Database connection OK"))
  .catch((error) => console.log("error :" + error));

// swagger
const { swaggerUi, specs } = require("./swagger/swagger");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

app.use(morgan("dev"));
//app.use('/', express.static(path.join(__dirname, 'public')));

// allow us to get the data in request.body
app.use(express.json({ extended: false }));
app.use(express.urlencoded({ extended: false }));

app.use("/api/user", userRouter);
app.use("/api/diary", diaryRouter);

// login
app.use(passport.initialize());
passportConfig();

app.use((req, res, next) => {
  const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  error.status = 404;
  next(error);
});

app.listen(app.get("port"), () => {
  console.log(app.get("port"), "번 포트에서 대기중");
});
