const {Schema, model, Types} = require('mongoose');

const schema = new Schema({
  name: { type: String, required: true, unique: true },
  key: { type: String, required: true },
  secretKey: { type: String, required: true },
  owner: {type: Types.ObjectId, ref: 'User'}
});

module.exports = model('Accounts', schema);
