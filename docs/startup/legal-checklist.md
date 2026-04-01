# PourStock — Legal Checklist

**Legal Documents & Compliance Requirements for SaaS Startup Operating in Denmark / EU**
*Version 1.0 — March 2026*

*Disclaimer: This document is an operational checklist for the founding team. It does not constitute legal advice. Engage a qualified Danish commercial lawyer and a GDPR-specialist data protection consultant before commercial launch.*

---

## 1. Company Formation

### 1.1 Entity Type

**Recommended**: Danish **Anpartsselskab (ApS)** — equivalent to a private limited company.

- Minimum share capital: DKK 40,000 (approximately €5,350)
- Liability limited to the company's assets
- Standard entity type for Danish technology startups and SaaS businesses
- Registered with the Danish Business Authority (Erhvervsstyrelsen)

**Alternative**: Estonian OÜ via e-Residency (if founding team is not based in Denmark). Provides EU-based entity with lower formation overhead, but may complicate Danish banking and investor relationships.

### 1.2 Formation Checklist

- [ ] Draft company articles of association (vedtægter)
- [ ] Register with Erhvervsstyrelsen via virk.dk
- [ ] Obtain CVR number (company registration number)
- [ ] Open a Danish business bank account (Nordea, Danske Bank, or a fintech such as Lunar Business or Penta)
- [ ] Register for VAT (moms) — mandatory if annual turnover exceeds DKK 50,000
- [ ] Register for corporate tax with SKAT
- [ ] File initial share register (aktiebog)
- [ ] Issue founder shares and document in shareholders' agreement
- [ ] Adopt IP assignment agreements for all founders and contractors

### 1.3 Shareholders' Agreement

A shareholders' agreement (aktionæroverenskomst) must be in place between all founders before any external capital is raised. It must address:

- [ ] Share ownership percentages
- [ ] Vesting schedules (typically 4-year vest, 1-year cliff)
- [ ] Good leaver / bad leaver provisions
- [ ] Pre-emption rights on share transfers
- [ ] Tag-along and drag-along rights
- [ ] Decision-making thresholds (ordinary vs. qualified majority)
- [ ] Non-compete and non-solicitation obligations

### 1.4 IP Assignment

- [ ] All intellectual property created by founders, employees, and contractors must be formally assigned to the company
- [ ] Include IP assignment clause in all employment contracts and contractor agreements
- [ ] Confirm that no pre-existing IP used in the platform is owned by a prior employer or third party

---

## 2. GDPR Compliance

PourStock processes personal data of hotel guests (names, room numbers, dietary requirements) as part of its core product functionality. This makes GDPR compliance a non-negotiable commercial and legal requirement before onboarding any paying customer.

### 2.1 GDPR Roles

- **PourStock**: Acts as a **Data Processor** with respect to hotel guest data. The hotel customer is the **Data Controller**.
- **PourStock**: Also acts as a **Data Controller** for its own customer data (hotel managers, staff user accounts, billing contacts).

### 2.2 Appointment of Data Protection Officer (DPO)

- PourStock likely does not meet the threshold for mandatory DPO appointment under GDPR Article 37 (not a public authority; core activities do not involve large-scale systematic monitoring or special category data).
- However, designating a voluntary DPO or Data Protection Lead from within the founding team is recommended.
- [ ] Designate a Data Protection Lead internally
- [ ] Evaluate DPO requirement annually as data processing activities scale

### 2.3 Record of Processing Activities (RoPA)

GDPR Article 30 requires a Record of Processing Activities for all data controllers and processors processing personal data. PourStock must maintain a RoPA documenting:

- [ ] Purpose and legal basis for each processing activity
- [ ] Categories of data subjects and personal data
- [ ] Recipients of personal data (third-party sub-processors: Supabase, Gemini/Google, Stripe)
- [ ] Retention periods
- [ ] Technical and organisational security measures

### 2.4 Lawful Basis for Processing

| Processing Activity | Data Subject | Lawful Basis |
|--------------------|-------------|--------------|
| Hotel staff accounts | Hotel employees | Legitimate interests / Contract |
| Guest names on table plans | Hotel guests | Legitimate interests of the hotel (Art. 6(1)(f)) |
| Dietary requirements in AI parsing | Hotel guests | Legitimate interests (processed on behalf of controller) |
| Billing and invoicing | Hotel admin contacts | Contract (Art. 6(1)(b)) |
| AI parsing via Gemini | Hotel guests | Sub-processor arrangement; covered by DPA with hotel |

Note: Dietary requirements may constitute special category health data under GDPR Article 9. Assess whether processing is covered by the hotel's own consent or legitimate interest framework.

### 2.5 Sub-Processor Management

PourStock relies on the following sub-processors that process personal data:

| Sub-Processor | Purpose | Data Region | DPA Available? |
|--------------|---------|-------------|----------------|
| Supabase | Database / backend | EU (AWS eu-central-1) | Yes — Supabase DPA |
| Google (Gemini) | AI parsing | May leave EU | Review Google Cloud DPA |
| Stripe | Payment processing | EU | Yes — Stripe DPA |
| Lovable (hosting) | Frontend hosting | Review | Confirm DPA status |

Actions:
- [ ] Confirm Supabase data residency is locked to EU region
- [ ] Sign Google Cloud DPA; assess Gemini-specific data processing terms
- [ ] Assess whether Gemini prompts containing guest names are retained by Google and for how long
- [ ] Sign Stripe DPA
- [ ] Confirm Lovable hosting GDPR status and sign DPA if required

### 2.6 Data Retention Policy

- [ ] Define retention periods for each data category
- [ ] Hotel guest operational data: retain for duration of hotel subscription + 30 days after termination
- [ ] Billing records: retain for 5 years (Danish bookkeeping law minimum)
- [ ] AI parsing logs: retain for 90 days, then anonymise or delete
- [ ] Implement automated data deletion workflows

### 2.7 Data Breach Procedure

Under GDPR Article 33, personal data breaches must be reported to the relevant supervisory authority (Datatilsynet in Denmark) within 72 hours of becoming aware.

- [ ] Draft and document a Data Breach Response Procedure
- [ ] Designate the breach notification point of contact
- [ ] Establish notification templates for both Datatilsynet and affected hotel customers
- [ ] Test the procedure annually

### 2.8 Data Subject Rights

- [ ] Implement a process for handling data subject access requests (DSAR): respond within 30 days
- [ ] Right to erasure: define the process for deleting a guest's data on hotel/guest request
- [ ] Right to data portability: define export formats for hotel customer data on subscription termination
- [ ] Document all DSARs in the RoPA

---

## 3. Customer-Facing Legal Documents

### 3.1 Terms of Service (ToS) / Subscription Agreement

The ToS governs the commercial relationship between PourStock and its hotel customers. Key clauses:

- [ ] **Service description**: What modules and features are included per tier
- [ ] **Subscription term**: Monthly and annual options; auto-renewal provisions
- [ ] **Payment terms**: Invoicing cadence, late payment interest (reference Danish interest rate regulations)
- [ ] **Acceptable use policy**: Prohibited uses of the platform
- [ ] **Intellectual property**: PourStock retains all IP; customer retains ownership of their data
- [ ] **Confidentiality**: Both parties' obligations
- [ ] **Liability limitation**: Cap on PourStock's aggregate liability (typically 12 months' fees paid)
- [ ] **Indemnification**: Customer indemnifies PourStock for misuse; PourStock indemnifies for IP infringement
- [ ] **Warranties and disclaimers**: SaaS provided "as is" with uptime SLA; disclaim consequential damages
- [ ] **Governing law and jurisdiction**: Danish law; Courts of Copenhagen
- [ ] **Termination**: Grounds for termination; post-termination data handling

### 3.2 Privacy Policy

Published on the PourStock website and accessible in-product. Must cover:

- [ ] Identity and contact details of the data controller
- [ ] Categories of personal data collected
- [ ] Purposes and legal bases for processing
- [ ] Retention periods
- [ ] Sub-processors and data transfers outside the EU
- [ ] Data subject rights and how to exercise them
- [ ] Right to lodge a complaint with Datatilsynet
- [ ] Cookie policy (if applicable to the marketing website)
- [ ] Date of last update

### 3.3 Data Processing Agreement (DPA)

The DPA is a contractually required document under GDPR Article 28 governing the processor-controller relationship between PourStock (processor) and each hotel customer (controller). Must include:

- [ ] Subject matter, nature, and purpose of the processing
- [ ] Type of personal data and categories of data subjects
- [ ] Duration of the processing
- [ ] Processor obligations: act only on controller's documented instructions; confidentiality; security measures; sub-processor management; data subject rights assistance; deletion or return of data; audit rights
- [ ] List of authorised sub-processors (Annex)
- [ ] Technical and organisational security measures (Annex — often a "Security Addendum")
- [ ] Standard Contractual Clauses if data is transferred to countries outside the EU/EEA (relevant for Google/Gemini)

**Template structure**:
```
DPA v1.0 — PourStock ApS
Controller: [Hotel Name and Legal Entity]
Processor: PourStock ApS, [Registered Address], CVR [number]

Article 1: Definitions
Article 2: Subject Matter and Duration
Article 3: Nature and Purpose of Processing
Article 4: Types of Personal Data and Categories of Data Subjects
Article 5: Obligations of the Processor
Article 6: Sub-Processors
Article 7: International Data Transfers
Article 8: Data Subject Rights
Article 9: Security Measures
Article 10: Breach Notification
Article 11: Audit Rights
Article 12: Deletion or Return of Data
Article 13: Governing Law

Annex I: Description of Processing Activities
Annex II: Technical and Organisational Measures
Annex III: List of Approved Sub-Processors
```

### 3.4 Service Level Agreement (SLA)

Establishes uptime commitments and support response obligations. Key provisions:

**Availability targets:**

| Service Tier | Monthly Uptime Target | Measurement Window |
|-------------|----------------------|--------------------|
| Starter | 99.0% | Calendar month |
| Professional | 99.5% | Calendar month |
| Enterprise | 99.9% | Calendar month |

*Exclusions*: Scheduled maintenance windows (notified 48 hours in advance), force majeure events, third-party infrastructure failures (Supabase, Lovable hosting) outside PourStock's control.

**Support response times:**

| Severity | Definition | Initial Response | Target Resolution |
|----------|-----------|-----------------|-------------------|
| P1 — Critical | Platform completely unavailable | 2 hours | 4 hours |
| P2 — Degraded | Core feature (table plan, inventory) broken | 4 hours | Next business day |
| P3 — Minor | Non-critical feature issue | Next business day | Within 3 business days |
| P4 — General | How-to / configuration question | 24 hours | 5 business days |

*Business hours*: 08:00–18:00 CET, Monday–Friday. P1 support is 24/7.

**Service credits:**
- 99.0–99.5% achieved (Starter target missed): 10% credit on monthly fee
- <99.0% (Starter): 25% credit
- Credits are the exclusive remedy for availability failures and are capped at one month's subscription fee

**SLA template structure**:
```
SLA v1.0 — PourStock ApS
Customer: [Hotel Name]
Effective Date: [Date]

1. Service Availability
2. Scheduled Maintenance
3. Support Services
4. Incident Classification
5. Response and Resolution Commitments
6. Service Credits
7. Exclusions
8. Measurement and Reporting
```

---

## 4. Employment & Contractor Agreements

- [ ] Employment contracts for all employees compliant with Danish employment law (Ansættelsesbevisloven)
- [ ] Include: salary, working hours, notice period, IP assignment, non-compete (6–12 months), confidentiality
- [ ] Contractor/freelancer agreements with IP assignment and data handling obligations
- [ ] Ensure contractor agreements do not create implied employment relationships (Danish courts apply substance-over-form analysis)

---

## 5. Intellectual Property Protection

- [ ] Trademark application for "PourStock" in Denmark (DKPTO) and EU-wide (EUIPO) in Class 42 (SaaS / software services)
- [ ] Review whether the AI parsing methodology or proprietary PDF parsing approach is patentable (software patents have limited scope in EU; assess with IP counsel)
- [ ] Ensure all open-source dependencies are documented and their licences are compatible with commercial use
- [ ] Maintain a software bill of materials (SBOM) for the codebase

---

## 6. Additional Compliance Requirements

### 6.1 Danish Bookkeeping Law (Bogføringsloven)

- [ ] Retain all financial records for a minimum of 5 years
- [ ] Use an accounting system compliant with Danish requirements (e.g., e-conomic, Dinero, Billy)
- [ ] Annual financial statements must be filed with Erhvervsstyrelsen (Årsrapport)

### 6.2 EU AI Act (effective August 2026 for most provisions)

- [ ] Classify PourStock's AI features under the EU AI Act risk framework
- [ ] AI-powered PDF parsing for restaurant table planning: categorised as **minimal-risk** (no impact on rights, safety, or fundamental interests of individuals)
- [ ] No specific obligations triggered for minimal-risk AI systems
- [ ] Monitor AI Act guidance for any reclassification if features evolve (e.g., predictive occupancy algorithms affecting staffing decisions)
- [ ] Maintain internal documentation of AI model usage, data inputs, and purpose (good practice even if not legally required)

### 6.3 Cookie Compliance (ePrivacy Directive / GDPR)

- [ ] Deploy a cookie consent banner on the marketing website compliant with Danish cookie guidelines
- [ ] Categorise cookies: strictly necessary (no consent required), analytics, marketing (explicit consent required)
- [ ] Do not set analytics or tracking cookies until user consent is obtained
- [ ] Document cookie list and update it when tools change

### 6.4 PCI DSS (Payment Card Industry)

- [ ] PourStock must never store, process, or transmit raw payment card data
- [ ] All payment processing is handled by Stripe; PourStock is a SAQ A merchant (minimal scope)
- [ ] Complete a Stripe-assisted PCI SAQ A self-assessment annually
- [ ] Ensure Stripe integration uses Stripe Elements or Checkout (no card data touches PourStock servers)

---

## 7. Priority Order for Legal Actions

Before onboarding the first paying customer (Month 1–2):

| Priority | Action | Owner | Cost Estimate |
|----------|--------|-------|---------------|
| 1 | Company formation (ApS) | Founder + Danish lawyer | €800–€1,500 |
| 2 | Founders' shareholders' agreement | Danish commercial lawyer | €1,500–€3,000 |
| 3 | IP assignment agreements | Danish commercial lawyer | €500 |
| 4 | DPA template (GDPR Article 28) | GDPR consultant | €1,000–€2,000 |
| 5 | Terms of Service | Commercial lawyer | €1,500–€2,500 |
| 6 | Privacy policy | GDPR consultant | €500–€800 |
| 7 | SLA template | Founder (from this template) | Internal |
| 8 | Supabase / Google / Stripe DPAs | Founder (vendor portals) | Free |
| 9 | VAT registration | Founder via SKAT | Free |
| 10 | Trademark application (PourStock) | IP lawyer or self-service DKPTO | €300–€800 |

---

*This checklist should be reviewed by a qualified Danish commercial lawyer and GDPR-specialist counsel before commercial launch. Laws and requirements change; confirm current requirements at the time of action.*
