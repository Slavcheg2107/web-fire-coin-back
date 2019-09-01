'use strict';

const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

passport.serializeUser(async (user, done) => {
  if (user) {
    return done(null, user);
  }
  return done(null, false);
});
passport.deserializeUser(async ({id}, done) => {
  // let user = await db.User.find({where: {id}});
  let user = {id:111, name: 'Oleh'};
  if (user) {
    return done(null, user);
  }
  return done(null, false);''
});

passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: 'super_secret_key'
}, async (jwt, done) => {
  try {
    let user = await db.User.find({where: {id: jwt.sub}});
    if (user) {
      return done(null, user);
    }
    return done(null, false);
  } catch (err) {
    return done(err, false);
  }
}));

const IsAuthenticated = passport.authenticate('jwt', { session: true });

module.exports = {passport, IsAuthenticated};
