"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

interface EmojiEntry {
  emoji: string
  keywords: string[]
}

interface EmojiCategory {
  id: string
  label: string
  icon: string
  emojis: EmojiEntry[]
}

const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: "caras",
    label: "Caras",
    icon: "😀",
    emojis: [
      { emoji: "😀", keywords: ["grinning", "smile", "happy"] },
      { emoji: "😃", keywords: ["grinning", "big eyes", "happy"] },
      { emoji: "😄", keywords: ["grinning", "smile", "happy", "eyes"] },
      { emoji: "😁", keywords: ["beaming", "grin", "happy"] },
      { emoji: "😆", keywords: ["laughing", "satisfied", "happy"] },
      { emoji: "😅", keywords: ["sweat", "smile", "relief"] },
      { emoji: "🤣", keywords: ["rolling", "laughing", "floor"] },
      { emoji: "😂", keywords: ["joy", "tears", "laughing"] },
      { emoji: "🙂", keywords: ["slightly smiling", "content"] },
      { emoji: "😊", keywords: ["blush", "smile", "happy", "warm"] },
      { emoji: "😇", keywords: ["angel", "halo", "innocent"] },
      { emoji: "🥰", keywords: ["love", "hearts", "adore"] },
      { emoji: "😍", keywords: ["heart eyes", "love", "crush"] },
      { emoji: "🤩", keywords: ["star struck", "excited", "wow"] },
      { emoji: "😘", keywords: ["kiss", "love", "blowing"] },
      { emoji: "😗", keywords: ["kiss", "whistling"] },
      { emoji: "😋", keywords: ["yummy", "delicious", "tongue"] },
      { emoji: "😛", keywords: ["tongue", "playful"] },
      { emoji: "😜", keywords: ["wink", "tongue", "playful"] },
      { emoji: "🤪", keywords: ["zany", "crazy", "wild"] },
      { emoji: "😝", keywords: ["tongue", "squinting", "playful"] },
      { emoji: "🤑", keywords: ["money", "rich", "dollar"] },
      { emoji: "🤗", keywords: ["hugging", "warm", "embrace"] },
      { emoji: "🤭", keywords: ["giggle", "cover mouth", "shy"] },
      { emoji: "🤫", keywords: ["shush", "quiet", "secret"] },
      { emoji: "🤔", keywords: ["thinking", "hmm", "consider"] },
      { emoji: "🤐", keywords: ["zipper", "mouth", "silent"] },
      { emoji: "😐", keywords: ["neutral", "blank", "meh"] },
      { emoji: "😑", keywords: ["expressionless", "blank"] },
      { emoji: "😶", keywords: ["no mouth", "silent", "speechless"] },
      { emoji: "😏", keywords: ["smirk", "sly", "suggestive"] },
      { emoji: "😒", keywords: ["unamused", "bored", "annoyed"] },
      { emoji: "🙄", keywords: ["eye roll", "annoyed", "whatever"] },
      { emoji: "😬", keywords: ["grimace", "awkward", "nervous"] },
      { emoji: "🤥", keywords: ["lying", "pinocchio", "liar"] },
      { emoji: "😌", keywords: ["relieved", "calm", "peaceful"] },
      { emoji: "😔", keywords: ["pensive", "sad", "thoughtful"] },
      { emoji: "😪", keywords: ["sleepy", "tired", "tear"] },
      { emoji: "🤤", keywords: ["drooling", "hungry", "desire"] },
      { emoji: "😴", keywords: ["sleeping", "zzz", "tired"] },
      { emoji: "😷", keywords: ["mask", "sick", "medical"] },
      { emoji: "🤒", keywords: ["thermometer", "sick", "fever"] },
      { emoji: "🤕", keywords: ["bandage", "hurt", "injured"] },
      { emoji: "🤢", keywords: ["nauseous", "sick", "green"] },
      { emoji: "🤮", keywords: ["vomit", "sick", "disgusted"] },
      { emoji: "🥵", keywords: ["hot", "sweating", "overheated"] },
      { emoji: "🥶", keywords: ["cold", "freezing", "frozen"] },
      { emoji: "🥴", keywords: ["woozy", "dizzy", "drunk"] },
      { emoji: "😵", keywords: ["dizzy", "knocked out", "spiral"] },
      { emoji: "🤯", keywords: ["exploding head", "mind blown", "shocked"] },
      { emoji: "🤠", keywords: ["cowboy", "hat", "western"] },
      { emoji: "🥳", keywords: ["party", "celebration", "birthday"] },
      { emoji: "🥸", keywords: ["disguise", "glasses", "nose"] },
      { emoji: "😎", keywords: ["cool", "sunglasses", "confident"] },
      { emoji: "🤓", keywords: ["nerd", "glasses", "smart"] },
      { emoji: "🧐", keywords: ["monocle", "curious", "inspect"] },
      { emoji: "😕", keywords: ["confused", "unsure", "puzzled"] },
      { emoji: "😟", keywords: ["worried", "concerned", "anxious"] },
      { emoji: "🙁", keywords: ["frowning", "sad", "disappointed"] },
      { emoji: "😮", keywords: ["open mouth", "surprised", "wow"] },
      { emoji: "😯", keywords: ["hushed", "surprised", "stunned"] },
      { emoji: "😲", keywords: ["astonished", "shocked", "amazed"] },
      { emoji: "😳", keywords: ["flushed", "embarrassed", "shy"] },
      { emoji: "🥺", keywords: ["pleading", "puppy eyes", "cute"] },
      { emoji: "😦", keywords: ["frowning", "open mouth", "anguish"] },
      { emoji: "😧", keywords: ["anguished", "distressed"] },
      { emoji: "😨", keywords: ["fearful", "scared", "afraid"] },
      { emoji: "😰", keywords: ["anxious", "sweat", "nervous"] },
      { emoji: "😥", keywords: ["sad", "relieved", "disappointed"] },
      { emoji: "😢", keywords: ["crying", "sad", "tear"] },
      { emoji: "😭", keywords: ["sobbing", "crying", "sad", "tears"] },
      { emoji: "😱", keywords: ["screaming", "fear", "horror"] },
      { emoji: "😖", keywords: ["confounded", "frustrated", "quivering"] },
      { emoji: "😣", keywords: ["persevering", "struggling"] },
      { emoji: "😞", keywords: ["disappointed", "sad", "let down"] },
      { emoji: "😓", keywords: ["downcast", "sweat", "hard work"] },
      { emoji: "😩", keywords: ["weary", "tired", "exhausted"] },
      { emoji: "😫", keywords: ["tired", "fed up", "exhausted"] },
      { emoji: "🥱", keywords: ["yawning", "bored", "tired"] },
      { emoji: "😤", keywords: ["triumph", "frustrated", "steam"] },
      { emoji: "😡", keywords: ["pouting", "angry", "mad", "rage"] },
      { emoji: "😠", keywords: ["angry", "grumpy", "mad"] },
      { emoji: "🤬", keywords: ["cursing", "swearing", "angry", "symbols"] },
    ],
  },
  {
    id: "personas",
    label: "Personas",
    icon: "👋",
    emojis: [
      { emoji: "👋", keywords: ["wave", "hello", "goodbye", "hand"] },
      { emoji: "🤚", keywords: ["raised back", "hand", "stop"] },
      { emoji: "🖐", keywords: ["hand", "fingers", "splayed"] },
      { emoji: "✋", keywords: ["raised hand", "stop", "high five"] },
      { emoji: "🖖", keywords: ["vulcan", "spock", "star trek"] },
      { emoji: "👌", keywords: ["ok", "perfect", "fine"] },
      { emoji: "🤌", keywords: ["pinched", "italian", "gesture"] },
      { emoji: "🤏", keywords: ["pinching", "small", "tiny"] },
      { emoji: "✌", keywords: ["peace", "victory", "two"] },
      { emoji: "🤞", keywords: ["crossed fingers", "luck", "hope"] },
      { emoji: "🤟", keywords: ["love you", "hand", "rock"] },
      { emoji: "🤘", keywords: ["rock", "horns", "metal"] },
      { emoji: "🤙", keywords: ["call me", "hang loose", "shaka"] },
      { emoji: "👈", keywords: ["pointing left", "direction"] },
      { emoji: "👉", keywords: ["pointing right", "direction"] },
      { emoji: "👆", keywords: ["pointing up", "direction"] },
      { emoji: "🖕", keywords: ["middle finger", "rude"] },
      { emoji: "👇", keywords: ["pointing down", "direction"] },
      { emoji: "☝", keywords: ["index up", "one", "point"] },
      { emoji: "👍", keywords: ["thumbs up", "like", "approve", "yes"] },
      { emoji: "👎", keywords: ["thumbs down", "dislike", "no"] },
      { emoji: "✊", keywords: ["fist", "power", "solidarity"] },
      { emoji: "👊", keywords: ["fist bump", "punch"] },
      { emoji: "🤛", keywords: ["left fist", "fist bump"] },
      { emoji: "🤜", keywords: ["right fist", "fist bump"] },
      { emoji: "👏", keywords: ["clap", "applause", "bravo"] },
      { emoji: "🙌", keywords: ["raising hands", "celebrate", "hooray"] },
      { emoji: "👐", keywords: ["open hands", "jazz hands"] },
      { emoji: "🤲", keywords: ["palms up", "prayer", "cupped"] },
      { emoji: "🤝", keywords: ["handshake", "deal", "agreement"] },
      { emoji: "🙏", keywords: ["pray", "please", "thank you", "namaste"] },
      { emoji: "💪", keywords: ["muscle", "strong", "bicep", "flex"] },
      { emoji: "🦾", keywords: ["mechanical arm", "prosthetic", "robot"] },
      { emoji: "💅", keywords: ["nail polish", "beauty", "sassy"] },
      { emoji: "🤳", keywords: ["selfie", "phone", "camera"] },
      { emoji: "💃", keywords: ["dancer", "woman", "salsa", "flamenco"] },
      { emoji: "🕺", keywords: ["man dancing", "disco", "dance"] },
      { emoji: "👫", keywords: ["couple", "man woman", "holding hands"] },
      { emoji: "👬", keywords: ["two men", "holding hands", "couple"] },
      { emoji: "👭", keywords: ["two women", "holding hands", "couple"] },
      { emoji: "👶", keywords: ["baby", "infant", "child"] },
      { emoji: "👦", keywords: ["boy", "child", "young"] },
      { emoji: "👧", keywords: ["girl", "child", "young"] },
      { emoji: "👨", keywords: ["man", "male", "adult"] },
      { emoji: "👩", keywords: ["woman", "female", "adult"] },
      { emoji: "🧑", keywords: ["person", "adult", "gender neutral"] },
      { emoji: "👴", keywords: ["old man", "elderly", "grandfather"] },
      { emoji: "👵", keywords: ["old woman", "elderly", "grandmother"] },
      { emoji: "🧓", keywords: ["older person", "elder", "senior"] },
      { emoji: "🙍", keywords: ["frowning person", "disappointed"] },
      { emoji: "🙎", keywords: ["pouting person", "annoyed"] },
      { emoji: "🙅", keywords: ["no good", "gesturing no"] },
      { emoji: "🙆", keywords: ["ok gesture", "gesturing ok"] },
      { emoji: "💁", keywords: ["information desk", "tipping hand", "sassy"] },
      { emoji: "🙋", keywords: ["raising hand", "question", "volunteer"] },
      { emoji: "🧏", keywords: ["deaf person", "hearing"] },
      { emoji: "🤦", keywords: ["facepalm", "disappointed", "doh"] },
      { emoji: "🤷", keywords: ["shrug", "dunno", "whatever", "idk"] },
    ],
  },
  {
    id: "naturaleza",
    label: "Naturaleza",
    icon: "🌸",
    emojis: [
      { emoji: "🌸", keywords: ["cherry blossom", "flower", "spring"] },
      { emoji: "🌹", keywords: ["rose", "flower", "love", "romance"] },
      { emoji: "🌺", keywords: ["hibiscus", "flower", "tropical"] },
      { emoji: "🌻", keywords: ["sunflower", "flower", "summer"] },
      { emoji: "🌼", keywords: ["blossom", "flower", "nature"] },
      { emoji: "🌷", keywords: ["tulip", "flower", "spring"] },
      { emoji: "💐", keywords: ["bouquet", "flowers", "gift"] },
      { emoji: "🌾", keywords: ["rice", "harvest", "grain"] },
      { emoji: "🌲", keywords: ["evergreen", "tree", "pine"] },
      { emoji: "🌳", keywords: ["deciduous", "tree", "nature"] },
      { emoji: "🌴", keywords: ["palm tree", "tropical", "beach"] },
      { emoji: "🌵", keywords: ["cactus", "desert", "plant"] },
      { emoji: "🍀", keywords: ["four leaf clover", "luck", "irish"] },
      { emoji: "☘", keywords: ["shamrock", "clover", "irish"] },
      { emoji: "🍁", keywords: ["maple leaf", "autumn", "fall", "canada"] },
      { emoji: "🍂", keywords: ["fallen leaf", "autumn", "fall"] },
      { emoji: "🍃", keywords: ["leaf", "wind", "nature", "green"] },
      { emoji: "🌿", keywords: ["herb", "plant", "green", "nature"] },
      { emoji: "🪴", keywords: ["potted plant", "houseplant", "indoor"] },
      { emoji: "🐶", keywords: ["dog", "puppy", "pet", "animal"] },
      { emoji: "🐱", keywords: ["cat", "kitten", "pet", "animal"] },
      { emoji: "🐭", keywords: ["mouse", "rodent", "animal"] },
      { emoji: "🐹", keywords: ["hamster", "pet", "animal"] },
      { emoji: "🐰", keywords: ["rabbit", "bunny", "animal"] },
      { emoji: "🦊", keywords: ["fox", "animal", "clever"] },
      { emoji: "🐻", keywords: ["bear", "animal", "nature"] },
      { emoji: "🐼", keywords: ["panda", "bear", "animal"] },
      { emoji: "🐨", keywords: ["koala", "animal", "australia"] },
      { emoji: "🐯", keywords: ["tiger", "animal", "cat"] },
      { emoji: "🦁", keywords: ["lion", "animal", "king"] },
      { emoji: "🐮", keywords: ["cow", "animal", "farm"] },
      { emoji: "🐷", keywords: ["pig", "animal", "farm"] },
      { emoji: "🐸", keywords: ["frog", "animal", "green"] },
      { emoji: "🐵", keywords: ["monkey", "animal", "primate"] },
      { emoji: "🐔", keywords: ["chicken", "animal", "farm", "bird"] },
      { emoji: "🐧", keywords: ["penguin", "animal", "bird", "cold"] },
      { emoji: "🐦", keywords: ["bird", "animal", "flying"] },
      { emoji: "🦋", keywords: ["butterfly", "insect", "beautiful"] },
      { emoji: "🐛", keywords: ["bug", "insect", "caterpillar"] },
      { emoji: "🐝", keywords: ["bee", "honeybee", "insect", "honey"] },
      { emoji: "🐞", keywords: ["ladybug", "insect", "luck"] },
      { emoji: "🐌", keywords: ["snail", "slow", "shell"] },
      { emoji: "🐙", keywords: ["octopus", "sea", "tentacles"] },
      { emoji: "🦑", keywords: ["squid", "sea", "ocean"] },
      { emoji: "🦀", keywords: ["crab", "sea", "beach"] },
      { emoji: "🐠", keywords: ["tropical fish", "sea", "ocean"] },
      { emoji: "🐟", keywords: ["fish", "sea", "ocean"] },
      { emoji: "🐬", keywords: ["dolphin", "sea", "ocean", "smart"] },
      { emoji: "🐳", keywords: ["whale", "sea", "ocean", "spray"] },
      { emoji: "🐋", keywords: ["whale", "sea", "ocean", "humpback"] },
      { emoji: "🦈", keywords: ["shark", "sea", "ocean", "danger"] },
      { emoji: "🌍", keywords: ["earth", "globe", "world", "europe", "africa"] },
      { emoji: "🌎", keywords: ["earth", "globe", "world", "americas"] },
      { emoji: "🌏", keywords: ["earth", "globe", "world", "asia"] },
      { emoji: "🌙", keywords: ["moon", "crescent", "night"] },
      { emoji: "⭐", keywords: ["star", "night", "bright"] },
      { emoji: "🌟", keywords: ["glowing star", "sparkle", "bright"] },
      { emoji: "🌈", keywords: ["rainbow", "colors", "pride"] },
      { emoji: "☀", keywords: ["sun", "sunny", "bright", "hot"] },
      { emoji: "🌤", keywords: ["sun", "cloud", "partly sunny"] },
      { emoji: "⛅", keywords: ["cloud", "sun", "partly cloudy"] },
      { emoji: "🌧", keywords: ["rain", "cloud", "weather"] },
      { emoji: "⛈", keywords: ["storm", "thunder", "lightning"] },
      { emoji: "🌩", keywords: ["lightning", "cloud", "storm"] },
      { emoji: "❄", keywords: ["snowflake", "cold", "winter"] },
      { emoji: "🔥", keywords: ["fire", "hot", "flame", "lit"] },
      { emoji: "💧", keywords: ["water", "droplet", "tear"] },
      { emoji: "🌊", keywords: ["wave", "ocean", "sea", "surf"] },
    ],
  },
  {
    id: "comida",
    label: "Comida",
    icon: "🍎",
    emojis: [
      { emoji: "🍎", keywords: ["apple", "red", "fruit"] },
      { emoji: "🍐", keywords: ["pear", "fruit", "green"] },
      { emoji: "🍊", keywords: ["orange", "tangerine", "fruit"] },
      { emoji: "🍋", keywords: ["lemon", "citrus", "yellow"] },
      { emoji: "🍌", keywords: ["banana", "fruit", "yellow"] },
      { emoji: "🍉", keywords: ["watermelon", "fruit", "summer"] },
      { emoji: "🍇", keywords: ["grapes", "fruit", "wine", "purple"] },
      { emoji: "🍓", keywords: ["strawberry", "fruit", "berry", "red"] },
      { emoji: "🫐", keywords: ["blueberries", "fruit", "berry"] },
      { emoji: "🍈", keywords: ["melon", "fruit", "green"] },
      { emoji: "🍒", keywords: ["cherries", "fruit", "red"] },
      { emoji: "🍑", keywords: ["peach", "fruit"] },
      { emoji: "🥭", keywords: ["mango", "fruit", "tropical"] },
      { emoji: "🍍", keywords: ["pineapple", "fruit", "tropical"] },
      { emoji: "🥝", keywords: ["kiwi", "fruit", "green"] },
      { emoji: "🍅", keywords: ["tomato", "vegetable", "red"] },
      { emoji: "🥑", keywords: ["avocado", "fruit", "green", "guacamole"] },
      { emoji: "🌽", keywords: ["corn", "maize", "vegetable"] },
      { emoji: "🌶", keywords: ["pepper", "hot", "spicy", "chili"] },
      { emoji: "🫑", keywords: ["bell pepper", "vegetable", "green"] },
      { emoji: "🥒", keywords: ["cucumber", "vegetable", "green"] },
      { emoji: "🥬", keywords: ["leafy green", "vegetable", "lettuce"] },
      { emoji: "🧅", keywords: ["onion", "vegetable", "cook"] },
      { emoji: "🧄", keywords: ["garlic", "vegetable", "cook", "flavor"] },
      { emoji: "🥔", keywords: ["potato", "vegetable", "starch"] },
      { emoji: "🍞", keywords: ["bread", "toast", "bakery"] },
      { emoji: "🥐", keywords: ["croissant", "bread", "french", "pastry"] },
      { emoji: "🥖", keywords: ["baguette", "bread", "french"] },
      { emoji: "🧀", keywords: ["cheese", "dairy", "wedge"] },
      { emoji: "🍕", keywords: ["pizza", "slice", "italian", "food"] },
      { emoji: "🍔", keywords: ["hamburger", "burger", "fast food"] },
      { emoji: "🍟", keywords: ["french fries", "fries", "fast food"] },
      { emoji: "🌭", keywords: ["hot dog", "sausage", "fast food"] },
      { emoji: "🥪", keywords: ["sandwich", "bread", "lunch"] },
      { emoji: "🌮", keywords: ["taco", "mexican", "food"] },
      { emoji: "🌯", keywords: ["burrito", "wrap", "mexican"] },
      { emoji: "🥗", keywords: ["salad", "healthy", "green", "bowl"] },
      { emoji: "🍝", keywords: ["spaghetti", "pasta", "italian"] },
      { emoji: "🍜", keywords: ["noodles", "ramen", "soup", "asian"] },
      { emoji: "🍲", keywords: ["stew", "pot", "soup", "cook"] },
      { emoji: "🍛", keywords: ["curry", "rice", "indian"] },
      { emoji: "🍣", keywords: ["sushi", "japanese", "fish", "rice"] },
      { emoji: "🍱", keywords: ["bento", "box", "japanese", "lunch"] },
      { emoji: "🧁", keywords: ["cupcake", "dessert", "sweet", "cake"] },
      { emoji: "🍰", keywords: ["cake", "shortcake", "dessert", "sweet"] },
      { emoji: "🎂", keywords: ["birthday cake", "celebration", "party"] },
      { emoji: "🍮", keywords: ["custard", "flan", "dessert", "pudding"] },
      { emoji: "🍦", keywords: ["ice cream", "soft serve", "dessert"] },
      { emoji: "🍩", keywords: ["donut", "doughnut", "dessert", "sweet"] },
      { emoji: "🍪", keywords: ["cookie", "biscuit", "sweet", "dessert"] },
      { emoji: "🍫", keywords: ["chocolate", "bar", "sweet", "candy"] },
      { emoji: "🍬", keywords: ["candy", "sweet", "sugar"] },
      { emoji: "☕", keywords: ["coffee", "hot", "drink", "cafe"] },
      { emoji: "🍵", keywords: ["tea", "hot", "drink", "green"] },
      { emoji: "🧃", keywords: ["juice box", "drink", "beverage"] },
      { emoji: "🥤", keywords: ["cup", "straw", "drink", "soda"] },
      { emoji: "🍺", keywords: ["beer", "drink", "alcohol", "mug"] },
      { emoji: "🍷", keywords: ["wine", "drink", "alcohol", "glass"] },
      { emoji: "🥂", keywords: ["champagne", "cheers", "toast", "celebrate"] },
      { emoji: "🍸", keywords: ["cocktail", "drink", "martini", "alcohol"] },
    ],
  },
  {
    id: "objetos",
    label: "Objetos",
    icon: "💼",
    emojis: [
      { emoji: "💼", keywords: ["briefcase", "work", "business", "office"] },
      { emoji: "📁", keywords: ["folder", "file", "documents"] },
      { emoji: "📂", keywords: ["open folder", "file", "documents"] },
      { emoji: "📅", keywords: ["calendar", "date", "schedule"] },
      { emoji: "📆", keywords: ["calendar", "tear-off", "date"] },
      { emoji: "🗓", keywords: ["calendar", "spiral", "schedule"] },
      { emoji: "📌", keywords: ["pushpin", "pin", "location"] },
      { emoji: "📍", keywords: ["round pushpin", "pin", "location"] },
      { emoji: "📎", keywords: ["paperclip", "attach", "office"] },
      { emoji: "🖇", keywords: ["linked paperclips", "attach"] },
      { emoji: "📏", keywords: ["ruler", "straight", "measure"] },
      { emoji: "📐", keywords: ["triangular ruler", "measure", "math"] },
      { emoji: "✂", keywords: ["scissors", "cut", "trim"] },
      { emoji: "🗑", keywords: ["trash", "waste", "bin", "delete"] },
      { emoji: "📝", keywords: ["memo", "note", "write", "pencil"] },
      { emoji: "✏", keywords: ["pencil", "write", "edit"] },
      { emoji: "🖊", keywords: ["pen", "write", "ballpoint"] },
      { emoji: "🖋", keywords: ["fountain pen", "write", "fancy"] },
      { emoji: "🔍", keywords: ["magnifying glass", "search", "zoom", "left"] },
      { emoji: "🔎", keywords: ["magnifying glass", "search", "zoom", "right"] },
      { emoji: "🔒", keywords: ["lock", "locked", "secure", "closed"] },
      { emoji: "🔓", keywords: ["unlock", "open", "lock"] },
      { emoji: "💡", keywords: ["light bulb", "idea", "bright"] },
      { emoji: "🔦", keywords: ["flashlight", "torch", "light"] },
      { emoji: "🏮", keywords: ["lantern", "red", "paper", "light"] },
      { emoji: "📷", keywords: ["camera", "photo", "picture"] },
      { emoji: "📹", keywords: ["video camera", "recording"] },
      { emoji: "🎥", keywords: ["movie camera", "film", "cinema"] },
      { emoji: "📞", keywords: ["telephone", "phone", "call"] },
      { emoji: "📱", keywords: ["mobile phone", "cell", "smartphone"] },
      { emoji: "💻", keywords: ["laptop", "computer", "pc"] },
      { emoji: "⌨", keywords: ["keyboard", "type", "computer"] },
      { emoji: "🖥", keywords: ["desktop computer", "monitor", "screen"] },
      { emoji: "🖨", keywords: ["printer", "print", "paper"] },
      { emoji: "💾", keywords: ["floppy disk", "save", "storage"] },
      { emoji: "💿", keywords: ["cd", "disc", "optical"] },
      { emoji: "📀", keywords: ["dvd", "disc", "movie"] },
      { emoji: "🎮", keywords: ["game", "controller", "joystick", "play"] },
      { emoji: "🕹", keywords: ["joystick", "game", "arcade"] },
      { emoji: "🎲", keywords: ["dice", "game", "chance", "roll"] },
      { emoji: "♟", keywords: ["chess pawn", "game", "strategy"] },
      { emoji: "🎯", keywords: ["bullseye", "target", "dart"] },
      { emoji: "🎳", keywords: ["bowling", "sport", "game"] },
      { emoji: "🧩", keywords: ["puzzle", "piece", "game", "jigsaw"] },
      { emoji: "🎵", keywords: ["music", "note", "melody"] },
      { emoji: "🎶", keywords: ["music", "notes", "melody", "song"] },
      { emoji: "🎧", keywords: ["headphones", "music", "listen", "audio"] },
      { emoji: "🎤", keywords: ["microphone", "sing", "karaoke", "mic"] },
      { emoji: "🎸", keywords: ["guitar", "music", "rock", "instrument"] },
      { emoji: "🥁", keywords: ["drum", "music", "beat", "instrument"] },
      { emoji: "🎹", keywords: ["piano", "keyboard", "music", "keys"] },
      { emoji: "🎺", keywords: ["trumpet", "music", "brass", "instrument"] },
      { emoji: "🎻", keywords: ["violin", "music", "string", "instrument"] },
      { emoji: "🔑", keywords: ["key", "lock", "password", "access"] },
      { emoji: "🗝", keywords: ["old key", "vintage", "antique", "lock"] },
      { emoji: "🔧", keywords: ["wrench", "tool", "fix", "settings"] },
      { emoji: "🔨", keywords: ["hammer", "tool", "build", "construct"] },
      { emoji: "⚙", keywords: ["gear", "settings", "cog", "mechanical"] },
      { emoji: "🧲", keywords: ["magnet", "attract", "magnetic"] },
      { emoji: "📦", keywords: ["package", "box", "shipping", "delivery"] },
      { emoji: "🏷", keywords: ["label", "tag", "price"] },
      { emoji: "🔔", keywords: ["bell", "notification", "alert", "ring"] },
      { emoji: "📣", keywords: ["megaphone", "announcement", "loudspeaker"] },
      { emoji: "💎", keywords: ["gem", "diamond", "jewel", "precious"] },
      { emoji: "🧭", keywords: ["compass", "navigate", "direction"] },
      { emoji: "⏰", keywords: ["alarm clock", "time", "wake up"] },
      { emoji: "⌛", keywords: ["hourglass", "time", "sand", "waiting"] },
      { emoji: "🎁", keywords: ["gift", "present", "wrapped", "birthday"] },
      { emoji: "🏆", keywords: ["trophy", "winner", "champion", "award"] },
      { emoji: "🥇", keywords: ["gold medal", "first", "winner"] },
      { emoji: "🥈", keywords: ["silver medal", "second"] },
      { emoji: "🥉", keywords: ["bronze medal", "third"] },
    ],
  },
  {
    id: "simbolos",
    label: "Símbolos",
    icon: "❤",
    emojis: [
      { emoji: "❤", keywords: ["red heart", "love", "like"] },
      { emoji: "🧡", keywords: ["orange heart", "love"] },
      { emoji: "💛", keywords: ["yellow heart", "love"] },
      { emoji: "💚", keywords: ["green heart", "love"] },
      { emoji: "💙", keywords: ["blue heart", "love"] },
      { emoji: "💜", keywords: ["purple heart", "love"] },
      { emoji: "🖤", keywords: ["black heart", "love", "dark"] },
      { emoji: "🤍", keywords: ["white heart", "love", "pure"] },
      { emoji: "🤎", keywords: ["brown heart", "love"] },
      { emoji: "💔", keywords: ["broken heart", "sad", "heartbreak"] },
      { emoji: "❣", keywords: ["heart exclamation", "love"] },
      { emoji: "💕", keywords: ["two hearts", "love", "pair"] },
      { emoji: "💞", keywords: ["revolving hearts", "love"] },
      { emoji: "💓", keywords: ["beating heart", "love", "pulse"] },
      { emoji: "💗", keywords: ["growing heart", "love"] },
      { emoji: "💖", keywords: ["sparkling heart", "love", "shine"] },
      { emoji: "💝", keywords: ["heart with ribbon", "love", "gift"] },
      { emoji: "💘", keywords: ["cupid heart", "arrow", "love"] },
      { emoji: "💟", keywords: ["heart decoration", "love"] },
      { emoji: "☮", keywords: ["peace", "symbol"] },
      { emoji: "✝", keywords: ["cross", "christian", "religion"] },
      { emoji: "☪", keywords: ["star and crescent", "islam", "religion"] },
      { emoji: "🕉", keywords: ["om", "hindu", "religion"] },
      { emoji: "☸", keywords: ["wheel of dharma", "buddhism", "religion"] },
      { emoji: "✡", keywords: ["star of david", "jewish", "religion"] },
      { emoji: "🔯", keywords: ["six pointed star", "dotted"] },
      { emoji: "🕎", keywords: ["menorah", "candles", "hanukkah"] },
      { emoji: "☯", keywords: ["yin yang", "balance", "harmony"] },
      { emoji: "♈", keywords: ["aries", "zodiac", "horoscope"] },
      { emoji: "♉", keywords: ["taurus", "zodiac", "horoscope"] },
      { emoji: "♊", keywords: ["gemini", "zodiac", "horoscope"] },
      { emoji: "♋", keywords: ["cancer", "zodiac", "horoscope"] },
      { emoji: "♌", keywords: ["leo", "zodiac", "horoscope"] },
      { emoji: "♍", keywords: ["virgo", "zodiac", "horoscope"] },
      { emoji: "♎", keywords: ["libra", "zodiac", "horoscope"] },
      { emoji: "♏", keywords: ["scorpio", "zodiac", "horoscope"] },
      { emoji: "♐", keywords: ["sagittarius", "zodiac", "horoscope"] },
      { emoji: "♑", keywords: ["capricorn", "zodiac", "horoscope"] },
      { emoji: "♒", keywords: ["aquarius", "zodiac", "horoscope"] },
      { emoji: "♓", keywords: ["pisces", "zodiac", "horoscope"] },
      { emoji: "⛎", keywords: ["ophiuchus", "zodiac"] },
      { emoji: "🔀", keywords: ["shuffle", "random", "twisted arrows"] },
      { emoji: "🔁", keywords: ["repeat", "loop", "arrows"] },
      { emoji: "🔂", keywords: ["repeat single", "loop one"] },
      { emoji: "⏩", keywords: ["fast forward", "speed"] },
      { emoji: "⏭", keywords: ["next track", "skip"] },
      { emoji: "⏪", keywords: ["rewind", "back"] },
      { emoji: "⏮", keywords: ["previous track", "back"] },
      { emoji: "⏫", keywords: ["fast up", "arrow"] },
      { emoji: "⏬", keywords: ["fast down", "arrow"] },
      { emoji: "▶", keywords: ["play", "start", "right"] },
      { emoji: "⏸", keywords: ["pause", "break"] },
      { emoji: "⏹", keywords: ["stop", "square"] },
      { emoji: "⏺", keywords: ["record", "circle", "red"] },
      { emoji: "⏏", keywords: ["eject", "disc"] },
      { emoji: "✅", keywords: ["check", "done", "complete", "yes"] },
      { emoji: "❌", keywords: ["cross mark", "no", "wrong", "delete"] },
      { emoji: "❎", keywords: ["cross mark button", "no"] },
      { emoji: "➕", keywords: ["plus", "add", "positive"] },
      { emoji: "➖", keywords: ["minus", "subtract", "negative"] },
      { emoji: "➗", keywords: ["divide", "division", "math"] },
      { emoji: "❗", keywords: ["exclamation", "important", "warning"] },
      { emoji: "❓", keywords: ["question", "ask", "help"] },
      { emoji: "❕", keywords: ["exclamation", "white", "important"] },
      { emoji: "❔", keywords: ["question", "white", "ask"] },
      { emoji: "⭕", keywords: ["circle", "round", "ring"] },
      { emoji: "✔", keywords: ["check mark", "done", "correct"] },
      { emoji: "🚀", keywords: ["rocket", "launch", "space", "fast"] },
      { emoji: "💯", keywords: ["hundred", "perfect", "score", "100"] },
      { emoji: "🔴", keywords: ["red circle", "dot"] },
      { emoji: "🟠", keywords: ["orange circle", "dot"] },
      { emoji: "🟡", keywords: ["yellow circle", "dot"] },
      { emoji: "🟢", keywords: ["green circle", "dot"] },
      { emoji: "🔵", keywords: ["blue circle", "dot"] },
      { emoji: "🟣", keywords: ["purple circle", "dot"] },
      { emoji: "⚪", keywords: ["white circle", "dot"] },
      { emoji: "⚫", keywords: ["black circle", "dot"] },
      { emoji: "🟤", keywords: ["brown circle", "dot"] },
      { emoji: "⬛", keywords: ["black square", "block"] },
      { emoji: "⬜", keywords: ["white square", "block"] },
      { emoji: "💬", keywords: ["speech bubble", "talk", "chat", "comment"] },
      { emoji: "💭", keywords: ["thought bubble", "think", "cloud"] },
      { emoji: "🗨", keywords: ["speech bubble", "left", "talk"] },
      { emoji: "⚡", keywords: ["lightning", "zap", "thunder", "electricity"] },
      { emoji: "✨", keywords: ["sparkles", "shine", "glitter", "stars"] },
      { emoji: "🎉", keywords: ["party popper", "celebration", "confetti"] },
      { emoji: "🎊", keywords: ["confetti ball", "celebration", "party"] },
      { emoji: "🏅", keywords: ["medal", "sports", "achievement"] },
      { emoji: "📢", keywords: ["loudspeaker", "announcement", "volume"] },
      { emoji: "🚨", keywords: ["rotating light", "alert", "emergency"] },
      { emoji: "⚠", keywords: ["warning", "caution", "alert"] },
      { emoji: "🚫", keywords: ["prohibited", "forbidden", "no", "ban"] },
      { emoji: "♻", keywords: ["recycle", "green", "environment"] },
      { emoji: "💤", keywords: ["zzz", "sleep", "tired", "snoring"] },
      { emoji: "🆕", keywords: ["new", "fresh", "badge"] },
      { emoji: "🆗", keywords: ["ok", "button", "agree"] },
      { emoji: "🆙", keywords: ["up", "button", "upgrade"] },
      { emoji: "ℹ", keywords: ["information", "info", "help"] },
    ],
  },
  {
    id: "banderas",
    label: "Banderas",
    icon: "🏳",
    emojis: [
      { emoji: "🏳", keywords: ["white flag", "surrender", "peace"] },
      { emoji: "🏴", keywords: ["black flag", "flag"] },
      { emoji: "🏁", keywords: ["checkered flag", "race", "finish"] },
      { emoji: "🚩", keywords: ["red flag", "triangular", "warning"] },
      { emoji: "🏳️‍🌈", keywords: ["rainbow flag", "pride", "lgbtq"] },
      { emoji: "🇦🇷", keywords: ["argentina", "flag"] },
      { emoji: "🇧🇷", keywords: ["brazil", "flag"] },
      { emoji: "🇨🇱", keywords: ["chile", "flag"] },
      { emoji: "🇨🇴", keywords: ["colombia", "flag"] },
      { emoji: "🇨🇷", keywords: ["costa rica", "flag"] },
      { emoji: "🇨🇺", keywords: ["cuba", "flag"] },
      { emoji: "🇪🇨", keywords: ["ecuador", "flag"] },
      { emoji: "🇪🇸", keywords: ["spain", "flag", "espana"] },
      { emoji: "🇬🇹", keywords: ["guatemala", "flag"] },
      { emoji: "🇭🇳", keywords: ["honduras", "flag"] },
      { emoji: "🇲🇽", keywords: ["mexico", "flag"] },
      { emoji: "🇳🇮", keywords: ["nicaragua", "flag"] },
      { emoji: "🇵🇦", keywords: ["panama", "flag"] },
      { emoji: "🇵🇪", keywords: ["peru", "flag"] },
      { emoji: "🇵🇷", keywords: ["puerto rico", "flag"] },
      { emoji: "🇵🇾", keywords: ["paraguay", "flag"] },
      { emoji: "🇺🇾", keywords: ["uruguay", "flag"] },
      { emoji: "🇻🇪", keywords: ["venezuela", "flag"] },
      { emoji: "🇺🇸", keywords: ["united states", "usa", "flag", "america"] },
      { emoji: "🇬🇧", keywords: ["united kingdom", "uk", "flag", "britain"] },
      { emoji: "🇫🇷", keywords: ["france", "flag", "french"] },
      { emoji: "🇩🇪", keywords: ["germany", "flag", "german"] },
      { emoji: "🇮🇹", keywords: ["italy", "flag", "italian"] },
      { emoji: "🇯🇵", keywords: ["japan", "flag", "japanese"] },
      { emoji: "🇰🇷", keywords: ["south korea", "flag", "korean"] },
      { emoji: "🇨🇳", keywords: ["china", "flag", "chinese"] },
      { emoji: "🇦🇺", keywords: ["australia", "flag", "australian"] },
      { emoji: "🇨🇦", keywords: ["canada", "flag", "canadian"] },
      { emoji: "🇮🇳", keywords: ["india", "flag", "indian"] },
      { emoji: "🇷🇺", keywords: ["russia", "flag", "russian"] },
      { emoji: "🇵🇹", keywords: ["portugal", "flag", "portuguese"] },
      { emoji: "🇳🇱", keywords: ["netherlands", "flag", "dutch"] },
      { emoji: "🇧🇪", keywords: ["belgium", "flag", "belgian"] },
      { emoji: "🇨🇭", keywords: ["switzerland", "flag", "swiss"] },
      { emoji: "🇸🇪", keywords: ["sweden", "flag", "swedish"] },
      { emoji: "🇳🇴", keywords: ["norway", "flag", "norwegian"] },
      { emoji: "🇩🇰", keywords: ["denmark", "flag", "danish"] },
      { emoji: "🇫🇮", keywords: ["finland", "flag", "finnish"] },
      { emoji: "🇵🇱", keywords: ["poland", "flag", "polish"] },
      { emoji: "🇹🇷", keywords: ["turkey", "flag", "turkish"] },
      { emoji: "🇪🇬", keywords: ["egypt", "flag", "egyptian"] },
      { emoji: "🇿🇦", keywords: ["south africa", "flag"] },
      { emoji: "🇳🇬", keywords: ["nigeria", "flag", "nigerian"] },
      { emoji: "🇰🇪", keywords: ["kenya", "flag", "kenyan"] },
      { emoji: "🇹🇭", keywords: ["thailand", "flag", "thai"] },
      { emoji: "🇻🇳", keywords: ["vietnam", "flag", "vietnamese"] },
      { emoji: "🇵🇭", keywords: ["philippines", "flag", "filipino"] },
      { emoji: "🇮🇩", keywords: ["indonesia", "flag", "indonesian"] },
      { emoji: "🇲🇾", keywords: ["malaysia", "flag", "malaysian"] },
      { emoji: "🇸🇬", keywords: ["singapore", "flag"] },
      { emoji: "🇳🇿", keywords: ["new zealand", "flag"] },
      { emoji: "🇮🇪", keywords: ["ireland", "flag", "irish"] },
      { emoji: "🇦🇹", keywords: ["austria", "flag", "austrian"] },
      { emoji: "🇬🇷", keywords: ["greece", "flag", "greek"] },
      { emoji: "🇭🇷", keywords: ["croatia", "flag", "croatian"] },
      { emoji: "🇷🇴", keywords: ["romania", "flag", "romanian"] },
      { emoji: "🇺🇦", keywords: ["ukraine", "flag", "ukrainian"] },
      { emoji: "🇮🇱", keywords: ["israel", "flag", "israeli"] },
      { emoji: "🇸🇦", keywords: ["saudi arabia", "flag"] },
      { emoji: "🇦🇪", keywords: ["united arab emirates", "uae", "flag"] },
    ],
  },
]

const FRECUENTES_ID = "frecuentes"

export function EmojiPickerFull({
  current,
  onChange,
  trigger,
}: {
  current: string
  onChange: (emoji: string) => void
  trigger?: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState(EMOJI_CATEGORIES[0].id)
  const [frequentlyUsed, setFrequentlyUsed] = useState<string[]>([])
  const pickerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  // Focus search when opened
  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus()
    }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen])

  const allCategories = useMemo(() => {
    if (frequentlyUsed.length === 0) return EMOJI_CATEGORIES
    const frecuentesCategory: EmojiCategory = {
      id: FRECUENTES_ID,
      label: "Frecuentes",
      icon: "🕐",
      emojis: frequentlyUsed.map((emoji) => ({ emoji, keywords: [] })),
    }
    return [frecuentesCategory, ...EMOJI_CATEGORIES]
  }, [frequentlyUsed])

  const filteredEmojis = useMemo(() => {
    const query = search.toLowerCase().trim()
    if (!query) return null

    const results: EmojiEntry[] = []
    const seen = new Set<string>()

    for (const category of EMOJI_CATEGORIES) {
      for (const entry of category.emojis) {
        if (seen.has(entry.emoji)) continue
        const matchesEmoji = entry.emoji.includes(query)
        const matchesKeyword = entry.keywords.some((kw) => kw.includes(query))
        if (matchesEmoji || matchesKeyword) {
          results.push(entry)
          seen.add(entry.emoji)
        }
      }
    }

    return results
  }, [search])

  function handleSelect(emoji: string) {
    setFrequentlyUsed((prev) => {
      const filtered = prev.filter((e) => e !== emoji)
      return [emoji, ...filtered].slice(0, 20)
    })
    onChange(emoji)
    setIsOpen(false)
    setSearch("")
  }

  function handleToggle() {
    setIsOpen((prev) => !prev)
    if (isOpen) {
      setSearch("")
    }
  }

  const activeCategoryEmojis = useMemo(() => {
    const cat = allCategories.find((c) => c.id === activeCategory)
    return cat?.emojis ?? []
  }, [activeCategory, allCategories])

  // If active category is "frecuentes" but there are no frequent emojis, switch to first real category
  useEffect(() => {
    if (activeCategory === FRECUENTES_ID && frequentlyUsed.length === 0) {
      setActiveCategory(EMOJI_CATEGORIES[0].id)
    }
  }, [activeCategory, frequentlyUsed])

  return (
    <div className="relative inline-block" ref={pickerRef}>
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          !trigger && "h-9 w-9 text-xl"
        )}
      >
        {trigger ?? current ?? "😀"}
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute left-0 top-full z-50 mt-1",
            "w-[340px] rounded-lg border bg-popover text-popover-foreground shadow-lg"
          )}
        >
          {/* Search bar */}
          <div className="border-b p-2">
            <input
              ref={searchRef}
              type="text"
              placeholder="Buscar emoji..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                "w-full rounded-md border bg-background px-3 py-1.5 text-sm",
                "placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-1 focus:ring-ring"
              )}
            />
          </div>

          {/* Category tabs (hidden during search) */}
          {!search && (
            <div className="flex gap-0.5 border-b px-1 py-1 overflow-x-auto">
              {allCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  title={cat.label}
                  className={cn(
                    "flex-shrink-0 rounded-md px-1.5 py-1 text-base transition-colors",
                    "hover:bg-accent",
                    activeCategory === cat.id && "bg-accent ring-1 ring-ring"
                  )}
                >
                  {cat.icon}
                </button>
              ))}
            </div>
          )}

          {/* Emoji grid */}
          <div className="max-h-[350px] overflow-y-auto p-2">
            {search ? (
              <>
                {filteredEmojis && filteredEmojis.length > 0 ? (
                  <div className="grid grid-cols-8 gap-0.5">
                    {filteredEmojis.map((entry) => (
                      <button
                        key={entry.emoji}
                        type="button"
                        onClick={() => handleSelect(entry.emoji)}
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded text-lg",
                          "transition-colors hover:bg-accent",
                          current === entry.emoji && "bg-accent ring-1 ring-ring"
                        )}
                        title={entry.keywords.join(", ")}
                      >
                        {entry.emoji}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No se encontraron emojis
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="mb-1 px-1 text-xs font-medium text-muted-foreground">
                  {allCategories.find((c) => c.id === activeCategory)?.label}
                </p>
                <div className="grid grid-cols-8 gap-0.5">
                  {activeCategoryEmojis.map((entry) => (
                    <button
                      key={entry.emoji}
                      type="button"
                      onClick={() => handleSelect(entry.emoji)}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded text-lg",
                        "transition-colors hover:bg-accent",
                        current === entry.emoji && "bg-accent ring-1 ring-ring"
                      )}
                      title={entry.keywords.join(", ")}
                    >
                      {entry.emoji}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
