var Service, Characteristic;
var ReqP = require("request-promise");

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-moonraker","Moonraker",Moonraker);
};

function Moonraker(log, config) {
  this.log = log;

  this.name = config["name"];
  this.server = config["server"] || 'http://mainsailos.local';
  this.apiKey = config["api_key"] || 'anything';

  log.info("Initialized Moonraker accessory at " + this.server);
}

Moonraker.prototype = {
  getServices: function() {
    var informationService = new Service.AccessoryInformation();
    informationService
      .setCharacteristic(Characteristic.Manufacturer, "Ed")
      .setCharacteristic(Characteristic.Model, "Moonraker");

    var motion = new Service.MotionSensor();
    var battery = new Service.Battery();

    motion     
      .getCharacteristic(Characteristic.MotionDetected)
      .onGet(this.isPrinting.bind(this));

    battery       
      .getCharacteristic(Characteristic.BatteryLevel)
      .onGet(this.printProgress.bind(this));

    motion.setCharacteristic(Characteristic.Name, this.name);
    battery.setCharacteristic(Characteristic.Name, this.name);

    return [informationService, motion, battery];
  },

  printProgress() {
    var keys = {
      method: 'GET',
      uri: this.server + '/printer/objects/query?display_status=progress',
      json: true
    };

    return ReqP(keys).then(function(values) {
      return (values.result.status.display_status.progress)*100;
    });
  },

  isPrinting() {
    var keys = {
      method: 'GET',
      uri: this.server + '/printer/objects/query?print_stats=state',
      json: true
    };

    return ReqP(keys).then(function(values) {
      return (values.result.status.print_stats.state == "printing");
    });
  }
}
