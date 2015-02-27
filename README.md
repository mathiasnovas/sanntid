# Sanntid.js 

Sanntid.js is a node.js module for getting real-time data from the public Ruter API.

## Installation
Simply do

    npm install sanntid
    
Use the `-g` option to make the command globally available as `sanntid`.

## How to work it

### As a CLI

    ./sanntid.js <locationID>

Or you can search for a location:

	./sanntid.js sofienberg

The result would be something like this:

    🚋  17 Rikshospitalet - in 2 minutes
    🚌  31 Snarøya - in 2 minutes

A list of locations and their IDs can be [downloaded from Ruter lab's pages.](http://labs.trafikanten.no/how-to-use-the-api.aspx)

You can limit the results to a specific direction by specifying 1 or 2 as the second parameter:

    ./sanntid.js sofienberg 1

### As a node module

```Javascript
var sanntid = require('./sanntid'),
	locations = sanntid.search('sofienberg');

for (var i = 0; i < locations.length; i++) {
	sanntid.getRealtimeData(locations[i], '1', function (data) {
	    console.log(data);
	});
}
```


## License
The MIT License

Copyright &copy; 2015 - Mathias Novas
