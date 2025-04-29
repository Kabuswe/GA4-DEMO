const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors'); // Import the cors package
const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const path = require('path');

dotenv.config();

const app = express();
app.use(cors()); // Enable CORS for all routes
app.use(express.json());

const propertyId = process.env.GA4_PROPERTY_ID;
const keyFilePath = path.resolve(__dirname, 'service-account.json');

const analyticsClient = new BetaAnalyticsDataClient({ keyFilename: keyFilePath });

app.post('/report', async (req, res) => {
  const { startDate, endDate, dimensions, metrics, filters, notFilters, limit, offset } = req.body;

  try {
    // Construct dimension filter group if filters are provided
    let dimensionFilter = undefined;
    if (Array.isArray(filters) && filters.length > 0 || Array.isArray(notFilters) && notFilters.length > 0) {
      dimensionFilter = {
        andGroup: {
          expressions: [
            ...(filters || []).map(f => ({
              filter: {
                fieldName: f.field,
                stringFilter: {
                  value: f.value,
                  matchType: f.matchType || 'EXACT',
                  caseSensitive: f.caseSensitive ?? false
                }
              }
            })),
            ...(notFilters || []).map(f => ({
              notExpression: {
                filter: {
                  fieldName: f.field,
                  stringFilter: {
                    value: f.value,
                    matchType: f.matchType || 'EXACT',
                    caseSensitive: f.caseSensitive ?? false
                  }
                }
              }
            }))
          ],
        }
      };
    }
    
    const request = {
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: dimensions.map(name => ({ name })),
      metrics: metrics.map(name => ({ name })),
      ...(dimensionFilter && { dimensionFilter }),
      ...(limit !== undefined && { limit }), 
      ...(offset !== undefined && { offset })  
    };

    const [report] = await analyticsClient.runReport(request);
    res.json(report);
  } catch (err) {
    console.error('GA4 API Error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log('✅ Running on http://localhost:3000/report');
});
