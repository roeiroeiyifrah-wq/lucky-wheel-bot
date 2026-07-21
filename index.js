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
const SPECIAL_ROLE_ID = "1529155524028010637";


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

      const msg = await interaction.reply({
        content: `💎 יש לך ${amount} נקודות`,
        ephemeral: false,
        fetchReply: true
      });

      setTimeout(() => {
        msg.delete().catch(() => {});
      }, 5000);

      return;
    }



    if (interaction.commandName === "addpoints") {


      if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {

        const msg = await interaction.reply({
          content: "❌ אין לך הרשאה",
          ephemeral: false,
          fetchReply: true
        });

        setTimeout(() => {
          msg.delete().catch(() => {});
        }, 2000);

        return;
      }


      const user = interaction.options.getUser("user");
      const amount = interaction.options.getInteger("amount");


      if (!points[user.id]) {
        points[user.id] = 0;
      }


      points[user.id] += amount;

      savePoints();


      const msg = await interaction.reply({
        content: `✅ נוספו ${amount} נקודות ל־${user}`,
        fetchReply: true
      });


      setTimeout(() => {
        msg.delete().catch(() => {});
      }, 2000);


      return;

    }



    if (interaction.commandName === "wheel") {


      if (interaction.channel.id !== WHEEL_CHANNEL_ID) {

        const msg = await interaction.reply({
          content: "❌ הפקודה רק בחדר הגלגל",
          fetchReply: true
        });

        setTimeout(() => {
          msg.delete().catch(() => {});
        }, 5000);

        return;
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

      const msg = await interaction.reply({
        content: "❌ אין לך מספיק נקודות",
        fetchReply: true
      });

      setTimeout(() => {
        msg.delete().catch(() => {});
      }, 5000);

      return;

    }


    points[userId] -= COST;



    const roll = Math.random() * 100;

    let result;


    if (roll < 1) {

      if (member.roles.cache.has(SPECIAL_ROLE_ID)) {

        points[userId] += 1000;
        result = "🎁 כבר יש לך פרס מיוחד! קיבלת 💎 1000 נקודות";

      } else {

        await member.roles.add(SPECIAL_ROLE_ID);
        result = "🎁 זכית בפרס מיוחד!";

      }


    } else if (roll < 6) {

      if (member.roles.cache.has(LUCK_ROLE_ID)) {

        points[userId] += 500;
        result = "🎡 כבר יש לך רול מזל! קיבלת 💎 500 נקודות";

      } else {

        await member.roles.add(LUCK_ROLE_ID);
        result = "🎡 זכית ברול מזל!";

      }


    } else if (roll < 14) {

      points[userId] += 1000;
      result = "💎 זכית ב־1000 נקודות";


    } else if (roll < 39) {

      points[userId] += 500;
      result = "💎 זכית ב־500 נקודות";


    } else if (roll < 64) {

      points[userId] += 100;
      result = "💎 זכית ב־100 נקודות";


    } else {

      result = "😭 לא זכית הפעם";

    }


    savePoints();


    const msg = await interaction.reply({
      content: `🎡 ${interaction.user} סובב את הגלגל!\n\n${result}`,
      fetchReply: true
    });


    setTimeout(() => {
      msg.delete().catch(() => {});
    }, 5000);


  }

});


client.login(TOKEN);
