var mongoose = require('mongoose')
var Schema = mongoose.Schema;

var classesListSchema = new Schema({
  src:String,
  id:String
})

classesListSchema.statics={
  fetch:function (cb) {
    return this
      .find({})
      .exec(cb);
  },
  /*findById:function (id,cb)  {
    return this
      .findOne({_id:id})
      .exec(cb);
  },*/
  deleteById:function (id,cb) {
    return this
      .remove({_id:id})
      .exec(cb);
  }
};
module.exports = classesListSchema

