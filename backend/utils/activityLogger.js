const { Activity } = require("../models");

const logActivity = async ({ user, action, entity, entityId }) => {
  if (!user || !action || !entity || !entityId) {
    throw new Error("Missing required activity log details");
  }

  const validActions = ["add", "edit", "delete"];

  if (!validActions.includes(action)) {
    throw new Error("Invalid activity action");
  }

  const activity = await Activity.create({
    user,
    action,
    entity,
    entityId,
  });

  return activity;
};

module.exports = logActivity;
