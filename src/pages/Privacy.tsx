import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Button variant="ghost" size="sm" asChild className="mb-8 -ml-2">
          <Link to="/auth"><ArrowLeft className="h-4 w-4 mr-2" />Back</Link>
        </Button>

        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground text-sm mb-8">Last updated: March 2026 · GDPR compliant</p>

        <div className="prose prose-sm max-w-none space-y-6 text-foreground">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Who We Are</h2>
            <p className="text-muted-foreground leading-relaxed">
              PourStock ApS ("we", "us") is the data controller for information collected through the PourStock platform. We are registered in Denmark and comply with the EU General Data Protection Regulation (GDPR).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Data We Collect</h2>
            <p className="text-muted-foreground leading-relaxed mb-2">We collect the following categories of data:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><strong className="text-foreground">Account data:</strong> name, email address, role, hotel association</li>
              <li><strong className="text-foreground">Guest data:</strong> name, contact details, nationality, passport number (collected by hotel operators)</li>
              <li><strong className="text-foreground">Operational data:</strong> reservations, room assignments, housekeeping tasks, orders</li>
              <li><strong className="text-foreground">Usage data:</strong> login timestamps, feature usage, browser/device type</li>
              <li><strong className="text-foreground">Financial data:</strong> folio charges, payment records (no card numbers stored)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Legal Basis for Processing</h2>
            <p className="text-muted-foreground leading-relaxed">
              We process personal data on the following legal bases: contractual necessity (to provide the Service), legitimate interests (platform security, fraud prevention), legal obligations (financial record keeping), and consent (marketing communications).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. How We Use Your Data</h2>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Provide and improve the Service</li>
              <li>Authenticate users and manage permissions</li>
              <li>Enable hotel operations (reservations, housekeeping, billing)</li>
              <li>Comply with legal obligations</li>
              <li>Respond to support requests</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              Guest PII is retained for 5 years after checkout by default (configurable per hotel). Financial records are retained for 7 years to comply with Danish accounting law. You may request earlier deletion subject to legal obligations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Your Rights (GDPR)</h2>
            <p className="text-muted-foreground leading-relaxed mb-2">Under GDPR, you have the right to:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><strong className="text-foreground">Access:</strong> request a copy of your personal data</li>
              <li><strong className="text-foreground">Rectification:</strong> correct inaccurate data</li>
              <li><strong className="text-foreground">Erasure:</strong> request deletion ("right to be forgotten")</li>
              <li><strong className="text-foreground">Portability:</strong> receive your data in machine-readable format</li>
              <li><strong className="text-foreground">Objection:</strong> object to certain processing</li>
              <li><strong className="text-foreground">Restriction:</strong> request limited processing</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">To exercise any right, contact us at privacy@pourstock.app. We respond within 30 days.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              Data is stored on Supabase infrastructure (AWS eu-central-1). All data is encrypted at rest and in transit. Access is controlled via row-level security policies. We conduct regular security reviews.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Third-Party Processors</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use Supabase (database/auth), Stripe (payments), and Vercel (hosting). All processors are GDPR-compliant and have signed Data Processing Agreements with us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use essential cookies for authentication and session management. See our <Link to="/cookies" className="text-primary underline">Cookie Policy</Link> for details.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Contact & Supervisory Authority</h2>
            <p className="text-muted-foreground leading-relaxed">
              Contact our Data Protection Officer at privacy@pourstock.app. You have the right to lodge a complaint with Datatilsynet (the Danish Data Protection Agency) at www.datatilsynet.dk.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
