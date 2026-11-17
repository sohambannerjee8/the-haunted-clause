// The room example clauses from the clause-analyzer design ("Room examples"), in one place.
// classifier.test.ts checks each one; the generators in arbitraries.test-util.ts reuse them.
// Test support only: the app never imports this file.
import type { RoomId, Severity } from "./types";

export interface PositiveExample {
  readonly room: RoomId;
  readonly severity: Severity;
  readonly ruleId: string;
  readonly text: string;
}
export interface NegativeExample {
  readonly room: RoomId;
  readonly text: string;
}

export const POSITIVE_EXAMPLES: readonly PositiveExample[] = [
  { room: "cellar", severity: 3, ruleId: "cellar.sell", text: "We may sell your personal information to third parties." },
  { room: "cellar", severity: 3, ruleId: "cellar.ad-partners", text: "We share your data with our advertising partners." },
  { room: "cellar", severity: 2, ruleId: "cellar.third-parties", text: "Your information may be disclosed to our affiliates and other third parties." },
  { room: "cellar", severity: 3, ruleId: "cellar.broker", text: "We work with data brokers who buy and combine information about you." },
  { room: "portraits", severity: 3, ruleId: "portraits.cross-site", text: "We track your activity across other websites and apps." },
  { room: "portraits", severity: 2, ruleId: "portraits.profile", text: "We use your browsing history to build a profile of your interests." },
  { room: "portraits", severity: 2, ruleId: "portraits.location", text: "We collect your precise location even when the app is closed." },
  { room: "portraits", severity: 1, ruleId: "portraits.trackers", text: "We use cookies to remember your language setting." },
  { room: "vault", severity: 2, ruleId: "vault.auto-renew", text: "Your subscription renews automatically each month until you cancel." },
  { room: "vault", severity: 2, ruleId: "vault.no-refund", text: "All fees are non-refundable, including for unused months." },
  { room: "vault", severity: 3, ruleId: "vault.charge-no-notice", text: "We may charge your card for additional fees without notice." },
  { room: "vault", severity: 2, ruleId: "vault.price-change", text: "We may increase the subscription price when your plan renews." },
  { room: "locked-door", severity: 2, ruleId: "locked.cancel-channel", text: "To cancel, you must call our support line by phone during business hours." },
  { room: "locked-door", severity: 3, ruleId: "locked.cancel-fee", text: "An early termination fee of $50 applies if you cancel before the end of your term." },
  { room: "locked-door", severity: 2, ruleId: "locked.retain-after", text: "We retain your data for five years after you delete your account." },
  { room: "locked-door", severity: 3, ruleId: "locked.cannot-delete", text: "You cannot delete your account while a subscription is active." },
  { room: "court", severity: 3, ruleId: "court.binding-arbitration", text: "All disputes will be resolved by binding arbitration." },
  { room: "court", severity: 3, ruleId: "court.class-action", text: "You waive any right to bring or join a class action against us." },
  { room: "court", severity: 3, ruleId: "court.jury", text: "You give up your right to a jury trial." },
  { room: "mirror", severity: 3, ruleId: "mirror.broad-licence", text: "You grant us a perpetual, irrevocable, worldwide licence to use anything you upload." },
  { room: "mirror", severity: 3, ruleId: "mirror.ownership", text: "Any photos you post become our property." },
  { room: "mirror", severity: 2, ruleId: "mirror.ai-training", text: "We may use your content to train our AI models." },
  { room: "trapdoor", severity: 2, ruleId: "trapdoor.as-is", text: "The service is provided as is, without warranties of any kind." },
  { room: "trapdoor", severity: 3, ruleId: "trapdoor.not-liable", text: "We are not liable for any loss of data or damages, however caused." },
  { room: "trapdoor", severity: 2, ruleId: "trapdoor.cap", text: "Our total liability to you shall not exceed ten dollars." },
  { room: "stairs", severity: 2, ruleId: "stairs.any-time", text: "We may change these terms at any time." },
  { room: "stairs", severity: 3, ruleId: "stairs.no-notice", text: "We can modify the service and these terms without notice." },
  { room: "stairs", severity: 2, ruleId: "stairs.continued-use", text: "Your continued use of the service after changes means you accept the new terms." },
  // Calibration and new rules (PLAN_DECISIONS.md C12.2).
  { room: "mirror", severity: 2, ruleId: "mirror.wide-licence", text: "You grant us a non-exclusive, royalty-free licence to host and display your content." },
  { room: "mirror", severity: 2, ruleId: "mirror.wide-licence", text: "A worldwide, royalty-free licence to store and show your posts is needed to run the service." },
  { room: "mirror", severity: 2, ruleId: "mirror.wide-licence", text: "You grant us a non-exclusive, non-transferable, non-sublicensable licence to display your posts." },
  { room: "mirror", severity: 3, ruleId: "mirror.broad-licence", text: "You grant us a worldwide, royalty-free, sublicensable licence to use your content." },
  { room: "mirror", severity: 3, ruleId: "mirror.broad-licence", text: "You grant us a licence to copy and sell the photos you upload." },
  { room: "trapdoor", severity: 2, ruleId: "trapdoor.consequential", text: "We are not liable for any indirect or consequential damages arising from your use of the service." },
  { room: "trapdoor", severity: 3, ruleId: "trapdoor.not-liable", text: "Under no circumstances will we be liable for any damages whatsoever." },
  { room: "locked-door", severity: 3, ruleId: "locked.phone-or-person", text: "You can cancel your membership only by phone or in person at one of our clubs." },
  { room: "locked-door", severity: 3, ruleId: "locked.phone-or-person", text: "Cancellations must be made in person at the branch where you signed up." },
  { room: "cellar", severity: 2, ruleId: "cellar.merger", text: "If we are involved in a merger or acquisition, your information may be transferred to the new owner." },
  { room: "cellar", severity: 2, ruleId: "cellar.merger", text: "We may disclose your personal data to a buyer as part of a sale of our business." },
  { room: "cellar", severity: 2, ruleId: "cellar.retention", text: "We keep your personal information indefinitely." },
  { room: "cellar", severity: 2, ruleId: "cellar.retention", text: "We retain your data for as long as we see fit." },
  // C19: sponsors (like partners and affiliates, severity 2) and advertisers (like advertising partners, severity 3)
  { room: "cellar", severity: 2, ruleId: "cellar.third-parties", text: "We may share your email address with our sponsors." },
  { room: "cellar", severity: 2, ruleId: "cellar.third-parties", text: "We provide your contact details to event sponsors." },
  { room: "cellar", severity: 3, ruleId: "cellar.ad-partners", text: "We disclose your personal information to advertisers." },
  { room: "cellar", severity: 3, ruleId: "cellar.ad-partners", text: "We may transfer your e-mail to advertisers who run campaigns on our site." },
  // C21: generic sentences for gaps found by the real-policy audit
  { room: "stairs", severity: 1, ruleId: "stairs.may-modify", text: "We can modify this policy." },
  { room: "stairs", severity: 1, ruleId: "stairs.may-modify", text: "We may update this privacy policy, and material changes will be posted here." },
  { room: "stairs", severity: 2, ruleId: "stairs.continued-use", text: "Your continued use after notice means you accept the updated policy." },
  { room: "stairs", severity: 2, ruleId: "stairs.continued-use", text: "Continued use of the service after we post a notice means your data is subject to the updated policy." },
  { room: "portraits", severity: 1, ruleId: "portraits.derived-location", text: "We estimate your general location based on your IP address." },
  { room: "portraits", severity: 1, ruleId: "portraits.derived-location", text: "Our partners may provide us with your approximate location." },
  { room: "portraits", severity: 1, ruleId: "portraits.derived-location", text: "We receive location information from third parties such as ad networks." },
  { room: "cellar", severity: 2, ruleId: "cellar.supplement", text: "We supplement the information we hold about you with data from third parties." },
  { room: "cellar", severity: 2, ruleId: "cellar.supplement", text: "Data providers help us enrich your profile with demographic information." },
];

export const NEGATIVE_EXAMPLES: readonly NegativeExample[] = [
  { room: "cellar", text: "You can download a copy of your data at any time." },
  { room: "cellar", text: "We store your information on servers located in Ireland." },
  { room: "portraits", text: "You can track the status of your order on the Orders page." },
  { room: "portraits", text: "Your profile page shows your display name and photo." },
  { room: "vault", text: "The monthly fee is shown on the checkout page before you pay." },
  { room: "vault", text: "You can view your billing history and download receipts in Settings." },
  { room: "locked-door", text: "You can cancel your plan from the Account page in two clicks." },
  { room: "locked-door", text: "Deleting your account removes your posts within 24 hours." },
  { room: "court", text: "If you have a dispute, please contact our support team first." },
  { room: "court", text: "You may bring a claim in small claims court in your home county." },
  { room: "mirror", text: "You can upload photos and videos up to 2 GB each." },
  { room: "mirror", text: "You can delete any content you have posted at any time." },
  { room: "trapdoor", text: "We are responsible for keeping the service secure." },
  { room: "trapdoor", text: "Our warranty covers repairs for two years." },
  { room: "stairs", text: "These terms were last updated on 1 November 2026." },
  { room: "stairs", text: "You can change your password at any time in Settings." },
  // Calibration and new rules (PLAN_DECISIONS.md C12.2).
  { room: "mirror", text: "A worldwide audience can see the posts you choose to make public." },
  { room: "trapdoor", text: "You are responsible for keeping your password safe." },
  { room: "locked-door", text: "Call us by phone if you need help with an order." },
  { room: "cellar", text: "Our company was founded after a merger of two small studios." },
  { room: "cellar", text: "We keep your data for as long as necessary to provide the service." },
  // C19: the new targets need your data, information, email or details to be what is shared
  { room: "cellar", text: "We provide reports to advertisers about how their ads performed." },
  { room: "cellar", text: "Our summer events are supported by local sponsors." },
  { room: "cellar", text: "Sponsors may share their own logos with us for the event page." },
  // C21
  { room: "stairs", text: "You may change your privacy settings whenever you like." },
  { room: "stairs", text: "Please read this policy carefully before you sign up." },
  { room: "portraits", text: "Your IP address is used to deliver the page you asked for." },
  { room: "portraits", text: "You can add a location to a post if you choose." },
  { room: "cellar", text: "You can supplement your weekly plan with extra lessons." },
  { room: "cellar", text: "Our data providers are listed on the suppliers page." },
];
