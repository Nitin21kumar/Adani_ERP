import Notification from "./notification.model.js";
export const notify = (user, title, message, type = "general") => Notification.create({ user, title, message, type });
