const {Router} = require('express');
const bcrypt = require('bcryptjs');
const {check, validationResult} = require('express-validator');
const router = Router();
const BFX = require('bitfinex-api-node');
const auth = require('../middleware/auth.middleware')

// /api/balances
router.get(
  '/',
  auth,
  [
    check('api_key_bfx', 'Некорректный api key').isEmail(),
    check('api_secret_bfx', 'Некорректный secret bfx').isEmail()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);

      if(!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
          message: 'Неккоректные данные'
        });
      }

      const {api_key_bfx, api_secret_bfx} = req.body;

      const bfx = new BFX({
        apiKey: api_key_bfx,
        apiSecret: api_secret_bfx,
        ws: {
          autoReconnect: true,
          seqAudit: true,
          packetWDDelay: 10 * 1000
        }
      });
      const bfxRest1 = bfx.rest(1, {});

      bfxRest1.wallet_balances((err2, res2) => {
        if (err2) throw err2;
        res.send(res2);
      });

    } catch (e) {
      res.status(500).json({message: "Ошибка. Попробуйте позже."})
    }
});

module.exports = router;
