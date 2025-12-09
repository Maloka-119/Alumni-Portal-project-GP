const { User, Staff, Graduate } = require("../models");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");

// 🔴 START OF LOGGER IMPORT - ADDED THIS
const { logger, securityLogger } = require("../utils/logger");
// 🔴 END OF LOGGER IMPORT

// LinkedIn OAuth 2.0 configuration
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const LINKEDIN_REDIRECT_URI =
  process.env.LINKEDIN_CALLBACK_URL ||
  process.env.LINKEDIN_REDIRECT_URI ||
  "http://localhost:5005/alumni-portal/auth/linkedin/callback";
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// In-memory state store for OAuth (fallback if session doesn't work)
const stateStore = new Map();
const STATE_EXPIRY = 10 * 60 * 1000; // 10 minutes

/**
 * Generate JWT token for user
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "7d" });
};

/**
 * Get LinkedIn authorization URL
 * @route GET /auth/linkedin
 * @access Public
 */
const getLinkedInAuthUrl = asyncHandler(async (req, res) => {
  try {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Get LinkedIn auth URL request initiated", {
      ip: req.ip,
      hasLinkedInClientId: !!LINKEDIN_CLIENT_ID,
      hasLinkedInClientSecret: !!LINKEDIN_CLIENT_SECRET,
      redirectUri: LINKEDIN_REDIRECT_URI,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    const state = Math.random().toString(36).substring(2, 15);

    // Store state in session and in-memory store (fallback)
    if (req.session) {
      req.session.linkedinState = state;
    }
    // Also store in memory as fallback
    stateStore.set(state, {
      timestamp: Date.now(),
      ip: req.ip
    });

    // LinkedIn OAuth 2.0 scopes - Using OpenID Connect
    const scope = "openid profile email";
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(
      LINKEDIN_REDIRECT_URI
    )}&state=${state}&scope=${encodeURIComponent(scope)}`;

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("LinkedIn auth URL generated successfully", {
      authUrlLength: authUrl.length,
      state,
      scope,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    res.status(200).json({
      status: "success",
      data: {
        authUrl,
        state,
      },
    });
  } catch (error) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("Error generating LinkedIn auth URL", {
      error: error.message,
      stack: error.stack.substring(0, 200),
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING
    console.error("LinkedIn auth URL error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to generate LinkedIn auth URL",
    });
  }
});

/**
 * Handle LinkedIn OAuth callback
 * @route GET /auth/linkedin/callback
 * @access Public
 */
const handleLinkedInCallback = asyncHandler(async (req, res) => {
  try {
    const { code, state } = req.query;

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("LinkedIn callback received", {
      hasCode: !!code,
      hasState: !!state,
      codeLength: code?.length || 0,
      stateLength: state?.length || 0,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    // Verify state parameter for security
    // Check both session and in-memory store
    const sessionState = req.session?.linkedinState;
    const memoryState = stateStore.get(state);
    
    // Clean up expired states
    if (memoryState && Date.now() - memoryState.timestamp > STATE_EXPIRY) {
      stateStore.delete(state);
    }
    
    const isValidState = state === sessionState || (memoryState && Date.now() - memoryState.timestamp <= STATE_EXPIRY);
    
    if (!isValidState) {
      // 🔴 START OF LOGGING - ADDED THIS
      securityLogger.warn("LinkedIn state mismatch detected", {
        receivedState: state,
        expectedState: sessionState,
        hasSession: !!req.session,
        hasMemoryState: !!memoryState,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return res.redirect(
        "http://localhost:3000/helwan-alumni-portal/login?error=" +
        encodeURIComponent("Invalid state parameter")
      );
    }
    
    // Clean up the state after validation
    if (memoryState) {
      stateStore.delete(state);
    }

    if (!code) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("LinkedIn callback missing authorization code", {
        state,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return res.redirect(
        "http://localhost:3000/helwan-alumni-portal/login?error=" +
        encodeURIComponent("Authorization code not provided")
      );
    }

    // Exchange authorization code for access token
    let tokenResponse;
    try {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.debug("Exchanging LinkedIn authorization code for access token", {
        codeLength: code.length,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING

      tokenResponse = await axios.post(
        "https://www.linkedin.com/oauth/v2/accessToken",
        {
          grant_type: "authorization_code",
          code: code,
          client_id: LINKEDIN_CLIENT_ID,
          client_secret: LINKEDIN_CLIENT_SECRET,
          redirect_uri: LINKEDIN_REDIRECT_URI,
        },
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      // 🔴 START OF LOGGING - ADDED THIS
      logger.debug("LinkedIn token exchange successful", {
        hasAccessToken: !!tokenResponse.data.access_token,
        expiresIn: tokenResponse.data.expires_in,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
    } catch (tokenError) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.error("LinkedIn token exchange failed", {
        error: tokenError.response?.data?.error || tokenError.message,
        errorDescription: tokenError.response?.data?.error_description,
        statusCode: tokenError.response?.status,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      console.error(
        "LinkedIn token exchange error:",
        tokenError.response?.data || tokenError.message
      );
      const errorMessage = tokenError.response?.data?.error_description ||
        tokenError.message ||
        "Failed to exchange authorization code for access token";
      return res.redirect(
        "http://localhost:3000/helwan-alumni-portal/login?error=" +
        encodeURIComponent(errorMessage)
      );
    }

    const { access_token, expires_in } = tokenResponse.data;

    if (!access_token) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.error("LinkedIn returned empty access token", {
        responseData: tokenResponse.data,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return res.status(400).json({
        status: "error",
        message: "No access token received from LinkedIn",
      });
    }

    // Fetch user profile using OpenID Connect userinfo endpoint
    let userInfoResponse;
    try {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.debug("Fetching LinkedIn user info", {
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING

      // Try OpenID Connect userinfo endpoint first
      try {
        userInfoResponse = await axios.get(
          "https://api.linkedin.com/v2/userinfo",
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
              "Content-Type": "application/json",
            },
            timeout: 10000, // 10 second timeout
          }
        );
      } catch (userInfoError) {
        // If v2/userinfo fails, try the legacy endpoint
        logger.warn("LinkedIn v2/userinfo failed, trying alternative endpoint", {
          error: userInfoError.response?.data || userInfoError.message,
          ip: req.ip,
        });
        
        // Try alternative: use token response data if available, or try legacy endpoint
        // For now, we'll extract what we can from the token response
        throw userInfoError; // Re-throw to be caught by outer catch
      }

      // 🔴 START OF LOGGING - ADDED THIS
      logger.debug("LinkedIn user info fetched successfully", {
        hasEmail: !!userInfoResponse.data.email,
        hasSub: !!userInfoResponse.data.sub,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
    } catch (userInfoError) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.error("LinkedIn user info fetch failed", {
        error: userInfoError.response?.data?.error || userInfoError.message,
        statusCode: userInfoError.response?.status,
        errorData: userInfoError.response?.data,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      console.error(
        "LinkedIn userinfo error:",
        userInfoError.response?.data || userInfoError.message
      );
      
      // Redirect to frontend with error message
      const errorMessage = userInfoError.response?.data?.error_description ||
        userInfoError.message ||
        "Failed to fetch user profile from LinkedIn";
      return res.redirect(
        "http://localhost:3000/helwan-alumni-portal/login?error=" +
        encodeURIComponent(errorMessage)
      );
    }

    const userInfo = userInfoResponse.data;

    // Extract data from OpenID Connect response
    const email = userInfo.email || null;
    const linkedinId = userInfo.sub || userInfo.id || null;

    // 🔴 START OF LOGGING - ADDED THIS
    logger.debug("LinkedIn user info extracted", {
      email: email ? email.substring(0, 3) + "***" : "null",
      linkedinId: linkedinId ? linkedinId.substring(0, 3) + "***" : "null",
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    // For additional profile info, try the v2 API (may need legacy scopes)
    let profile = {
      id: linkedinId,
      firstName: {
        localized: {
          en_US: userInfo.given_name || userInfo.name?.split(" ")[0] || "",
        },
      },
      lastName: {
        localized: {
          en_US:
            userInfo.family_name ||
            userInfo.name?.split(" ").slice(1).join(" ") ||
            "",
        },
      },
      profilePicture: null,
      headline: null,
      location: null,
    };

    // Try to get additional profile details if available
    try {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.debug("Attempting to fetch additional LinkedIn profile details", {
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING

      const profileResponse = await axios.get(
        "https://api.linkedin.com/v2/me",
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );
      profile = profileResponse.data;

      // 🔴 START OF LOGGING - ADDED THIS
      logger.debug("Additional LinkedIn profile details fetched", {
        hasProfileData: !!profile,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
    } catch (profileError) {
      // If v2/me fails, use the userinfo data we have
      // 🔴 START OF LOGGING - ADDED THIS
      logger.debug("Using OpenID Connect userinfo data only (v2/me failed)", {
        error: profileError.message,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      console.log("Using OpenID Connect userinfo data only");
    }

    if (!email) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("LinkedIn did not return email address", {
        linkedinId: linkedinId ? linkedinId.substring(0, 3) + "***" : "null",
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return res.redirect(
        "http://localhost:3000/helwan-alumni-portal/login?error=" +
        encodeURIComponent("Could not retrieve email from LinkedIn. Please ensure your LinkedIn account has a verified email address.")
      );
    }

    // Check if user already exists
    let user = await User.findOne({
      where: {
        email: email,
      },
    });

    // Extract profile data
    const firstName =
      profile.firstName?.localized?.en_US ||
      profile.firstName?.localized?.en ||
      userInfo.given_name ||
      userInfo.name?.split(" ")[0] ||
      "";
    const lastName =
      profile.lastName?.localized?.en_US ||
      profile.lastName?.localized?.en ||
      userInfo.family_name ||
      userInfo.name?.split(" ").slice(1).join(" ") ||
      "";
    const profilePictureUrl =
      profile.profilePicture?.["displayImage~"]?.elements?.[0]?.identifiers?.[0]
        ?.identifier ||
      userInfo.picture ||
      null;
    const headline = profile.headline || null;
    const location = profile.location?.name || null;
    const linkedinProfileUrl = profile.id
      ? `https://www.linkedin.com/in/${profile.id}`
      : null;

    // 🔴 START OF LOGGING - ADDED THIS
    logger.debug("Profile data extracted", {
      firstNameLength: firstName.length,
      lastNameLength: lastName.length,
      hasProfilePicture: !!profilePictureUrl,
      hasHeadline: !!headline,
      hasLocation: !!location,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    if (user) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.info("Updating existing user with LinkedIn data", {
        userId: user.id,
        email: email.substring(0, 3) + "***",
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING

      // Update existing user with LinkedIn data
      await user.update({
        linkedin_id: linkedinId,
        linkedin_access_token: access_token,
        linkedin_token_expires_at: new Date(Date.now() + expires_in * 1000),
        profile_picture_url: profilePictureUrl,
        linkedin_profile_url: linkedinProfileUrl,
        linkedin_headline: headline,
        linkedin_location: location,
        auth_provider: "linkedin",
        is_linkedin_verified: true,
        "first-name": firstName,
        "last-name": lastName,
      });
    } else {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.info("Creating new user from LinkedIn authentication", {
        email: email.substring(0, 3) + "***",
        linkedinId: linkedinId ? linkedinId.substring(0, 3) + "***" : "null",
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING

      // Create new user
      user = await User.create({
        email: email,
        linkedin_id: linkedinId,
        linkedin_access_token: access_token,
        linkedin_token_expires_at: new Date(Date.now() + expires_in * 1000),
        profile_picture_url: profilePictureUrl,
        linkedin_profile_url: linkedinProfileUrl,
        linkedin_headline: headline,
        linkedin_location: location,
        auth_provider: "linkedin",
        is_linkedin_verified: true,
        "first-name": firstName,
        "last-name": lastName,
        "user-type": "graduate",
        "hashed-password": null,
      });
    }

    // Create Graduate record if user is a graduate and doesn't have one
    if (user["user-type"] === "graduate") {
      const existingGraduate = await Graduate.findOne({ where: { graduate_id: user.id } });
      if (!existingGraduate) {
        // 🔴 START OF LOGGING - ADDED THIS
        logger.info("Creating Graduate record for LinkedIn user", {
          userId: user.id,
          email: email.substring(0, 3) + "***",
          isNewUser: !user.createdAt || (Date.now() - new Date(user.createdAt).getTime()) < 5000,
          ip: req.ip,
          timestamp: new Date().toISOString(),
        });
        // 🔴 END OF LOGGING

        await Graduate.create({
          graduate_id: user.id,
          "status-to-login": "pending", // Requires admin approval
          bio: headline || null, // Use LinkedIn headline as initial bio
          "profile-picture-url": profilePictureUrl || null,
        });
      }
    }

    // Check status for staff (if existing user)
    if (user["user-type"] === "staff") {
      const staffRecord = await Staff.findOne({ where: { staff_id: user.id } });
      if (staffRecord && staffRecord["status-to-login"] !== "active") {
        return res.redirect(
          "http://localhost:3000/helwan-alumni-portal/login?error=" +
          encodeURIComponent("Your account is not activated yet. Please wait for admin approval.")
        );
      }
    }

    // Check status for graduate
    if (user["user-type"] === "graduate") {
      const graduateRecord = await Graduate.findOne({ where: { graduate_id: user.id } });
      if (graduateRecord && graduateRecord["status-to-login"] !== "accepted") {
        return res.redirect(
          "http://localhost:3000/helwan-alumni-portal/login?error=" +
          encodeURIComponent("Your account is under review. Please wait for admin approval to access the dashboard.")
        );
      }
    }

    // Generate JWT token
    const token = generateToken(user.id);

    // Clear the state from session and memory
    if (req.session) {
      delete req.session.linkedinState;
    }

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("LinkedIn authentication successful", {
      userId: user.id,
      userType: user["user-type"],
      authProvider: user.auth_provider,
      tokenGenerated: !!token,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    // Redirect to frontend with token (similar to Google OAuth)
    const redirectUrl = new URL("http://localhost:3000/auth/linkedin/callback");
    redirectUrl.searchParams.set("token", token);
    redirectUrl.searchParams.set("id", user.id);
    redirectUrl.searchParams.set("email", user.email);
    redirectUrl.searchParams.set("userType", user["user-type"]);
    redirectUrl.searchParams.set("firstName", user["first-name"]);
    redirectUrl.searchParams.set("lastName", user["last-name"]);
    
    return res.redirect(redirectUrl.toString());
  } catch (error) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("LinkedIn callback processing failed", {
      error: error.message,
      stack: error.stack.substring(0, 200),
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING
    console.error("LinkedIn callback error:", error);
    console.error("Error stack:", error.stack);
    
    // Redirect to frontend with error message
    const errorMessage = error.message || "LinkedIn authentication failed";
    return res.redirect(
      "http://localhost:3000/helwan-alumni-portal/login?error=" +
      encodeURIComponent(errorMessage)
    );
  }
});

/**
 * Refresh LinkedIn access token
 * @route POST /auth/linkedin/refresh
 * @access Private
 */
const refreshLinkedInToken = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Refresh LinkedIn token request initiated", {
      userId,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    const user = await User.findByPk(userId);
    if (!user || user.auth_provider !== "linkedin") {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn(
        "User not found or not LinkedIn authenticated for token refresh",
        {
          userId,
          userExists: !!user,
          authProvider: user?.auth_provider,
          ip: req.ip,
          timestamp: new Date().toISOString(),
        }
      );
      // 🔴 END OF LOGGING
      return res.status(400).json({
        status: "error",
        message: "User not found or not authenticated via LinkedIn",
      });
    }

    if (!user.linkedin_refresh_token) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("No refresh token available for LinkedIn user", {
        userId,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return res.status(400).json({
        status: "error",
        message: "No refresh token available",
      });
    }

    // Exchange refresh token for new access token
    const tokenResponse = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      {
        grant_type: "refresh_token",
        refresh_token: user.linkedin_refresh_token,
        client_id: LINKEDIN_CLIENT_ID,
        client_secret: LINKEDIN_CLIENT_SECRET,
      },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token, expires_in, refresh_token } = tokenResponse.data;

    // Update user with new tokens
    await user.update({
      linkedin_access_token: access_token,
      linkedin_refresh_token: refresh_token || user.linkedin_refresh_token,
      linkedin_token_expires_at: new Date(Date.now() + expires_in * 1000),
    });

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("LinkedIn token refreshed successfully", {
      userId,
      hasNewAccessToken: !!access_token,
      hasNewRefreshToken: !!refresh_token,
      expiresIn: expires_in,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    res.status(200).json({
      status: "success",
      message: "LinkedIn token refreshed successfully",
    });
  } catch (error) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("LinkedIn token refresh failed", {
      userId: req.user?.id,
      error: error.message,
      stack: error.stack.substring(0, 200),
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING
    console.error("LinkedIn token refresh error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to refresh LinkedIn token",
      error: error.message,
    });
  }
});

/**
 * Disconnect LinkedIn account
 * @route DELETE /auth/linkedin/disconnect
 * @access Private
 */
const disconnectLinkedIn = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Disconnect LinkedIn request initiated", {
      userId,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    const user = await User.findByPk(userId);
    if (!user) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("User not found for LinkedIn disconnect", {
        userId,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Clearing LinkedIn data for user", {
      userId,
      email: user.email.substring(0, 3) + "***",
      currentAuthProvider: user.auth_provider,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    // Clear LinkedIn data
    await user.update({
      linkedin_id: null,
      linkedin_access_token: null,
      linkedin_refresh_token: null,
      linkedin_token_expires_at: null,
      linkedin_profile_url: null,
      linkedin_headline: null,
      linkedin_location: null,
      auth_provider: "local",
      is_linkedin_verified: false,
    });

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("LinkedIn account disconnected successfully", {
      userId,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    res.status(200).json({
      status: "success",
      message: "LinkedIn account disconnected successfully",
    });
  } catch (error) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("LinkedIn disconnect failed", {
      userId: req.user?.id,
      error: error.message,
      stack: error.stack.substring(0, 200),
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING
    console.error("LinkedIn disconnect error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to disconnect LinkedIn account",
      error: error.message,
    });
  }
});

/**
 * Get LinkedIn profile data
 * @route GET /auth/linkedin/profile
 * @access Private
 */
const getLinkedInProfile = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Get LinkedIn profile request initiated", {
      userId,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    const user = await User.findByPk(userId, {
      attributes: [
        "id",
        "first-name",
        "last-name",
        "email",
        "user-type",
        "profile_picture_url",
        "linkedin_profile_url",
        "linkedin_headline",
        "linkedin_location",
        "auth_provider",
        "is_linkedin_verified",
        "linkedin_token_expires_at",
      ],
    });

    if (!user) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("User not found for LinkedIn profile request", {
        userId,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    if (user.auth_provider !== "linkedin") {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("User not LinkedIn authenticated for profile request", {
        userId,
        authProvider: user.auth_provider,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return res.status(400).json({
        status: "error",
        message: "User not authenticated via LinkedIn",
      });
    }

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("LinkedIn profile retrieved successfully", {
      userId,
      email: user.email.substring(0, 3) + "***",
      userType: user["user-type"],
      hasTokenExpiry: !!user.linkedin_token_expires_at,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    res.status(200).json({
      status: "success",
      data: {
        user: {
          id: user.id,
          "first-name": user["first-name"],
          "last-name": user["last-name"],
          email: user.email,
          "user-type": user["user-type"],
          profile_picture_url: user.profile_picture_url,
          linkedin_profile_url: user.linkedin_profile_url,
          linkedin_headline: user.linkedin_headline,
          linkedin_location: user.linkedin_location,
          auth_provider: user.auth_provider,
          is_linkedin_verified: user.is_linkedin_verified,
          token_expires_at: user.linkedin_token_expires_at,
        },
      },
    });
  } catch (error) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("Get LinkedIn profile failed", {
      userId: req.user?.id,
      error: error.message,
      stack: error.stack.substring(0, 200),
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING
    console.error("Get LinkedIn profile error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to get LinkedIn profile",
      error: error.message,
    });
  }
});

module.exports = {
  getLinkedInAuthUrl,
  handleLinkedInCallback,
  refreshLinkedInToken,
  disconnectLinkedIn,
  getLinkedInProfile,
};
