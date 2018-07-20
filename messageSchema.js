var mongoose = require('mongoose')
var Schema = mongoose.Schema;

var messageSchema = new Schema({
  msgs: {
    type: Array,
    default: [
      {
        username: String, //留言者名字
        message: String //留言信息
      }
    ]
  }
})

messageSchema.statics={
  fetch:function (cb) {
    return this
      .find({})
      .sort({'updateAt':-1})
      .exec(cb);
  },
  findById:function (id,cb) {
    return this
      .findOne({_id:id})
      .exec(cb);
  }
};
module.exports = messageSchema

