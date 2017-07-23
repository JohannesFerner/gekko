console.info('Loading Slack!');

var log = require('../core/log');
var moment = require('moment');
var _ = require('lodash');
var util = require('../core/util.js');
var config = util.getConfig();
var SlackBot = require('slackbots');
var slackBotConfig = config.slack;

// create a bot
var bot = new SlackBot({
    token: slackBotConfig.token, // Add a bot https://my.slack.com/services/new/bot and put the token
    name: slackBotConfig.botName
});

var price = 'N/A';

var Actor = function (next) {
    _.bindAll(this);
    log.info('Setup Slack!');


    if (slackBotConfig.sendStartMessage) {
        this.sendSlackMessage(
            "Gekko has started ::: " +
            [
                "I've just started watching ",
                config.watch.exchange,
                ' ',
                config.watch.currency,
                '/',
                config.watch.asset,
                ". I'll let you know when I got some advice"
            ].join('')
        );
    }
}

Actor.prototype.sendSlackMessage = (message) => {
    var params = {
        icon_emoji: slackBotConfig.icon_emoji
    };
    bot.postMessageToChannel(slackBotConfig.channel, message, params);
    log.debu('Sent to Slack: ', message, params);
}

Actor.prototype.init = function (data) {
};

Actor.prototype.processCandle = function (candle, next) {
    // console.info('CANDLE!!')
    this.price = candle.close;
    next();
};

Actor.prototype.processAdvice = function (advice) {
    if (advice.recommendation == 'soft' && slackBotConfig.muteSoft) return;

    log.debug(config, advice);
    var strategyName = config.tradingAdvisor;
    var strategyCandleSize = config.candleSize;

    var text = [
        moment(advice.candle.start).format('YYYY-MM-DD HH:mm'),
        config.watch.exchange,
        '/',
        config.watch.asset,
        config.watch.currency,
        ' GO ',
        advice.recommendation,
        ' @ ',
        this.price,
        advice
    ].join(' ');

    this.sendSlackMessage(text);


};

module.exports = Actor;
