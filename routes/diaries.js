const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const ObjectId = mongoose.Types.ObjectId;
const { Diary } = require("../models/diary");
const { User } = require("../models/user");
const { Like } = require("../models/like");
const multer = require("multer");
const AWS = require("aws-sdk");
const multerS3 = require("multer-s3");

require("dotenv").config({ path: ".env" });

const router = express.Router();

// AWS S3
AWS.config.update({
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  region: "ap-northeast-2",
});

const upload = multer({
  storage: multerS3({
    s3: new AWS.S3(),
    bucket: "ds-dreamable",
    key(req, file, cb) {
      cb(null, `original/${Date.now()}_${file.originalname}`);
    },
  }),
});

const getBadgeList = (emotions) => {
  let emotion = new Array();
  if (emotions.includes("행복")) emotion.push("HappyBadge");
  if (emotions.includes("중립")) emotion.push("NeutralityBadge");
  if (emotions.includes("슬픔")) emotion.push("SadBadge");
  if (emotions.includes("공포")) emotion.push("FearBadge");
  if (emotions.includes("분노")) emotion.push("AngerBadge");
  if (emotions.includes("불안")) emotion.push("UnrestBadge");
  if (emotions.includes("놀람")) emotion.push("SurprisedBadge");
  if (emotions.includes("설렘")) emotion.push("FlutterBadge");
  emotion.push("WritingBeginnerBadge");

  return emotion;
};

router.get("/:diaryId", (req, res) => {
  let diaryId = req.params.diaryId;
  Diary.findOne({ _id: ObjectId(diaryId) }).exec((err, diary) => {
    if (err) {
      return res
        .status(200)
        .json({ success: false, message: "꿈 일기 id가 없음" });
    }
    Like.find({ diaryId: diary._id }).exec((err, likes) => {
      if (err) {
        return res
          .status(200)
          .json({ success: false, message: err + "꿈 일기 없음" });
      }
      const like_list = likes.map((like) => like.userId);
      return res.status(200).json({ success: true, like_list, diary });
    });
  });
  User.findOneAndUpdate(
    { _id: userId },
    { $addToSet: { badge: "DreamUnLockBadge" } }
  ).then((err, user) => {
    console.log(user);
  });
});

// 유저의 가장 최근 꿈 불러오기
router.get("/recent/user/:userId", (req, res) => {
  let userId = req.params.userId;

  Diary.findOne({ author: userId })
    .sort({ createdAt: -1 })
    .exec((err, diary) => {
      if (err) {
        return res.status(200).json({ success: false, err });
      }
      return res.status(200).json({ success: true, diary });
    });
});

// 유저의 꿈 목록 전체 불러오기
router.get("/user/:userId", (req, res) => {
  let userId = req.params.userId;

  Diary.find({ author: userId }).exec((err, diaries) => {
    console.log(diaries);
    if (err) {
      return res.status(200).json({ success: false, err });
    }
    return res.status(200).json({ success: true, diaries });
  });
});

// 유저의 꿈 저장하기 req.body
// 없는 정보는 빈칸으로 !
router.post("/user/:userId", upload.single("Image"), (req, res) => {
  let userId = req.params.userId;
  let content = req.body.content;
  let img = (req.file !== undefined && req.file?.location) || "";
  console.log("file : ", req.file);
  console.log(req.body.content);
  // 유저 확인
  User.findOne({ _id: userId }).exec(async (err, user) => {
    if (user) {
      let today = new Date();

      let createdAt =
        today.getFullYear() +
        "-" +
        ("0" + (today.getMonth() + 1)).slice(-2) +
        "-" +
        ("0" + today.getDate()).slice(-2);
      let emotion = [];
      let keyword = [];
      // 꿈 분석
      await axios
        .post(`${process.env.EMOTION_API_URL}`, {
          content: content,
        })
        .then((response) => {
          emotion = response.data.result;
          console.log(response.data);
        });
      await axios
        .post(`${process.env.KEYWORD_API_URL}`, {
          content: content,
        })
        .then((response) => {
          keyword = response.data.keywords;
          console.log(response.data);
        });
      Diary.create(
        // 꿈 저장
        {
          author: userId,
          likes: 0,
          emotion: emotion,
          keyword: keyword,
          ...req.body,
          createdAt,
        },
        (err, diary) => {
          if (err) {
            return res.status(200).json({ success: false, err });
          }
          // 꿈 분석 넘어오면 users에 있는 키워드 통계 업데이트 로직 가져오기
          return res.status(200).json({ success: true, diary });
        }
      );
      // emotion
      const badges = getBadgeList(emotion);

      // update
      User.findOneAndUpdate(
        { _id: userId },
        { $addToSet: { badge: { $each: badges } } }
      ).then((err, user) => {
        console.log(user);
      });
      // 유저 키워드 통계 업데이트
      Diary.find({ author: user._id }, (err, diaries) => {
        if (err) {
          return res.status(200).json({ success: false, message: err });
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
          ).exec((err, keywords) => {
            if (err)
              return res.status(200).json({
                success: false,
                error: "키워드 통계 업데이트 실패",
              });
            console.log(keywords);
          });
        }
      });
    } else {
      return res.status(200).json({ success: false });
    }
  });
});

// 특정 감정의 꿈 일기 가져오기
router.get("/emotion/:emotion/user/:userId", (req, res) => {
  let emotion = req.params.emotion;
  let userId = req.params.userId;

  Diary.findOne({
    $and: [{ emotion: { $in: emotion } }, { author: { $ne: userId } }],
  }).exec((err, diary) => {
    if (err) {
      return res.status(200).json({ success: false, err });
    }
    if (diary) {
      Like.find({ diaryId: diary._id }).exec((err, likes) => {
        const like_list = likes.map((like) => like.userId);
        if (err) {
          return res.status(200).json({ json: false, err });
        }
        return res.status(200).json({ success: true, like_list, diary });
      });
    } else {
      return res.status(200).json({
        success: false,
        message: "해당 감정에 해당하는 꿈이 없습니다",
      });
    }
  });
  User.findOneAndUpdate(
    { _id: userId },
    { $addToSet: { badge: "DreamTravelerBadge" } }
  ).then((err, user) => {
    console.log(user);
  });
});

// 좋아요 수
router.put("/:diaryId/likes/user/:userId", (req, res) => {
  let diaryId = req.params.diaryId;
  let userId = req.params.userId;
  // 다이어리 좋아요 누른 사람 목록에 userId가 있는지 확인하고
  // 없으면 +1 있으면 -1
  let updateLikes = (update) =>
    new Promise((resolve, reject) => {
      const updateNum = update === "plus" ? 1 : -1;
      Diary.findOneAndUpdate(
        { _id: diaryId },
        { $inc: { likes: updateNum } }
      ).exec((err, diary) => {
        console.log(diary);
        if (!diary || err) {
          return res.status(200).json({ success: false, err });
        }
        resolve(diary.likes);
      });
    });

  if (userId) {
    Like.findOneAndDelete({
      $and: [{ userId: userId }, { diaryId: diaryId }],
    }).exec((err, delete_success) => {
      if (err) {
        return res
          .status(200)
          .json({ success: false, error: "좋아요 목록 업데이트 실패" });
      }
      if (delete_success) {
        updateLikes("minus").then((likes) =>
          res.status(200).json({
            success: true,
            message: "좋아요 취소 성공",
            likes: likes - 1,
          })
        );
      } else {
        const like = new Like({ userId: userId, diaryId: diaryId });
        like.save((err, result) => {
          if (err) {
            return res
              .status(200)
              .json({ success: false, error: "좋아요 실패" });
          }
          updateLikes("plus").then((likes) =>
            res
              .status(200)
              .json({ success: true, message: "좋아요 성공", likes: likes + 1 })
          );
        });
      }
    });
    User.findOneAndUpdate(
      { _id: userId },
      { $addToSet: { badge: "LikeADreamBadge" } }
    ).then((err, user) => {
      console.log(user);
    });
  }
});

module.exports = router;
