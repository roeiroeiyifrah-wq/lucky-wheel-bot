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
    .setDescription("בדיקת נקודות")
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
    { body: commands }
  );
});


client.login(TOKEN);
