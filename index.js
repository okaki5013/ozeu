const {
    Client,
    GatewayIntentBits,
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    Routes
} = require("discord.js");
const { REST } = require("@discordjs/rest");

const TOKEN = "MTQ0MDI4MTcwMzAyODM2MzMyNg.GMHeci.It3I2_EY04iu0n56GZ3VQtpMdoV5ey4YmTEnMo";
const CLIENT_ID = "1440281703028363326";


// ====== client作成 ======
const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// ====== スラッシュコマンド登録 ======
const commands = [
    new SlashCommandBuilder()
        .setName("irrrai")
        .setDescription("匿名依頼カードを出す")
        .addChannelOption(opt =>
            opt.setName("channel")
                .setDescription("招待リンクの送信先チャンネル")
                .setRequired(true)
        )
];

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
    try {
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log("Slash command setup OK");
    } catch (err) {
        console.error(err);
    }
})();

// ====== ready ======
client.once("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
});

// ====== interactionCreate まとめ ======
client.on("interactionCreate", async (interaction) => {
    // ----- /irrrai コマンド -----
    if (interaction.isChatInputCommand() && interaction.commandName === "irrrai") {
        const targetChannel = interaction.options.getChannel("channel");

        const embed = new EmbedBuilder()
            .setTitle("匿名で依頼する")
            .setDescription("下のボタンを押して招待リンクを送れます。")
            .setColor("Red");

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`openform_${targetChannel.id}`)
                .setLabel("依頼する")
                .setStyle(ButtonStyle.Danger)
        );

        await interaction.reply({ embeds: [embed], components: [row] });
        return;
    }

    // ----- ボタン押したらモーダル -----
    if (interaction.isButton() && interaction.customId.startsWith("openform_")) {
        const channelID = interaction.customId.split("openform_")[1];

        const modal = new ModalBuilder()
            .setCustomId(`irrrai_modal_${channelID}`)
            .setTitle("招待リンク依頼");

        const inviteInput = new TextInputBuilder()
            .setCustomId("invite")
            .setLabel("招待リンク (discord.gg/ のみ)")
            .setPlaceholder("discord.gg/xxxx")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(inviteInput));
        await interaction.showModal(modal);
        return;
    }

    // ----- モーダル送信 -----
    if (interaction.isModalSubmit() && interaction.customId.startsWith("irrrai_modal_")) {
        const channelID = interaction.customId.replace("irrrai_modal_", "");
        const sendChannel = await client.channels.fetch(channelID);

        const invite = interaction.fields.getTextInputValue("invite");

        const regex = /^(https:\/\/discord\.gg\/|discord\.gg\/).+/i;
        if (!regex.test(invite)) {
            return interaction.reply({
                content: "❌ **discord.gg/** 形式のみ有効です。",
                ephemeral: true
            });
        }

        // ここが普通のテキスト送信
        await sendChannel.send(invite);

        await interaction.reply({
            content: "✅ 依頼を送信しました！",
            ephemeral: true
        });
        return;
    }
});

// ====== client login ======
client.login(TOKEN);