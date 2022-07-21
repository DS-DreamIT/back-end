const express = require("express");
const mongodb = require("mongodb");
const { User } = require("../models/user");
const { Diary } = require("../models/diary");

const router = express.Router();

router.get("/", (req, res) => {
  // user 정보를 가져온다
  // res.send("/api/user 경로로 들어옴");
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
      return res.status(200).json({ success: true, user });
    }
  });
});

router.post("/register", (req, res) => {
  // body에 회원 정보 담아서 전송
  let user = req.body.user;
  // 회원가입
});

// 회원 정보 수정

// 회원 탈퇴

module.exports = router;
