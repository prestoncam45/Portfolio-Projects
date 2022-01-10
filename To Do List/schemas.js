const Joi = require('joi');

module.exports.activitySchema = Joi.object({
    activity: Joi.string().required()
}).required();