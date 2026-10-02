import User from "../../modules/auth/user.model.js";
import Employee from "../../modules/employees/employee.model.js";
import { ApiError } from "../utils/ApiError.js";
import { verifyAccessToken } from "../utils/tokens.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const protect = asyncHandler(async (req, _res, next) => {
  const token = req.headers.authorization?.startsWith("Bearer ") && req.headers.authorization.slice(7);
  if (!token) throw new ApiError(401, "Authentication required");
  const { sub } = verifyAccessToken(token);
  const user = await User.findById(sub).select("+password").populate("role");
  if (!user || user.status !== "active") throw new ApiError(401, "Account is unavailable");
  req.user = user;
  req.employee = await Employee.findOne({ user: user.id, isDeleted: false });
  next();
});

export const allow = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user.role.name)) return next(new ApiError(403, "You do not have permission for this action"));
  next();
};

export const managementRoles = ["super_admin", "admin", "hr"];
