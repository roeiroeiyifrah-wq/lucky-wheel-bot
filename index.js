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
  intents: [GatewayIntentBits.Guilds]
});

const TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID;

const WHEEL_CHANNEL_ID = "1529065973401915492";
const COST = 1000;

let points = {};

if (fs.existsSync("points.json")) {
  points = JSON.parse(fs.readFileSync("points.json"));
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
          "לחץ על הכפתור לסובב!\n💎 מחיר: 1000 נקודות"
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

    const amount = points[userId] || 0;


    if (amount < COST) {
      return interaction.reply({
        content: "❌ אין לך מספיק נקודות",
        ephemeral: true
      });
    }


    points[userId] -= COST;


    const prizes = [
      0,
      500,
      1000,
      2000,
      5000
    ];


    const prize =
      prizes[Math.floor(Math.random() * prizes.length)];


    points[userId] += prize;

    savePoints();


    return interaction.reply(
      `🎡 ${interaction.user} סובב!\nזכית ב־💎 ${prize} נקודות`
    );

  }

});


client.login(TOKEN);
