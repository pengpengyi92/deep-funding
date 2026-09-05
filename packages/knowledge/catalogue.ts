import { fundingProfileSchema } from "./profile-schema";
import p0 from "../../funding/incubators/profiles/demo-workshop.json";
import p1 from "../../funding/accelerators/profiles/demo-launchpad.json";
import p2 from "../../funding/angel/investors/demo-operator.json";
import p3 from "../../funding/venture_capital/pre_seed/demo-frontier.json";
import p4 from "../../funding/venture_capital/seed/demo-seed.json";
import p5 from "../../funding/venture_capital/growth/demo-growth.json";
import p6 from "../../funding/private_equity/growth_equity/demo-pe.json";
import p7 from "../../funding/banks/loans/demo-credit.json";
import p8 from "../../funding/strategic_investors/corporate/demo-strategic.json";
import p9 from "../../funding/government/grants/demo-university.json";
import p10 from "../../funding/government/industrial_funds/demo-policy.json";
import p11 from "../../funding/banks/venture_debt/demo-venture-debt.json";
import p12 from "../../funding/other/family_offices/demo-family.json";
import p13 from "../../funding/other/crowdfunding/demo-platform.json";
import p14 from "../../funding/accelerators/profiles/y_combinator.json";

export const fundingCatalogue = [
  p0,
  p1,
  p2,
  p3,
  p4,
  p5,
  p6,
  p7,
  p8,
  p9,
  p10,
  p11,
  p12,
  p13,
  p14,
].map((p) => fundingProfileSchema.parse(p));
if (
  new Set(fundingCatalogue.map((p) => p.slug)).size !== fundingCatalogue.length
)
  throw new Error("Duplicate funding entity slug");
