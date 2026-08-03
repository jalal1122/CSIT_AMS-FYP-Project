import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  const token =
    req.header("Authorization")?.replace("Bearer ", "") ||
    req.cookies?.accessToken;

  if (!token) {
    throw new ApiError(401, "Access token is required");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // 1. Account status check (from token payload - no DB hit)
    if (decoded.accountStatus === "Inactive" || decoded.accountStatus === "Suspended") {
      throw new ApiError(403, "Your account has been deactivated. Please contact admin.");
    }

    // 2. mustChangePassword gate
    const SETUP_ROUTES = ["/api/v2/auth/setup-profile", "/api/v2/auth/logout"];
    const isSetupRoute = SETUP_ROUTES.some(r => req.originalUrl.includes(r));

    if (decoded.mustChangePassword && !isSetupRoute) {
      throw new ApiError(403, "You must complete your profile setup before proceeding.");
    }

    // 3. DB fetch for full user object
    const user = await User.findById(decoded._id)
      .select("-password -refreshToken -twoFactorSecret");

    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }

    // Double-check accountStatus from DB (in case token is stale)
    if (user.accountStatus !== "Active") {
      throw new ApiError(403, "Account is not active");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});
