const { User } = require('../models');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');

// LinkedIn OAuth 2.0 configuration
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const LINKEDIN_REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:3000/helwan-alumni-portal/auth/linkedin/callback';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Generate JWT token for user
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
};

/**
 * Get LinkedIn authorization URL
 * @route GET /auth/linkedin
 * @access Public
 */
const getLinkedInAuthUrl = asyncHandler(async (req, res) => {
  try {
    const state = Math.random().toString(36).substring(2, 15);
    
    // Store state in session or database for security
    req.session.linkedinState = state;
    
    // LinkedIn OAuth 2.0 scopes - Using OpenID Connect
    // Your LinkedIn app shows these scopes are available: openid, profile, email
    // These are the new OpenID Connect scopes (legacy r_liteprofile and r_emailaddress are deprecated)
    const scope = 'openid profile email';
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(LINKEDIN_REDIRECT_URI)}&state=${state}&scope=${encodeURIComponent(scope)}`;
    
    res.status(200).json({
      status: 'success',
      data: {
        authUrl,
        state
      }
    });
  } catch (error) {
    console.error('LinkedIn auth URL error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate LinkedIn auth URL'
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
    
    // Verify state parameter for security
    if (!req.session || state !== req.session.linkedinState) {
      console.error('State mismatch:', { 
        received: state, 
        expected: req.session?.linkedinState,
        hasSession: !!req.session 
      });
      return res.status(400).json({
        status: 'error',
        message: 'Invalid state parameter'
      });
    }
    
    if (!code) {
      return res.status(400).json({
        status: 'error',
        message: 'Authorization code not provided'
      });
    }
    
    // Exchange authorization code for access token
    let tokenResponse;
    try {
      tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', {
        grant_type: 'authorization_code',
        code: code,
        client_id: LINKEDIN_CLIENT_ID,
        client_secret: LINKEDIN_CLIENT_SECRET,
        redirect_uri: LINKEDIN_REDIRECT_URI
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
    } catch (tokenError) {
      console.error('LinkedIn token exchange error:', tokenError.response?.data || tokenError.message);
      return res.status(400).json({
        status: 'error',
        message: 'Failed to exchange authorization code for access token',
        error: tokenError.response?.data?.error_description || tokenError.message
      });
    }
    
    const { access_token, expires_in } = tokenResponse.data;
    
    if (!access_token) {
      return res.status(400).json({
        status: 'error',
        message: 'No access token received from LinkedIn'
      });
    }
    
    // Fetch user profile using OpenID Connect userinfo endpoint
    // This endpoint returns profile information when using openid, profile, email scopes
    let userInfoResponse;
    try {
      userInfoResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      });
    } catch (userInfoError) {
      console.error('LinkedIn userinfo error:', userInfoError.response?.data || userInfoError.message);
      return res.status(400).json({
        status: 'error',
        message: 'Failed to fetch user profile from LinkedIn',
        error: userInfoError.response?.data?.error_description || userInfoError.message
      });
    }
    
    const userInfo = userInfoResponse.data;
    
    // Extract data from OpenID Connect response
    const email = userInfo.email || null;
    const linkedinId = userInfo.sub || userInfo.id || null;
    
    // For additional profile info, try the v2 API (may need legacy scopes)
    let profile = {
      id: linkedinId,
      firstName: { localized: { en_US: userInfo.given_name || userInfo.name?.split(' ')[0] || '' } },
      lastName: { localized: { en_US: userInfo.family_name || userInfo.name?.split(' ').slice(1).join(' ') || '' } },
      profilePicture: null,
      headline: null,
      location: null
    };
    
    // Try to get additional profile details if available
    try {
      const profileResponse = await axios.get('https://api.linkedin.com/v2/me', {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      });
      profile = profileResponse.data;
    } catch (profileError) {
      // If v2/me fails, use the userinfo data we have
      console.log('Using OpenID Connect userinfo data only');
    }
    
    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: 'Could not retrieve email from LinkedIn'
      });
    }
    
    // Check if user already exists
    let user = await User.findOne({
      where: {
        email: email
      }
    });
    
    // Extract profile data (handle both OpenID Connect and v2 API formats)
    const firstName = profile.firstName?.localized?.en_US || profile.firstName?.localized?.en || userInfo.given_name || userInfo.name?.split(' ')[0] || '';
    const lastName = profile.lastName?.localized?.en_US || profile.lastName?.localized?.en || userInfo.family_name || userInfo.name?.split(' ').slice(1).join(' ') || '';
    const profilePictureUrl = profile.profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier || userInfo.picture || null;
    const headline = profile.headline || null;
    const location = profile.location?.name || null;
    const linkedinProfileUrl = profile.id ? `https://www.linkedin.com/in/${profile.id}` : null;
    
    if (user) {
      // Update existing user with LinkedIn data
      await user.update({
        linkedin_id: linkedinId,
        linkedin_access_token: access_token,
        linkedin_token_expires_at: new Date(Date.now() + expires_in * 1000),
        profile_picture_url: profilePictureUrl,
        linkedin_profile_url: linkedinProfileUrl,
        linkedin_headline: headline,
        linkedin_location: location,
        auth_provider: 'linkedin',
        is_linkedin_verified: true,
        'first-name': firstName,
        'last-name': lastName
      });
    } else {
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
        auth_provider: 'linkedin',
        is_linkedin_verified: true,
        'first-name': firstName,
        'last-name': lastName,
        'user-type': 'graduate', // Default to graduate for LinkedIn users
        'hashed-password': null // No password for LinkedIn users
      });
    }
    
    // Generate JWT token
    const token = generateToken(user.id);
    
    // Clear the state from session
    delete req.session.linkedinState;
    
    // ✅ تأكد من أن الرد يحتوي على كل البيانات المطلوبة
    res.status(200).json({
      status: 'success',
      message: 'LinkedIn authentication successful',
      data: {
        user: {
          id: user.id,
          'first-name': user['first-name'],
          'last-name': user['last-name'],
          email: user.email,
          'user-type': user['user-type'], // ✅ مهم جداً
          profile_picture_url: user.profile_picture_url,
          linkedin_profile_url: user.linkedin_profile_url,
          linkedin_headline: user.linkedin_headline,
          linkedin_location: user.linkedin_location,
          auth_provider: user.auth_provider,
          is_linkedin_verified: user.is_linkedin_verified
        },
        token // ✅ مهم جداً
      }
    });
    
  } catch (error) {
    console.error('LinkedIn callback error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      status: 'error',
      message: 'LinkedIn authentication failed',
      error: error.message
    });
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
    
    const user = await User.findByPk(userId);
    if (!user || user.auth_provider !== 'linkedin') {
      return res.status(400).json({
        status: 'error',
        message: 'User not found or not authenticated via LinkedIn'
      });
    }
    
    if (!user.linkedin_refresh_token) {
      return res.status(400).json({
        status: 'error',
        message: 'No refresh token available'
      });
    }
    
    // Exchange refresh token for new access token
    const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', {
      grant_type: 'refresh_token',
      refresh_token: user.linkedin_refresh_token,
      client_id: LINKEDIN_CLIENT_ID,
      client_secret: LINKEDIN_CLIENT_SECRET
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const { access_token, expires_in, refresh_token } = tokenResponse.data;
    
    // Update user with new tokens
    await user.update({
      linkedin_access_token: access_token,
      linkedin_refresh_token: refresh_token || user.linkedin_refresh_token,
      linkedin_token_expires_at: new Date(Date.now() + expires_in * 1000)
    });
    
    res.status(200).json({
      status: 'success',
      message: 'LinkedIn token refreshed successfully'
    });
    
  } catch (error) {
    console.error('LinkedIn token refresh error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to refresh LinkedIn token',
      error: error.message
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
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Clear LinkedIn data
    await user.update({
      linkedin_id: null,
      linkedin_access_token: null,
      linkedin_refresh_token: null,
      linkedin_token_expires_at: null,
      linkedin_profile_url: null,
      linkedin_headline: null,
      linkedin_location: null,
      auth_provider: 'local',
      is_linkedin_verified: false
    });
    
    res.status(200).json({
      status: 'success',
      message: 'LinkedIn account disconnected successfully'
    });
    
  } catch (error) {
    console.error('LinkedIn disconnect error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to disconnect LinkedIn account',
      error: error.message
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
    
    const user = await User.findByPk(userId, {
      attributes: [
        'id', 'first-name', 'last-name', 'email', 'user-type',
        'profile_picture_url', 'linkedin_profile_url', 'linkedin_headline',
        'linkedin_location', 'auth_provider', 'is_linkedin_verified',
        'linkedin_token_expires_at'
      ]
    });
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    if (user.auth_provider !== 'linkedin') {
      return res.status(400).json({
        status: 'error',
        message: 'User not authenticated via LinkedIn'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          'first-name': user['first-name'],
          'last-name': user['last-name'],
          email: user.email,
          'user-type': user['user-type'],
          profile_picture_url: user.profile_picture_url,
          linkedin_profile_url: user.linkedin_profile_url,
          linkedin_headline: user.linkedin_headline,
          linkedin_location: user.linkedin_location,
          auth_provider: user.auth_provider,
          is_linkedin_verified: user.is_linkedin_verified,
          token_expires_at: user.linkedin_token_expires_at
        }
      }
    });
    
  } catch (error) {
    console.error('Get LinkedIn profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get LinkedIn profile',
      error: error.message
    });
  }
});

module.exports = {
  getLinkedInAuthUrl,
  handleLinkedInCallback,
  refreshLinkedInToken,
  disconnectLinkedIn,
  getLinkedInProfile
};
