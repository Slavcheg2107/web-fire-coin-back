const {Router} = require('express')
const Accounts = require('../models/Accounts')
const auth = require('../middleware/auth.middleware')
const router = Router()

// /api/keys
router.post('/', auth, async (req, res) => {
  try {
    const {name, key, secretKey} = req.body
    const account = await Accounts.findOne({ name })

    if (account) {
      return res.status(400).json({message: 'Такой ключь уже есть'});
    }

    const NewAccount = new Accounts({
      name, key, secretKey, owner: req.user.userId
    })
    await NewAccount.save()

    res.status(201).json({ NewAccount })
  } catch (e) {
    res.status(500).json({ message: 'Что-то пошло не так, попробуйте снова' })
  }
})

router.get('/', auth, async (req, res) => {
  try {
    const accounts = await Accounts.find({ owner: req.user.userId })
    res.json(accounts)
  } catch (e) {
    res.status(500).json({ message: 'Что-то пошло не так, попробуйте снова' })
  }
})

router.get('/:id', auth, async (req, res) => {
  try {
    const account = await Accounts.findById(req.params.id)
    res.json(account)
  } catch (e) {
    res.status(500).json({ message: 'Что-то пошло не так, попробуйте снова' })
  }
})

router.delete('/:id', auth, async (req, res) => {
  try {
    console.log(req.params.id)
    const account = await Accounts.findOneAndDelete(req.params.id)

    console.log(account);
    if (!account) {
      return res.status(400).json({message: 'Нет такого ключа'});
    }
    res.json({ id: account._id })
  } catch (e) {
    res.status(500).json({ message: 'Что-то пошло не так, попробуйте снова' })
  }
})

module.exports = router
