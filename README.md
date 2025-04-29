# 📘 GA4 Proxy Integration Wiki

## 🔧 Project Overview

This project sets up a **backend proxy for Google Analytics 4 (GA4) reporting**, using a **Node.js + Express** server. The backend securely interacts with the GA4 Data API via a **service account**, allowing frontend clients or tools like Postman to request analytics reports using custom filters, dimensions, and metrics.

---

## 🛠️ Backend Configuration

### ✅ Technologies Used

- **Node.js** / **Express**
- `@google-analytics/data` (GA4 API SDK)
- `google-auth-library` (for service account auth)

### ✅ Required Files

- `index.js` → Express server
- `service-account.json` → Downloaded from GCP (contains private key, email, etc.)
- `package.json` → Node dependencies

### ✅ Service Account Setup

1. **Create a service account** in [Google Cloud Console](https://console.cloud.google.com/iam-admin/serviceaccounts).
2. **Generate a JSON key file** for this service account.
3. **Grant the account GA4 Viewer access**:
   - Go to **GA4 Admin → Property Access Management**
   - Add the service account email with **Viewer** role
4. Place the `.json` key file in the root directory (`/GA4-DEMO`)

### ✅ GA4 Configuration

1. **Custom Dimensions Setup**
   - Register any used dimensions (e.g., `platform_portal`)
   - Scope: `Event`, `User`, or `Item` depending on intended use
   - Parameter name must match what’s sent in the correct scope (event param, user property, or item param)

2. **Event Collection Validation**
   - Ensure data is being sent with `gtag()` or GTM
   - Confirm data exists in recent date ranges (use Free Form UI)

---

## 🧾 API Usage

### ✅ API Endpoint

```bash
POST /report
```

### ✅ Request Payload Format

```json
{
  "startDate": "7daysAgo",
  "endDate": "today",
  "dimensions": ["customEvent:platform_portal", "city", "deviceCategory"],
  "metrics": ["eventCount", "activeUsers"],
  "filters": [
    { "field": "city", "value": "Casablanca" },
    { "field": "deviceCategory", "value": "desktop" }
  ]
}
```

### ✅ Supported Options

- `dimensions[]` – GA4 dimensions (registered if custom)
- `metrics[]` – GA4 metrics (e.g., `eventCount`, `activeUsers`)
- `filters[]` – array of dimension-level filters
- `orderBys[]` – optional metric sort (planned support)

---

## ⚙️ Functional Flow

### ✅ Report Handling Logic

1. Client sends a `POST /report` request with JSON payload
2. Backend reads:
   - `startDate`, `endDate`
   - `dimensions[]`, `metrics[]`
   - Optional filters
3. Backend uses `BetaAnalyticsDataClient.runReport()` to query GA4
4. Response is returned to client in raw GA4 API format
5. Client (frontend/Postman) reshapes or renders the data

---

## 🔐 Security Notes

- `service-account.json` should never be committed or exposed
- Use `.env` or secret management in production
- Whitelist allowed dimensions/metrics to prevent misuse

---

## 📊 Use Case Flow Diagram (Plain-Text)

```plaintext
 +------------------+           +-----------------------+            +------------------------------+
 |   Frontend App   |           |     Backend Proxy     |            |         GA4 Data API         |
 | (or Postman Req) |  POST     |  Express + Service Acc|   Auth +   |    analyticsdata.googleapis  |
 +--------+---------+ --------> +-----------+-----------+ ---------> +--------------+---------------+
          |                                 |                                 |
          |  JSON payload:                  |  Validates dimensions,          |
          |  - startDate, endDate           |  filters, and metrics           |
          |  - dimensions, metrics          |                                 |
          |  - optional filters             |  Generates GA4 API request      |
          |                                 |                                 |
          |                                 |  Fetches GA4 report             |
          |                                 | <------------------------------+
          |                                 |                                 |
          |  Receives report JSON           |                                 |
          | <-------------------------------+                                 |
          |  Displays, reshapes, visualizes |                                 |
 +--------+---------+                       |                                 |
 |        Client     |                       |                                 |
 +------------------+                       +---------------------------------+
```

---

## ✅ Supported Use Cases

| Use Case | Description |
|----------|-------------|
| 💻 Dashboarding | Dynamically fetch GA4 metrics from different dimensions |
| 🧪 Postman Testing | Manual analytics report exploration |
| 🧑‍💼 Client-specific filtering | Filter results by platform, city, or custom identifiers |
| 📊 Pivot-style tables | Client-side grouping by `deviceCategory`, `platform_portal`, etc. |
| 🔄 Caching (future) | Optimize repeated queries with in-memory or Redis cache |
| 🔒 Role-based field control | Lock down dimensions/metrics per client or session (planned) |

---

## 🎯 Dimension-Level Filtering Methods

The backend supports advanced dimension-level filtering using the GA4 Data API’s `dimensionFilter` field. Supported methods include:

### 1. Single Filter (Default)

```json
"filters": [
  { "field": "city", "value": "Casablanca" }
]
```

### 2. Multi-Filter with AND Logic

```json
"filters": [
  { "field": "city", "value": "Casablanca" },
  { "field": "deviceCategory", "value": "desktop" }
]
```

### 3. Match Type Variants

```json
"filters": [
  { "field": "city", "value": "casa", "matchType": "CONTAINS", "caseSensitive": false }
]
```

| Match Type     | Description                |
|----------------|----------------------------|
| `EXACT`        | Exact string match (default) |
| `BEGINS_WITH`  | Value starts with filter    |
| `CONTAINS`     | Value contains filter       |

You can combine any number of these filters and the backend will construct a GA4-compatible `andGroup` dimension filter block.

---

## 🔧 Querying Custom Dimensions

To successfully query custom dimensions, you must use the correct prefix depending on the dimension's scope:

### ✅ Syntax by Scope

| Scope        | API Format Example                       |
|--------------|-------------------------------------------|
| Event        | `customEvent:platform_portal`             |
| User         | `customUser:user_type`                    |
| Item         | `customItem:item_category`                |

### ✅ Request Example

```json
"dimensions": ["customEvent:platform_portal", "customUser:membership_status", "customItem:category_name"]
```

### ✅ Backend Behavior

- Native dimensions (like `city`, `deviceCategory`) are passed unchanged
- Custom dimensions are auto-prefixed with the appropriate scope if not already present
- By default, the backend assumes `customEvent:` for unknown fields unless configured otherwise

To override this, pass explicitly prefixed dimension names or configure scope handling logic inside the backend.

> You can confirm available custom dimensions via the [GA4 Metadata API](https://developers.google.com/analytics/devguides/reporting/data/v1/metadata-api), which returns all valid dimensions and metrics for a given property.
