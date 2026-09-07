# Truck Dispatch & Logistics Platform

## Project Status

This is a **standalone project** and must remain completely separate from **StockIQ**.

Do not reuse the StockIQ repository, database, Vercel project, environment variables, authentication configuration, or deployment pipeline.

---

## 1. Project Goal

Build a modern web-based truck dispatch and logistics platform that helps dispatchers and carriers manage trucks, drivers, loads, brokers, documents, profitability, and dispatch decisions.

The long-term goal is to create a technology-driven logistics platform that can support:

- Independent owner-operators
- Small trucking fleets
- Dispatch companies
- Freight brokerage operations
- Direct shipper relationships
- AI-assisted dispatching
- Load profitability optimization
- Automated paperwork and workflow management

The platform should begin as a dispatch-management SaaS product and later be capable of supporting freight brokerage functionality.

---

## 2. Recommended Technology Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Vercel

### Source Control

- GitHub

Recommended repository:

```text
truck-dispatch-platform
```

Possible future product names:

```text
DispatchIQ
FreightIQ
HaulIQ
TruckFlow
RouteIQ
LoadPilot
```

The final product name can be decided later.

### Database

Use PostgreSQL.

Recommended providers:

- Supabase
- Neon

Do not share a database with StockIQ.

### Authentication

Recommended options:

- Clerk
- Supabase Auth
- Auth0

The trucking platform must have its own authentication configuration.

### File Storage

Use object storage for:

- Rate confirmations
- Bills of lading
- PODs
- Carrier packets
- Insurance certificates
- Broker agreements
- Driver documents

Possible providers:

- Supabase Storage
- AWS S3
- Cloudflare R2

### Background Processing

Long-running jobs should not depend entirely on Vercel serverless functions.

Recommended:

- Inngest
- Trigger.dev
- Dedicated worker service

Use background workers for:

- Load ingestion
- Document processing
- Notifications
- AI analysis
- Load scoring
- Rate calculations
- Scheduled data synchronization

---

## 3. High-Level Architecture

```text
                     +-------------------+
                     |     Web Browser   |
                     +---------+---------+
                               |
                               v
                     +-------------------+
                     | Next.js / Vercel  |
                     +---------+---------+
                               |
             +-----------------+-----------------+
             |                                   |
             v                                   v
    +-------------------+               +-------------------+
    |    PostgreSQL     |               |   File Storage    |
    |  Operational DB   |               | Documents / PODs  |
    +---------+---------+               +-------------------+
              |
              v
    +-------------------+
    | Background Worker |
    +---------+---------+
              |
       +------+------+------------------+
       |             |                  |
       v             v                  v
 Load Feeds      AI Engine        Notifications
 / APIs          / Scoring        Email / SMS
```

---

## 4. Core Users

### Platform Admin

Can:

- Manage customers
- Manage subscriptions
- Manage system settings
- View platform metrics
- Handle support
- Review audit activity

### Dispatch Company

Can:

- Add carriers
- Add trucks
- Add drivers
- Find and manage loads
- Assign trucks
- Upload documents
- Monitor dispatch status
- Track weekly revenue
- Analyze truck profitability

### Carrier / Owner-Operator

Can:

- View assigned loads
- Accept or reject loads
- Upload documents
- View settlements
- View revenue
- Update truck availability
- Set home-time preferences

### Dispatcher

Can:

- View assigned trucks
- Search loads
- Compare loads
- Negotiate rates
- Assign loads
- communicate with drivers
- Track active shipments
- upload documents

---

## 5. MVP Modules

### 5.1 Dashboard

Display:

- Active trucks
- Available trucks
- Trucks under load
- Loads today
- Loads this week
- Gross revenue
- Average rate per mile
- Deadhead percentage
- Upcoming pickups
- Upcoming deliveries
- Missing documents

---

## 6. Carrier Management

Each carrier should contain:

```text
Carrier Name
MC Number
DOT Number
Address
Phone
Email
Dispatcher
Insurance Expiration
Authority Status
Equipment Types
Preferred Lanes
Home State
Notes
Status
```

Carrier status:

```text
Active
Inactive
Pending
Suspended
```

---

## 7. Driver Management

Driver fields:

```text
First Name
Last Name
Phone
Email
Carrier
Truck
Current Location
Home Location
Available Date
Preferred Lanes
Home-Time Requirement
Hours Available
Driver Notes
Status
```

---

## 8. Truck Management

Truck fields:

```text
Truck Number
Carrier
Driver
VIN
Equipment Type
Trailer Number
Current City
Current State
Available Date
Available Time
Status
```

Equipment types:

```text
Dry Van
Reefer
Flatbed
Step Deck
Power Only
Box Truck
Hotshot
RGN
Other
```

Truck status:

```text
Available
Searching
Booked
At Pickup
In Transit
At Delivery
Delivered
Out of Service
```

---

## 9. Load Management

Load fields:

```text
Load Number
Broker
Broker MC
Carrier
Truck
Driver
Origin
Destination
Pickup Date
Pickup Time
Delivery Date
Delivery Time
Commodity
Weight
Trailer Type
Loaded Miles
Deadhead Miles
Rate
Fuel Estimate
Tolls
Rate Per Loaded Mile
Effective Rate Per Mile
Status
Broker Contact
Broker Phone
Broker Email
Notes
```

Load status:

```text
Potential
Negotiating
Booked
Dispatched
At Pickup
Loaded
In Transit
At Delivery
Delivered
Invoiced
Paid
Cancelled
```

---

## 10. Dispatch Board

The Dispatch Board should be one of the main screens.

Suggested columns:

```text
AVAILABLE
SEARCHING
BOOKED
AT PICKUP
IN TRANSIT
DELIVERED
```

Each truck card should show:

```text
Truck Number
Driver
Current Location
Destination
Pickup
Delivery
Rate
RPM
Next Availability
```

Cards should support drag-and-drop status updates later.

---

## 11. Load Profitability Engine

This is one of the most important differentiators.

Basic calculations:

```text
Total Miles = Loaded Miles + Deadhead Miles
```

```text
Loaded RPM = Rate / Loaded Miles
```

```text
Effective RPM = Rate / Total Miles
```

Example:

```text
Rate: $2,400
Loaded Miles: 720
Deadhead: 80

Total Miles = 800

Loaded RPM = $3.33

Effective RPM = $3.00
```

The platform should emphasize **effective RPM**, not just loaded RPM.

---

## 12. Load Scoring Engine

Future load-ranking logic:

```text
Load Score =
    Rate Per Mile
    + Destination Market Strength
    + Reload Probability
    + Home-Time Match
    + Preferred Lane Match
    - Deadhead Penalty
    - Fuel Cost
    - Toll Cost
    - HOS Risk
    - Detention Risk
    - Bad Broker Risk
```

Example:

```text
Atlanta -> Nashville

Rate:              $1,150
Loaded Miles:      250
Deadhead:           30
Total Miles:       280
Effective RPM:    $4.11
Market Score:       88
Reload Score:       92
Home-Time Score:    90

Overall Load Score: 94
```

The dispatcher should be able to sort available loads by overall score.

---

## 13. Route Optimization

The system should eventually evaluate the whole truck week rather than individual loads.

Example:

```text
Atlanta
   |
   v
Nashville
   |
   v
Indianapolis
   |
   v
Atlanta
```

The objective should be:

```text
Maximum Weekly Revenue
+
Minimum Deadhead
+
Strong Reload Markets
+
Driver Home-Time Requirement
```

rather than simply choosing the highest-paying immediate load.

---

## 14. Broker Management

Broker fields:

```text
Broker Name
MC Number
DOT Number
Phone
Email
Website
Payment Terms
Credit Rating
Average Rate
Average Days to Pay
Loads Completed
Claims
Dispatcher Rating
Notes
Status
```

Eventually calculate an internal:

```text
Broker Score
```

based on:

```text
Payment Speed
Rate Quality
Detention
Communication
Load Accuracy
Cancellation History
Claims
```

---

## 15. Document Management

Associate documents with:

- Carrier
- Driver
- Truck
- Load
- Broker

Document types:

```text
Rate Confirmation
BOL
POD
Carrier Packet
Insurance Certificate
W-9
Broker Agreement
Invoice
Lumpher Receipt
Fuel Receipt
Other
```

Future AI capability:

Upload a rate confirmation and automatically extract:

```text
Broker
Rate
Pickup
Delivery
Commodity
Weight
Reference Number
Appointment Times
Special Instructions
```

---

## 16. Financial Dashboard

Per truck:

```text
Gross Revenue
Loads Completed
Loaded Miles
Deadhead Miles
Average Loaded RPM
Average Effective RPM
Fuel Estimate
Dispatch Fees
Estimated Net
```

Per carrier:

```text
Weekly Gross
Monthly Gross
Average RPM
Revenue Per Truck
Deadhead Percentage
Loads Per Truck
```

---

## 17. Dispatch Company Revenue

Support multiple fee models.

### Percentage

Example:

```text
Truck Gross Revenue = $7,000
Dispatch Fee = 5%

Dispatch Revenue = $350
```

### Flat Weekly Fee

Example:

```text
$300 / truck / week
```

### Hybrid

Example:

```text
$150 base weekly fee
+
3% load revenue
```

---

## 18. SaaS Subscription Model

Potential future pricing:

### Owner Operator

```text
1 Truck
Basic dispatch dashboard
Document management
Revenue tracking
```

### Small Fleet

```text
Up to 10 trucks
Multiple drivers
Dispatch board
Analytics
Load scoring
```

### Dispatch Company

```text
Multiple carriers
Multiple dispatchers
Advanced reporting
Automation
AI tools
```

### Brokerage

```text
Shippers
Carrier network
Margin tracking
Carrier procurement
Load tendering
Advanced compliance
```

Pricing should be determined after product-market testing.

---

## 19. AI Features

AI should be added after the operational workflow is stable.

Possible AI capabilities:

### Load Recommendations

```text
What is the best load for Truck 105?
```

### Negotiation Assistant

```text
Broker offered $2,100.

Market data and route economics indicate
a target range of $2,350-$2,500.
```

### Document Extraction

Automatically read:

- Rate confirmations
- PODs
- BOLs
- Carrier packets

### Dispatcher Assistant

Example:

```text
Truck 105 delivers in Nashville at 07:00 tomorrow.

Recommended next markets:

1. Nashville -> Chicago
2. Nashville -> Indianapolis
3. Nashville -> Cincinnati

Avoid:
Nashville -> Miami

Reason:
poor outbound reload probability from South Florida.
```

### Risk Detection

Detect:

- suspicious brokers
- unusual rates
- duplicate loads
- late deliveries
- missing documents
- expiring insurance
- poor-performing lanes

---

## 20. Future Load Board Integrations

Potential integrations may include:

- DAT
- Truckstop
- Direct broker APIs
- EDI
- Email-based load ingestion
- Shipper APIs

Important:

Do not build scraping mechanisms that violate load-board terms of service.

Use approved APIs and integration methods.

---

## 21. Maps and Routing

Possible providers:

- Google Maps
- Mapbox
- HERE

Features:

```text
Mileage Calculation
Deadhead Calculation
Route Visualization
ETA
Traffic
Tolls
Truck Location
Pickup / Delivery Mapping
```

---

## 22. Notifications

Support:

- Email
- SMS
- In-app notifications

Possible events:

```text
New Load Assigned
Pickup Approaching
Delivery Approaching
Driver Late
POD Missing
Insurance Expiring
Rate Confirmation Missing
Truck Available
Broker Payment Late
```

---

## 23. Database Entities

Initial schema:

```text
users
organizations
carriers
dispatchers
drivers
trucks
trailers
brokers
loads
load_stops
dispatch_assignments
documents
invoices
payments
expenses
load_scores
notifications
audit_logs
```

Future entities:

```text
shippers
customers
brokerage_loads
carrier_quotes
shipper_rates
contracts
subscriptions
integrations
market_rates
lanes
lane_statistics
```

---

## 24. Multi-Tenant Architecture

The system should be multi-tenant from the beginning.

Basic relationship:

```text
Organization
    |
    +-- Users
    +-- Carriers
    +-- Trucks
    +-- Drivers
    +-- Loads
    +-- Brokers
    +-- Documents
```

Every operational table should contain:

```text
organization_id
```

This prevents one customer from seeing another customer's data.

---

## 25. Security

Minimum requirements:

- Role-based access control
- Tenant isolation
- Secure authentication
- Encrypted secrets
- HTTPS
- Audit logs
- Database backups
- Signed document URLs
- Rate limiting
- Input validation

Never store secrets directly in GitHub source code.

Use Vercel environment variables.

Example:

```text
DATABASE_URL
AUTH_SECRET
MAPS_API_KEY
STORAGE_KEY
AI_API_KEY
EMAIL_API_KEY
```

---

## 26. GitHub Structure

Recommended:

```text
truck-dispatch-platform/
|
|-- app/
|-- components/
|-- lib/
|-- db/
|-- services/
|-- workers/
|-- public/
|-- tests/
|-- docs/
|
|-- .env.example
|-- README.md
|-- package.json
|-- tsconfig.json
```

Branches:

```text
main
develop
feature/*
fix/*
```

Examples:

```text
feature/dispatch-board
feature/carrier-management
feature/load-management
feature/load-scoring
feature/document-upload
```

---

## 27. Deployment Strategy

### Production

```text
GitHub main
    |
    v
Vercel Production
```

### Development

```text
GitHub develop
    |
    v
Vercel Staging
```

### Pull Requests

```text
Feature Branch
    |
    v
GitHub Pull Request
    |
    v
Vercel Preview Deployment
```

---

## 28. Separation From StockIQ

This requirement is mandatory.

```text
StockIQ
|
+-- Separate GitHub Repo
+-- Separate Vercel Project
+-- Separate Database
+-- Separate Environment Variables
+-- Separate Authentication
+-- Separate Domain
```

```text
Truck Dispatch Platform
|
+-- New GitHub Repo
+-- New Vercel Project
+-- New Database
+-- New Environment Variables
+-- New Authentication
+-- New Domain
```

There should be **no dependency between StockIQ and the trucking platform**.

They can eventually share reusable development knowledge or generic code patterns, but they should remain separate products.

---

## 29. MVP Development Phases

### Phase 1 - Foundation

Build:

- GitHub repository
- Next.js application
- Vercel deployment
- PostgreSQL database
- Authentication
- Organization model
- User roles

### Phase 2 - Carrier Operations

Build:

- Carrier management
- Driver management
- Truck management
- Trailer management

### Phase 3 - Loads

Build:

- Create load
- Edit load
- Assign truck
- Assign driver
- Load status
- Pickup and delivery workflow

### Phase 4 - Dispatch Board

Build:

- Truck availability board
- Active loads
- Status management
- Upcoming pickups
- Upcoming deliveries

### Phase 5 - Financial Analytics

Build:

- Revenue
- Loaded RPM
- Effective RPM
- Deadhead
- Weekly truck revenue
- Carrier reporting

### Phase 6 - Documents

Build:

- Rate confirmations
- BOL
- POD
- Carrier packets
- File storage

### Phase 7 - Load Scoring

Build:

- Deadhead scoring
- RPM scoring
- lane scoring
- reload scoring
- truck/load matching

### Phase 8 - Automation and AI

Build:

- Document extraction
- AI load recommendations
- automated notifications
- broker scoring
- route recommendations

---

## 30. MVP Success Criteria

The MVP should allow a dispatcher to perform the following workflow:

```text
Create Carrier
    |
    v
Add Driver
    |
    v
Add Truck
    |
    v
Mark Truck Available
    |
    v
Create / Import Load
    |
    v
Calculate Load Profitability
    |
    v
Assign Load
    |
    v
Dispatch Driver
    |
    v
Track Load
    |
    v
Deliver Load
    |
    v
Upload POD
    |
    v
Complete Load
    |
    v
Update Revenue Dashboard
```

If this workflow works cleanly, the first usable version of the platform exists.

---

## 31. Core Product Principle

The product should not simply help dispatchers find loads.

The product should answer:

> **What is the most profitable next move for this truck?**

The long-term competitive advantage should come from:

```text
Automation
+
Data
+
Operational History
+
Lane Intelligence
+
Load Scoring
+
AI
```

rather than competing only on manual dispatch labor.

---

## 32. Initial Development Priority

Start with:

```text
1. Project foundation
2. Authentication
3. Organizations
4. Carriers
5. Drivers
6. Trucks
7. Loads
8. Dispatch Board
9. Revenue calculations
10. Documents
```

Do not start with advanced AI or load-board integrations.

First build a reliable dispatch operating system.

Then add automation and intelligence on top of it.
