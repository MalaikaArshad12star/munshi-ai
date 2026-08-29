import type { Language } from "./types";
import type { Intelligence } from "./intelligence";
import type { Intent } from "./intent";
import { formatCompact, formatPKR, formatSignedPct } from "./format";

export interface AnswerNumber {
  label: string;
  value: string;
}

export interface MunshiAnswer {
  intent: Intent;
  quick: string;
  numbers: AnswerNumber[];
  insight: string;
  action: string;
}

type Trio = { en: string; ur: string; roman: string };
function pick(lang: Language, t: Trio): string {
  return t[lang] ?? t.en;
}

const L = {
  todaySales: { en: "Today's sales", ur: "آج کی فروخت", roman: "Aaj ki sales" },
  sales30: { en: "30-day sales", ur: "۳ دن کی فروخت", roman: "30 din ki sales" },
  netProfit: { en: "Net profit", ur: "خالص منافع", roman: "Net munafa" },
  udhaar: { en: "Outstanding udhaar", ur: "بقایا ادھار", roman: "Baqi udhaar" },
  transactions: { en: "Transactions", ur: "لین دین", roman: "Transactions" },
  avgSale: { en: "Avg. sale", ur: "اوسط فروخت", roman: "Avg sale" },
  expenses: { en: "Total expenses", ur: "کل اخراجات", roman: "Total kharchay" },
  margin: { en: "Profit margin", ur: "منافع کا تناسب", roman: "Margin" },
  customers: { en: "Customers", ur: "گاہک", roman: "Grahak" },
  lowStock: { en: "Low stock", ur: "کم اسٹاک", roman: "Kam stock" },
  next7: { en: "Next 7-day sales (est.)", ur: "اگلے ۷ دن فروخت (تخمینہ)", roman: "Aglay 7 din sales (andaza)" },
  confidence: { en: "Confidence", ur: "اعتماد", roman: "Confidence" },
};

export function suggestedQuestions(intel: Intelligence, lang: Language): string[] {
  const q: string[] = [];
  q.push(
    pick(lang, { en: "How is my business doing?", ur: "میرا کاروبار کیسا چل رہا ہے؟", roman: "Mera karobar kaisa chal raha hai?" }),
  );
  if (intel.udhaar.ratioPct > 10) {
    q.push(pick(lang, { en: "Who owes me the most money?", ur: "سب سے زیادہ ادھار کس کے پاس ہے؟", roman: "Sab se zyada udhaar kis ke paas hai?" }));
  }
  if (intel.inventory.low.length || intel.inventory.out.length) {
    q.push(pick(lang, { en: "Which products are low in stock?", ur: "کون سی اشیاء کم اسٹاک ہیں؟", roman: "Kaun si cheezein kam stock hain?" }));
  }
  if (intel.expenses.growthPct > 10) {
    q.push(pick(lang, { en: "Why are my expenses high?", ur: "میرے اخراجات زیادہ کیوں ہیں؟", roman: "Mere kharchay zyada kyun hain?" }));
  }
  q.push(pick(lang, { en: "Which products sell the most?", ur: "سب سے زیادہ کون سی اشیاء بکتی ہیں؟", roman: "Sab se zyada kaun si cheezein bikti hain?" }));
  q.push(pick(lang, { en: "What should I focus on today?", ur: "آج مجھے کس چیز پر توجہ دینی چاہیے؟", roman: "Aaj mujhe kis cheez par tawajo deni chahiye?" }));
  return q.slice(0, 5);
}

export function composeAnswer(
  intel: Intelligence,
  intent: Intent,
  lang: Language,
): MunshiAnswer {
  const s = intel.sales;
  const p = intel.profit;
  const u = intel.udhaar;
  const f = intel.forecast;
  const rec = intel.health.recommendation;

  switch (intent) {
    case "greeting":
      return {
        intent,
        quick: pick(lang, {
          en: "Assalam! I'm your Munshi. Ask me about your sales, profit, expenses, customers, stock or udhaar.",
          ur: "السلام! میں آپ کا منشی ہوں۔ فروخت، منافع، اخراجات، گاہک، اسٹاک یا ادھار کے بارے میں پوچھیں۔",
          roman: "Assalam! Main aap ka Munshi hoon. Sales, munafa, kharchay, grahak, stock ya udhaar ke baare mein poochain.",
        }),
        numbers: [],
        insight: "",
        action: "",
      };

    case "sales":
      return {
        intent,
        quick: pick(lang, {
          en: `Your sales today are ${formatPKR(s.today)}. Over 30 days you made ${formatCompact(s.total)}, ${s.growthPct >= 0 ? "up" : "down"} ${formatSignedPct(s.growthPct)} week-over-week.`,
          ur: `آج کی فروخت ${formatPKR(s.today)} ہے۔ ۳۰ دن میں ${formatCompact(s.total)}، ہفتہ وار ${formatSignedPct(s.growthPct)}۔`,
          roman: `Aaj ki sales ${formatPKR(s.today)} hai. 30 din mein ${formatCompact(s.total)}, haftawar ${formatSignedPct(s.growthPct)}.`,
        }),
        numbers: [
          { label: pick(lang, L.todaySales), value: formatPKR(s.today) },
          { label: pick(lang, L.sales30), value: formatCompact(s.total) },
          { label: pick(lang, L.transactions), value: String(s.transactions) },
          { label: pick(lang, L.avgSale), value: formatPKR(s.avgTransaction) },
        ],
        insight: s.best[0]
          ? pick(lang, {
              en: `${s.best[0].name} is your best seller this week.`,
              ur: `${s.best[0].name} اس ہفتے سب سے زیادہ فروخت ہوا۔`,
              roman: `${s.best[0].name} is hafte sab se zyada bikee.`,
            })
          : "",
        action: pick(lang, {
          en: "Keep your best sellers stocked to protect revenue.",
          ur: "آمدنی برقرار رکھنے کے لیے بہترین اشیاء کا اسٹاک رکھیں۔",
          roman: "Aamdani barqarar rakhne ke liye best cheezon ka stock rakhein.",
        }),
      };

    case "profit":
      return {
        intent,
        quick: pick(lang, {
          en: `Your net profit is ${formatCompact(p.net)} with a ${p.marginPct.toFixed(1)}% margin. ${p.marginPct >= 15 ? "That's healthy." : "There's room to improve."}`,
          ur: `خالص منافع ${formatCompact(p.net)} ہے، ${p.marginPct.toFixed(1)}% مارجن کے ساتھ۔`,
          roman: `Net munafa ${formatCompact(p.net)} hai, ${p.marginPct.toFixed(1)}% margin ke saath.`,
        }),
        numbers: [
          { label: pick(lang, L.sales30), value: formatCompact(p.revenue) },
          { label: pick(lang, L.expenses), value: formatCompact(p.expenses) },
          { label: pick(lang, L.netProfit), value: formatCompact(p.net) },
          { label: pick(lang, L.margin), value: `${p.marginPct.toFixed(1)}%` },
        ],
        insight: pick(lang, {
          en: "Margin tells you how much of each rupee you actually keep.",
          ur: "مارجن بتاتا ہے کہ ہر روپے میں سے آپ کتنا رکھتے ہیں۔",
          roman: "Margin batata hai ke har rupay mein se aap kitna rakhte hain.",
        }),
        action: pick(lang, {
          en: p.marginPct < 10 ? "Review pricing and high-cost expenses to lift margin." : "Protect your margin by controlling expenses.",
          ur: "مارجن بڑھانے کے لیے قیمتیں اور مہنگے اخراجات دیکھیں۔",
          roman: "Margin barhane ke liye qeematein aur mehenge kharchay dekhein.",
        }),
      };

    case "expenses": {
      const top = intel.expenses.top[0];
      return {
        intent,
        quick: pick(lang, {
          en: `Your 30-day expenses are ${formatCompact(intel.expenses.total)}${top ? `, led by ${top.category}` : ""}.`,
          ur: `۳۰ دن کے اخراجات ${formatCompact(intel.expenses.total)} ہیں${top ? `، سب سے زیادہ ${top.category}` : ""}۔`,
          roman: `30 din ke kharchay ${formatCompact(intel.expenses.total)} hain${top ? `, sab se zyada ${top.category}` : ""}.`,
        }),
        numbers: intel.expenses.top.slice(0, 4).map((t) => ({ label: t.category, value: formatPKR(t.amount) })),
        insight: pick(lang, {
          en: intel.expenses.growthPct > 10 ? `Expenses grew ${intel.expenses.growthPct.toFixed(0)}% this week.` : "Expenses look stable this week.",
          ur: intel.expenses.growthPct > 10 ? `اس ہفتے اخراجات ${intel.expenses.growthPct.toFixed(0)}% بڑھے۔` : "اخراجات مستحکم ہیں۔",
          roman: intel.expenses.growthPct > 10 ? `Is hafte kharchay ${intel.expenses.growthPct.toFixed(0)}% barhe.` : "Kharchay mustehkam hain.",
        }),
        action: pick(lang, {
          en: `Review ${top ? top.category : "your largest"} spending first.`,
          ur: "سب سے بڑے خرچے کو پہلے دیکھیں۔",
          roman: "Sab se baray kharchay ko pehle dekhein.",
        }),
      };
    }

    case "customers":
      return {
        intent,
        quick: pick(lang, {
          en: `You have ${intel.customers.total} customers. ${intel.customers.best[0] ? `${intel.customers.best[0].name} is your best customer.` : ""}`,
          ur: `آپ کے ${intel.customers.total} گاہک ہیں۔ ${intel.customers.best[0] ? `${intel.customers.best[0].name} بہترین گاہک ہے۔` : ""}`,
          roman: `Aap ke ${intel.customers.total} grahak hain. ${intel.customers.best[0] ? `${intel.customers.best[0].name} behtareen grahak hai.` : ""}`,
        }),
        numbers: [
          { label: pick(lang, L.customers), value: String(intel.customers.total) },
          ...intel.customers.best.slice(0, 2).map((c) => ({ label: c.name, value: formatPKR(c.total) })),
        ],
        insight: u.total > 0 ? pick(lang, { en: `${formatPKR(u.total)} is still outstanding from customers.`, ur: `${formatPKR(u.total)} اب بھی بقایا ہے۔`, roman: `${formatPKR(u.total)} abhi baqi hai.` }) : "",
        action: pick(lang, { en: "Reward loyal customers and follow up on big balances.", ur: "وفادار گاہکوں کو نوازیں اور بڑے بقایا پر رابطہ کریں۔", roman: "Wafadar grahakon ko nawazein aur baray baqaya par rabta karein." }),
      };

    case "udhaar":
      return {
        intent,
        quick: pick(lang, {
          en: `Customers owe you ${formatPKR(u.total)} (${u.ratioPct.toFixed(1)}% of monthly revenue). ${u.top[0] ? `${u.top[0].name} owes the most.` : ""}`,
          ur: `گاہکوں پر ${formatPKR(u.total)} ادھار ہے۔ ${u.top[0] ? `${u.top[0].name} سب سے زیادہ بقایا رکھتا ہے۔` : ""}`,
          roman: `Grahakon par ${formatPKR(u.total)} udhaar hai. ${u.top[0] ? `${u.top[0].name} sab se zyada baqi rakhta hai.` : ""}`,
        }),
        numbers: [
          { label: pick(lang, L.udhaar), value: formatPKR(u.total) },
          ...u.top.slice(0, 3).map((d) => ({ label: d.name, value: formatPKR(d.outstanding) })),
        ],
        insight: pick(lang, { en: "High udhaar ties up cash you could reinvest.", ur: "زیادہ ادھار آپ کا روپیہ روک لیتا ہے۔", roman: "Zyada udhaar aap ka rupaya rok leta hai." }),
        action: pick(lang, { en: "Follow up on the largest balances first.", ur: "پہلے سب سے بڑے بقایا پر رابطہ کریں۔", roman: "Pehle sab se baray baqaya par rabta karein." }),
      };

    case "inventory":
      return {
        intent,
        quick: pick(lang, {
          en: `${intel.inventory.low.length} products are low and ${intel.inventory.out.length} out of stock. ${s.fast[0] ? `${s.fast[0].name} is selling fastest.` : ""}`,
          ur: `${intel.inventory.low.length} اشیاء کم اور ${intel.inventory.out.length} ختم ہیں۔ ${s.fast[0] ? `${s.fast[0].name} تیزی سے بک رہی ہے۔` : ""}`,
          roman: `${intel.inventory.low.length} cheezein kam aur ${intel.inventory.out.length} khatam hain. ${s.fast[0] ? `${s.fast[0].name} tezi se bik rahi hai.` : ""}`,
        }),
        numbers: [
          { label: pick(lang, L.lowStock), value: String(intel.inventory.low.length) },
          ...s.fast.slice(0, 2).map((x) => ({ label: x.name, value: `${x.qty7} sold` })),
        ],
        insight: pick(lang, { en: "Fast movers running low are lost sales waiting to happen.", ur: "تیز فروخت ہونے والی کم اشیاء نقصان کا سبب بن سکتی ہیں۔", roman: "Tez bikne wali kam cheezein nuqsan ka sabab ban sakti hain." }),
        action: pick(lang, { en: "Restock fast-selling, low items first.", ur: "پہلے تیز بکنے والی کم اشیاء کا اسٹاک لیں۔", roman: "Pehle tez bikne wali kam cheezon ka stock lein." }),
      };

    case "forecast":
      return {
        intent,
        quick: pick(lang, {
          en: `Estimated next 7 days: about ${formatCompact(f.next7Sales)} in sales, trending ${f.trend}. This is an estimate, not a guarantee.`,
          ur: `اگلے ۷ دن کا تخمینہ: تقریباً ${formatCompact(f.next7Sales)} فروخت، رجحان ${f.trend}۔ یہ تخمینہ ہے۔`,
          roman: `Aglay 7 din ka andaza: taqreeban ${formatCompact(f.next7Sales)} sales, rujhan ${f.trend}. Yeh andaza hai.`,
        }),
        numbers: [
          { label: pick(lang, L.next7), value: formatCompact(f.next7Sales) },
          { label: pick(lang, L.expenses), value: formatCompact(f.next7Expenses) },
          { label: pick(lang, L.confidence), value: f.confidence },
        ],
        insight: pick(lang, { en: "Based on your recent 7-day average.", ur: "آپ کے حالیہ ۷ دن کی اوسط پر مبنی۔", roman: "Aap ke haaliya 7 din ki average par mabni." }),
        action: pick(lang, { en: "Plan stock and cash around the expected week.", ur: "متوقع ہفتے کے مطابق اسٹاک اور روپیہ منصوبہ بندی کریں۔", roman: "Mutawaqqa hafte ke mutabiq stock aur rupaya plan karein." }),
      };

    case "recommendation":
      return {
        intent,
        quick: rec ? pick(lang, { en: `Focus on: ${rec.problem}.`, ur: `توجہ دیں: ${rec.problem}۔`, roman: `Tawajo dein: ${rec.problem}.` }) : "All clear.",
        numbers: [{ label: "Health", value: `${intel.health.score}/100` }],
        insight: rec?.why ?? "",
        action: rec?.action ?? "",
      };

    case "overview":
    default:
      return {
        intent: "overview",
        quick: pick(lang, {
          en: `Your business health is ${intel.health.status} (${intel.health.score}/100). Today's sales ${formatPKR(s.today)}; ${formatPKR(u.total)} is outstanding as udhaar.`,
          ur: `آپ کے کاروبار کی صحت ${intel.health.status} (${intel.health.score}/100) ہے۔ آج کی فروخت ${formatPKR(s.today)}؛ ادھار ${formatPKR(u.total)} ہے۔`,
          roman: `Aap ke karobar ki sehat ${intel.health.status} (${intel.health.score}/100) hai. Aaj ki sales ${formatPKR(s.today)}; udhaar ${formatPKR(u.total)} hai.`,
        }),
        numbers: [
          { label: pick(lang, L.todaySales), value: formatPKR(s.today) },
          { label: pick(lang, L.netProfit), value: formatCompact(p.net) },
          { label: pick(lang, L.udhaar), value: formatPKR(u.total) },
        ],
        insight: intel.health.attention[0] ?? intel.health.helping[0] ?? "",
        action: rec?.action ?? "",
      };
  }
}
