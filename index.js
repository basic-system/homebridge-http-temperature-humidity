var Service, Characteristic;
var request = require('sync-request');

var temperatureService;
var humidityService;
var AirService;
var NoisyService;
var LightService;
var url;
var humidity = 0;
var temperature = 0;
var noisy = 0;
var air = 0;
var light = 0;

module.exports = function (homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory("homebridge-httptemperaturehumidity", "HttpTemphum", HttpTemphum);
}


function HttpTemphum(log, config) {
    this.log = log;

    // url info
    this.url = config["url"];
    this.http_method = config["http_method"] || "GET";
    this.sendimmediately = config["sendimmediately"] || "";
    this.name = config["name"];
    this.manufacturer = config["manufacturer"] || "Luca Manufacturer";
    this.model = config["model"] || "Luca Model";
    this.serial = config["serial"] || "Luca Serial";
    this.humidity = config["humidity"];
    this.noisy = config["noisy"];
    this.air = config["air"];
    this.light = config["light"];
}

HttpTemphum.prototype = {

    httpRequest: function (url, body, method, username, password, sendimmediately, callback) {
        request({
                    url: url,
                    body: body,
                    method: method,
                    rejectUnauthorized: false
                },
                function (error, response, body) {
                    callback(error, response, body)
                })
    },

    getStateHumidity: function(callback){
        callback(null, this.humidity);
    },

    getStateNoisy: function(callback){
        callback(null, this.noisy);
    },

    getStateAir: function(callback){
        callback(null, this.air);
    },

    getStateLight: function(callback){
        callback(null, this.light);
    },

    getState: function (callback) {
        var body;
        var res = request(this.http_method, this.url, {});
        if(res.statusCode > 400){
            this.log('HTTP power function failed');
            callback(error);
        } else {
            this.log('HTTP power function succeeded!');
            var info = JSON.parse(res.body);

            temperatureService.setCharacteristic(Characteristic.CurrentTemperature, info.temperature);
            if(this.humidity !== false)
                humidityService.setCharacteristic(Characteristic.CurrentRelativeHumidity, info.humidity);
            if(this.air !== false)
                airService.setCharacteristic(Characteristic.CurrentRelativeAir, info.air);
            if(this.noisy !== false)
                noisyService.setCharacteristic(Characteristic.CurrentRelativeNoisy, info.noisy);
            if(this.light !== false)
                lightService.setCharacteristic(Characteristic.CurrentRelativeLight, info.light);

            this.log(res.body);
            this.log(info);

            this.temperature = info.temperature;
            if(this.humidity !== false)
                this.humidity = info.humidity;
            if(this.air !== false)
                this.air = info.air;
            if(this.light !== false)
                this.light = info.light;
            if(this.noisy !== false)
                this.noisy = info.noisy;

            callback(null, this.temperature);
        }
    },

    identify: function (callback) {
        this.log("Identify requested!");
        callback(); // success
    },

    getServices: function () {
        var services = [],
        informationService = new Service.AccessoryInformation();
        informationService
                .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
                .setCharacteristic(Characteristic.Model, this.model)
                .setCharacteristic(Characteristic.SerialNumber, this.serial);
        services.push(informationService);

        temperatureService = new Service.TemperatureSensor(this.name);
        temperatureService
                .getCharacteristic(Characteristic.CurrentTemperature)
                .on('get', this.getState.bind(this));
        services.push(temperatureService);

        if(this.humidity !== false){
          humidityService = new Service.HumiditySensor(this.name);
          humidityService
                  .getCharacteristic(Characteristic.CurrentRelativeHumidity)
                  .on('get', this.getStateHumidity.bind(this));
          services.push(humidityService);
        }

        if(this.air !== false){
          airService = new Service.AirSensor(this.name);
          AirService
                  .getCharacteristic(Characteristic.CurrentRelativeAir)
                  .on('get', this.getStateAir.bind(this));
          services.push(AirService);
        }

        if(this.noisy !== false){
          noisyService = new Service.NoisySensor(this.name);
          NoisyService
                  .getCharacteristic(Characteristic.CurrentRelativeNoisy)
                  .on('get', this.getStateNoisy.bind(this));
          services.push(NoisyService);
        }

        if(this.light !== false){
          lightService = new Service.LightSensor(this.name);
          LightService
                  .getCharacteristic(Characteristic.CurrentRelativeLight)
                  .on('get', this.getStateLight.bind(this));
          services.push(LightService);
        }

        return services;
    }
};
