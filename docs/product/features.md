# PourStock Features

## Inventory Management

Product catalog with beverage categorization, multi-location stock tracking, quick count workflows for bar staff, partial bottle tracking, stock movement history, and configurable reorder thresholds.

## Hotel Reception

Guest check-in and check-out workflows, room assignment management, reservation tracking, and real-time room status board. Supports multi-device coordination between reception, bar, and restaurant.

## Housekeeping

Task generation triggered by check-out events, room status tracking, priority-based task queues, inspection workflows, and assignment management.

## Restaurant Table Planning

AI-powered dinner service coordination. Upload reservation PDFs (Danish Køkkenliste format), automatic extraction of guest names, room numbers, party sizes, course types, and dietary requirements. Interactive floor plan with drag-and-drop seating, table merging, arrival timers, and preparation summaries for cutlery, glassware, and service items.

## Billing and Folios

Structured billing model with folios, folio items, and payment tracking. Mirrors legacy room charge data into a normalized relational model.

## AI-Powered PDF Parsing

Gemini-based extraction of reservation data from uploaded PDFs. Configurable parser profiles per hotel to support different document formats. Results feed directly into the table planning system.

## Purchase Orders

Ordering workflow from draft through sent to received. Automatic reorder suggestions based on configurable thresholds. Vendor management and order history.

## Reports and Analytics

Variance reports, beverage consumption trends, cost-of-goods analysis, waste tracking, occupancy analytics, and revenue summaries.

## User Management

Role-based access control with approval workflow. Roles include hotel admin, manager, and staff with server-side permission enforcement.

## Real-Time Multi-Device Sync

All operational pages synchronize in real-time across tablets, phones, and desktops using Supabase Realtime subscriptions with tenant-filtered events.
