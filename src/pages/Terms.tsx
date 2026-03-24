import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Button variant="ghost" size="sm" asChild className="mb-8 -ml-2">
          <Link to="/auth"><ArrowLeft className="h-4 w-4 mr-2" />Back</Link>
        </Button>

        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground text-sm mb-8">Last updated: March 2026</p>

        <div className="prose prose-sm max-w-none space-y-6 text-foreground">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using PourStock ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              PourStock is a cloud-based hotel management platform that provides tools for housekeeping, reception, restaurant, bar, and kitchen operations. The Service is provided on a subscription basis.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Account Registration</h2>
            <p className="text-muted-foreground leading-relaxed">
              You must register an account to use the Service. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. You must notify us immediately of any unauthorised use.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Data and Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your use of the Service is also governed by our <Link to="/privacy" className="text-primary underline">Privacy Policy</Link>, which is incorporated into these Terms by reference. You acknowledge that you have read and understood the Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Acceptable Use</h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree not to misuse the Service or help anyone else do so. You may not attempt to gain unauthorised access to the Service or its related systems, reverse-engineer any part of the Service, or use the Service to store or transmit illegal content.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Subscription and Billing</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service is provided on a subscription basis. Fees are billed in advance on a monthly or annual basis. All fees are non-refundable except as required by law. We reserve the right to change fees with 30 days notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              You may cancel your subscription at any time. We may suspend or terminate your account if you violate these Terms. Upon termination, your right to access the Service ceases and data may be deleted after 90 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              To the fullest extent permitted by law, PourStock shall not be liable for any indirect, incidental, special, or consequential damages arising from use of the Service. Our aggregate liability shall not exceed the fees paid in the preceding 12 months.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms are governed by the laws of Denmark. Any disputes shall be resolved in the courts of Denmark.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these Terms, contact us at legal@pourstock.app.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
