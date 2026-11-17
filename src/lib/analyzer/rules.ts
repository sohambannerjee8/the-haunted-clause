// Rule table, mitigations and exception markers (clause-analyzer design, "Rule table" and "Mitigations").
// Every pattern is case-insensitive and has no g or y flag, so no lastIndex state leaks between calls.
// Gaps between words use [^.;]{0,N} with a fixed N, so matching stays linear in the clause length.
import type { RoomId, Severity } from "./types";

export interface Rule {
  readonly id: string;
  readonly room: RoomId;
  readonly severity: Exclude<Severity, 0>;
  readonly pattern: RegExp;
  readonly explanation: string;
  readonly whyItMatters: string;
}

export interface Mitigation {
  readonly id: string;
  readonly room: RoomId;
  readonly level: 0 | 1;
  readonly pattern: RegExp;
}

const G = "[^.;]";
/** Qualifiers that make a liability exclusion partial rather than total. */
const LIMITED_DAMAGES = "(?:indirect|consequential|incidental|special|punitive|exemplary)";
const re = (...alternatives: string[]) => new RegExp(alternatives.map((a) => `(?:${a})`).join("|"), "i");

const rule = (id: string, room: RoomId, severity: 1 | 2 | 3, pattern: RegExp, explanation: string, whyItMatters: string): Rule =>
  Object.freeze({ id, room, severity, pattern, explanation, whyItMatters });

export const RULES: readonly Rule[] = Object.freeze([
  // The Cellar: data sharing and selling
  rule("cellar.sell", "cellar", 3, re(`\\bsell(?:s|ing)?\\b${G}{0,60}\\b(?:data|information|details)\\b`),
    "This clause lets the company sell what it knows about you.",
    "Once your data is sold you cannot see or control who holds it next."),
  rule("cellar.sold", "cellar", 3, re(`\\b(?:data|information|details)\\b${G}{0,40}\\b(?:be |is |are )?sold\\b`),
    "This clause says your information can be sold.",
    "Buyers of your data are not bound by the promises this company made to you."),
  rule("cellar.broker", "cellar", 3, re(`\\bdata brokers?\\b`),
    "The company works with data brokers, firms that buy and resell personal information.",
    "Brokers combine data from many sources into detailed files about you that others can buy."),
  rule("cellar.ad-partners", "cellar", 3, re(`\\b(?:share|disclose|provide|transfer)\\w*\\b${G}{0,80}\\badvertis\\w*\\s+partners?\\b`),
    "Your data is passed to advertising partners.",
    "Ad partners use it to target you across other sites, and you rarely know who they are."),
  rule("cellar.third-parties", "cellar", 2, re(`\\b(?:share|disclose|provide|transfer)\\w*\\b${G}{0,80}\\b(?:third[- ]part(?:y|ies)|partners|affiliates)\\b`),
    "Your information can be shared with other companies.",
    "Each company that receives your data is another place it can leak or be misused."),
  rule("cellar.merger", "cellar", 2, re(
      `\\b(?:transfer|disclos|shar|pass|provid)\\w*\\b${G}{0,100}\\b(?:merger|acquisition|reorgani[sz]ation|bankruptcy|change (?:of|in) control|sale of (?:all or part of |substantially all of |some or all of |part of )?(?:our |the )?(?:business|company|assets))\\b`,
      `\\b(?:merger|acquisition|bankruptcy|change (?:of|in) control)\\b${G}{0,100}\\b(?:transfer|disclos|shar|pass)\\w*`),
    "If the company is sold or merges, your information goes to the new owner.",
    "The new owner may have different plans for your data than the company you signed up with."),
  rule("cellar.retention", "cellar", 2, re(
      `\\b(?:retain|keep|store|hold)\\w*\\b${G}{0,80}\\b(?:indefinitely|permanently|forever|for an? (?:unlimited|indefinite) (?:period|time)|as long as we (?:see fit|wish|like|want|choose|deem (?:necessary|appropriate)))\\b`),
    "The company can keep your information with no end date.",
    "Data kept forever can leak, be sold or be used in ways you never expected, years from now."),

  // The Watching Portraits: tracking and profiling
  rule("portraits.cross-site", "portraits", 3, re(`\\btrack\\w*\\b${G}{0,60}\\b(?:across|on) (?:other |third[- ]party )?(?:websites|sites|apps|services|devices)\\b`),
    "The company follows what you do on other websites, apps or devices.",
    "Tracking beyond this service builds a picture of your life that you never agreed to share here."),
  rule("portraits.profile", "portraits", 2, re(`\\b(?:build|create|compile)\\w*\\b${G}{0,40}\\bprofiles?\\b`, `\\bprofiling\\b`),
    "The company builds a profile of you from your activity.",
    "Profiles are used to guess things about you and decide what you see or pay."),
  rule("portraits.location", "portraits", 2, re(`\\b(?:collect|track|record|use)\\w*\\b${G}{0,40}\\b(?:precise |exact )?(?:location|geolocation)\\b`),
    "The company collects where you are.",
    "Location data can reveal your home, work and habits, even when you are not using the app."),
  rule("portraits.targeted-ads", "portraits", 2, re(`\\b(?:behaviou?ral|targeted|personali[sz]ed|interest-based) (?:advertis\\w*|ads)\\b`),
    "Your activity is used to choose the ads you see.",
    "Targeted ads rely on watching your behaviour, and the data behind them is often shared."),
  rule("portraits.trackers", "portraits", 1, re(`\\b(?:cookies|pixels|web beacons|tracking technologies|device fingerprint\\w*)\\b`),
    "The service uses cookies or similar trackers.",
    "Some trackers are needed to run a site, but others follow you for advertising."),

  // The Coin Vault: auto-renewal, fees and billing
  rule("vault.charge-no-notice", "vault", 3, re(`\\bcharge\\w*\\b${G}{0,60}\\bwithout (?:prior |advance |any )?notice\\b`),
    "The company can charge you without telling you first.",
    "Surprise charges are hard to spot and hard to get back."),
  rule("vault.auto-renew", "vault", 2, re(`\\b(?:automatically|auto[- ]?)renew\\w*`, `\\brenew\\w*\\s+automatically\\b`),
    "Your plan renews and charges you again on its own.",
    "If you forget to cancel, you keep paying for something you may not use."),
  rule("vault.no-refund", "vault", 2, re(`\\bnon[- ]?refundable\\b`, `\\bno refunds?\\b`),
    "You cannot get your money back.",
    "If the service changes or fails you, the payment is lost."),
  rule("vault.price-change", "vault", 2, re(`\\b(?:increase|raise|change)\\w*\\b${G}{0,40}\\b(?:price|prices|fee|fees)\\b`),
    "The company can change what you pay.",
    "A price you agreed to today may not be the price you pay next month."),
  rule("vault.extra-fees", "vault", 1, re(`\\b(?:additional|extra|hidden|service|processing) (?:fees|charges)\\b`),
    "There are fees on top of the main price.",
    "Extra fees make the real cost higher than the price you were shown."),

  // The Locked Door: cancellation and account deletion
  rule("locked.cannot-delete", "locked-door", 3, re(`\\b(?:cannot|can't|may not|will not be able to) (?:delete|close|remove) (?:your )?(?:account|data)\\b`),
    "You are not allowed to delete your account or your data.",
    "If you cannot leave, the company keeps your data and your attention for as long as it likes."),
  rule("locked.cancel-fee", "locked-door", 3, re(`\\b(?:cancellation|early termination|termination) fees?\\b`),
    "Leaving costs you money.",
    "A fee to cancel is a penalty for changing your mind."),
  rule("locked.phone-or-person", "locked-door", 3, re(
      `\\bcancel\\w*\\b${G}{0,60}\\bonly\\b${G}{0,20}\\b(?:by (?:phone|telephone|calling)|in person)\\b`,
      `\\bcancel\\w*\\b${G}{0,40}\\b(?:must|need to|have to) be (?:made|done|submitted) in person\\b`,
      `\\bonly\\b${G}{0,20}\\b(?:by (?:phone|telephone)|in person)\\b${G}{0,40}\\bcancel\\w*`),
    "You can only cancel by phone or by going somewhere in person.",
    "Forcing a call or a visit to cancel keeps people paying who meant to leave."),
  rule("locked.cancel-channel", "locked-door", 2, re(`\\bcancel\\w*\\b${G}{0,60}\\b(?:by (?:phone|telephone|mail|post|fax)|in writing|in person|by calling)\\b`),
    "You can only cancel by phone, post or another slow route.",
    "Making cancelling awkward keeps people paying who meant to leave."),
  rule("locked.retain-after", "locked-door", 2, re(`\\b(?:retain|keep|store)\\w*\\b${G}{0,80}\\bafter\\b${G}{0,40}\\b(?:delet|clos|cancel|terminat)\\w*`),
    "The company keeps your data after you delete your account or leave.",
    "Deleting your account may not delete what the company holds about you."),
  rule("locked.notice-period", "locked-door", 1, re(`\\bcancel\\w*\\b${G}{0,40}\\b\\d+ days\\b`),
    "You must cancel a set number of days in advance.",
    "Miss the deadline and you may be charged for another period."),

  // The Silent Court: forced arbitration and class-action waivers
  rule("court.binding-arbitration", "court", 3, re(`\\b(?:binding|mandatory|individual) arbitration\\b`),
    "Disputes go to a private arbitrator instead of a court.",
    "Arbitration is private, hard to appeal and usually favours the company that uses it often."),
  rule("court.class-action", "court", 3, re(`\\bclass[- ]actions?\\b`, `\\bclass (?:or|and) representative\\b`),
    "You give up the right to join with other users in a group lawsuit.",
    "Small harms to many people are often only worth fighting together."),
  rule("court.jury", "court", 3, re(`\\b(?:waive|give up)\\w*\\b${G}{0,60}\\bjury\\b`),
    "You give up the right to a jury trial.",
    "A jury of ordinary people is one of the strongest protections in a legal dispute."),
  rule("court.arbitration", "court", 2, re(`\\barbitrat\\w*`),
    "This clause mentions arbitration for disputes.",
    "Arbitration can limit how and where you can complain."),
  rule("court.venue", "court", 1, re(`\\bexclusive(?:ly)? (?:jurisdiction|venue)\\b`),
    "Disputes must be heard in a place the company chooses.",
    "A distant court makes it expensive for you to bring a claim."),

  // The Mirror Room: rights the company takes over your content
  // Severity 3 only for licences that never end, cannot be withdrawn, pass to others, or let the
  // company sell your work (PLAN_DECISIONS.md C12.2). "non-transferable" and similar do not count.
  rule("mirror.broad-licence", "mirror", 3, re(
      `(?<!non-)(?<!non )\\b(?:perpetual|irrevocable|sub-?licen[cs]\\w*|transferable|in perpetuity)\\b${G}{0,80}\\blicen[cs]e\\b`,
      `\\blicen[cs]e\\b${G}{0,80}(?<!non-)(?<!non )\\b(?:perpetual|irrevocable|sub-?licen[cs]\\w*|transferable|in perpetuity)\\b`,
      `\\blicen[cs]e\\b${G}{0,60}\\bsell\\b`,
      `\\bsell\\w*\\b${G}{0,40}\\b(?:your )?(?:content|posts|photos|videos|uploads|submissions|creations)\\b`),
    "You give the company a lasting licence it can pass on, or the right to sell what you upload.",
    "A perpetual, irrevocable or sublicensable licence means others can keep using your work even after you leave."),
  rule("mirror.ownership", "mirror", 3, re(`\\bbecomes? (?:our|the company's) (?:sole )?property\\b`, `\\b(?:we|company) (?:own|owns|will own)\\b${G}{0,40}\\b(?:content|posts|photos|uploads|submissions)\\b`),
    "What you post becomes the company's property.",
    "You may lose the right to control, remove or reuse your own content."),
  rule("mirror.ai-training", "mirror", 2, re(`\\b(?:train|improve)\\w*\\b${G}{0,40}\\b(?:ai|artificial intelligence|machine learning|models?)\\b`),
    "Your content can be used to train AI systems.",
    "Once used for training, your content cannot easily be taken back out."),
  rule("mirror.wide-licence", "mirror", 2, re(`\\b(?:worldwide|royalty[- ]free|non-exclusive|fully[- ]paid)\\b${G}{0,80}\\blicen[cs]e\\b`),
    "You give the company a licence to use what you upload, for example to host and show it.",
    "A service needs some licence to show your posts, but check what else it covers."),
  rule("mirror.licence", "mirror", 2, re(`\\b(?:grant|give)\\w*\\b${G}{0,40}\\b(?:us|company)\\b${G}{0,40}\\blicen[cs]e\\b`),
    "You give the company a licence to use your content.",
    "The wider the licence, the more the company can do with your work without asking."),
  rule("mirror.likeness", "mirror", 1, re(`\\buse your (?:name|likeness|image|profile picture)\\b`),
    "The company can use your name or picture.",
    "Your face or name could appear in promotions you never saw."),

  // The Trapdoor: liability limits and disclaimers
  // Severity 3 only for total exclusions; an ordinary indirect or consequential damages exclusion
  // is trapdoor.consequential (PLAN_DECISIONS.md C12.2).
  rule("trapdoor.not-liable", "trapdoor", 3, re(
      `\\b(?:not|never) (?:be )?(?:liable|responsible)\\b(?!${G}{0,80}\\b${LIMITED_DAMAGES}\\b)${G}{0,80}\\b(?:any|all)\\b`,
      `\\bunder no circumstances\\b${G}{0,40}\\b(?:liable|responsible)\\b(?!${G}{0,80}\\b${LIMITED_DAMAGES}\\b)`,
      `\\b(?:liable|liability|responsible)\\b(?!${G}{0,80}\\b${LIMITED_DAMAGES}\\b)${G}{0,80}\\b(?:whatsoever|howsoever)\\b`),
    "The company says it is not responsible for any harm the service causes.",
    "If something goes badly wrong, you may have no one to hold to account."),
  rule("trapdoor.consequential", "trapdoor", 2, re(
      `\\b(?:not|never) (?:be )?(?:liable|responsible)\\b${G}{0,80}\\b${LIMITED_DAMAGES}\\b`,
      `\\b(?:exclude|disclaim)\\w*\\b${G}{0,60}\\b(?:indirect|consequential|incidental)\\b`),
    "The company will not pay for knock-on losses, such as lost profits or other indirect damage.",
    "Many terms exclude these, but it means you bear the wider costs if the service fails you."),
  rule("trapdoor.as-is", "trapdoor", 2, re(`\\bprovided\\b${G}{0,30}\\bas[- ]is\\b`, `\\bas[- ]is\\s+basis\\b`, `\\bon an ["“]?as[- ]is`),
    "The service is offered \"as is\", with no promise that it works.",
    "You take the risk if it fails, loses your data or is wrong."),
  rule("trapdoor.cap", "trapdoor", 2, re(`\\bliability\\b${G}{0,60}\\b(?:limited to|shall not exceed|will not exceed|capped at)\\b`),
    "The most the company would ever pay you is capped.",
    "A low cap means real losses may be repaid only in part, or not at all."),
  rule("trapdoor.indemnify", "trapdoor", 2, re(`\\bindemnif\\w*`, `\\bhold (?:us )?harmless\\b`),
    "You agree to cover the company's costs if a claim involves your use.",
    "You could end up paying the company's legal bills."),
  rule("trapdoor.no-warranty", "trapdoor", 1, re(`\\b(?:disclaim\\w*|make no|without)\\b${G}{0,30}\\bwarrant(?:y|ies)\\b`),
    "The company makes no promises about the service.",
    "Without a warranty you have fewer grounds to complain when it falls short."),

  // The Shifting Stairs: terms the company can change without notice
  rule("stairs.no-notice", "stairs", 3, re(`\\b(?:change|modify|update|amend|revise)\\w*\\b${G}{0,80}\\bwithout (?:prior |advance |any )?notice\\b`),
    "The company can change the rules without telling you.",
    "You can be bound by terms you have never seen."),
  rule("stairs.no-notify", "stairs", 3, re(`\\b(?:not|never|no obligation to)\\b${G}{0,20}\\b(?:notify|inform|tell) you\\b${G}{0,40}\\bchanges?\\b`),
    "The company does not have to tell you about changes.",
    "Changes you never hear about can still take away rights you relied on."),
  rule("stairs.any-time", "stairs", 2, re(`\\b(?:change|modify|update|amend|revise)\\w*\\b${G}{0,60}\\b(?:terms|agreement|polic(?:y|ies))\\b${G}{0,40}\\b(?:at any time|from time to time)\\b`),
    "The company can change these terms whenever it likes.",
    "What you agreed to today may not be what applies tomorrow."),
  rule("stairs.continued-use", "stairs", 2, re(`\\bcontinued use\\b${G}{0,60}\\b(?:accept|agree|constitut)\\w*`),
    "Simply keeping on using the service counts as accepting new terms.",
    "You can agree to changes without ever reading or approving them."),
  rule("stairs.sole-discretion", "stairs", 1, re(`\\b(?:sole|absolute) discretion\\b`),
    "The company decides on its own, with no rules it has to follow.",
    "\"Sole discretion\" leaves you nothing to point to if a decision goes against you."),
]);

const mitigation = (id: string, room: RoomId, level: 0 | 1, pattern: RegExp): Mitigation => Object.freeze({ id, room, level, pattern });

// A negation, alone or doubled ("we do not and will not"), so every common way of saying "we never"
// is read the same (PLAN_DECISIONS.md C12.1: "We will never sell" used to be missed).
const NOT_ONE = "(?:(?:do|does|will|shall|would|can) (?:not|never)|cannot|can't|don't|doesn't|won't|shan't|never)";
const NOT = `${NOT_ONE}(?:,? (?:and|or) ${NOT_ONE})?(?: ever)?`;

export const MITIGATIONS: readonly Mitigation[] = Object.freeze([
  mitigation("cellar.no-sell", "cellar", 0, re(`\\bwe ${NOT} sell\\b`)),
  mitigation("cellar.no-share", "cellar", 0, re(`\\bwe ${NOT} share\\b`)),
  mitigation("cellar.consent", "cellar", 1, re(`\\bonly with your (?:explicit |prior )?consent\\b`)),
  mitigation("portraits.no-track", "portraits", 0, re(`\\bwe ${NOT} (?:track|profile|build profiles)\\b`)),
  mitigation("portraits.opt-out", "portraits", 1, re(`\\byou (?:can|may|will be able to) (?:always |still )?(?:opt[- ]out|turn (?:this|these|it) off|decline)\\b`)),
  mitigation("vault.reminder", "vault", 1, re(`\\b(?:remind|notify|email|tell) you\\b${G}{0,40}\\bbefore\\b`, `\\bsend you (?:a |an )?(?:reminder|notice|email)\\b${G}{0,40}\\bbefore\\b`)),
  mitigation("locked.delete-anytime", "locked-door", 0, re(`\\byou (?:can|may|are free to|will be able to) (?:always )?(?:delete|close|cancel)\\b${G}{0,60}\\b(?:at any time|anytime|instantly|immediately)\\b`)),
  mitigation("court.opt-out", "court", 1, re(`\\bopt[- ]out of (?:this |the )?arbitration\\b`)),
  mitigation("mirror.you-own", "mirror", 1, re(`\\byou (?:will |always |still )?(?:retain|keep) (?:all )?(?:(?:of )?your )?(?:ownership|rights)\\b`, `\\byou (?:still |always )?own your content\\b`)),
  mitigation("trapdoor.carve-out", "trapdoor", 1, re(`\\bnothing in (?:these|this)\\b${G}{0,60}\\b(?:limits?|excludes?|restricts?)\\b${G}{0,40}\\bliability\\b`)),
  mitigation("stairs.advance-notice", "stairs", 1, re(`\\b(?:will|we'll|shall) (?:always )?(?:notify|tell|email|inform|give) you\\b${G}{0,60}\\b\\d+ days\\b`, `\\bat least \\d+ days'? notice\\b`)),
]);

/** The eight exception markers (R3.8, PLAN_DECISIONS.md C10.2), on word boundaries. */
export const EXCEPTION_MARKER = /\b(?:except|unless|other than|however|provided that|but|although|subject to)\b/i;
