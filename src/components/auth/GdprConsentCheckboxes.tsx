import { Link } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface GdprConsentCheckboxesProps {
  termsAccepted: boolean;
  privacyAccepted: boolean;
  onTermsChange: (v: boolean) => void;
  onPrivacyChange: (v: boolean) => void;
}

export function GdprConsentCheckboxes({
  termsAccepted,
  privacyAccepted,
  onTermsChange,
  onPrivacyChange,
}: GdprConsentCheckboxesProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <Checkbox
          id="terms"
          checked={termsAccepted}
          onCheckedChange={(v) => onTermsChange(!!v)}
          className="mt-0.5"
        />
        <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer font-normal">
          I agree to the{' '}
          <Link to="/terms" target="_blank" className="text-primary underline hover:no-underline">
            Terms of Service
          </Link>
        </Label>
      </div>

      <div className="flex items-start gap-3">
        <Checkbox
          id="privacy"
          checked={privacyAccepted}
          onCheckedChange={(v) => onPrivacyChange(!!v)}
          className="mt-0.5"
        />
        <Label htmlFor="privacy" className="text-sm leading-relaxed cursor-pointer font-normal">
          I consent to data processing per the{' '}
          <Link to="/privacy" target="_blank" className="text-primary underline hover:no-underline">
            Privacy Policy
          </Link>
        </Label>
      </div>
    </div>
  );
}
