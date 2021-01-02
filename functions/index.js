const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { google } = require('googleapis');

admin.initializeApp();

const oauthParams = require('./oauth_credentials');

const getClient = () => new google.auth.OAuth2(
  oauthParams.clientId, oauthParams.secretKey, oauthParams.callbackUrl,
);

const scopes = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events.readonly'
];

const CORSHeaders = (req) => ({
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Origin": req.header("Origin"),
  "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
  "Content-Type": "application/json"
});

exports.calendar = functions.https.onRequest(async (request, response) => {
  response.set(CORSHeaders(request));

  const { userId } = request.query;
  const userOb = await admin.firestore().doc(`users/${userId}`).get();

  if (userOb.exists) {
    const user = userOb.data();
    const { calendarRefreshToken } = user;

    const auth = getClient();
    auth.setCredentials({refresh_token: calendarRefreshToken});

    const calendar = google.calendar({version: 'v3', auth});

    const result = await calendar.events.list({
      calendarId: 'primary',
      timeMin: (new Date()).toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });

    response.json(result);
  } else {
    response.status(404).json({error: "User not found"});
  }
});

exports.oauthUrl = functions.https.onRequest((request, response) => {
  const client = getClient();

  response.set(CORSHeaders(request));

  const url = client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state: request.query.action
});
  
  response.send(url);
});

exports.oauthCallback = functions.https.onRequest(async (request, response) => {
  const client = getClient();

  const { query: { state, code } } = request;
  const { tokens: { refresh_token } } = await client.getToken(code);

  const { redirect, userId } = JSON.parse(state);

  if (refresh_token) {
    await admin.firestore().doc(`users/${userId}`).update({calendarRefreshToken: refresh_token});
    response.redirect(redirect);
  } else {
    response.send("Couldn't find refresh token in result");
  }
});
