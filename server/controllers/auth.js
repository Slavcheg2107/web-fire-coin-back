'use strict';
var jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();
const {passport, IsAuthenticated} = require('../auth/passport');

router.post('/auth/register', async (req, res, next) => {
  try {
    //let user = await db.User.register(req.body);
    let user = {id:111, name: 'Oleh'};
    let token = jwt.sign({
      sub: user.id
    }, process.env.SERVER_SECRET, {
      expiresIn: '1d'
    });
    res.json({data: {token}});
  } catch (err) {
    return next(err);
  }
});

router.post('/auth/login', async (req, res, next) => {
  //let {email, password, rememberMe} = req.body;
  let rememberMe = true;
  //let user = await db.User.find({where: {email: {$ilike: email}}});
  let user = {id:111, name: 'Oleh'};
  let token = jwt.sign({
    sub: user.id
  }, 'super_secret_key', {
    expiresIn: rememberMe ? '30d' : '1d'
  });
  res.json({data: {token}});
});

router.get('/auth/me', IsAuthenticated, (req, res) => res.json({data: req.user}));

module.exports = router;
