import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Cookies() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Button variant="ghost" size="sm" asChild className="mb-8 -ml-2">
          <Link to="/auth"><ArrowLeft className="h-4 w-4 mr-2" />Back</Link>
        </Button>

        <h1 className="text-3xl font-bold mb-2">Cookie Policy</h1>
        <p className="text-muted-foreground text-sm mb-8">Last updated: March 2026</p>

        <div className="prose prose-sm max-w-none space-y-6 text-foreground">
          <section>
            <h2 className="text-xl font-semibold mb-3">What Are Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              Cookies are small text files placed on your device by websites you visit. They are widely used to make websites work efficiently and provide information to website owners.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Cookies We Use</h2>

            <div className="space-y-4">
              <div className="border border-border rounded-lg p-4">
                <h3 className="font-semibold text-sm mb-1">Essential Cookies</h3>
                <p className="text-xs text-muted-foreground mb-2">Always active · Cannot be disabled</p>
                <table className="w-full text-xs text-muted-foreground">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left pb-1 font-medium">Cookie</th>
                      <th className="text-left pb-1 font-medium">Purpose</th>
                      <th className="text-left pb-1 font-medium">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="py-1 font-mono">sb-*</td>
                      <td className="py-1">Supabase authentication session</td>
                      <td className="py-1">Session / 7 days</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-mono">cookie-consent</td>
                      <td className="py-1">Stores your cookie preference</td>
                      <td className="py-1">1 year</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="border border-border rounded-lg p-4">
                <h3 className="font-semibold text-sm mb-1">Analytics Cookies</h3>
                <p className="text-xs text-muted-foreground mb-2">Optional · Requires consent</p>
                <p className="text-xs text-muted-foreground">
                  We do not currently use analytics cookies. If introduced in future, we will update this policy and request your consent.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Managing Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              You can control cookies through your browser settings. Blocking essential cookies will prevent you from logging in to PourStock. For instructions, visit your browser's help pages.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              Questions about our cookie use? Contact privacy@pourstock.app. See also our <Link to="/privacy" className="text-primary underline">Privacy Policy</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
