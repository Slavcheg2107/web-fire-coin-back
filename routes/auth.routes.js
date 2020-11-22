const {Router} = require('express');
const bcrypt = require('bcryptjs');
const config = require('config');
const jwt = require('jsonwebtoken');
const {check, validationResult} = require('express-validator');
const User = require('../models/User');
const router = Router();


// /api/auth/register
router.post(
  '/register',
  [
    check('email', 'Некорректный email').isEmail(),
    check('username', 'Введите имя').exists(),
    check('password', 'Минимальная длинна пароля 6 символов').isLength({min: 6})
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);

      if(!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
          message: 'Неккоректные данные при регистрации'
        });
      }

      const {email, password, username} = req.body;
      console.log(email, password, username);
      const candidate = await User.findOne({ email });
      if(candidate){
        res.status(400).json({message: 'Такой пользователь уже есть'});
      }
      const hashedPassword = await bcrypt.hash(password, config.get('salt_work_factor'));
      const user = new User({email, password: hashedPassword, username});

      await user.save();
      const token = jwt.sign(
        { userId: user.id },
        config.get('jwt_secret'),
        { expiresIn: '1d' }
      );

      await res.status(201).json({token, userId: user.id, message: "Пользователь создан"});

    } catch (e) {
      res.status(500).json({message: "Ошибка. Попробуйте позже."})
    }
});

// /api/auth/login
router.post(
  '/login',
  [
    check('email', 'Некорректный email').normalizeEmail().isEmail(),
    check('password', 'Введите пароль').exists()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);

      if(!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
          message: 'Неккоректные данные при входе'
        });
      }

      const {email, password} = req.body;
      const user = await User.findOne({ email });
      if(!user){
        return res.status(400).json({message: "Пользователь не найден."})
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if(!isMatch){
        return res.status(400).json({message: "Неверный пароль."})
      }
      const token = jwt.sign(
        { userId: user.id },
        config.get('jwt_secret'),
        { expiresIn: '1d' }
      );

      await res.json({token, userId: user.id});

    } catch (e) {
      res.status(500).json({message: "Ошибка. Попробуйте позже."})
    }
});

module.exports = router;
