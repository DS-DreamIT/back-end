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
router.get("/:userId", (req, res) => {
  const day = new Date();
  day.setDate(day.getDate() - 3);

  let userId = req.params.userId;
  User.findOne({ _id: userId }).exec((err, user) => {
    if (err) {
      return res.status(400).json({ success: false, err });
    }
    if (user) {
      Diary.find({ author: user._id, createdAt: { $lt: day } })
        .sort({ createdAt: "desc" })
        .exec((err, diaries) => {
          if (err) {
            return res.status(200).json({ success: true, user });
          }
          const recent_diary_list = diaries.reduce((arr, diary, idx) => {
            if (idx < 6) {
              let temp = new Object();
              temp["_id"] = diary._id;
              temp["emotion"] = diary.emotion;
              temp["createdAt"] = diary.createdAt;
              arr.push(temp);
            }
            return arr;
          }, []);
          return res.status(200).json({
            success: true,
            user,
            diary_list: recent_diary_list,
          });
        });
    }
  });
});

// 다이어리 총 개수 반환
router.get("/:userId/totalDiaryCount", async (req, res) => {
  const userId = req.params.userId;
  Diary.find({ author: userId }).exec((err, diaries) => {
    if (err) {
      return res.status(200).json({ success: false, err: "no diaries" });
    }
    if (diaries.length >= 25) {
      User.findOneAndUpdate(
        { _id: userId },
        { $addToSet: { badge: "FullMoonBadge" } }
      ).then((err, user) => {
        console.log(user);
      });
    }
    return res.status(200).json({ success: true, diary_count: diaries.length });
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
  User.findOne({ email: req.body.userEmail }, (err, user) => {
    if (err) {
      return res.status(200).json({ success: false, message: err });
    }
    if (!user) {
      return res.status(200).json({ success: false, message: "no user" });
    }
    if (user) {
      const checkPassword = async () => {
        const comparePassword = await bcrypt.compare(
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
                return res.status(200).json({ success: true, error: err });
              }
              console.log(token);
              // 글쓴이 키워드 통계가 있는지 확인하기
              if (user.keywords?.length > 0) {
                console.log("키워드 통계 있음, 바로 로그인 성공");
                return res
                  .status(200)
                  .json({ success: true, token: token, user: user });
              } else {
                console.log("키워드 통계가 없습니다");
                Diary.find({ author: user._id }, (err, diaries) => {
                  if (err) {
                    return res.status(200).json({ success: false, error: err });
                  }
                  if (diaries.length > 0) {
                    // 다이어리를 적은 적이 있는데 통계가 없을 때
                    let keyword_list = {};
                    diaries.forEach((diary) => {
                      diary.keyword.forEach((keyword) => {
                        if (keyword in keyword_list) {
                          keyword_list[keyword] += 1;
                        } else {
                          keyword_list[keyword] = 1;
                        }
                      });
                    });
                    const sort_list = Object.entries(keyword_list)
                      .sort(([, a], [, b]) => b - a)
                      .reduce((r, [k, v]) => ({ ...r, [k]: v }), {});
                    console.log(sort_list);
                    let index = 0;
                    let result = [];
                    for (s in sort_list) {
                      result.push(s);
                      index++;
                      if (index === 3) break;
                    }
                    // db 업데이트
                    User.findOneAndUpdate(
                      { _id: user._id },
                      { $set: { keywords: result } }
                    ).exec((err, userUpdate) => {
                      if (err)
                        return res.status(200).json({
                          success: false,
                          error: "키워드 통계 업데이트 실패",
                        });
                      return res.status(200).json({
                        success: true,
                        token: token,
                        user: userUpdate,
                      });
                    });
                  } else {
                    return res.status(200).json({
                      success: true,
                      message: "로그인 성공",
                      token: token,
                      user: user,
                    });
                  }
                });
              }
            });
          }
        } else {
          return res.status(200).json({
            success: false,
            warning: "비밀번호를 올바르게 입력하세요",
          });
        }
      };
      checkPassword();
    }
  });
});

// 회원 정보 수정

// 회원 탈퇴

module.exports = router;
