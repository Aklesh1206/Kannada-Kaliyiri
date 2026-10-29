// Standalone on purpose (no imports) so Node can run the tests directly.
// Provides structured, multi-turn guided conversations with Neela when no cloud AI key is configured.
// Ensures every learner can immediately practice one-on-one conversations across key scenarios.

import type { NeelaReply, SuggestedReply } from "./neelaAI";

export type ScenarioInfo = {
  id: string;
  label: string;
  icon: string;
  mission: string;
  description: string;
};

export const SCENARIO_LIST: ScenarioInfo[] = [
  {
    id: "auto-ride",
    label: "Auto ride",
    icon: "🛺",
    mission: "Hail an auto, agree on meter/destination, give directions, and pay with UPI.",
    description: "Everyday Bengaluru auto-rickshaw negotiation & directions in natural Kannada.",
  },
  {
    id: "cafe",
    label: "Darshini / Cafe",
    icon: "☕",
    mission: "Order breakfast and filter coffee, request less sugar, and pay the bill.",
    description: "Ordering food and drinks at a local Karnataka tiffin hotel or darshini.",
  },
  {
    id: "market",
    label: "Market shopping",
    icon: "🛒",
    mission: "Ask prices, choose fresh vegetables, negotiate politely, and complete purchase.",
    description: "Bargaining and buying vegetables and fruits at the local market.",
  },
  {
    id: "friends",
    label: "Making friends",
    icon: "👋",
    mission: "Introduce yourself, say where you live and work, and talk about learning Kannada.",
    description: "Warm, casual introductions and friendly small talk with a Kannada speaker.",
  },
  {
    id: "free",
    label: "Small talk",
    icon: "💬",
    mission: "Casual chit-chat with Neela about food, weather, and daily life in Karnataka.",
    description: "Open-ended friendly conversation with Neela.",
  },
];

type DialogueStep = {
  reply: { kn: string; tr: string; en: string };
  suggestions: SuggestedReply[];
  tip?: string;
  correctionWhy?: string;
  completed?: boolean;
};

type ScenarioDialogue = {
  steps: DialogueStep[];
};

const DIALOGUES: Record<string, ScenarioDialogue> = {
  "auto-ride": {
    steps: [
      {
        reply: {
          kn: "ನಮಸ್ಕಾರ! ಎಲ್ಲಿಗೆ ಹೋಗ್ಬೇಕು ಸರ್/ಮೇಡಂ?",
          tr: "Namaskara! Ellige hogabeku sir/madam?",
          en: "Hello! Where do you need to go sir/madam?",
        },
        suggestions: [
          { kn: "ಎಂ ಜಿ ರೋಡ್‌ಗೆ ಹೋಗ್ತೀರಾ?", tr: "MG Road-ge hogtira?", en: "Will you go to MG Road?" },
          { kn: "ಇಂದಿರಾನಗರಕ್ಕೆ ಹೋಗ್ಬೇಕು", tr: "Indiranagarakke hogabeku", en: "I need to go to Indiranagar" },
          { kn: "ಮೆಜೆಸ್ಟಿಕ್‌ಗೆ ಬರ್ತೀರಾ?", tr: "Majestic-ge bartira?", en: "Will you come to Majestic?" },
        ],
        tip: "In Bengaluru, 'ಹೋಗ್ತೀರಾ?' (hogtira? - will you go?) is the standard polite way to ask an auto driver.",
      },
      {
        reply: {
          kn: "ಹೌದು, ಹೋಗ್ತೀನಿ. ಬನ್ನಿ ಕೂತ್ಕೊಳ್ಳಿ, ಮೀಟರ್ ಹಾಕ್ತೀನಿ.",
          tr: "Haudu, hogtini. Banni kootkolli, meter haaktini.",
          en: "Yes, I will go. Please get in, I will turn on the meter.",
        },
        suggestions: [
          { kn: "ಸರಿ, ಧನ್ಯವಾದಗಳು", tr: "Sari, dhanyavaadagalu", en: "Okay, thank you" },
          { kn: "ಸ್ವಲ್ಪ ಬೇಗ ಹೋಗಿ", tr: "Svalpa bega hogi", en: "Please go a little quickly" },
          { kn: "ಮುಂದೆ ಸಿಗ್ನಲ್‌ನಲ್ಲಿ ರೈಟ್", tr: "Munde signal-nalli right", en: "Right at the signal ahead" },
        ],
        tip: "'ಮೀಟರ್ ಹಾಕಿ' (meter haaki) means 'please put the meter'. Bengaluru autos are metered.",
      },
      {
        reply: {
          kn: "ಸರಿ. ಮುಂದೆ ಲೆಫ್ಟ್ ತಗೋಬೇಕಾ ಅಥವಾ ನೇರವಾಗಿ ಹೋಗ್ಬೇಕಾ?",
          tr: "Sari. Munde left tagobeka athava neravaagi hogabeka?",
          en: "Okay. Ahead, should I take a left or go straight?",
        },
        suggestions: [
          { kn: "ನೇರವಾಗಿ ಹೋಗಿ", tr: "Neravaagi hogi", en: "Go straight" },
          { kn: "ಮುಂದೆ ಲೆಫ್ಟ್ ತಗೊಳ್ಳಿ", tr: "Munde left tagolli", en: "Take left ahead" },
          { kn: "ಸಿಗ್ನಲ್ ಹತ್ತಿರ ರೈಟ್", tr: "Signal hattira right", en: "Right near the signal" },
        ],
        tip: "Direction words: ಲೆಫ್ಟ್ / ಎಡಕ್ಕೆ (left), ರೈಟ್ / ಬಲಕ್ಕೆ (right), ನೇರ (straight).",
      },
      {
        reply: {
          kn: "ಬಂತು ನೋಡಿ. ಇಲ್ಲಿ ನಿಲ್ಲಿಸಲಾ ಅಥವಾ ಗೇಟ್ ಹತ್ತಿರ ಹೋಗ್ಲಾ?",
          tr: "Bantu nodi. Illi nillisala athava gate hattira hogla?",
          en: "Here we are. Should I stop here or go near the gate?",
        },
        suggestions: [
          { kn: "ಇಲ್ಲಿಯೇ ನಿಲ್ಲಿಸಿ, ಎಷ್ಟು ಆಯ್ತು?", tr: "Illiye nillisi, eshtu aaytu?", en: "Stop right here, how much is it?" },
          { kn: "ಗೇಟ್ ಹತ್ತಿರ ನಿಲ್ಲಿಸಿ", tr: "Gate hattira nillisi", en: "Please stop near the gate" },
          { kn: "ಎಷ್ಟು ಕೊಡಬೇಕು?", tr: "Eshtu kodabeku?", en: "How much should I give?" },
        ],
        tip: "'ಇಲ್ಲಿ ನಿಲ್ಲಿಸಿ' (illi nillisi) = 'stop here'. A phrase you will use in every ride!",
      },
      {
        reply: {
          kn: "ಮೀಟರ್ ಪ್ರಕಾರ ಐವತ್ತು ರೂಪಾಯಿ ಆಯ್ತು.",
          tr: "Meter prakaara aivattu roopaayi aaytu.",
          en: "According to the meter, it is 50 rupees.",
        },
        suggestions: [
          { kn: "ಆನ್‌ಲೈನ್ / UPI ಮಾಡ್ತೀನಿ, ಕ್ಯೂಆರ್ ಕೋಡ್ ಕೊಡಿ", tr: "Online / UPI maadtini, QR code kodi", en: "I will pay online / UPI, give QR code" },
          { kn: "ತಗೊಳ್ಳಿ, ಐವತ್ತು ರೂಪಾಯಿ", tr: "Tagolli, aivattu roopaayi", en: "Here, take fifty rupees" },
          { kn: "ಚಿಲ್ಲರೆ ಇದೆಯಾ?", tr: "Chillare ideya?", en: "Do you have change?" },
        ],
        tip: "'ಚಿಲ್ಲರೆ' (chillare) means loose change or coins.",
      },
      {
        reply: {
          kn: "ಹಣ ಬಂತು, ತುಂಬಾ ಧನ್ಯವಾದಗಳು! ಶುಭ ದಿನ!",
          tr: "Hana bantu, tumba dhanyavaadagalu! Shubha dina!",
          en: "Payment received, thank you very much! Have a good day!",
        },
        suggestions: [
          { kn: "ಧನ್ಯವಾದಗಳು, ಬರ್ತೀನಿ!", tr: "Dhanyavaadagalu, bartini!", en: "Thank you, bye!" },
        ],
        tip: "'ಬರ್ತೀನಿ' (bartini) literally means 'I will come', which is the traditional Kannada way to say 'goodbye'.",
        completed: true,
      },
    ],
  },
  cafe: {
    steps: [
      {
        reply: {
          kn: "ನಮಸ್ಕಾರ! ಬಿಸಿ ಬಿಸಿ ತಿಂಡಿ ರೆಡಿ ಇದೆ. ಏನು ಕೊಡ್ಲಿ?",
          tr: "Namaskara! Bisi bisi tindi ready ide. Enu kodli?",
          en: "Hello! Hot breakfast is ready. What can I get for you?",
        },
        suggestions: [
          { kn: "ಒಂದು ಮಸಾಲ ದೋಸೆ ಕೊಡಿ", tr: "Ondu masala dose kodi", en: "Give one masala dosa" },
          { kn: "ಇಡ್ಲಿ ವಡೆ ಮತ್ತು ಫಿಲ್ಟರ್ ಕಾಫಿ ಕೊಡಿ", tr: "Idli vade mattu filter coffee kodi", en: "Give idli vada and filter coffee" },
          { kn: "ಇವತ್ತು ಸ್ಪೆಷಲ್ ಏನು?", tr: "Ivattu special enu?", en: "What is the special today?" },
        ],
        tip: "'ಕೊಡಿ' (kodi) is the polite imperative for 'give'. For friends, you might hear 'ಕೊಡು' (kodu).",
      },
      {
        reply: {
          kn: "ಸರಿ! ಇಲ್ಲಿಯೇ ತಿಂತೀರಾ ಅಥವಾ ಪಾರ್ಸಲ್ ಬೇಕಾ?",
          tr: "Sari! Illiye tintira athava parcel beka?",
          en: "Sure! Will you eat here or do you need a parcel/takeaway?",
        },
        suggestions: [
          { kn: "ಇಲ್ಲಿಯೇ ತಿಂತೀನಿ", tr: "Illiye tintini", en: "I will eat here itself" },
          { kn: "ಪಾರ್ಸಲ್ ಕಟ್ಟಿ ಕೊಡಿ", tr: "Parcel katti kodi", en: "Please pack it for takeaway" },
          { kn: "ಜೊತೆಗೆ ಒಂದು ಫಿಲ್ಟರ್ ಕಾಫಿ ಬೇಕು", tr: "Jotege ondu filter coffee beku", en: "Along with that I need a filter coffee" },
        ],
        tip: "'-ಯೇ' is an emphatic suffix: 'ಇಲ್ಲಿ' (here) -> 'ಇಲ್ಲಿಯೇ' (right here).",
      },
      {
        reply: {
          kn: "ಆಯಿತು. ಕಾಫಿಗೆ ಸಕ್ಕರೆ ಎಷ್ಟು ಹಾಕ್ಲಿ?",
          tr: "Aayitu. Coffee-ge sakkare eshtu haakli?",
          en: "Understood. How much sugar should I put in the coffee?",
        },
        suggestions: [
          { kn: "ಸ್ವಲ್ಪ ಸಕ್ಕರೆ ಹಾಕಿ", tr: "Svalpa sakkare haaki", en: "Put a little sugar" },
          { kn: "ಸಕ್ಕರೆ ಬೇಡ", tr: "Sakkare beda", en: "No sugar" },
          { kn: "ಮೀಡಿಯಂ ಸಕ್ಕರೆ ಕೊಡಿ", tr: "Medium sakkare kodi", en: "Give medium sugar" },
        ],
        tip: "'ಬೇಕು' (beku) = want/need; 'ಬೇಡ' (beda) = do not want.",
      },
      {
        reply: {
          kn: "ತಗೊಳ್ಳಿ, ನಿಮ್ಮ ಮಸಾಲ ದೋಸೆ ಮತ್ತು ಕಾಫಿ! ಒಟ್ಟು ಎಪ್ಪತ್ತೈದು ರೂಪಾಯಿ ಆಯ್ತು.",
          tr: "Tagolli, nimma masala dose mattu coffee! Ottu eppattaidu roopaayi aaytu.",
          en: "Here you go, your masala dosa and coffee! Total is 75 rupees.",
        },
        suggestions: [
          { kn: "ಆನ್‌ಲೈನ್ ಪೇ ಮಾಡ್ತೀನಿ", tr: "Online pay maadtini", en: "I will pay online" },
          { kn: "ತಗೊಳ್ಳಿ ನೂರು ರೂಪಾಯಿ, ಚಿಲ್ಲರೆ ಕೊಡಿ", tr: "Tagolli nooru roopaayi, chillare kodi", en: "Take 100 rupees, please give change" },
          { kn: "ತುಂಬಾ ರುಚಿಯಾಗಿದೆ!", tr: "Tumba ruchiyaagide!", en: "It is very tasty!" },
        ],
        tip: "'ರುಚಿಯಾಗಿದೆ' (ruchiyaagide) = 'it is tasty/delicious'. Kitchen staff will appreciate hearing this!",
      },
      {
        reply: {
          kn: "ಹಣ ಬಂತು. ತುಂಬಾ ಧನ್ಯವಾದಗಳು, ತಿಂಡಿ ಎಂಜಾಯ್ ಮಾಡಿ! ಮತ್ತೆ ಬನ್ನಿ!",
          tr: "Hana bantu. Tumba dhanyavaadagalu, tindi enjoy maadi! Matte banni!",
          en: "Payment received. Thank you very much, enjoy your breakfast! Come again!",
        },
        suggestions: [
          { kn: "ಖಂಡಿತ, ಧನ್ಯವಾದಗಳು!", tr: "Khandita, dhanyavaadagalu!", en: "Definitely, thank you!" },
        ],
        tip: "'ಮತ್ತೆ ಬನ್ನಿ' (matte banni) means 'come again'.",
        completed: true,
      },
    ],
  },
  market: {
    steps: [
      {
        reply: {
          kn: "ಬನ್ನಿ ಬನ್ನಿ! ಇವತ್ತು ಹಳ್ಳಿ ಕಡೆಯಿಂದ ತಾಜಾ ತರಕಾರಿ ಬಂದಿದೆ. ಏನು ತಗೊಳ್ತೀರಿ?",
          tr: "Banni banni! Ivattu halli kadeyinda taaja tarakaari bandide. Enu tagoltiri?",
          en: "Welcome! Today fresh vegetables arrived from the village. What will you take?",
        },
        suggestions: [
          { kn: "ಟೊಮೇಟೊ ಒಂದು ಕೆಜಿ ಎಷ್ಟು?", tr: "Tomato ondu kg eshtu?", en: "How much is one kg of tomatoes?" },
          { kn: "ಈರುಳ್ಳಿ ಮತ್ತು ಆಲೂಗಡ್ಡೆ ಇದೆಯಾ?", tr: "Eerulli mattu aaloogadde ideya?", en: "Do you have onions and potatoes?" },
          { kn: "ತಾಜಾ ಸೊಪ್ಪು ಯಾವುದು ಇದೆ?", tr: "Taaja soppu yaavudu ide?", en: "Which fresh leafy greens do you have?" },
        ],
        tip: "'ತಾಜಾ' (taaja) = fresh. 'ಎಷ್ಟು?' (eshtu?) = how much?",
      },
      {
        reply: {
          kn: "ಟೊಮೇಟೊ ಕೆಜಿಗೆ ಮೂವತ್ತು ರೂಪಾಯಿ. ತುಂಬಾ ಗಟ್ಟಿ ಮತ್ತು ತಾಜಾ ಇದೆ!",
          tr: "Tomato kg-ge moovattu roopaayi. Tumba gatti mattu taaja ide!",
          en: "Tomatoes are 30 rupees a kg. Very firm and fresh!",
        },
        suggestions: [
          { kn: "ಸ್ವಲ್ಪ ಕಡಿಮೆ ಮಾಡಿ, ಎರಡು ಕೆಜಿ ತಗೊಳ್ತೀನಿ", tr: "Svalpa kadime maadi, eradu kg tagoltini", en: "Reduce a little, I will take 2 kg" },
          { kn: "ಒಂದು ಕೆಜಿ ಕೊಡಿ", tr: "Ondu kg kodi", en: "Give one kg" },
          { kn: "ಅರ್ಧ ಕೆಜಿ ಸಾಕು", tr: "Ardha kg saaku", en: "Half a kg is enough" },
        ],
        tip: "'ಸ್ವಲ್ಪ ಕಡಿಮೆ ಮಾಡಿ' (svalpa kadime maadi) is polite bargaining: 'please reduce a little'.",
      },
      {
        reply: {
          kn: "ಸರಿ, ನೀವು ರೆಗ್ಯುಲರ್ ಕಸ್ಟಮರ್! ಎರಡು ಕೆಜಿಗೆ ಐವತ್ತು ರೂಪಾಯಿ ಕೊಡಿ ಸಾಕು.",
          tr: "Sari, neevu regular customer! Eradu kg-ge aivattu roopaayi kodi saaku.",
          en: "Alright, you are a regular customer! Give 50 rupees for 2 kg, that's enough.",
        },
        suggestions: [
          { kn: "ಧನ್ಯವಾದಗಳು! ಜೊತೆಗೆ ಸ್ವಲ್ಪ ಕೊತ್ತಂಬರಿ ಸೊಪ್ಪು ಹಾಕಿ", tr: "Dhanyavaadagalu! Jotege svalpa kottambari soppu haaki", en: "Thank you! Also put some coriander leaves" },
          { kn: "ಸರಿ, ಒಂದು ಕವರ್‌ನಲ್ಲಿ ಹಾಕಿ ಕೊಡಿ", tr: "Sari, ondu cover-nalli haaki kodi", en: "Okay, please pack it in a bag" },
          { kn: "ಒಟ್ಟು ಎಷ್ಟು ಕೊಡಬೇಕು?", tr: "Ottu eshtu kodabeku?", en: "How much total should I give?" },
        ],
        tip: "Vendors often add 'ಸ್ವಲ್ಪ ಕೊತ್ತಂಬರಿ ಸೊಪ್ಪು' (a little coriander) for free if you ask nicely!",
      },
      {
        reply: {
          kn: "ಕೊತ್ತಂಬರಿ ಸೊಪ್ಪು ಫ್ರೀಯಾಗಿ ಹಾಕಿದ್ದೀನಿ! ಬ್ಯಾಗ್ ತಗೊಳ್ಳಿ. ಒಟ್ಟು ಐವತ್ತು ರೂಪಾಯಿ.",
          tr: "Kottambari soppu free-yaagi haakiddini! Bag tagolli. Ottu aivattu roopaayi.",
          en: "I put coriander leaves for free! Take the bag. Total fifty rupees.",
        },
        suggestions: [
          { kn: "ಕ್ಯೂಆರ್ ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡ್ತೀನಿ", tr: "QR code scan maadtini", en: "I will scan the QR code" },
          { kn: "ತಗೊಳ್ಳಿ ಐವತ್ತು ರೂಪಾಯಿ", tr: "Tagolli aivattu roopaayi", en: "Here is fifty rupees" },
          { kn: "ತುಂಬಾ ಧನ್ಯವಾದಗಳು!", tr: "Tumba dhanyavaadagalu!", en: "Thank you very much!" },
        ],
        tip: "'ಹಾಕಿದ್ದೀನಿ' (haakiddini) = 'I have put/added'.",
      },
      {
        reply: {
          kn: "ಧನ್ಯವಾದಗಳು! ನಾಳೆ ತಾಜಾ ಹಣ್ಣುಗಳು ಬರುತ್ತೆ, ಮತ್ತೆ ಬನ್ನಿ!",
          tr: "Dhanyavaadagalu! Naale taaja hannugalu barutte, matte banni!",
          en: "Thank you! Tomorrow fresh fruits will arrive, come again!",
        },
        suggestions: [
          { kn: "ಖಂಡಿತ ಬರ್ತೀನಿ, ನಮಸ್ಕಾರ!", tr: "Khandita bartini, namaskara!", en: "Definitely I will come, goodbye!" },
        ],
        tip: "'ನಾಳೆ' (naale) = tomorrow; 'ಇವತ್ತು' (ivattu) = today; 'ನಿನ್ನೆ' (ninne) = yesterday.",
        completed: true,
      },
    ],
  },
  friends: {
    steps: [
      {
        reply: {
          kn: "ನಮಸ್ಕಾರ! ನನ್ನ ಹೆಸರು ನೀಲಾ. ನಿಮ್ಮ ಹೆಸರು ಏನು?",
          tr: "Namaskara! Nanna hesaru Neela. Nimma hesaru enu?",
          en: "Hello! My name is Neela. What is your name?",
        },
        suggestions: [
          { kn: "ನನ್ನ ಹೆಸರು ರಾಹುಲ್, ನಿಮ್ಮನ್ನು ಭೇಟಿಯಾಗಿದ್ದು ಸಂತೋಷ", tr: "Nanna hesaru Rahul, nimmannu bhetiyaagiddu santoshat", en: "My name is Rahul, pleased to meet you" },
          { kn: "ನನ್ನ ಹೆಸರು ಅರುಣ್, ನೀವು ಹೇಗಿದ್ದೀರಿ?", tr: "Nanna hesaru Arun, neevu hegiddiri?", en: "My name is Arun, how are you?" },
          { kn: "ನಮಸ್ಕಾರ ನೀಲಾ, ಚೆನ್ನಾಗಿದ್ದೀರಾ?", tr: "Namaskara Neela, chennaagiddira?", en: "Hello Neela, are you doing well?" },
        ],
        tip: "'ನಿಮ್ಮ ಹೆಸರು ಏನು?' (nimma hesaru enu?) = 'What is your name?'. 'ನನ್ನ ಹೆಸರು...' (nanna hesaru...) = 'My name is...'.",
      },
      {
        reply: {
          kn: "ನಿಮ್ಮನ್ನು ಭೇಟಿಯಾಗಿದ್ದು ತುಂಬಾ ಸಂತೋಷ! ನೀವು ಎಲ್ಲಿ ಇರೋದು?",
          tr: "Nimmannu bhetiyaagiddu tumba santoshat! Neevu elli irodu?",
          en: "Very glad to meet you! Where do you stay?",
        },
        suggestions: [
          { kn: "ನಾನು ಬೆಂಗಳೂರಿನಲ್ಲಿ ಇರ್ತೀನಿ", tr: "Naanu Bengalurinalli irtini", en: "I stay in Bengaluru" },
          { kn: "ನಾನು ಕೋರಮಂಗಲದಲ್ಲಿ ವಾಸ ಮಾಡ್ತೀನಿ", tr: "Naanu Koramangaladalli vaasa maadtini", en: "I live in Koramangala" },
          { kn: "ನಾನು ಹೊಸದಾಗಿ ಇಲ್ಲಿಗೆ ಬಂದಿದ್ದೀನಿ", tr: "Naanu hosadaagi illige bandiddini", en: "I came here recently" },
        ],
        tip: "Location suffix '-ನಲ್ಲಿ' (-nalli) means 'in' (e.g. ಬೆಂಗಳೂರು -> ಬೆಂಗಳೂರಿನಲ್ಲಿ = in Bengaluru).",
      },
      {
        reply: {
          kn: "ಓಹ್ ಹೌದಾ! ನೀವು ಕನ್ನಡ ತುಂಬಾ ಚೆನ್ನಾಗಿ ಮಾತಾಡ್ತೀರಲ್ಲ!",
          tr: "Oh hauda! Neevu Kannada tumba chennaagi maataadtiralla!",
          en: "Oh really! You speak Kannada so nicely!",
        },
        suggestions: [
          { kn: "ಧನ್ಯವಾದಗಳು! ನಾನು ಈಗಷ್ಟೇ ಕಲಿಯುತ್ತಿದ್ದೇನೆ", tr: "Dhanyavaadagalu! Naanu eegashte kaliyuttiddene", en: "Thank you! I am just learning now" },
          { kn: "ಸ್ವಲ್ಪ ಸ್ವಲ್ಪ ಕನ್ನಡ ಬರುತ್ತೆ", tr: "Svalpa svalpa Kannada barutte", en: "I know a little bit of Kannada" },
          { kn: "ನನಗೆ ಕನ್ನಡ ಕಲಿಯಲು ತುಂಬಾ ಇಷ್ಟ", tr: "Nanage Kannada kaliyalu tumba ishta", en: "I really like learning Kannada" },
        ],
        tip: "'ಸ್ವಲ್ಪ ಸ್ವಲ್ಪ' (svalpa svalpa) = 'a little bit'. A humble and beloved phrase among Kannada speakers!",
      },
      {
        reply: {
          kn: "ತುಂಬಾ ಹೆಮ್ಮೆ! ಕನ್ನಡಿಗರು ಹೊಸಬರು ಕನ್ನಡ ಕಲಿಯೋದನ್ನ ತುಂಬಾ ಇಷ್ಟಪಡ್ತಾರೆ.",
          tr: "Tumba hemme! Kannadigaru hosabaru Kannada kaliyodanna tumba ishtapadtaare.",
          en: "Very proud! Kannadigas really love when newcomers learn Kannada.",
        },
        suggestions: [
          { kn: "ಹೌದು, ಇಲ್ಲಿ ಎಲ್ಲರೂ ತುಂಬಾ ಸಹಾಯ ಮಾಡ್ತಾರೆ", tr: "Haudu, illi ellaroo tumba sahaaya maadtaare", en: "Yes, everyone here is very helpful" },
          { kn: "ದಿನಾಲೂ ಪ್ರಾಕ್ಟೀಸ್ ಮಾಡ್ತೀನಿ", tr: "Dinaaloo practice maadtini", en: "I practice daily" },
          { kn: "ನಿಮ್ಮ ಜೊತೆ ಮಾತಾಡಿದ್ದು ಖುಷಿ ಆಯ್ತು", tr: "Nimma jote maataadiddu khushi aaytu", en: "Happy talking with you" },
        ],
        tip: "'ಸಹಾಯ' (sahaaya) means help. 'ದಿನಾಲೂ' (dinaaloo) means every day.",
      },
      {
        reply: {
          kn: "ಖಂಡಿತ! ಹೀಗೆಯೇ ಅಭ್ಯಾಸ ಮುಂದುವರಿಸಿ. ಮತ್ತೆ ಸಿಗೋಣ, ಬಾಯ್!",
          tr: "Khandita! Higeeye abhyaasa munduvarisi. Matte sigona, bye!",
          en: "Definitely! Keep practicing like this. See you again, bye!",
        },
        suggestions: [
          { kn: "ಮತ್ತೆ ಸಿಗೋಣ, ಶುಭ ದಿನ!", tr: "Matte sigona, shubha dina!", en: "See you again, have a good day!" },
        ],
        tip: "'ಮತ್ತೆ ಸಿಗೋಣ' (matte sigona) = 'let's meet again / see you'.",
        completed: true,
      },
    ],
  },
  free: {
    steps: [
      {
        reply: {
          kn: "ನಮಸ್ಕಾರ! ಇವತ್ತು ನಿಮ್ಮ ದಿನ ಹೇಗಿತ್ತು?",
          tr: "Namaskara! Ivattu nimma dina hegittu?",
          en: "Hello! How was your day today?",
        },
        suggestions: [
          { kn: "ತುಂಬಾ ಚೆನ್ನಾಗಿತ್ತು, ಧನ್ಯವಾದಗಳು", tr: "Tumba chennaagittu, dhanyavaadagalu", en: "It was very good, thank you" },
          { kn: "ಸ್ವಲ್ಪ ಬ್ಯುಸಿ ಇತ್ತು", tr: "Svalpa busy ittu", en: "It was a little busy" },
          { kn: "ನಿಮ್ಮ ದಿನ ಹೇಗಿತ್ತು ನೀಲಾ?", tr: "Nimma dina hegittu Neela?", en: "How was your day Neela?" },
        ],
        tip: "'ಹೇಗಿತ್ತು?' (hegittu?) = 'how was it?'. 'ಚೆನ್ನಾಗಿತ್ತು' (chennaagittu) = 'it was good'.",
      },
      {
        reply: {
          kn: "ನನ್ನ ದಿನವೂ ಚೆನ್ನಾಗಿತ್ತು! ಇವತ್ತು ಬೆಂಗಳೂರಿನ ಹವಾಮಾನ ಹೇಗಿದೆ ನಿಮ್ಮ ಕಡೆ?",
          tr: "Nanna dinavoo chennaagittu! Ivattu Bengalurina havaamaana hegide nimma kade?",
          en: "My day was good too! How is Bengaluru's weather today on your side?",
        },
        suggestions: [
          { kn: "ತುಂಬಾ ತಂಪಾಗಿದೆ, ಮಳೆ ಬರ್ತಿದೆ", tr: "Tumba tampaagide, male bartide", en: "It is very cool, it is raining" },
          { kn: "ಸ್ವಲ್ಪ ಬಿಸಿಲಿದೆ", tr: "Svalpa bisilide", en: "It is a little sunny" },
          { kn: "ಹವಾಮಾನ ತುಂಬಾ ಚೆನ್ನಾಗಿದೆ", tr: "Havaamaana tumba chennaagide", en: "The weather is very pleasant" },
        ],
        tip: "'ಮಳೆ' (male) = rain; 'ಬಿಸಿಲು' (bisilu) = sunshine/heat; 'ತಂಪು' (tampu) = cool.",
      },
      {
        reply: {
          kn: "ಬೆಂಗಳೂರು ಹವಾಮಾನ ಯಾವಾಗಲೂ ಸೂಪರ್! ಊಟ ಆಯ್ತಾ ನಿಮ್ಮದು?",
          tr: "Bengaluru havaamaana yaavaagaloo super! Oota aayta nimmadu?",
          en: "Bengaluru weather is always super! Did you have your food/meal?",
        },
        suggestions: [
          { kn: "ಹೌದು, ಊಟ ಆಯ್ತು. ನಿಮ್ಮದು?", tr: "Haudu, oota aaytu. Nimmadu?", en: "Yes, had food. Yours?" },
          { kn: "ಇನ್ನೂ ಇಲ್ಲ, ಈಗ ಮಾಡ್ಬೇಕು", tr: "Innoo illa, eega maadabeku", en: "Not yet, have to eat now" },
          { kn: "ಇವತ್ತು ಮಧ್ಯಾಹ್ನ ದೋಸೆ ತಿಂದೆ", tr: "Ivattu madhyaahna dose tinde", en: "I ate dosa this afternoon" },
        ],
        tip: "'ಊಟ ಆಯ್ತಾ?' (Oota aayta?) is the most common, caring daily greeting in Karnataka, like 'Did you eat?'.",
      },
      {
        reply: {
          kn: "ಹೌದು, ನನಗೂ ಹೊಟ್ಟೆ ತುಂಬಾ ಊಟ ಆಯ್ತು! ನೀವು ಕನ್ನಡ ಚೆನ್ನಾಗಿ ಮಾತಾಡ್ತಿದ್ದೀರಿ.",
          tr: "Haudu, nanagoo hotte tumba oota aaytu! Neevu Kannada chennaagi maataadtiddiri.",
          en: "Yes, I also had my fill of food! You are speaking Kannada very well.",
        },
        suggestions: [
          { kn: "ನಿಮ್ಮ ಸಹಾಯಕ್ಕೆ ಧನ್ಯವಾದಗಳು ನೀಲಾ", tr: "Nimma sahaayakke dhanyavaadagalu Neela", en: "Thank you for your help Neela" },
          { kn: "ನನಗೆ ಇನ್ನಷ್ಟು ಕಲಿಯಬೇಕು", tr: "Nanage innashtu kaliyabeku", en: "I want to learn more" },
        ],
        tip: "'ಹೊಟ್ಟೆ ತುಂಬಾ' (hotte tumba) = 'stomach full'.",
      },
      {
        reply: {
          kn: "ಸಂತೋಷ! ಪ್ರತಿದಿನ ಹೀಗೆಯೇ ೫ ನಿಮಿಷ ಕನ್ನಡ ಮಾತಾಡಿ. ಶುಭ ರಾತ್ರಿ, ಮತ್ತೆ ಸಿಗೋಣ!",
          tr: "Santosha! Pratidina higeeye 5 nimisha Kannada maataadi. Shubha raatri, matte sigona!",
          en: "Delighted! Speak Kannada for 5 minutes like this every day. Good night, see you again!",
        },
        suggestions: [
          { kn: "ಶುಭ ರಾತ್ರಿ, ಮತ್ತೆ ಸಿಗೋಣ!", tr: "Shubha raatri, matte sigona!", en: "Good night, see you again!" },
        ],
        tip: "'ಶುಭ ರಾತ್ರಿ' (shubha raatri) = 'good night'.",
        completed: true,
      },
    ],
  },
};

/**
 * Returns the guided offline reply for a given scenario and turn index.
 * Turn 0 is Neela's initial message when entering the scenario.
 */
export function getOfflineReply(scenario: string, turnIndex: number, userText?: string): NeelaReply {
  const normScenario = scenario in DIALOGUES ? scenario : "free";
  const diag = DIALOGUES[normScenario] ?? DIALOGUES.free;
  const safeIndex = Math.max(0, Math.min(turnIndex, diag.steps.length - 1));
  const step = diag.steps[safeIndex];

  let correction: NeelaReply["correction"] = null;

  // If user provided input, check if they typed English or need a gentle nudge
  if (userText && userText.trim()) {
    const text = userText.trim();
    // If the input was predominantly English alphabet and lacks Kannada script
    const hasKannada = /[ಀ-೿]/.test(text);
    if (!hasKannada && /^[a-zA-Z0-9\s?!.,'"]+$/.test(text) && text.length > 2) {
      // Suggest one of the scenario Kannada alternatives
      const preferred = step.suggestions[0];
      if (preferred) {
        correction = {
          said: text,
          kn: preferred.kn,
          tr: preferred.tr,
          en: preferred.en,
          why: "Try saying it in Kannada to build your spoken fluency!",
        };
      }
    }
  }

  return {
    reply: { ...step.reply },
    suggestions: step.suggestions.map((s) => ({ ...s })),
    correction,
    tip: step.tip ?? null,
    completed: Boolean(step.completed),
  };
}

export function getTotalSteps(scenario: string): number {
  const normScenario = scenario in DIALOGUES ? scenario : "free";
  return DIALOGUES[normScenario]?.steps.length ?? 5;
}
