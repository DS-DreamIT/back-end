const express = require("express");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const { Diary } = require("../models/diary");
const { User } = require("../models/user");
const { Like } = require("../models/like");

const router = express.Router();

router.get("/:diaryId", (req, res) => {
  let diaryId = req.params.diaryId;

  Diary.findOne({ _id: ObjectId(diaryId) }).exec((err, diary) => {
    Like.find({ diaryId: diary._id }).exec((err, likes) => {
      const like_list = likes.map((like) => like.userId);
      return res.status(200).json({ success: true, like_list, diary });
    });
  });
});

// 유저(이메일)의 꿈 목록 전체 불러오기
router.get("/user/:userId", (req, res) => {
  let userId = req.params.userId;

  Diary.find({ author: userId }).exec((err, diaries) => {
    console.log(diaries);
    return res.status(200).json({ success: true, diaries });
  });
});

// 유저의 꿈 저장하기 req.body
// body에 들어갈 정보
// content, keyword, analysisType, emotion, img, resultImg, music, release
// 없는 정보는 빈칸으로 !
router.post("/user/:userId", (req, res) => {
  let userId = req.params.userId;
  // 유저 확인
  console.log(userId);
  User.findOne({ _id: userId }).exec((err, user) => {
    if (user) {
      let createdAt = Date.now() + 3600000 * 9;
      Diary.create(
        // 꿈 저장
        { author: userId, likes: 0, ...req.body, createdAt },
        (err, diary) => {
          if (err) {
            return res.status(200).json({ success: false, err });
          }
          return res.status(200).json({ success: true, Diary: diary });
        }
      );
    } else {
      return res.status(200).json({ success: false });
    }
  });
});

// 특정 감정의 꿈 일기 가져오기
router.get("/emotion/:emotion", (req, res) => {
  let emotion = req.params.emotion;

  Diary.findOne({ emotion: emotion }).exec((err, diary) => {
    if (err) {
      return res.status(200).json({ success: false, err });
    }
    Like.find({ diaryId: diary._id }).exec((err, likes) => {
      const like_list = likes.map((like) => like.userId);
      return res.status(200).json({ success: true, like_list, diary });
    });
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
  }
});

module.exports = router;
