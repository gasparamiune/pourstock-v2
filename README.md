PourStock

AI-Powered Operations Platform for Hotels & Restaurants

PourStock is a modern SaaS platform designed for hotel and restaurant operations, combining AI-powered dinner service coordination with beverage inventory management in a single real-time system.

Built for real hospitality environments, PourStock synchronizes front-of-house, bar, and management workflows across multiple devices during live service.

The platform is currently in production use at Sønderborg Strand Hotel.

Overview

Hospitality operations are often fragmented across multiple tools:

POS systems track sales

spreadsheets track inventory

printed reservation lists coordinate dinner service

PourStock replaces this fragmented workflow with a single operational platform.

It brings together:

reservations and table planning

beverage inventory management

purchase orders

operational reporting

real-time service coordination

AI-powered workflow automation

All in one system built specifically for hospitality teams.

AI-First Hospitality Software

PourStock proudly integrates AI directly into operational workflows.

Rather than adding AI as a novelty feature, the system applies machine intelligence to real hospitality tasks.

AI Reservation Parsing

Upload a Danish Køkkenliste (reservation PDF) and AI automatically extracts:

guest names

room numbers

guest counts

menu type (2-ret, 3-ret, 4-ret, buffet, à la carte)

dietary restrictions

dessert / coffee preferences

The system converts this data into a live interactive restaurant floor plan.

AI Operational Insights

Inventory analytics identify:

unusual stock discrepancies

abnormal consumption patterns

potential waste

Helping managers maintain better operational control.

Core Features
AI Table Plan

Interactive dinner service coordination.

Features:

upload reservation PDFs

AI reservation extraction

automatic table assignments

drag-and-drop seating

merge / split tables

live arrival timers

table clearing with undo

preparation summaries

Preparation summaries automatically calculate:

cutlery requirements

glassware

coffee and dessert quantities

Designed for real-time use during dinner service.

Beverage Inventory

Inventory management optimized for restaurants and hotel bars.

Features:

beverage product catalog

multi-location stock tracking

fast mobile counting mode

partial bottle tracking

reorder thresholds

stock movement logging

barcode support

CSV / Excel imports

Staff can count 50+ items in minutes using tablets or phones.

Purchase Orders

Integrated ordering workflow.

Features:

automatic reorder suggestions

purchase order creation

receiving and tracking

order history

Reports & Analytics

Operational visibility tools including:

variance reports

beverage consumption trends

cost-of-goods analysis

waste tracking

Real-Time Multi-Device Sync

PourStock is built for real hospitality environments.

Typical usage during service:

restaurant tablet

bar tablet

reception computer

All devices remain synchronized using real-time data subscriptions.

User Management

Secure role-based access control.

Roles include:

Admin

Manager

Staff

Security features include:

approval workflow for new users

restricted role escalation

server-side permission enforcement

audit-friendly operational logging

Architecture

PourStock is built as a multi-tenant SaaS platform.

All hotels share the same platform while maintaining strict data isolation.

Each hotel's operational data is separated using a tenant identifier.

The system is designed to scale to hundreds of hospitality businesses across the Nordic region.

Technology Stack
Frontend

React

TypeScript

Vite

Tailwind CSS

shadcn/ui

Backend

Supabase

PostgreSQL

Row Level Security

Edge Functions (Deno)

Real-Time

Supabase Realtime subscriptions

AI

Gemini models via Lovable AI gateway

Security

Security is built into the platform architecture.

Key principles:

strict tenant data isolation

Row Level Security policies

server-side role validation

protected administrative operations

secure authentication via Supabase

The system is designed with GDPR-aligned data handling practices.

Multi-Tenant SaaS Design

PourStock operates as a single configurable platform, not custom software per hotel.

Each hotel has isolated:

users

inventory

reservations

settings

integrations

Customization is handled through configuration rather than code forks, allowing the platform to scale efficiently.

Project Structure

Example high-level structure:

src
 ├ components
 ├ features
 │   ├ table-plan
 │   ├ inventory
 │   ├ orders
 │   ├ reports
 │   ├ users
 │   └ settings
 ├ hooks
 ├ services
 ├ types
 └ utils

The project follows a feature-based architecture to keep business logic modular and scalable.

Development Philosophy

PourStock follows several guiding principles:

AI should solve real operational problems

configuration over custom client builds

security-first architecture

simple UX for hospitality staff

real-time operational awareness

The goal is to build the operational intelligence layer for hospitality service.

Target Market

Primary market:

Hotels with restaurant service in the Nordic region.

Secondary market:

Standalone restaurants with structured dinner service.

The platform is optimized for properties with 50–200 rooms.

Documentation

| Area | Location |
|------|----------|
| Architecture overview | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Architecture & ADRs | [docs/architecture](docs/architecture) |
| Operational runbooks | [docs/operations](docs/operations) |
| Platform evolution | [docs/architecture/history](docs/architecture/history) |
| Migration program | [.lovable/migration-master-plan.md](.lovable/migration-master-plan.md) |
| Release history | [docs/releases](docs/releases) |
| Product documentation | [docs/product](docs/product) |

Contributing

Contributions, ideas, and discussions are welcome.

Areas of interest include:

hospitality technology

AI-driven operational software

modern SaaS architecture

real-time web applications

Please open an issue or discussion if you would like to contribute.

Vision

PourStock aims to become the AI operations platform for Nordic hospitality.

By combining AI, real-time systems, and operational analytics, the platform helps hospitality teams focus on what matters most:

delivering exceptional guest experiences.
