const express = require("express");
const morgan = require("morgan");
const path = require("path");
const mongoose = require("mongoose");
const cors = require("cors");

require("dotenv").config({ path: ".env" });

const userRouter = require("./routes/users");
const diaryRouter = require("./routes/diaries");

const app = express();
app.set("port", process.env.PORT || 3001);

mongoose
  .connect(
    `mongodb+srv://${process.env.USER_NAME}:${process.env.PASSWORD}@dreamable.isiau.mongodb.net/?retryWrites=true&w=majority`,
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
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api/user", userRouter);
app.use("/api/diary", diaryRouter);

app.use((req, res, next) => {
  const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  error.status = 404;
  next(error);
});

app.listen(app.get("port"), () => {
  console.log(app.get("port"), "번 포트에서 대기중");
});
