// Standard Secret Words List & Allowed Words
const TARGET_WORDS = [
  "apple", "audio", "beach", "brain", "bread", "cloud", "dance", 
  "dream", "earth", "flame", "fresh", "ghost", "grape", "green", 
  "heart", "house", "light", "lemon", "music", "night", "ocean",
  "plant", "queen", "react", "right", "river", "scene", "shine",
  "slate", "slice", "smart", "space", "spark", "steam", "stone"
  /* ... Paste full 2,309 standard word list here */
];

const ALLOWED_WORDS = Array.from(new Set([...TARGET_WORDS, "adieu", "soare", "salet", "roate", "tarse"]));
