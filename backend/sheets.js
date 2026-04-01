const { google } = require("googleapis");

// AUTH SETUP
const auth = new google.auth.GoogleAuth({
    keyFile: "config/credentials.json",
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"] 
});

// CREATE SHEET INSTANCE
const sheets = google.sheets({version: "v4", auth});

// SPREADSHEET ID
const SPREADSHEET_ID = "1wf32jRYWpADdeEsee0sbgnIPedn7hKMSQ7GJcAg7yJI";

async function getSheetData() {
    const response= await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: "Sheet1!A2:E"
    });

    const rows = response.data.values;

    if (!rows) { return[]; }

    // converts rows into structured objects
    const formattedData = rows.map((row) => {
        let alive = parseInt(row[2]) || 0;
        let knocked = parseInt(row[3]) || 0;

        alive = Math.max(0, Math.min(alive, 4));
        knocked = Math.max(0, Math.min(knocked, 4));

        if (alive === 0) {
            knocked = 0;
        }if (alive + knocked > 4) {
            knocked = 4-alive;
        }

        return{
            rank: row[0],
            team: row[1],
            alive,
            knocked,
            // alive: parseInt(row[2]) || 0,
            // knocked: parseInt(row[3]) || 0,
            elims: parseInt(row[4]) || 0,
        };
    });

    const cleanData = formattedData.filter(team => team.team && team.team.trim() !== "");

    return cleanData;
    return formattedData;
};

module.exports = { getSheetData };