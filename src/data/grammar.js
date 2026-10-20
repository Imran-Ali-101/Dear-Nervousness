// item: { h, rule, note, en, to, bn }
// en = মূল বাক্য, to = রূপান্তরিত বাক্য (→ দিয়ে দেখায়)

export const grammarParts = [
  {
    id: "pos",
    title: "Parts of Speech",
    desc: "Noun, Pronoun, Verb, Adjective, Adverb…",
    sections: [
      {
        title: "৮টি Parts of Speech",
        text: "বাক্যের প্রতিটি শব্দ ৮টি ভাগের কোনো একটিতে পড়ে। একই শব্দ বাক্যে কাজ অনুযায়ী ভিন্ন POS হতে পারে।",
        items: [
          { h: "Noun (বিশেষ্য)", rule: "নাম বোঝায়: ব্যক্তি, স্থান, বস্তু, ভাব", en: "Rahim lives in Dhaka.", bn: "রহিম ঢাকায় থাকে।" },
          { h: "Pronoun (সর্বনাম)", rule: "Noun-এর বদলে বসে: I, you, he, she, it, we, they", en: "She loves her mother.", bn: "সে তার মাকে ভালোবাসে।" },
          { h: "Verb (ক্রিয়া)", rule: "কাজ বা অবস্থা বোঝায়", en: "They play football every day.", bn: "তারা প্রতিদিন ফুটবল খেলে।" },
          { h: "Adjective (বিশেষণ)", rule: "Noun/Pronoun-এর গুণ বোঝায়", en: "She is a beautiful girl.", bn: "সে একটি সুন্দরী মেয়ে।" },
          { h: "Adverb (ক্রিয়া বিশেষণ)", rule: "Verb, Adjective বা অন্য Adverb-কে বিশেষিত করে", en: "He speaks very clearly.", bn: "সে খুব স্পষ্টভাবে কথা বলে।" },
          { h: "Preposition (অব্যয় / পদান্বয়ী)", rule: "Noun/Pronoun-এর আগে বসে অন্য শব্দের সাথে সম্পর্ক দেখায়: in, on, at, to, from, with", en: "The book is on the table.", bn: "বইটি টেবিলের উপর আছে।" },
          { h: "Conjunction (সংযোজক)", rule: "শব্দ, বাক্যাংশ বা বাক্য জোড়ে: and, but, or, because, if", en: "I was tired, but I kept working.", bn: "আমি ক্লান্ত ছিলাম, কিন্তু কাজ চালিয়ে গেলাম।" },
          { h: "Interjection (আবেগ সূচক)", rule: "হঠাৎ আবেগ প্রকাশ করে: Oh! Wow! Alas! Hurrah!", en: "Wow! What a beautiful place!", bn: "বাহ! কী সুন্দর জায়গা!" },
        ],
      },
      {
        title: "Noun-এর প্রকার",
        items: [
          { h: "Proper Noun", rule: "নির্দিষ্ট নাম, সবসময় Capital letter", en: "Bangladesh, Karim, Padma", bn: "বাংলাদেশ, করিম, পদ্মা" },
          { h: "Common Noun", rule: "একই জাতীয় সবার নাম", en: "boy, city, river", bn: "ছেলে, শহর, নদী" },
          { h: "Collective Noun", rule: "দল বা সমষ্টির নাম", en: "A team of players", bn: "খেলোয়াড়দের একটি দল" },
          { h: "Material Noun", rule: "উপাদান বা পদার্থের নাম", en: "gold, water, rice", bn: "সোনা, পানি, চাল" },
          { h: "Abstract Noun", rule: "গুণ, ভাব বা অবস্থার নাম (ছোঁয়া যায় না)", en: "honesty, love, childhood", bn: "সততা, ভালোবাসা, শৈশব" },
        ],
      },
      {
        title: "Verb-এর প্রকার",
        items: [
          { h: "Transitive Verb", rule: "Object লাগে", en: "She reads a book.", bn: "সে একটি বই পড়ে।" },
          { h: "Intransitive Verb", rule: "Object লাগে না", en: "The baby sleeps.", bn: "শিশুটি ঘুমায়।" },
          { h: "Auxiliary Verb", rule: "মূল Verb-কে সাহায্য করে: am, is, are, was, were, have, has, had, do, does, did", en: "He is reading a book.", bn: "সে একটি বই পড়ছে।" },
          { h: "Modal Verb", rule: "can, could, may, might, must, should, would, will, shall + V1", en: "You should speak slowly.", bn: "তোমার ধীরে কথা বলা উচিত।" },
        ],
      },
      {
        title: "Article (a, an, the)",
        items: [
          { h: "a", rule: "Consonant sound-এর আগে: a book, a university", en: "I bought a book.", bn: "আমি একটি বই কিনলাম।" },
          { h: "an", rule: "Vowel sound-এর আগে: an apple, an hour", en: "She ate an apple.", bn: "সে একটি আপেল খেল।" },
          { h: "the", rule: "নির্দিষ্ট বা পরিচিত কিছুর আগে; সূর্য, চাঁদ, নদী, সর্বোচ্চ (superlative)-এর আগে", en: "The sun rises in the east.", bn: "সূর্য পূর্ব দিকে ওঠে।" },
        ],
      },
      {
        title: "একই শব্দ, ভিন্ন POS",
        text: "শব্দটি বাক্যে কী কাজ করছে, সেটা দেখে POS ঠিক করুন।",
        items: [
          { h: "work", rule: "Noun / Verb", en: "I have a lot of work. (Noun)", to: "I work in an office. (Verb)" },
          { h: "fast", rule: "Adjective / Adverb", en: "He is a fast runner. (Adjective)", to: "He runs fast. (Adverb)" },
          { h: "before", rule: "Preposition / Conjunction / Adverb", en: "Come before noon. (Preposition)", to: "Come before it rains. (Conjunction)" },
        ],
      },
    ],
  },

  {
    id: "tense",
    title: "Tense",
    desc: "Present, Past, Future (প্রতিটার ৪ রূপ)",
    sections: [
      {
        title: "আগে জেনে নিন",
        items: [
          { h: "Verb-এর ৩ রূপ", rule: "V1 (Present) • V2 (Past) • V3 (Past Participle)", en: "go – went – gone", to: "write – wrote – written" },
          { h: "V1-এর সাথে s/es", rule: "He, She, It ও একবচন Subject + Present Indefinite হলে Verb-এ s/es", en: "He plays cricket.", bn: "সে ক্রিকেট খেলে।" },
        ],
      },
      {
        title: "Present Tense",
        items: [
          { h: "Present Indefinite", rule: "Subject + V1 (s/es) + Object", en: "I eat rice every day.", bn: "আমি প্রতিদিন ভাত খাই। (অভ্যাস, চিরসত্য)" },
          { h: "Present Continuous", rule: "Subject + am/is/are + V1+ing", en: "I am eating rice now.", bn: "আমি এখন ভাত খাচ্ছি। (এখন চলছে)" },
          { h: "Present Perfect", rule: "Subject + has/have + V3", en: "I have eaten rice.", bn: "আমি ভাত খেয়েছি। (সদ্য শেষ বা ফল এখনও আছে)" },
          { h: "Present Perfect Continuous", rule: "Subject + has/have been + V1+ing + since/for", en: "I have been eating for an hour.", bn: "আমি এক ঘণ্টা ধরে খাচ্ছি।" },
        ],
      },
      {
        title: "Past Tense",
        items: [
          { h: "Past Indefinite", rule: "Subject + V2 + Object", en: "I ate rice yesterday.", bn: "আমি গতকাল ভাত খেয়েছিলাম।" },
          { h: "Past Continuous", rule: "Subject + was/were + V1+ing", en: "I was eating rice then.", bn: "আমি তখন ভাত খাচ্ছিলাম।" },
          { h: "Past Perfect", rule: "Subject + had + V3", en: "I had eaten before he came.", bn: "সে আসার আগেই আমি খেয়েছিলাম। (দুই অতীত ঘটনার আগেরটা)" },
          { h: "Past Perfect Continuous", rule: "Subject + had been + V1+ing + since/for", en: "I had been eating for an hour.", bn: "আমি এক ঘণ্টা ধরে খাচ্ছিলাম।" },
        ],
      },
      {
        title: "Future Tense",
        items: [
          { h: "Future Indefinite", rule: "Subject + will/shall + V1", en: "I will eat rice tomorrow.", bn: "আমি আগামীকাল ভাত খাব।" },
          { h: "Future Continuous", rule: "Subject + will/shall be + V1+ing", en: "I will be eating at 8 PM.", bn: "রাত ৮টায় আমি খেতে থাকব।" },
          { h: "Future Perfect", rule: "Subject + will/shall have + V3", en: "I will have eaten by 9 PM.", bn: "রাত ৯টার মধ্যে আমি খেয়ে ফেলব।" },
          { h: "Future Perfect Continuous", rule: "Subject + will/shall have been + V1+ing + for", en: "I will have been studying for two hours.", bn: "আমি দুই ঘণ্টা ধরে পড়তে থাকব।" },
        ],
      },
      {
        title: "Negative ও Question বানানো",
        items: [
          { h: "Present Indefinite", rule: "Negative: do/does not + V1 • Question: Do/Does + S + V1?", en: "She does not play.", to: "Does she play?" },
          { h: "Past Indefinite", rule: "Negative: did not + V1 • Question: Did + S + V1?", en: "She did not play.", to: "Did she play?" },
          { h: "Continuous / Perfect / Future", rule: "Negative: Auxiliary-এর পরে not • Question: Auxiliary আগে", en: "She is not playing.", to: "Is she playing?" },
        ],
      },
    ],
  },

  {
    id: "voice",
    title: "Voice Change",
    desc: "Active ↔ Passive",
    sections: [
      {
        title: "মূল ধারণা",
        text: "Active Voice-এ Subject কাজ করে। Passive Voice-এ কাজের ফল (Object) Subject হয়ে বসে।",
        items: [
          { h: "মূল ফর্মুলা", rule: "Subject + Verb + Object → Object + be + V3 + by + Subject", en: "Rahim writes a letter.", to: "A letter is written by Rahim.", bn: "রহিম একটি চিঠি লেখে। → চিঠিটি রহিমের দ্বারা লেখা হয়।" },
          { h: "শর্ত", note: "Object না থাকলে (Intransitive Verb) সাধারণত Passive হয় না।" },
        ],
      },
      {
        title: "Pronoun পরিবর্তন",
        items: [
          { h: "Subject → Object", rule: "I → me • We → us • You → you • He → him • She → her • They → them • It → it" },
          { h: "Object → Subject", rule: "me → I • us → we • you → you • him → he • her → she • them → they • it → it" },
        ],
      },
      {
        title: "Tense অনুযায়ী Passive",
        items: [
          { h: "Present Indefinite", rule: "am/is/are + V3", en: "She writes a letter.", to: "A letter is written by her." },
          { h: "Present Continuous", rule: "am/is/are + being + V3", en: "She is writing a letter.", to: "A letter is being written by her." },
          { h: "Present Perfect", rule: "has/have + been + V3", en: "She has written a letter.", to: "A letter has been written by her." },
          { h: "Past Indefinite", rule: "was/were + V3", en: "She wrote a letter.", to: "A letter was written by her." },
          { h: "Past Continuous", rule: "was/were + being + V3", en: "She was writing a letter.", to: "A letter was being written by her." },
          { h: "Past Perfect", rule: "had + been + V3", en: "She had written a letter.", to: "A letter had been written by her." },
          { h: "Future Indefinite", rule: "will/shall + be + V3", en: "She will write a letter.", to: "A letter will be written by her." },
          { h: "Future Perfect", rule: "will/shall + have been + V3", en: "She will have written a letter.", to: "A letter will have been written by her." },
          { h: "Continuous (Perfect/Future)", note: "Perfect Continuous ও Future Continuous Tense-এর সাধারণত Passive হয় না।" },
        ],
      },
      {
        title: "বিশেষ ক্ষেত্র",
        items: [
          { h: "Modal Verb", rule: "Modal + be + V3", en: "You must obey the rules.", to: "The rules must be obeyed by you." },
          { h: "Interrogative (Yes/No)", rule: "Auxiliary আগে, তারপর Object + V3", en: "Does he play football?", to: "Is football played by him?" },
          { h: "Interrogative (Wh)", rule: "Wh-word আগে বসে, Who → By whom", en: "Who wrote this book?", to: "By whom was this book written?" },
          { h: "Imperative (আদেশ)", rule: "Let + Object + be + V3", en: "Close the door.", to: "Let the door be closed." },
          { h: "Imperative (অনুরোধ)", rule: "You are requested/ordered + to + V1", en: "Please help me.", to: "You are requested to help me." },
          { h: "দুটো Object", rule: "যেকোনো একটা Object Subject হতে পারে", en: "He gave me a book.", to: "I was given a book by him." },
          { h: "Passive → Active", rule: "উল্টো করুন: by-এর পরের অংশ Subject হবে", en: "The cake was eaten by the boy.", to: "The boy ate the cake." },
        ],
      },
    ],
  },

  {
    id: "narration",
    title: "Narration",
    desc: "Direct ↔ Indirect",
    sections: [
      {
        title: "মূল ধারণা",
        text: "কারও কথা হুবহু বললে Direct (“ ” চিহ্ন থাকে), নিজের ভাষায় বললে Indirect। Direct → Indirect করতে ৩টা জিনিস বদলাতে হয়: Reporting Verb, Pronoun, Tense/সময়।",
        items: [
          { h: "Assertive (সাধারণ বাক্য)", rule: "said/said to → said / told + that", en: "He said, “I am happy.”", to: "He said that he was happy." },
        ],
      },
      {
        title: "Tense পরিবর্তন",
        text: "Reporting Verb Past হলে Reported Speech-এর Tense এক ধাপ পিছিয়ে যায়। Present বা Future হলে বদলায় না।",
        items: [
          { h: "Present Indefinite → Past Indefinite", en: "He said, “I play cricket.”", to: "He said that he played cricket." },
          { h: "Present Continuous → Past Continuous", en: "He said, “I am playing.”", to: "He said that he was playing." },
          { h: "Present Perfect → Past Perfect", en: "He said, “I have played.”", to: "He said that he had played." },
          { h: "Past Indefinite → Past Perfect", en: "He said, “I played.”", to: "He said that he had played." },
          { h: "will → would, can → could", en: "She said, “I will come, and I can help.”", to: "She said that she would come and could help." },
          { h: "may → might, shall → should", en: "He said, “I may go.”", to: "He said that he might go." },
          { h: "বদলায় না", rule: "চিরসত্য, ঐতিহাসিক সত্য বা Reporting Verb Present/Future হলে", en: "The teacher said, “The earth moves round the sun.”", to: "The teacher said that the earth moves round the sun." },
        ],
      },
      {
        title: "Pronoun পরিবর্তন",
        items: [
          { h: "1st Person (I, we, my, our)", rule: "Reporting Speech-এর Subject অনুযায়ী" },
          { h: "2nd Person (you, your)", rule: "Reporting Speech-এর Object অনুযায়ী" },
          { h: "3rd Person (he, she, they)", rule: "বদলায় না" },
          { h: "উদাহরণ", en: "She said to me, “I will help you.”", to: "She told me that she would help me." },
        ],
      },
      {
        title: "সময় ও স্থান",
        items: [
          { h: "সময়", rule: "now → then • today → that day • tomorrow → the next day • yesterday → the previous day • last night → the previous night • ago → before" },
          { h: "স্থান", rule: "here → there • this → that • these → those • come → go" },
        ],
      },
      {
        title: "বাক্যের ধরন অনুযায়ী",
        items: [
          { h: "Interrogative (Wh-question)", rule: "asked + Wh-word বজায় থাকে + Statement order", en: "He said to me, “Where do you live?”", to: "He asked me where I lived." },
          { h: "Interrogative (Yes/No)", rule: "asked + if / whether + Statement order", en: "She said to him, “Do you know me?”", to: "She asked him if he knew her." },
          { h: "Imperative (আদেশ)", rule: "ordered / commanded + to + V1", en: "The teacher said to the boy, “Open the door.”", to: "The teacher ordered the boy to open the door." },
          { h: "Imperative (অনুরোধ)", rule: "requested + to + V1", en: "He said to her, “Please help me.”", to: "He requested her to help him." },
          { h: "Imperative (উপদেশ)", rule: "advised + to + V1", en: "The doctor said to him, “Take rest.”", to: "The doctor advised him to take rest." },
          { h: "Imperative (নিষেধ)", rule: "forbade / told + not to + V1", en: "The teacher said, “Don’t make noise.”", to: "The teacher told us not to make noise." },
          { h: "Exclamatory", rule: "exclaimed with joy/sorrow/surprise + that", en: "He said, “Alas! I am ruined.”", to: "He exclaimed with sorrow that he was ruined." },
          { h: "Optative (প্রার্থনা)", rule: "prayed / wished + that + may → might", en: "She said to me, “May you be happy.”", to: "She prayed that I might be happy." },
        ],
      },
    ],
  },

  {
    id: "degree",
    title: "Degree",
    desc: "Positive, Comparative, Superlative",
    sections: [
      {
        title: "তিন ধরনের Degree",
        items: [
          { h: "Positive", rule: "as + Adjective + as", en: "Rahim is as tall as Karim.", bn: "রহিম করিমের মতোই লম্বা।" },
          { h: "Comparative", rule: "Adjective + er / more + Adjective + than", en: "Rahim is taller than Karim.", bn: "রহিম করিমের চেয়ে লম্বা।" },
          { h: "Superlative", rule: "the + Adjective + est / the most + Adjective", en: "Rahim is the tallest boy in the class.", bn: "রহিম ক্লাসের সবচেয়ে লম্বা ছেলে।" },
        ],
      },
      {
        title: "-er / -est যোগের নিয়ম",
        items: [
          { h: "এক Syllable", rule: "-er / -est", en: "tall – taller – tallest" },
          { h: "e দিয়ে শেষ", rule: "-r / -st", en: "nice – nicer – nicest" },
          { h: "Consonant + y", rule: "y → i + er/est", en: "happy – happier – happiest" },
          { h: "ছোট Vowel + এক Consonant", rule: "Consonant দ্বিগুণ", en: "big – bigger – biggest" },
          { h: "২ বা বেশি Syllable", rule: "more / most", en: "beautiful – more beautiful – most beautiful" },
        ],
      },
      {
        title: "Irregular Forms",
        items: [
          { rule: "good/well – better – best" },
          { rule: "bad/ill – worse – worst" },
          { rule: "much/many – more – most" },
          { rule: "little – less – least" },
          { rule: "far – farther/further – farthest/furthest" },
          { rule: "old – older/elder – oldest/eldest" },
        ],
      },
      {
        title: "Degree পরিবর্তন",
        text: "তিন রূপে একই অর্থ ঠিক রেখে বাক্য লেখা পরীক্ষায় সবচেয়ে বেশি আসে।",
        items: [
          { h: "Superlative → Comparative", rule: "the + adj-est → adj-er than any other + Singular Noun", en: "Everest is the highest mountain in the world.", to: "Everest is higher than any other mountain in the world." },
          { h: "Superlative → Positive", rule: "No other + Singular Noun + as/so + adj + as", en: "Everest is the highest mountain in the world.", to: "No other mountain in the world is as high as Everest." },
          { h: "one of the + Superlative → Comparative", rule: "adj-er than most other + Plural Noun", en: "Dhaka is one of the largest cities in Bangladesh.", to: "Dhaka is larger than most other cities in Bangladesh." },
          { h: "one of the + Superlative → Positive", rule: "Very few + Plural Noun + are as + adj + as", en: "Dhaka is one of the largest cities in Bangladesh.", to: "Very few cities in Bangladesh are as large as Dhaka." },
          { h: "Comparative → Positive", rule: "A is adj-er than B → B is not as adj as A", en: "He is wiser than I.", to: "I am not as wise as he." },
          { h: "Positive → Comparative", rule: "A is as adj as B → B is not adj-er than A", en: "Rina is as smart as Mina.", to: "Mina is not smarter than Rina." },
        ],
      },
    ],
  },

  {
    id: "changing",
    title: "Changing Sentence",
    desc: "Meaning, Structure, Transformation",
    sections: [
      {
        title: "অর্থ অনুযায়ী ৫ ধরন",
        items: [
          { h: "Assertive", rule: "তথ্য বা মত জানায়", en: "He is a good boy.", bn: "সে একটি ভালো ছেলে।" },
          { h: "Interrogative", rule: "প্রশ্ন করে", en: "Is he a good boy?", bn: "সে কি ভালো ছেলে?" },
          { h: "Imperative", rule: "আদেশ, অনুরোধ, উপদেশ", en: "Be a good boy.", bn: "ভালো ছেলে হও।" },
          { h: "Optative", rule: "প্রার্থনা, ইচ্ছা", en: "May you be happy.", bn: "তুমি সুখী হও।" },
          { h: "Exclamatory", rule: "আবেগ প্রকাশ", en: "What a good boy he is!", bn: "সে কী ভালো ছেলে!" },
        ],
      },
      {
        title: "এক ধরন থেকে অন্য ধরনে",
        items: [
          { h: "Assertive → Interrogative", rule: "Affirmative হলে negative question, Negative হলে affirmative question", en: "He is a good boy.", to: "Is he not a good boy?" },
          { h: "Assertive → Interrogative", rule: "Nobody/None → Who", en: "Nobody can do this.", to: "Who can do this?" },
          { h: "Assertive → Exclamatory", rule: "What a… / How…", en: "It is a very hot day.", to: "What a hot day it is!" },
          { h: "Assertive → Exclamatory", en: "He is very clever.", to: "How clever he is!" },
          { h: "Imperative → Assertive", en: "Please help me.", to: "You are requested to help me." },
          { h: "Optative → Assertive", en: "May you live long.", to: "I wish that you will live long." },
        ],
      },
      {
        title: "Affirmative ↔ Negative",
        text: "অর্থ একই রেখে বাক্য ইতিবাচক থেকে নেতিবাচক করুন, বা উল্টো।",
        items: [
          { h: "বিপরীত শব্দ + not", en: "He is rich.", to: "He is not poor." },
          { h: "always → never", en: "He always tells the truth.", to: "He never tells a lie." },
          { h: "only → none but / nothing but", en: "Only he can do it.", to: "None but he can do it." },
          { h: "Everybody → There is none who…", en: "Everybody loves honesty.", to: "There is none who does not love honesty." },
          { h: "as soon as → No sooner… than", en: "As soon as he saw me, he ran away.", to: "No sooner had he seen me than he ran away." },
          { h: "too… to → so… that… cannot", en: "He is too weak to walk.", to: "He is so weak that he cannot walk." },
        ],
      },
      {
        title: "Structure অনুযায়ী ৪ ধরন",
        items: [
          { h: "Simple", rule: "১টা Independent Clause", en: "She reads books.", bn: "সে বই পড়ে।" },
          { h: "Compound", rule: "২+ Independent Clause (and, but, or, so)", en: "She reads books, and he plays games.", bn: "সে বই পড়ে, আর সে খেলা খেলে।" },
          { h: "Complex", rule: "১ Independent + ১+ Dependent Clause", en: "She reads books because she loves stories.", bn: "সে বই পড়ে কারণ সে গল্প ভালোবাসে।" },
          { h: "Compound-Complex", rule: "২+ Independent + ১+ Dependent", en: "She reads books, and he plays games because he likes them.", bn: "সে বই পড়ে, আর সে খেলা খেলে কারণ সে সেগুলো পছন্দ করে।" },
        ],
      },
      {
        title: "Simple → Complex",
        items: [
          { h: "Participle → as / since / when", en: "Being ill, he stayed home.", to: "As he was ill, he stayed home." },
          { h: "In spite of → Though", en: "In spite of being poor, he is honest.", to: "Though he is poor, he is honest." },
          { h: "Preposition + Gerund → when", en: "On seeing me, he ran away.", to: "When he saw me, he ran away." },
          { h: "Noun → Noun Clause", en: "I know his name.", to: "I know what his name is." },
          { h: "Phrase → Adjective Clause", en: "The man in the red shirt is my uncle.", to: "The man who is in the red shirt is my uncle." },
          { h: "Infinitive → that-clause", en: "He is sure of passing.", to: "He is sure that he will pass." },
        ],
      },
      {
        title: "Simple → Compound",
        items: [
          { h: "Participle → and", en: "Seeing the tiger, he ran away.", to: "He saw the tiger and ran away." },
          { h: "Besides → not only… but also", en: "Besides being poor, he is dishonest.", to: "He is not only poor but also dishonest." },
          { h: "In spite of → but", en: "In spite of being rich, he is unhappy.", to: "He is rich but he is unhappy." },
          { h: "Being → so", en: "Being ill, he could not attend.", to: "He was ill, so he could not attend." },
          { h: "Without → or", en: "Without working hard, you cannot succeed.", to: "Work hard, or you cannot succeed." },
        ],
      },
      {
        title: "Complex → Compound",
        items: [
          { h: "Though → but", en: "Though he is poor, he is honest.", to: "He is poor but honest." },
          { h: "If → and / or", en: "If you run, you will catch the bus.", to: "Run, and you will catch the bus." },
          { h: "Since/As → so", en: "Since he was ill, he did not come.", to: "He was ill, so he did not come." },
        ],
      },
      {
        title: "Clause-এর ধরন",
        items: [
          { h: "Noun Clause", rule: "Noun-এর কাজ করে (that, what, whether, why…)", en: "I know that he is honest.", bn: "আমি জানি যে সে সৎ।" },
          { h: "Adjective Clause", rule: "Noun-কে বিশেষিত করে (who, which, that, whose)", en: "The boy who won the prize is my brother.", bn: "যে ছেলেটি পুরস্কার জিতেছে সে আমার ভাই।" },
          { h: "Adverb Clause", rule: "Verb-কে বিশেষিত করে (when, because, if, although, where)", en: "I stayed home because it was raining.", bn: "বৃষ্টি হচ্ছিল বলে আমি বাসায় ছিলাম।" },
        ],
      },
      {
        title: "Phrase-এর ধরন",
        items: [
          { h: "Noun Phrase", en: "a cup of tea" },
          { h: "Verb Phrase", en: "has been waiting" },
          { h: "Adjective Phrase", en: "full of water" },
          { h: "Adverb Phrase", en: "in the morning" },
          { h: "Prepositional Phrase", en: "on the table" },
          { h: "Infinitive Phrase", en: "to learn English" },
          { h: "Gerund Phrase", en: "Reading books is fun." },
        ],
      },
      {
        title: "Joining ও Splitting",
        items: [
          { h: "দুই বাক্য জোড়া (Compound)", en: "He is poor. He is honest.", to: "He is poor but honest." },
          { h: "দুই বাক্য জোড়া (Complex)", en: "I know a man. He lives in Dhaka.", to: "I know a man who lives in Dhaka." },
          { h: "ভেঙে দুই বাক্য", en: "Though he was tired, he continued working.", to: "He was tired. Still, he continued working." },
        ],
      },
    ],
  },
];