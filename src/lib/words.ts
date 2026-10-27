export type Word = {
  word: string;
  pos: string;
  /** Meaning in Hindi */
  hindi: string;
  /** Short meaning in English */
  meaning: string;
  example: string;
};

// One word per day, rotating through the list.
export const WORDS: Word[] = [
  { word: "resilient", pos: "adjective", hindi: "लचीला; मुश्किलों से जल्दी उबरने वाला", meaning: "able to recover quickly from difficulty", example: "She stayed resilient after losing her first job." },
  { word: "diligent", pos: "adjective", hindi: "मेहनती; लगन से काम करने वाला", meaning: "careful and hard-working", example: "A diligent student revises every evening." },
  { word: "candid", pos: "adjective", hindi: "स्पष्टवादी; साफ़-साफ़ कहने वाला", meaning: "honest and direct", example: "Thank you for your candid feedback." },
  { word: "meticulous", pos: "adjective", hindi: "बारीकी से ध्यान देने वाला", meaning: "showing great attention to detail", example: "He kept meticulous notes in every meeting." },
  { word: "procrastinate", pos: "verb", hindi: "टालमटोल करना; काम को टालना", meaning: "to delay doing something", example: "I procrastinate when a task feels too big." },
  { word: "eloquent", pos: "adjective", hindi: "वाक्पटु; प्रभावशाली ढंग से बोलने वाला", meaning: "fluent and persuasive in speaking", example: "Her eloquent speech moved the whole room." },
  { word: "pragmatic", pos: "adjective", hindi: "व्यावहारिक", meaning: "dealing with things sensibly and realistically", example: "We need a pragmatic plan, not a perfect one." },
  { word: "ambiguous", pos: "adjective", hindi: "अस्पष्ट; जिसके एक से ज़्यादा अर्थ हों", meaning: "open to more than one meaning", example: "The email was ambiguous, so I asked again." },
  { word: "gratitude", pos: "noun", hindi: "कृतज्ञता; आभार", meaning: "the feeling of being thankful", example: "I wrote three lines of gratitude before bed." },
  { word: "consistent", pos: "adjective", hindi: "लगातार एक जैसा; नियमित", meaning: "acting the same way over time", example: "Being consistent matters more than being fast." },
  { word: "initiative", pos: "noun", hindi: "पहल", meaning: "the ability to act without being told", example: "She took the initiative to fix the report." },
  { word: "humble", pos: "adjective", hindi: "विनम्र", meaning: "not proud; modest", example: "He stayed humble even after the promotion." },
  { word: "persevere", pos: "verb", hindi: "डटे रहना; हार न मानना", meaning: "to keep trying despite difficulty", example: "If you persevere, the skill will come." },
  { word: "concise", pos: "adjective", hindi: "संक्षिप्त; कम शब्दों में", meaning: "short and clear", example: "Keep your update concise and to the point." },
  { word: "empathy", pos: "noun", hindi: "सहानुभूति; दूसरे की भावना समझना", meaning: "understanding how others feel", example: "Good managers lead with empathy." },
  { word: "obsolete", pos: "adjective", hindi: "पुराना; अब काम का नहीं", meaning: "no longer in use", example: "Fax machines are almost obsolete now." },
  { word: "feasible", pos: "adjective", hindi: "संभव; करने योग्य", meaning: "possible to do", example: "Is it feasible to finish this by Friday?" },
  { word: "vivid", pos: "adjective", hindi: "जीवंत; स्पष्ट और चमकीला", meaning: "very clear, bright or detailed", example: "I have a vivid memory of my first day at school." },
  { word: "reluctant", pos: "adjective", hindi: "अनिच्छुक; झिझकने वाला", meaning: "unwilling or hesitant", example: "He was reluctant to speak in the meeting." },
  { word: "accomplish", pos: "verb", hindi: "पूरा करना; हासिल करना", meaning: "to complete successfully", example: "What do you want to accomplish this week?" },
  { word: "abundant", pos: "adjective", hindi: "प्रचुर; भरपूर", meaning: "existing in large amounts", example: "Fresh mangoes are abundant in summer." },
  { word: "cautious", pos: "adjective", hindi: "सावधान", meaning: "careful to avoid risk", example: "Be cautious when you share passwords." },
  { word: "dedicate", pos: "verb", hindi: "समर्पित करना", meaning: "to give time or effort to something", example: "I dedicate the first hour of my day to reading." },
  { word: "genuine", pos: "adjective", hindi: "असली; सच्चा", meaning: "real and sincere", example: "Her smile was warm and genuine." },
  { word: "hesitate", pos: "verb", hindi: "हिचकिचाना", meaning: "to pause before doing something", example: "Don't hesitate to ask for help." },
  { word: "integrity", pos: "noun", hindi: "ईमानदारी; सत्यनिष्ठा", meaning: "being honest and having strong principles", example: "Integrity means doing right when no one is watching." },
  { word: "momentum", pos: "noun", hindi: "गति; रफ़्तार", meaning: "the force that keeps something moving", example: "Small wins help you build momentum." },
  { word: "negotiate", pos: "verb", hindi: "बातचीत से तय करना; मोलभाव करना", meaning: "to discuss to reach an agreement", example: "We need to negotiate the deadline with the client." },
  { word: "optimistic", pos: "adjective", hindi: "आशावादी", meaning: "hopeful about the future", example: "I'm optimistic that the launch will go well." },
  { word: "prioritise", pos: "verb", hindi: "प्राथमिकता देना", meaning: "to decide what is most important", example: "Prioritise the tasks that move your goals forward." },
  { word: "quarrel", pos: "noun", hindi: "झगड़ा; बहस", meaning: "an angry argument", example: "They had a small quarrel about the plan." },
  { word: "rational", pos: "adjective", hindi: "तर्कसंगत; विवेकपूर्ण", meaning: "based on clear thinking", example: "Let's make a rational decision, not an emotional one." },
  { word: "subtle", pos: "adjective", hindi: "सूक्ष्म; हल्का", meaning: "not obvious; delicate", example: "There is a subtle difference between the two colours." },
  { word: "tedious", pos: "adjective", hindi: "उबाऊ; थकाने वाला", meaning: "long and boring", example: "Filling in the form was tedious but necessary." },
  { word: "unique", pos: "adjective", hindi: "अनोखा; अद्वितीय", meaning: "the only one of its kind", example: "Everyone has a unique way of learning." },
  { word: "versatile", pos: "adjective", hindi: "बहुमुखी; कई काम करने में सक्षम", meaning: "able to do many different things", example: "A versatile player can play in any position." },
  { word: "wholesome", pos: "adjective", hindi: "पौष्टिक; अच्छा और स्वस्थ", meaning: "good for your health or wellbeing", example: "We had a wholesome dinner at home." },
  { word: "zeal", pos: "noun", hindi: "उत्साह; जोश", meaning: "great energy and enthusiasm", example: "He started the new project with real zeal." },
  { word: "adapt", pos: "verb", hindi: "ढलना; अनुकूल बनाना", meaning: "to change to suit new conditions", example: "It took me a week to adapt to the new office." },
  { word: "benevolent", pos: "adjective", hindi: "परोपकारी; दयालु", meaning: "kind and wanting to help others", example: "A benevolent neighbour helped us move." },
  { word: "clarity", pos: "noun", hindi: "स्पष्टता", meaning: "the quality of being clear", example: "Writing a plan gives me clarity." },
  { word: "deliberate", pos: "adjective", hindi: "जानबूझकर; सोच-समझकर किया गया", meaning: "done on purpose and with care", example: "Taking a break was a deliberate choice." },
  { word: "endeavour", pos: "noun", hindi: "प्रयास; कोशिश", meaning: "a serious attempt to do something", example: "Learning a language is a long endeavour." },
  { word: "frugal", pos: "adjective", hindi: "मितव्ययी; किफ़ायती", meaning: "careful with money", example: "Being frugal this month helped me save more." },
  { word: "grateful", pos: "adjective", hindi: "आभारी", meaning: "feeling thankful", example: "I am grateful for my supportive friends." },
  { word: "habitual", pos: "adjective", hindi: "आदतन; आदत के रूप में", meaning: "done regularly as a habit", example: "Reading before bed became habitual for me." },
  { word: "inevitable", pos: "adjective", hindi: "अनिवार्य; जिसे टाला न जा सके", meaning: "certain to happen", example: "Mistakes are inevitable when you learn something new." },
  { word: "jubilant", pos: "adjective", hindi: "अत्यंत प्रसन्न; हर्षित", meaning: "feeling great happiness", example: "The team was jubilant after the win." },
  { word: "keen", pos: "adjective", hindi: "उत्सुक; इच्छुक", meaning: "eager and interested", example: "She is keen to learn data engineering." },
  { word: "lucid", pos: "adjective", hindi: "स्पष्ट; आसानी से समझ आने वाला", meaning: "easy to understand", example: "His explanation was short and lucid." },
  { word: "mundane", pos: "adjective", hindi: "साधारण; रोज़मर्रा का", meaning: "ordinary and not exciting", example: "Even mundane tasks feel better with music." },
  { word: "nurture", pos: "verb", hindi: "पालन-पोषण करना; बढ़ावा देना", meaning: "to care for and help grow", example: "Good teachers nurture curiosity." },
  { word: "overwhelm", pos: "verb", hindi: "अभिभूत करना; हावी हो जाना", meaning: "to be too much for someone", example: "A long to-do list can overwhelm you." },
  { word: "punctual", pos: "adjective", hindi: "समय का पाबंद", meaning: "arriving or doing things on time", example: "Be punctual for the 9 am stand-up." },
  { word: "quaint", pos: "adjective", hindi: "पुराने ढंग का पर आकर्षक", meaning: "attractively old-fashioned", example: "We stayed in a quaint little hill town." },
  { word: "reflect", pos: "verb", hindi: "विचार करना; मनन करना", meaning: "to think carefully about something", example: "I reflect on my day for five minutes each night." },
  { word: "steadfast", pos: "adjective", hindi: "दृढ़; अटल", meaning: "firm and not changing", example: "She was steadfast in her goal to get fit." },
  { word: "thrive", pos: "verb", hindi: "फलना-फूलना; ख़ूब बढ़ना", meaning: "to grow and do well", example: "Plants thrive with sunlight and water." },
  { word: "undermine", pos: "verb", hindi: "कमज़ोर करना; नुकसान पहुँचाना", meaning: "to weaken gradually", example: "Lack of sleep can undermine your focus." },
  { word: "vigilant", pos: "adjective", hindi: "सतर्क; चौकस", meaning: "watchful for danger or problems", example: "Stay vigilant about suspicious emails." },
  { word: "wary", pos: "adjective", hindi: "सावधान; शंकित", meaning: "careful because of possible danger", example: "I'm wary of offers that sound too good." },
  { word: "yearn", pos: "verb", hindi: "तरसना; बहुत चाहना", meaning: "to have a strong wish for something", example: "I yearn for a quiet weekend in the mountains." },
  { word: "acknowledge", pos: "verb", hindi: "स्वीकार करना; मानना", meaning: "to accept or admit something", example: "Please acknowledge the email when you get it." },
  { word: "brevity", pos: "noun", hindi: "संक्षिप्तता", meaning: "using few words", example: "Brevity makes a message easier to read." },
  { word: "commence", pos: "verb", hindi: "आरंभ करना; शुरू करना", meaning: "to begin", example: "The training will commence on Monday." },
  { word: "discreet", pos: "adjective", hindi: "विवेकी; बात को गुप्त रखने वाला", meaning: "careful not to cause embarrassment", example: "Please be discreet about the salary details." },
  { word: "elaborate", pos: "verb", hindi: "विस्तार से बताना", meaning: "to explain in more detail", example: "Could you elaborate on your idea?" },
  { word: "fluent", pos: "adjective", hindi: "धाराप्रवाह", meaning: "able to speak smoothly and easily", example: "With daily practice, you'll become fluent." },
  { word: "gradual", pos: "adjective", hindi: "धीरे-धीरे होने वाला; क्रमिक", meaning: "happening slowly over time", example: "Progress is gradual, but it adds up." },
  { word: "hinder", pos: "verb", hindi: "बाधा डालना; रोकना", meaning: "to make something harder", example: "Notifications hinder deep work." },
  { word: "impulsive", pos: "adjective", hindi: "आवेगी; बिना सोचे करने वाला", meaning: "acting without thinking first", example: "I made an impulsive purchase last night." },
  { word: "justify", pos: "verb", hindi: "उचित ठहराना", meaning: "to show that something is right", example: "Can you justify the extra cost?" },
  { word: "lenient", pos: "adjective", hindi: "नरम; उदार", meaning: "not strict", example: "The teacher was lenient about the late homework." },
  { word: "mediocre", pos: "adjective", hindi: "औसत दर्जे का; साधारण", meaning: "only average; not very good", example: "Don't settle for mediocre work." },
  { word: "nostalgia", pos: "noun", hindi: "पुरानी यादों की चाह; अतीत-मोह", meaning: "a happy-sad longing for the past", example: "Old songs fill me with nostalgia." },
  { word: "outcome", pos: "noun", hindi: "परिणाम; नतीजा", meaning: "the result of something", example: "Focus on the process, not just the outcome." },
  { word: "persuade", pos: "verb", hindi: "मनाना; राज़ी करना", meaning: "to convince someone", example: "She persuaded me to join the gym." },
  { word: "refrain", pos: "verb", hindi: "परहेज़ करना; बचना", meaning: "to stop yourself from doing something", example: "Please refrain from using phones in class." },
  { word: "scrutinise", pos: "verb", hindi: "बारीकी से जाँचना", meaning: "to examine closely", example: "Scrutinise the contract before you sign." },
  { word: "tranquil", pos: "adjective", hindi: "शांत; स्थिर", meaning: "calm and peaceful", example: "The lake looked tranquil in the morning." },
  { word: "urgent", pos: "adjective", hindi: "अत्यावश्यक; ज़रूरी", meaning: "needing action now", example: "Only mark a task P1 if it is truly urgent." },
  { word: "valuable", pos: "adjective", hindi: "क़ीमती; मूल्यवान", meaning: "very useful or important", example: "Your time is your most valuable resource." },
  { word: "witty", pos: "adjective", hindi: "हाज़िरजवाब; मज़ाकिया", meaning: "clever and funny", example: "He gave a witty reply that made everyone laugh." },
  { word: "aspire", pos: "verb", hindi: "आकांक्षा रखना; बनने की इच्छा रखना", meaning: "to hope to achieve something", example: "I aspire to lead a data team one day." },
  { word: "composure", pos: "noun", hindi: "संयम; शांतचित्तता", meaning: "the state of being calm", example: "She kept her composure during the tough interview." },
  { word: "dwindle", pos: "verb", hindi: "घटते जाना; कम होना", meaning: "to become smaller over time", example: "My savings dwindle when I eat out daily." },
  { word: "flourish", pos: "verb", hindi: "फलना-फूलना; समृद्ध होना", meaning: "to grow or develop well", example: "Small businesses flourish with loyal customers." },
  { word: "insight", pos: "noun", hindi: "अंतर्दृष्टि; गहरी समझ", meaning: "a deep understanding of something", example: "The data gave us a useful insight." },
  { word: "patience", pos: "noun", hindi: "धैर्य; सब्र", meaning: "the ability to wait calmly", example: "Learning to code takes patience." },
  { word: "routine", pos: "noun", hindi: "दिनचर्या", meaning: "a regular way of doing things", example: "A simple morning routine sets up my day." },
  { word: "vulnerable", pos: "adjective", hindi: "असुरक्षित; कमज़ोर", meaning: "easily hurt or attacked", example: "Weak passwords leave your account vulnerable." },
];

/** Stable word for a given date (YYYY-MM-DD). */
export function wordForDate(date: string): Word {
  const [y, m, d] = date.split("-").map(Number);
  const dayNumber = Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
  return WORDS[((dayNumber % WORDS.length) + WORDS.length) % WORDS.length];
}

/** True when the text contains the word or a close form of it (e.g. "resilience"). */
export function containsWord(text: string, word: string): boolean {
  const stem = word.toLowerCase().slice(0, Math.max(4, word.length - 3));
  return text.toLowerCase().includes(stem);
}

/** A real sentence (3+ words) that uses the word. */
export function sentenceUsesWord(sentence: string, word: string): boolean {
  return sentence.trim().split(/\s+/).length >= 3 && containsWord(sentence, word);
}
