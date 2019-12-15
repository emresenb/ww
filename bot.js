const express = require("express");
const app = express();
const http = require("http");
app.get("/", (request, response) => {
  console.log(`[PING] Açık tutuyorum...`);
  response.sendStatus(200);
});
    app.listen(process.env.PORT);
    setInterval(() => {
    http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
    }, 280000);
const Discord = require('discord.js');
const client = new Discord.Client();
const ayarlar = require('./ayarlar.json');
const chalk = require('chalk');
const fs = require('fs');
const ms = require('ms');
const moment = require('moment');
const Jimp = require('jimp');
const db = require('quick.db');
const YouTube = require("simple-youtube-api");
const ytdl = require("ytdl-core");
const youtube = new YouTube("AIzaSyCkT_L10rO_NixDHNjoAixUu45TVt0ES-s");
const queue = new Map();
const { promisify } = require("util");
require('./util/eventLoader')(client);


var prefix = ayarlar.prefix;

const log = message => {
    console.log(`${message}`);
};




client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();
fs.readdir('./komutlar/', (err, files) => {
    if (err) console.error(err);
    log(`${files.length} komut yüklenecek.`);
    files.forEach(f => {
        let props = require(`./komutlar/${f}`);
        log(`Yüklenen komut: ${props.help.name}.`);
        client.commands.set(props.help.name, props);
        props.conf.aliases.forEach(alias => {
            client.aliases.set(alias, props.help.name);
        });
    });
});




client.reload = command => {
    return new Promise((resolve, reject) => {
        try {
            delete require.cache[require.resolve(`./komutlar/${command}`)];
            let cmd = require(`./komutlar/${command}`);
            client.commands.delete(command);
            client.aliases.forEach((cmd, alias) => {
                if (cmd === command) client.aliases.delete(alias);
            });
            client.commands.set(command, cmd);
            cmd.conf.aliases.forEach(alias => {
                client.aliases.set(alias, cmd.help.name);
            });
            resolve();
        } catch (e) {
            reject(e);
        }
    });
};

client.load = command => {
    return new Promise((resolve, reject) => {
        try {
            let cmd = require(`./komutlar/${command}`);
            client.commands.set(command, cmd);
            cmd.conf.aliases.forEach(alias => {
                client.aliases.set(alias, cmd.help.name);
            });
            resolve();
        } catch (e) {
            reject(e);
        }
    });
};




client.unload = command => {
    return new Promise((resolve, reject) => {
        try {
            delete require.cache[require.resolve(`./komutlar/${command}`)];
            let cmd = require(`./komutlar/${command}`);
            client.commands.delete(command);
            client.aliases.forEach((cmd, alias) => {
                if (cmd === command) client.aliases.delete(alias);
            });
            resolve();
        } catch (e) {
            reject(e);
        }
    });
};

client.elevation = message => {
    if (!message.guild) {
        return;
    }
    let permlvl = 0;
    if (message.member.hasPermission("BAN_MEMBERS")) permlvl = 2;
    if (message.member.hasPermission("ADMINISTRATOR")) permlvl = 3;
    if (message.author.id === ayarlar.sahip) permlvl = 4;
    return permlvl;
};

var regToken = /[\w\d]{24}\.[\w\d]{6}\.[\w\d-_]{27}/g;
// client.on('debug', e => {
//   console.log(chalk.bgBlue.green(e.replace(regToken, 'that was redacted')));
// });

client.on('warn', e => {
    console.log(chalk.bgYellow(e.replace(regToken, 'that was redacted')));
});

client.on('error', e => {
    console.log(chalk.bgRed(e.replace(regToken, 'that was redacted')));
});

client.login(ayarlar.token);
client.on("voiceStateUpdate", (old, neww) => {
  let ses = old.voiceChannel;
  if (!neww.voiceChannel) {
    if (neww.id === client.user.id) {
      console.log(`BOT: Bot yeniden başlatılıyor...`);
      process.exit(0);
      console.clear();
    }
  }
});
client.on("message", async msg => {
  const args = msg.content.split(" ");
  const searchString = args.slice(1).join(" ");
  const url = args[1] ? args[1].replace(/<(.+)>/g, "$1") : "";
  const serverQueue = queue.get(msg.guild.id);
  let command = msg.content.toLowerCase().split(" ")[0];
  command = command.slice(prefix.length);
  if (msg.content.startsWith("!play")) {
    console.log("mesaj çalışıyor");
    let mesaj2 =
      "**Komutu kullanabilmek için bir ses kanalında bulunmalısınız.**"; // hata neden var onu bulmak için yapıyorum

    const voiceChannel = msg.member.voiceChannel;
    let send = new Discord.RichEmbed()
      .setColor("RANDOM")
      .setDescription(mesaj2)
      .setTimestamp()
      .setFooter("Müzik", "");
    console.log(mesaj2); 
    if (!voiceChannel) return msg.channel.sendEmbed(send);

    if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
      const playlist = await youtube.getPlaylist(url);
      const videos = await playlist.getVideos();
      for (const video of Object.values(videos)) {
        const video2 = await youtube.getVideoByID(video.id); // eslint-disable-line no-await-in-loop
        await handleVideo(video2, msg, voiceChannel, true); // eslint-disable-line no-await-in-loop
      }
      return msg.channel
        .sendEmbed(new Discord.RichEmbed())
        .setTitle(`**\`${playlist.title}\` adlı şarkı kuyruğa eklendi.**`);
    } else {
      try {
        var video = await youtube.getVideo(url);
      } catch (error) {
        try {
          var videos = await youtube.searchVideos(searchString, 10);
          let index = 0;

          msg.channel.sendEmbed(
            new Discord.RichEmbed()
              .setTitle("Şarkı Seçimi")
              .setDescription(
                `${videos
                  .map(video2 => `**${++index} -** ${video2.title}`)
                  .join("\n")}`
              )
              .setFooter(
                "**__1__-__10__ arasında bir sayı belirtmelisin. Belirtmezsen 10 saniye içinde komut iptal edilecektir.**"
              )
              .setFooter("Örnek kullanım: 1")
              .setColor("0x36393E")
          );
          msg.delete(5000);
          try {
            var response = await msg.channel.awaitMessages(
              msg2 => msg2.content > 0 && msg2.content < 11,
              {
                maxMatches: 1,
                time: 10000,
                errors: ["time"]
              }
            );
          } catch (err) {
            console.error(err);
            return msg.channel.sendEmbed(
              new Discord.RichEmbed()
                .setColor("0x36393E")
                .setDescription(
                  "**10 saniye boyunca bir şarkı seçmediğiniz için komut iptal edildi.**."
                )
            );
          }
          const videoIndex = parseInt(response.first().content);
          var video = await youtube.getVideoByID(videos[videoIndex - 1].id);
        } catch (err) {
          console.error(err);
          return msg.channel.sendEmbed(
            new Discord.RichEmbed()
              .setColor("0x36393E")
              .setDescription(`**YouTube'da böyle bir şarkı mevcut değil!**`)
          );
        }
      }
      return handleVideo(video, msg, voiceChannel);
    }
  } else if (command === "gir") {
    return new Promise((resolve, reject) => {
      const voiceChannel = msg.member.voiceChannel;
      if (!voiceChannel || voiceChannel.type !== "voice")
        return msg.reply(
          "**Kanalda kimse bulunmadığı için kanalda durmama gerek yok. Bu yüzden kanaldan ayrıldım.**"
        );
      voiceChannel
        .join()
        .then(connection => resolve(connection))
        .catch(err => reject(err));
    });
  } else if (command === "geç") {
    if (!msg.member.voiceChannel)
      if (!msg.member.voiceChannel)
        return msg.channel.sendEmbed(
          new Discord.RichEmbed()
            .setColor("RANDOM")
            .setDescription(
              "**Komutu kullanabilmek için bir ses kanalında bulunmalısınız.**"
            )
        );
    if (!serverQueue)
      return msg.channel.sendEmbed(
        new Discord.RichEmbed()
          .setColor("RANDOM")
          .setDescription("**Şuanda herhangi bir şarkı zaten oynatılmıyor.**")
      );
    serverQueue.connection.dispatcher.end("**Sıradaki Şarkıya Geçildi!**");
    return undefined;
  } else if (command === "dur") {
    if (!serverQueue || !serverQueue.playing)
      return msg.channel.send("**Şuanda zaten bir şarkı oynatılmıyor.");

    if (serverQueue && serverQueue.playing) {
      serverQueue.playing = false;
      serverQueue.connection.dispatcher.pause();
      return msg.channel.sendEmbed(
        new Discord.RichEmbed()
          .setTitle("**Şarkı Durduruldu!**")
          .setColor("RANDOM")
      );
    }
  } else if (command === "volume") {
    if (!msg.member.voiceChannel)
      if (!msg.member.voiceChannel)
        return msg.channel.sendEmbed(
          new Discord.RichEmbed()
            .setColor("RANDOM")
            .setDescription(
              "**Komutu kullanabilmek için bir ses kanalında bulunmalısınız.**"
            )
        );

    if (!serverQueue)
      return msg.channel.sendEmbed(
        new Discord.RichEmbed()
          .setColor("RANDOM")
          .setTitle(
            "**Herhangi bir şarkı oynatılmadığı için sesini ayarlayamam!**"
          )
      );

    if (args[1] > 200)
      return msg.reply("**Ses seviyesi 200'den fazla olamaz.**");

    if (!args[1])
      return msg.channel.sendEmbed(
        new Discord.RichEmbed()
          .setTitle(
            `:loud_sound: Şuanki Ses Seviyesi: **${serverQueue.volume}**`
          )
          .setColor("RANDOM")
      );

    serverQueue.volume = args[1];
    serverQueue.connection.dispatcher.setVolumeLogarithmic(args[1] / 5);
    return msg.channel.sendEmbed(
      new Discord.RichEmbed()
        .setTitle(`:loud_sound: Ses Seviyesi Ayarlanıyor: **${args[1]}**`)
        .setColor("RANDOM")
    );
  } else if (command === "çalan") {
    if (!serverQueue)
      return msg.channel.sendEmbed(
        new Discord.RichEmbed()
          .setTitle("**Şuan herhangi bir şarkı çalınmıyor.")
          .setColor("RANDOM")
      );
    return msg.channel.sendEmbed(
      new Discord.RichEmbed()
        .setColor("RANDOM")
        .setTitle("Çalan")
        .addField(
          "Başlık",
          `[${serverQueue.songs[0].title}](${serverQueue.songs[0].url})`,
          true
        )
        .addField(
          "Süre",
          `${serverQueue.songs[0].durationm}:${serverQueue.songs[0].durations}`,
          true
        )
    );
  } else if (msg.content.startsWith === prefix + "queue") {
    let index = 0;
    if (!serverQueue)
      return msg.channel.sendEmbed(
        new Discord.RichEmbed()
          .setTitle("**Herhangi bir şarkı sıraya eklenmemiş.**")
          .setColor("RANDOM")
      );
    return msg.channel
      .sendEmbed(
        new Discord.RichEmbed()
          .setColor("RANDOM")
          .setTitle("Şarkı Kuyruğu")
          .setDescription(
            `${serverQueue.songs
              .map(song => `**${++index} -** ${song.title}`)
              .join("\n")}`
          )
      )
      .addField("Şu Anda Çalınan: " + `${serverQueue.songs[0].title}`);
  } else if (command === "duraklat") {
    if (serverQueue && serverQueue.playing) {
      serverQueue.playing = false;
      serverQueue.connection.dispatcher.pause();
      return msg.channel.sendEmbed(
        new Discord.RichEmbed()
          .setTitle("**:pause_button: Şarkı Durduruldu!**")
          .setColor("RANDOM")
      );
    }
    return msg.channel.send("**Şuanda herhangi bir şarkı oynatılmıyor.**");
  } else if (command === "devam") {
    if (serverQueue && serverQueue.playing)
      return msg.reply("**Zaten şarkı oynatılıyor.**");

    if (serverQueue && !serverQueue.playing) {
      serverQueue.playing = true;
      serverQueue.connection.dispatcher.resume();
      return msg.channel.sendEmbed(
        new Discord.RichEmbed()
          .setTitle("**:arrow_forward: **Şarkı, çalınmaya devam ediyor.**")
          .setColor("RANDOM")
      );
    }
    return msg.channel.sendEmbed(
      new Discord.RichEmbed()
        .setTitle("**Şuanda herhangi bir şarkı oynatılmıyor.**")
        .setColor("RANDOM")
    );
  }

  return undefined;
});

async function handleVideo(video, msg, voiceChannel, playlist = false) {
  const serverQueue = queue.get(msg.guild.id);
  console.log(video);
  const song = {
    id: video.id,
    title: video.title,
    url: `https://www.youtube.com/watch?v=${video.id}`,
    durationh: video.duration.hours,
    durationm: video.duration.minutes,
    durations: video.duration.seconds,
    views: video.views
  };
  if (!serverQueue) {
    const queueConstruct = {
      textChannel: msg.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: 5,
      playing: true
    };
    queue.set(msg.guild.id, queueConstruct);

    queueConstruct.songs.push(song);

    try {
      var connection = await voiceChannel.join();
      queueConstruct.connection = connection;
      play(msg.guild, queueConstruct.songs[0]);
    } catch (error) {
      console.error(
        `❎ | **Şarkı Sisteminde Problem Var Hata Nedeni: ${error}**`
      );
      queue.delete(msg.guild.id);
      return msg.channel.sendEmbed(
        new Discord.RichEmbed()
          .setTitle(
            `❎ | **Şarkı Sisteminde Problem Var Hata Nedeni: ${error}**`
          )
          .setColor("RANDOM")
      );
    }
  } else {
    serverQueue.songs.push(song);
    console.log(serverQueue.songs);
    if (playlist) return undefined;
    return msg.channel.sendEmbed(
      new Discord.RichEmbed()
        .setTitle(`**\`${song.title}\` adlı şarkı kuyruğa eklendi!**`)
        .setColor("RANDOM")
    );
  }
  return undefined;
}

function play(guild, song) {
  const serverQueue = queue.get(guild.id);

  if (!song) {
    serverQueue.voiceChannel.leave();
    queue.delete(guild.id);
    return;
  }
  console.log(serverQueue.songs);

  const dispatcher = serverQueue.connection
    .playStream(ytdl(song.url))
    .on("end", reason => {
      if (reason === "**Yayın Akış Hızı yeterli değil.**")
        console.log("Şarkı Bitti.");
      else console.log(reason);
      serverQueue.songs.shift();
      play(guild, serverQueue.songs[0]);
    })
    .on("error", error => console.error(error));
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);

  serverQueue.textChannel.sendEmbed(
    new Discord.RichEmbed()
      .setColor("RANDOM")
      .setColor("RANDOM")
      .setTitle(
        "**🎙 :ok_hand: :orange_heart:  :gem: Şarkı Başladı :gem: :orange_heart:  :ok_hand:  **"
      )
      .setThumbnail(
        `https://i.ytimg.com/vi/${song.id}/default.jpg?width=80&height=60`
      )
      .setImage(
        "https://cdn.discordapp.com/attachments/645797096842199051/649361326992523274/efekt.gif"
      )

      .addField(
        ":flag_tr: :cupid: :kiss: Discord : !YILMAZ#9312\n\n",
        `[${song.title}](${song.url})`,
        true
      )
      .setColor(0xdf01a5)

      .addField("Destek Sunucusu!", `[Tıkla!](https://discord.gg/R85ha4N)`)

      .addField(
        "Bot Davet Et!",
        `[Tıkla!](https://discordapp.com/oauth2/authorize?client_id=649660381261987861&scope=bot&permissions=2146958847)`,
        true
      )
      .addField("\nSes Seviyesi", `${serverQueue.volume}%`, true)

      .addField("Süre", `${song.durationm}:${song.durations}`, true)
      .setColor("RANDOM")
  );
}