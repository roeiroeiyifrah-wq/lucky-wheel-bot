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
    GatewayIntentBits.Guilds
  ]
});

const TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID;

const WHEEL_CHANNEL_ID = "1529065973401915492";
const COST = 1000;

const STAFF_ROLE_ID = "1524447926213017720";
const LUCK_ROLE_ID = "1529150264022401165";


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


const commands = [
  new SlashCommandBuilder()
    .setName("wheel")
    .setDescription("פתיחת גלגל המזל"),

  new SlashCommandBuilder()
    .setName("balance")
    .setDescription("בדיקת נקודות"),

  new SlashCommandBuilder()
    .setName("addpoints")
    .setDescription("הוספת נקודות")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("משתמש")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName("amount")
        .setDescription("כמות נקודות")
        .setRequired(true)
    )
].map(command => command.toJSON());


client.once("ready", async () => {

  console.log(`מחובר בתור ${client.user.tag}`);

  const rest = new REST({ version: "10" })
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
client.on("interactionCreate", async interaction => {


  if (interaction.isChatInputCommand()) {


    if (interaction.commandName === "balance") {

      const amount = points[interaction.user.id] || 0;

      return interaction.reply({
        content: `💎 יש לך ${amount} נקודות`,
        ephemeral: true
      });

    }


    if (interaction.commandName === "addpoints") {

      if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {

        return interaction.reply({
          content: "❌ אין לך הרשאה להוסיף נקודות",
          ephemeral: true
        });

      }


      const user = interaction.options.getUser("user");
      const amount = interaction.options.getInteger("amount");


      if (!points[user.id]) {
        points[user.id] = 0;
      }


      points[user.id] += amount;

      savePoints();


      return interaction.reply(
        `✅ נוספו ${amount} נקודות ל־${user}`
      );

    }



    if (interaction.commandName === "wheel") {


      if (interaction.channel.id !== WHEEL_CHANNEL_ID) {

        return interaction.reply({
          content: "❌ הפקודה רק בחדר הגלגל",
          ephemeral: true
        });

      }


      const button = new ButtonBuilder()
        .setCustomId("spin")
        .setLabel("🎡 סובב גלגל")
        .setStyle(ButtonStyle.Primary);


      const row = new ActionRowBuilder()
        .addComponents(button);


      const embed = new EmbedBuilder()
        .setTitle("🎡 Lucky Wheel")
        .setDescription(
          "לחץ על הכפתור כדי לסובב!\n💎 מחיר: 1000 נקודות"
        );


      return interaction.reply({
        embeds: [embed],
        components: [row]
      });

    }

  }



  if (interaction.isButton()) {


    if (interaction.customId !== "spin") return;


    const userId = interaction.user.id;
    const member = interaction.member;


    const userPoints = points[userId] || 0;


    if (userPoints < COST) {

      return interaction.reply({
        content: "❌ אין לך מספיק נקודות",
        ephemeral: true
      });

    }


    points[userId] -= COST;



    const prizes = [
      { type: "points", amount: 500 },
      { type: "points", amount: 1000 },
      { type: "points", amount: 2000 },
      { type: "points", amount: 5000 },
      { type: "luck" }
    ];


    const prize =
      prizes[Math.floor(Math.random() * prizes.length)];



    if (prize.type === "luck") {


      if (member.roles.cache.has(LUCK_ROLE_ID)) {


        points[userId] += 500;

        savePoints();


        return interaction.reply(
          `🎡 כבר יש לך רול מזל!\nקיבלת במקום 💎 500 נקודות`
        );

      } else {


        await member.roles.add(LUCK_ROLE_ID);

        savePoints();


        return interaction.reply(
          `🎉 זכית ברול מזל! 🎡`
        );

      }

    }



    points[userId] += prize.amount;

    savePoints();


    return interaction.reply(
      `🎡 סובבת את הגלגל!\nזכית ב־💎 ${prize.amount} נקודות`
    );


  }

});


client.login(TOKEN);
