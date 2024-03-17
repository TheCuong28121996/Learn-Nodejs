const jwt = require("jsonwebtoken");
const userModel = require("../model/user_model");
const bcrypt = require("bcrypt");

let refreshTokens = [];

let register = async (req, res) => {
  try {
    const {phoneNumber, password} = req.body;

    let existingUser = await userModel.findOne({phoneNumber: phoneNumber});

    if (existingUser != null) {
      return res.status(400).json({error: 'Số điện thoại đã được sử dụng'});
    }

    const salt = await bcrypt.genSalt(10);

    const hashed = await bcrypt.hash(password, salt);

    let newUser = await userModel.create({
      phoneNumber: phoneNumber,
      password: hashed,
    });

    return res.status(200).json({message: 'Đăng ký thành công', user: newUser});
  } catch (exception) {
    console.log('Lỗi khi đăng ký người dùng:', exception);
    return res.status(500).json({error: 'Đã xảy ra lỗi khi đăng ký người dùng'});
  }
}

let generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id
    },
    "LiY6ayZasO",
    {expiresIn: "30s"}
  );
}

let generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user.id
    },
    "LiY6ayZasORefresh",
    {expiresIn: "365d"}
  );
}

let login = async (req, res) => {
  const user = await userModel.findOne({phoneNumber: req.body.phoneNumber});
  if (!user) {
    res.status(404).json("Tên người dùng không chính xác");
  }

  const validPassword = await bcrypt.compare(
    req.body.password,
    user.password
  );

  if (!validPassword) {
    res.status(404).json("Mật khẩu khong chinh xac");
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  refreshTokens.push(refreshToken);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false,
    path: "/",
    sameSite: "strict",
  });

  res.status(200).json({
    "success": true,
    "message": "success",
    "data": user,
    "accessToken": accessToken,
    "refreshToken": refreshToken,
  });
}

let refreshToken = async (req, res) => {
  const refreshToken = req.body.refreshToken;

  if (!refreshTokens.includes(refreshToken)) {
    return res.status(403).json("Refresh token is not valid");
  }

  jwt.verify(refreshToken, "LiY6ayZasORefresh", (err, user) => {
      if (err) {
        console.log(err);
      }

      refreshTokens = refreshTokens.filter((token) => token !== refreshToken);

      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);

      refreshTokens.push(newRefreshToken);

      res.status(200).json({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    }
  );
}

module.exports = {register, login, refreshToken}