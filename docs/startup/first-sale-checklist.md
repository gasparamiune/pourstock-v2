# First Hotel Onboarding Checklist

Use this checklist before onboarding the first paying hotel to PourStock.

## 1 — Legal & Compliance

- [ ] DPA (Data Processing Agreement) reviewed by Danish lawyer
- [ ] DPA signed with hotel (see `dpa-template.md`)
- [ ] Privacy Policy accessible at `/privacy`
- [ ] Cookie banner live and functional
- [ ] GDPR erasure flow tested end-to-end

## 2 — Infrastructure

- [ ] DB migrations applied (`npx supabase db push`)
- [ ] Edge function `export-guest-data` deployed
- [ ] Custom domain configured (`app.pourstock.dk` or hotel-specific)
- [ ] Supabase Auth redirect URLs updated for custom domain
- [ ] CORS updated for custom domain

## 3 — Hotel Setup in Admin

- [ ] Create hotel record via Supabase admin or onboarding flow
- [ ] Create admin user account for hotel manager
- [ ] Assign departments to staff accounts
- [ ] Configure `hotel_modules` (enable relevant modules for their plan)
- [ ] Create initial room inventory

## 4 — Subscription

- [ ] Subscription record created in `subscriptions` table
- [ ] `trial_ends_at` set to 14 days from start
- [ ] Plan set to `'starter'` or `'professional'` as agreed
- [ ] Invoice sent manually (bank transfer during Stripe setup)

## 5 — Handover

- [ ] Walk hotel manager through Reception, Housekeeping, Bar modules
- [ ] Demonstrate GDPR erasure and export flows
- [ ] Provide `docs/startup/dpa-template.md` for signature
- [ ] Schedule 30-day check-in call

## 6 — Monitoring

- [ ] Verify error boundary catches are not firing (check Supabase logs)
- [ ] Confirm realtime subscriptions are working (kitchen/housekeeping)
- [ ] Check Supabase usage dashboard — stay within free tier limits during trial
