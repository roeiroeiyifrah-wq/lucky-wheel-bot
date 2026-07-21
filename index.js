const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const fs = require("fs");


const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});


const TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID;


// 🎡 גלגל
const WHEEL_CHANNEL_ID = "1529158985725251624";


// 🎯 משימות יומיות
const QUEST_CHANNEL_ID = "1529241574041719004";


const COST = 1000;


// 👑 צוות
const STAFF_ROLE_ID = "1524447926213017720";


// 🎡 רולים
const LUCK_ROLE_ID = "1529150264022401165";
const SPECIAL_ROLE_ID = "1529155524028010637";


// 💎 נקודות

let points = {};

if (fs.existsSync("points.json")) {
  points = JSON.parse(
    fs.readFileSync("points.json")
  );
}


function savePoints() {
  fs.writeFileSync(
    "points.json",
    JSON.stringify(points, null, 2)
  );
}


// 🎯 נתוני משימות

let questData = {};

if (fs.existsSync("quests.json")) {
  questData = JSON.parse(
    fs.readFileSync("quests.json")
  );
}


function saveQuests() {
  fs.writeFileSync(
    "quests.json",
    JSON.stringify(questData, null, 2)
  );
}


// 🎤 מעקב וויס

let voiceMinutes = {};


// 💬 מעקב צ'אט

let chatMessages = {};
// 🎯 רשימת משימות אפשריות

const questList = [

  {
    type: "chat",
    text: "💬 שלח 5 הודעות איכותיות",
    amount: 5,
    reward: 100
  },

  {
    type: "voice",
    text: "🎤 היה 10 דקות פעיל בוויס",
    amount: 10,
    reward: 100
  },


  {
    type: "chat",
    text: "💬 שלח 20 הודעות איכותיות",
    amount: 20,
    reward: 250
  },


  {
    type: "voice",
    text: "🎤 היה 30 דקות פעיל בוויס",
    amount: 30,
    reward: 250
  },


  {
    type: "chat",
    text: "💬 שלח 50 הודעות איכותיות",
    amount: 50,
    reward: 500
  },


  {
    type: "voice",
    text: "🎤 היה שעה פעילה בוויס",
    amount: 60,
    reward: 500
  }

];


// יצירת משימות חדשות

function createDailyQuests() {

  let shuffled = questList.sort(() => Math.random() - 0.5);


  return [
    shuffled[0],
    shuffled[1],
    shuffled[2]
  ];

}



// איפוס יומי

function resetDailyQuests() {

  const today = new Date().toDateString();


  if (questData.date !== today) {

    questData = {
      date: today,
      quests: createDailyQuests(),
      users: {}
    };


    saveQuests();


  }

}



// בדיקת משתמש

function getUserQuest(userId) {

  if (!questData.users[userId]) {

    questData.users[userId] = {
      completed: []
    };

  }


  return questData.users[userId];

}



// השלמת משימה

async function completeQuest(user, quest) {


  const data = getUserQuest(user.id);


  const index = questData.quests.indexOf(quest);


  if (data.completed.includes(index)) return;


  data.completed.push(index);



  if (!points[user.id]) {
    points[user.id] = 0;
  }


  points[user.id] += quest.reward;


  savePoints();
  saveQuests();



  try {

    await user.send(
`━━━━━━━━━━━━━━
🏆 QUEST COMPLETED
━━━━━━━━━━━━━━

🎯 ${quest.text}

💎 קיבלת:
+${quest.reward} נקודות

🔥 המשך להיות פעיל!
━━━━━━━━━━━━━━`
    );

  } catch {}



  // בונוס סיום הכול

  if (data.completed.length === 3) {

    points[user.id] += 250;

    savePoints();


    try {

      await user.send(
`👑 סיימת את כל המשימות היומיות!

🎁 בונוס השלמה:
+250 נקודות`
      );

    } catch {}

  }

}



// הודעות צ'אט

client.on("messageCreate", async message => {


  if (message.author.bot) return;


  resetDailyQuests();


  if (!chatMessages[message.author.id]) {

    chatMessages[message.author.id] = 0;

  }


  const words = message.content.trim().split(/\s+/);


  // לפחות 3 מילים

  if (words.length >= 3) {

    chatMessages[message.author.id]++;


    questData.quests.forEach(async quest => {

      if (
        quest.type === "chat" &&
        chatMessages[message.author.id] >= quest.amount
      ) {

        await completeQuest(
          message.author,
          quest
        );

      }

    });

  }

});
// 🎤 מעקב וויס

let activeVoice = {};

client.on("voiceStateUpdate", (oldState, newState) => {

  const member = newState.member;

  if (!member || member.user.bot) return;


  if (newState.channel) {

    activeVoice[member.id] = Date.now();

  } else {

    delete activeVoice[member.id];

  }

});


// כל דקה בודק מי באמת פעיל בוויס

setInterval(async () => {


  resetDailyQuests();


  for (const userId in activeVoice) {


    const member = await client.users.fetch(userId)
      .catch(() => null);


    if (!member) continue;



    if (!voiceMinutes[userId]) {

      voiceMinutes[userId] = 0;

    }


    // דקה אחת של פעילות

    voiceMinutes[userId]++;



    const userQuest = questData.users[userId] || {
      completed: []
    };


    questData.quests.forEach(async quest => {


      if (
        quest.type === "voice" &&
        voiceMinutes[userId] >= quest.amount
      ) {


        await completeQuest(
          member,
          quest
        );


      }


    });


  }


}, 60000);





// שליחת משימות לחדר כל יום

async function sendDailyQuests() {


  const channel = await client.channels.fetch(
    QUEST_CHANNEL_ID
  ).catch(() => null);



  if (!channel) return;



  const embed = new EmbedBuilder()

    .setTitle("🎯 משימות יומיות")

    .setDescription(

      questData.quests.map((q, i) =>

        `${i + 1}. ${q.text}\n💎 פרס: ${q.reward} נקודות`

      ).join("\n\n")

    )

    .setFooter({
      text: "המשימות מתחלפות כל יום 🔄"
    });



  channel.send({
    embeds: [embed]
  });


}





client.once("ready", async () => {


  console.log(
    `מחובר בתור ${client.user.tag}`
  );


  resetDailyQuests();


  sendDailyQuests();


  const rest = new REST({version:"10"})
    .setToken(TOKEN);



  await rest.put(

    Routes.applicationGuildCommands(
      client.user.id,
      GUILD_ID
    ),

    {
      body: commands
    }

  );


});



client.login(TOKEN);
