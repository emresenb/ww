const Discord = require('discord.js');
const ayarlar = require('../ayarlar.json');

let botid = ('672381245115727911') //bu yere botun id'sini yapıştırın.
//eğer botunuz dbl(discord bot list) de yoksa Bota Oy Ver (Vote) olmucaktır.

exports.run = (client, message, args) => {
    const embed = new Discord.RichEmbed()
        .setAuthor(`${client.user.username} `, client.user.avatarURL)
        .setColor('0x36393E')
        .setTitle(`${client.user.username} - Müzik-Komutlar`)
        .setDescription(`:small_orange_diamond:cr!radyo ➠ Radyoyu Açmanızı Sağlar.
:small_blue_diamond:cr!çal ➠ Belirtilen müziği oynatmayı sağlar.
:small_orange_diamond:cr!kapat ➠ Belirtilen müziği kapatmayı sağlar sağlar. 
:small_blue_diamond:cr!geç ➠ Sıradaki müziğe geçiş yapar.
:small_orange_diamond:cr!duraklat ➠ Müziği durkaklatır.
:small_blue_diamond:cr!devam ➠ Müziği devam ettirir.` )  
        .setThumbnail(client.user.avatarURL)
        .setFooter(`${message.author.username} Tarafından İstendi.`, message.author.avatarURL)
    return message.channel.sendEmbed(embed);
  
  
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: [''],
  permLevel: 0,
};

exports.help = {
  name: 'müzik',
  description: '',
  usage: ''
};