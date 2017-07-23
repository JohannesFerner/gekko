/*
    Johannes - ADX Strategy 22.07.2017
 */

// helpers
var _ = require('lodash');
var log = require('../core/log.js');

// configuration
var config = require('../core/util.js').getConfig();
var settings = config.JohannesADX;

settings.adx = {
    optInTimePeriod: 14
};


// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function () {
    this.i = 0;

    this.name = "JohannesADX";
    log.debug('Initialize JohannesADX!');
    // how many candles do we need as a base
    // before we can start giving advice?
    this.requiredHistory = config.tradingAdvisor.historySize + 15;

    // define the indicators we need
    // this.addIndicator('macd', 'MACD', settings);
    this.addTalibIndicator('ADX', 'adx', {optInTimePeriod: 14});
    this.addTalibIndicator('DX', 'dx', {optInTimePeriod: 14});
    this.addTalibIndicator('MINUS_DI', 'minus_di', {optInTimePeriod: 14});
    // this.addTalibIndicator('MINUS_DM', 'minus_dm', {optInTimePeriod: 14});
    this.addTalibIndicator('PLUS_DI', 'plus_di', {optInTimePeriod: 14});
    // this.addTalibIndicator('PLUS_DM', 'plus_dm', {optInTimePeriod: 14});

    this.addIndicator('macd', 'MACD', {
        short: 10,
        long: 21,
        signal: 9,
        // the difference between the EMAs (to act as triggers)
        thresholds: {
            down: -0.025,
            up: 0.025,
            // How many candle intervals should a trend persist
            // before we consider it real?
            persistence: 1
        }
    });
    log.debug('Aadding Indicator MACD')


    this.longAdviced = false;
    this.shortAdviced = false;
    this.currentlyInMarket = false;
    this.marketPosition = null;

}

method.buy = function(){
    if (!this.longAdviced) {
        this.longAdviced = true;
        this.shortAdviced = false;
        this.currentlyInMarket = true;
        this.advice('long');
    } else {
        if (this.currentlyInMarket === true) {
            this.currentlyInMarket = true;
            this.advice('long')
        }
        else {
            this.advice();
        }
    }
};

method.sell= function(){
    if (!this.shortAdviced) {
        this.longAdviced = false;
        this.shortAdviced = true;
        this.advice('short');
    }
    else {
        if (this.currentlyInMarket === true) {
            this.currentlyInMarket = false;
            this.advice('short')
        }
        else {
            this.advice();
        }
    }
}

// what happens on every new candle?
method.update = function (candle) {
    // nothing!
    // log.debug('Updated Candle!');
}

// for debugging purposes: log the last calculated
// EMAs and diff.
method.log = function () {
    var digits = 4;
    var adx = parseFloat(this.talibIndicators.ADX.result.outReal);
    var DX = parseFloat(this.talibIndicators.DX.result.outReal);
    var MINUS_DI = parseFloat(this.talibIndicators.MINUS_DI.result.outReal);
    var PLUS_DI = parseFloat(this.talibIndicators.PLUS_DI.result.outReal);
    var DI_DIFF = PLUS_DI - MINUS_DI;
    // log.debug('\t', 'adx:', adx.toFixed(digits));
    // log.debug('\t', 'DX:', DX.toFixed(digits));
    // log.debug('\t', 'MINUS_DI:', MINUS_DI.toFixed(digits));
    // log.debug('\t', 'PLUS_DI:', PLUS_DI.toFixed(digits));
    // log.debug('\t', 'DI_DIFF:', DI_DIFF.toFixed(digits));

}
method.check = function () {
    // console.info('i', this.i);
    this.i++;
    if (this.i === 15) {
        console.info('this', this);
    }
    if(this.marketPosition){
        console.info(this.marketPosition)
    }
    // log.debug(this.indicators);
    // log.debug(this.talibIndicators);
    if (this.talibIndicators.ADX.result === undefined) {
        log.debug('ADX undefined!', this.talibIndicators.ADX)
        return;
    }
    else {
        // this.log();
        var adx = parseFloat(this.talibIndicators.ADX.result.outReal);
        var DX = parseFloat(this.talibIndicators.DX.result.outReal);
        var MINUS_DI = parseFloat(this.talibIndicators.MINUS_DI.result.outReal);
        var PLUS_DI = parseFloat(this.talibIndicators.PLUS_DI.result.outReal);
        var DI_DIFF = PLUS_DI - MINUS_DI;


        /* GO LONG:
        1. ADX > 20
        2. PLUS_DI > 20
        */
        if (adx > 20) {
            log.debug('ADX > 20');
            if (PLUS_DI > 20) {
                log.debug('PLUS_DI > 20');
                if (MINUS_DI < 20) {
                    log.debug('MINUS_DI < 20');
                    if (DI_DIFF > 3) {
                        log.debug('DI_DIFF > 3');
                        this.buy();
                    }
                }
            }
            else if (PLUS_DI < 20) {
                if (this.longAdviced) {
                    this.longAdviced = false;
                    this.shortAdviced = false;
                    this.advice();
                }
            }

            if (MINUS_DI > 20) {
                log.debug('MINUS_DI > 20');
                if (PLUS_DI > 20) {
                    log.debug('PLUS_DI < 20');
                    if (DI_DIFF > 3) {
                        log.debug('DI_DIFF > 3');
                        this.sell();

                    }
                }
            }
            else if (MINUS_DI < 20) {
                if (this.shortAdviced) {
                    this.longAdviced = false;
                    this.shortAdviced = false;
                    this.advice();
                }
            }
        }
        else {
            log.debug('ADX < 20');
            this.longAdviced = false;
            this.shortAdviced = false;
            this.advice();
        }

    }


    this.advice();
}

module.exports = method;
