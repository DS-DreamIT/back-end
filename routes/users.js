const express = require("express");
const mongodb = require("mongodb");
const { User } = require("../models/user");
const { Diary } = require("../models/diary");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

require("dotenv").config({ path: ".env" });
const saltNum = 10;

const router = express.Router();

router.get("/", (req, res) => {
  // don't use
  User.find({}).exec((err, user) => {
    return res.status(200).json({ success: true, user });
  });
});

// 회원 정보 불러오기
router.get("/:userEmail", (req, res) => {
  let userEmail = req.params.userEmail;
  User.findOne({ email: userEmail }).exec((err, user) => {
    if (err) {
      return res.status(400).json({ success: false, err });
    }
    if (user) {
      Diary.find({ author: user._id }).exec((err, diaries) => {
        if (err) {
          return res.status(200).json({ success: true, user });
        }
        const diary_list = diaries.map((d) => {
          return { _id: d._id, emotion: d.emotion };
        });
        const diary_count = diaries.length;
        console.log(diary_count);
        return res.status(200).json({
          success: true,
          user,
          diary_list: diary_list,
          diary_count: diary_count,
        });
      });
    }
  });
});

// 회원가입
// body에 userEmail nickname password
router.post("/register", async (req, res) => {
  // body에 회원 정보 담아서 전송
  let { userEmail, nickname, password } = req.body;
  // user 정보가 잘 넘어왔는지 확인
  if (userEmail === "" || nickname === "" || password === "") {
    return res.json({ registerSuccess: false, message: "정보를 입력하세요" });
  }
  const sameEmailUser = await User.findOne({ email: userEmail });
  if (sameEmailUser !== null) {
    return res.json({
      registerSuccess: false,
      message: "이미 존재하는 이메일입니다",
    });
  }
  // 해쉬화
  bcrypt.genSalt(saltNum, (err, salt) => {
    if (err) {
      return res
        .status(200)
        .json({ success: false, message: "비밀번호 해쉬화 실패" });
    }
    bcrypt.hash(password, salt, async (err, hashResult) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "비밀번호 해쉬화 실패" });
      }
      // 해쉬화된 비밀번호로 교체
      password = hashResult;

      // 유저 db에 저장
      const user = await new User({
        ...req.body,
        email: userEmail,
        name: nickname,
        password,
      });

      user.save((err, user) => {
        if (err) {
          return res
            .status(200)
            .json({ success: false, type: "register", message: err });
        }
        const token = jwt.sign(
          { userId: user._id },
          process.env.JWT_SECRET_TOKEN
        );
        if (token) {
          return res
            .status(200)
            .json({ success: true, message: "register success", token, user });
        }
      });
    });
  });
});

// 로그인
// body에 email, password
router.post("/login", (req, res) => {
  // passport.authenticate("local", (passportError, user, info) => {
  //   if (passportError || !user) {
  //     return res.status(200).json({ success: false, message: info.reason });
  //   }

  //   req.login(user, { session: false }, (loginError) => {
  //     if (loginError) {
  //       return res.status(200).json({ success: false, message: loginError });
  //     }
  //   });
  //   const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_TOKEN);
  //   if (token) {
  //     return res.status(200).json({ success: true, token: token });
  //   } else {
  //     return res
  //       .status(200)
  //       .json({ success: false, message: "토큰 발급 안 됨" });
  //   }
  // });
  User.findOne({ email: req.body.userEmail }, (err, user) => {
    if (err) {
      return res.status(200).json({ success: false, message: err });
    }
    if (!user) {
      return res.status(200).json({ success: false, message: "no user" });
    }
    if (user) {
      const checkPassword = () => {
        const comparePassword = bcrypt.compare(
          req.body.password,
          user.password
        );

        if (comparePassword) {
          const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET_TOKEN
          );
          if (token) {
            user.token = token;
            user.save((err, user) => {
              if (err) {
                return res.status(200).json({ success: true, message: err });
              }
              console.log(token);
              return res
                .status(200)
                .json({ success: true, token: token, user: user });
            });
          }
        }
      };
      checkPassword();
    }
  });
});

// 회원 정보 수정

// 회원 탈퇴

module.exports = router;
