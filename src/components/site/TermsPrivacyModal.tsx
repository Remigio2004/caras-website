import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TermsPrivacyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TermsPrivacyModal({
  open,
  onOpenChange,
}: TermsPrivacyModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] rounded-xl bg-neutral-50 border border-emerald-100 flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-emerald-900">
            Terms & Conditions and Privacy Notice
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Please read these carefully before submitting your application to
            CARAS de San Sebastian.
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable body */}
        <ScrollArea className="mt-2 pr-3 h-[60vh]">
          <div className="space-y-6 pb-4">
            {/* TERMS */}
            <section>
              <h2 className="font-display text-lg text-emerald-900 mb-2">
                1. About This Website
              </h2>
              <p className="text-sm text-muted-foreground mb-2">
                This website is managed by the Confraternity of Augustinian
                Recollect Altar Servers (CARAS) of the Minor Basilica and Parish
                of San Sebastian, Manila. It is intended to share information
                about the ministry, its events and activities, and to receive
                applications from interested altar servers.
              </p>
              <p className="text-sm text-muted-foreground">
                By browsing the site and submitting any form, you acknowledge
                that you will use this portal only for lawful and legitimate
                purposes related to altar server ministry and parish life.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg text-emerald-900 mb-2">
                2. Acceptable Use
              </h2>
              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                <li>
                  Use the site only to view content, learn about CARAS, contact
                  the ministry, or submit a genuine application.
                </li>
                <li>
                  Do not attempt to disrupt, damage, or gain unauthorized access
                  to the website, its data, or underlying systems.
                </li>
                <li>
                  Do not upload or send content that is unlawful, offensive,
                  misleading, or harmful to the parish community.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-lg text-emerald-900 mb-2">
                3. Accuracy of Information
              </h2>
              <p className="text-sm text-muted-foreground">
                When you submit information through the Join Us form or Contact
                section, you confirm that the details provided are true,
                accurate, and submitted with the proper consent of the person
                concerned, including the consent of a parent or guardian for
                minors.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg text-emerald-900 mb-2">
                4. Photos and Content
              </h2>
              <p className="text-sm text-muted-foreground mb-2">
                Photos, text, and media on this site document the life and
                service of CARAS and the parish. These materials are owned by
                CARAS or used with permission. They may not be copied or reused
                for commercial or misleading purposes without prior written
                consent.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg text-emerald-900 mb-2">
                5. Third-Party Services
              </h2>
              <p className="text-sm text-muted-foreground">
                The website may display links or embeds such as Facebook,
                Instagram, YouTube, or Google Maps. These services are provided
                for convenience. CARAS is not responsible for the content,
                security, or privacy practices of external websites.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg text-emerald-900 mb-2">
                6. Limitation of Liability
              </h2>
              <p className="text-sm text-muted-foreground">
                CARAS strives to keep the website accurate and available but
                cannot guarantee that it will always be error-free or
                uninterrupted. CARAS will not be liable for any loss or damage
                arising from the use or inability to use this site, except as
                required by applicable law.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg text-emerald-900 mb-2">
                7. Privacy Notice
              </h2>
              <p className="text-sm text-muted-foreground mb-2">
                CARAS processes personal data in accordance with the Philippine
                Data Privacy Act of 2012. Personal data collected through this
                website is used only for altar server recruitment, ministry
                coordination, and related parish activities.
                [web:2][web:9][web:11]
              </p>
            </section>

            {/* PRIVACY */}
            <section>
              <h2 className="font-display text-lg text-emerald-900 mb-2">
                8. Personal Data We Collect
              </h2>
              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                <li>Applicant or child&apos;s name, birthday, and age.</li>
                <li>Address, contact number, and Facebook account.</li>
                <li>Guardian or parent&apos;s name and contact number.</li>
                <li>
                  Messages or information you voluntarily provide in the forms.
                </li>
                <li>
                  Basic technical details such as date/time of submission and,
                  if logged by the server, IP address for security.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-lg text-emerald-900 mb-2">
                9. How Your Data Is Used
              </h2>
              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                <li>To evaluate and process applications to join CARAS.</li>
                <li>
                  To contact you and/or your parent or guardian regarding
                  orientation, formation sessions, rehearsals, and events.
                </li>
                <li>
                  To maintain basic records of members and applicants for
                  internal ministry and parish documentation.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-lg text-emerald-900 mb-2">
                10. Data Sharing and Retention
              </h2>
              <p className="text-sm text-muted-foreground mb-2">
                Access to your data is limited to authorized CARAS leaders and,
                when needed, parish clergy or staff. Data is not sold or shared
                with unrelated third parties. It is kept only for as long as
                necessary for recruitment, active membership, or parish records,
                unless a longer period is required by parish policy or law.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg text-emerald-900 mb-2">
                11. Your Rights
              </h2>
              <p className="text-sm text-muted-foreground mb-2">
                Subject to applicable laws, you or your parent/guardian may
                request access to your personal data, ask for corrections,
                request deletion of data that is no longer needed, or withdraw
                consent you previously gave by contacting CARAS through the
                details on the Contact page.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg text-emerald-900 mb-2">
                12. Changes
              </h2>
              <p className="text-sm text-muted-foreground">
                CARAS may update these Terms & Conditions and this Privacy
                Notice from time to time to reflect changes in the ministry, the
                website, or applicable policies. The updated version will be
                posted on this site, and continued use of the website after such
                changes means that you accept the revised terms.
              </p>
            </section>
          </div>
        </ScrollArea>

        {/* Fixed footer inside card */}
        <div className="mt-3 pt-3 border-t border-emerald-100 flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
