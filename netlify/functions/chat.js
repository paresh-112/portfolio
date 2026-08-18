const ChatController = require("../../src/controllers/ChatController");

exports.handler = async (event, context) => {
  return await ChatController.handleNetlifyStreamEvent(event, context);
};
