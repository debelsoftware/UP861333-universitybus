const server = require("../server.js");

const assert = require('assert');
describe('#searchForUser(userID)', () => {
  it('should return false when user is not found in database', () => {
    return server.searchForUser("notInHere").then(result => {
      assert.equal(result, false)
    });
  });
  it('should return true when user is found in database', () => {
    return server.searchForUser("118183512168514310928").then(result => {
      assert.equal(result, true)
    });
  });
});
describe('#verify(token)', () => {
  it('should return "error" when token is not provided correctly', () => {
    return server.verify("notAToken").then(result => {
      assert.equal(result, "error")
    });
  });
});
describe('#calculateDelay(expectedTime, stop)', function() {
  it("should return a status of 'On Time' for scheduled stop it can get to on time", function() {
    assert.equal(server.calculateDelay(32503680000,5).status, "On Time");
  });
  it("should return a status of 'Late' for scheduled stop it's expected late for", function() {
    assert.equal(server.calculateDelay(915148800,5).status, "Late");
  });
});
describe('#getOffsetTime(estimatedMinutes)', function() {
  let day = new Date();
  let minutes = day.getMinutes();
  it("should return a unix timestamp for 5 minutes ahead of the current time", function() {
    assert.equal(new Date(server.getOffsetTime(5)*1000).getMinutes(), minutes+5)
  });
});
describe('#closestStopToBus()', function() {
  it("should return stop 3 if bus is at start of simulated route", function() {
    assert.equal(server.closestStopToBus(), 3)
  });
});
describe('#distanceBetweenPoints(lat1,lon1,lat2,lon2)', function() {
  it("should return 0.9457655089486274 for values 50.791297, -1.095648, 50.789265, -1.082583", function() {
    assert.equal(server.distanceBetweenPoints(50.791297, -1.095648, 50.789265, -1.082583), 0.9457655089486274)
  });
  it("should return 2.9214342407366467 for values 50.794850, -1.067182, 50.796485, -1.108667", function() {
    assert.equal(server.distanceBetweenPoints(50.794850, -1.067182, 50.796485, -1.108667), 2.9214342407366467)
  });
});
describe('#getStopFromLocation()', function() {
  it("Should return -1 for unknown location. Testing: 'my house'", function() {
    assert.equal(server.getStopFromLocation('my house'), -1)
  });
  it("should return 10 for 'anglesea building'", function() {
    assert.equal(server.getStopFromLocation('anglesea building'), 10)
  });
  it("should return 10 for 'anglesea 2.06'", function() {
    assert.equal(server.getStopFromLocation('anglesea 2.06'), 10)
  });
  it("should return 10 for 'aNgLeSeA'", function() {
    assert.equal(server.getStopFromLocation('aNgLeSeA'), 10)
  });
  it("should return 0 for 'BUCKINGHAM'", function() {
    assert.equal(server.getStopFromLocation('BUCKINGHAM'), 0)
  });
});

describe('#dateToHour(isoDate)', function() {
  let date = new Date();
  let iso = date.toISOString();
  let hour = date.getHours();
  it(`should return ${hour} for '${iso}'`, function() {
    assert.equal(server.dateToHour(iso), hour)
  });
});

describe('#dateToDay(isoDate)', function() {
  let date = new Date();
  let iso = date.toISOString();
  let day = date.getDay();
  it(`should return ${day} for '${iso}'`, function() {
    assert.equal(server.dateToDay(iso), day)
  });
});

describe('#fourDigitTimeToUnix(time)', function() {
  it(`should return 36900000 for value '1015'`, function() {
    assert.equal(server.fourDigitTimeToUnix('1015'), '36900000')
  });
  it(`should return 68100000 for value '1855'`, function() {
    assert.equal(server.fourDigitTimeToUnix('1855'), '68100000')
  });
});

describe('#resetUnix(time)', function() {
  it(`should return 29280000 for value '1584532220'`, function() {
    assert.equal(server.resetUnix('1584532220'), '29280000')
  });
  it(`should return 82020000 for value '946036800'`, function() {
    assert.equal(server.resetUnix('946036800'), '82020000')
  });
});

describe('#dateToUnix(time)', function() {
  let date = new Date();
  let iso = date.toISOString();
  let unix = date.getTime();
  it(`should return ${unix} for value '${iso}'`, function() {
    assert.equal(server.dateToUnix(iso), unix)
  });
});
