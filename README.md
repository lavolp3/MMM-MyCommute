# MMM-MyCommute

This a module for the [MagicMirror](https://github.com/MichMich/MagicMirror/tree/develop).

It shows your commute time using Google's Directions API (requires an API Key from Google).

It is a fork of [jclarke0000's work](https://github.com/jclarke0000/MMM-MyCommute/)

![Screenshot](/screenshots/MMM-MyCommute-screenshot.png?raw=true "Screenshot")

## Installation

1. Navigate into your MagicMirror `modules` folder and execute<br>`git clone https://github.com/qistoph/MMM-MyCommute.git`.
2. Enter the `MMM-MyCommute` directory and execute `npm install`.
3. Go to [Google Maps devtools](https://developers.google.com/maps/documentation/javascript/get-api-key) and get an API key.
4. Enable [Directions API](https://console.cloud.google.com/marketplace/details/google/directions-backend.googleapis.com).
5. **NOTE:** After the free period you might need to [enable billing](https://console.cloud.google.com/project/_/billing/enable).
6. Restart MagicMirror<br>e.g. `pm2 restart mm`

## Billing

According to the [billing information](https://cloud.google.com/maps-platform/pricing/): "you get $200 free usage every month for Maps, Routes, or Places. Based on the millions of users using our APIs today, most of them can continue to use Google Maps Platform for free with this credit."

The default polling time is once every 10 minutes. That would ammount to an average of 4464 requests per month (`60 / 10 * 24 * 31 = 4464`). For the Directions ($0.005/request) that totals to $22.32 per month. For Advanced Directions ($0.01/request) the total is $44.62 per month.

[Advanced Directions](https://developers.google.com/maps/billing/gmp-billing#directions-advanced) are directions that use one or more of:

- Traffic Information
- More than 10 waypoints
- Waypoints optimization

The number of requests can easily be significantly reduced by using the `startTime` and `endTime`.

## NOTE To those updating from previous verions

You now configure the header in the standard way instead using the `headerText` and `showHeader` parameters. So if your config looked like this before:

```JavaScript
    {
      module: 'MMM-MyCommute',
      position: 'top_left',
      classes: 'default everyone',
      config: {
        showHeader: true,
        headerText: 'Traffic',
        ...
      }
    }
```

change it to this:

```JavaScript
   {
      module: 'MMM-MyCommute',
      position: 'top_left',
      header: 'Traffic',
      classes: 'default everyone',
      config: {
        ...
      }
    }
```

If you don’t want a header, then just omit it.

## Config

Option                              | Description
----------------------------------- | -----------
`apiKey`                            | **REQUIRED** API Key from Google<br><br>**Type:** `string`
`origin`                            | **REQUIRED** The starting point for your commute. Usually this is your home address.<br><br>**Type:** `string`<br>This is as you would see it Google Maps. Example: `65 Front St W, Toronto, ON M5J 1E6`
`startTime`                         | The start time of the window during which this module wil be visible.<br><br>**Type:** `string`<br>Must be in 24-hour time format. Defaults to `00:00` (i.e.: midnight)
`endTime`                           | The end time of the window during which this module wil be visible.<br><br>**Type:** `string`<br>Must be in 24-hour time format. Defaults to `23:59` (i.e.: one minute before midnight).
`hideDays`                          | A list of numbers representing days of the week to hide the module.<br><br>**Type:** `array`<br>Valid numbers are 0 through 6, 0 = Sunday, 6 = Saturday.<br>e.g.: `[0,6]` hides the module on weekends.
`showSummary`                       | Whether to show a brief summary of the route<br><br>**Type:** `boolean`<br>Defaults to `true`
`showUpdated`                       | Show when the last update completed<br><br>**Type:** `boolean`<br>Default to `true`
`colorCodeTravelTime`               | Whether to colour-code the travel time red, yellow, or green based on traffic.<br><br>**Type:** `boolean`<br>Defaults to `true`
`travelTimeFormat`                  | How the module should format your total travel time.<br><br>**Type:** `string`<br>Defaults to `m [min]` (e.g. 86 min). Some other examples are `h[h] m[m]` (e.g.: 1h 26min), `h:mm` (e.g. 1:26). This uses the `moment-duration-format` plugin's [templating feature](https://github.com/jsmreese/moment-duration-format#template).
`travelTimeFormatTrim`              | How to handle time tokens that have no value. For example, if you configure `travelTimeFormat` as `"hh:mm"` but the actual travel time is less than an hour, by default only the minute portion of the duration will be rendered. Set `travelTimeFormatTrim` to `false` to preserve the `hh:` portion of the format (e.g.: `00:21`). Valid options are `"left"`, `"right"` (e.g.: `2:00` renders as `2`), or `false` (e.g.: do not trim).<br><br>**Type:** `String` or `false`<br>Defaults to `"left"`.
`moderateTimeThreshold`             | The amount of variance between time in traffic vs absolute fastest time after which the time is coloured yellow<br><br>**Type:** `float`<br>Defaults to `1.1` (i.e.: 10% longer than fastest time)
`poorTimeThreshold`                 | The amount of variance between time in traffic vs absolute fastest time after which the time is coloured red<br><br>**Type:** `float`<br>Defaults to `1.3` (i.e.: 30% longer than fastest time)
`nextTransitVehicleDepartureFormat` | For any transit destinations where `showNextVehicleDeparture` is true, this dictates how to format the next arrival time.<br><br>**Type:** `string`<br>Defaults to `[next at] h:mm a`.
`pollFrequency`                     | How frequently, in milliseconds, to poll for traffic predictions.<br>**BE CAREFUL WITH THIS!** We're using Google's free API which has a maximum of 2400 requests per day. Each entry in the destinations list requires its own request so if you set this to be too frequent, it's pretty easy to blow your request quota.<br><br>**Type:** `number`.<br>Defaults to `10 * 60 * 1000` (i.e.: 600000ms, or every 10 minutes)
`destinations`                     | An array of destinations to which you would like to see commute times.<br><br>**Type:** `array` of objects.<br>See below for destination options.

Each object in the `destinations` array can have the following parameters:

Option                       | Description
---------------------------- | -----------
`destination`                | **REQUIRED** The address of the destination<br><br>**Type:** `string`
`label`                      | **REQUIRED** How you would like this displayed on your MagicMirror.<br><br>**Type:** `string`
`mode`                       | Transportation mode, one of the following: `driving`, `walking`, `bicycling`, `transit`.<br><br>**Type:** `string`<br>Defaults to `driving`.
`transitMode`                | If `mode` = `transit` you can additionally specify one or more of the following: `bus`, `subway`, `train`, `tram`, or `rail`.<br><br>**Type:** `string`.<br>Separate multiple entries with the `\|` character (e.g.: `"transitMode" : "bus\|subway\|tram"`). Specifying `rail`indicates that the calculated route should prefer travel by train, tram, light rail, and subway. Equivalenet to `train\|tram\|subway`
`showNextVehicleDeparture`   | If `mode` = `transit` the time of the next departure of the first vehicle on your route will be displayed in the route summary. Only visible when `showSummary = true`.<br><br>**Type:** `boolean`.
`waypoints`                  | If specified, it instructs Google to find the route that passes through the waypoints you specify.<br><br>**Type:** `string`.<br>Separate multiple entries with the `\|` character. See [Waypoints docs](https://developers.google.com/maps/documentation/directions/intro#Waypoints) for details on how waypoints can be specified.<br>**NOTE:** your waypoints will automatically be prefixed with `via:` so that they are not treated as stopovers. This can cause Google to plan an erratic route. if you find your time predictions are wildly overestimated, then try adjusting your waypoints. Intersections where you would normally make a turn on this roite usually work well (e.g.: `Main St & Southwood Drive Toronto ON`).
`avoid`                      | If specified, will instruct the Google API to find a route that avoids one or more of the following: `tolls`,`highways`,`ferries`,`indoor`.<br><br>**Type:** `string`.<br>Separate multiple entries with the `\|` character (e.g.: `"avoid" : "highways\|tolls"`).
`alternatives`               | If specified, will instruct the Google API to provide times for alternate routes. Must be used with `showSummary: true`<br><br>**Type:** `boolean`
`color`                      | If specified, the colour for the icon in hexadecimal format (e.g.: `"#82BAE5"`)<br><br>**Type:** `string`<br>Defaults to white.
`startTime`                  | The start time of the window during which this destination wil be visible.<br><br>**Type:** `string`<br>Must be in 24-hour time format. Defaults to `00:00` (i.e.: midnight)
`endTime`                    | The end time of the window during which this destination wil be visible.<br><br>**Type:** `string`<br>Must be in 24-hour time format. Defaults to `23:59` (i.e.: one minute before midnight).
`hideDays`                   | A list of numbers representing days of the week to hide the destination.<br><br>**Type:** `array`<br>Valid numbers are 0 through 6, 0 = Sunday, 6 = Saturday.<br>e.g.: `[0,6]` hides the destination on weekends.
`origin`                     | Optionally overide the global origin for a single destination.

Here is an example of an entry in `config.js`

```JavaScript
{
  module: 'MMM-MyCommute',
  position: 'top_left',
  config: {
    apikey: 'API_KEY_FROM_GOOGLE',
    origin: '65 Front St W, Toronto, ON M5J 1E6',
    startTime: '00:00',
    endTime: '23:59',
    hideDays: [0,6],
    destinations: [
      {
        destination: '14 Duncan St Toronto, ON M5H 3G8',
        label: 'Air Canada Centre',
        mode: 'walking',
        color: '#82E5AA'
      },
      {
        destination: '317 Dundas St W, Toronto, ON M5T 1G4',
        label: 'Art Gallery of Ontario',
        mode: 'transit'
      },
      {
        destination: '55 Mill St, Toronto, ON M5A 3C4',
        label: 'Distillery District',
        mode: 'bicycling'
      },
      {
        destination: '6301 Silver Dart Dr, Mississauga, ON L5P 1B2',
        label: 'Pearson Airport',
        avoid: 'tolls'
      }
    ]
  }
}
```

## Routes for calendar events

Additionally MMM-MyCommute can show travel times to upcoming events in the default calendar module. The config can be extended with the following options. Routes will be shown for events with a location.

Option              | Description
------------------- | -----------
`maxCalendarEvents` | Number of routes to show.<br><br>**Type:** `int`<br>Defaults to `0`
`maxCalendarTime`   | Show routes only for appointments within this timeframe (in milliseconds).<br><br>**Type:** `int`<br>Defaults to `24 * 60 * 60 * 1000` (1 day)
`calendarOptions`   | An array like the regular `destinations`. For each event all of these options are added as a route. All options from above can be used, except that `label` will be overwritten with the event subject and `destination` with the event location.<br><br>**Type:** `array`<br>Defaults to `[{mode: 'driving'}]`

Here is an example of an entry in `config.js` including calendar event routes

```JavaScript
{
  module: 'MMM-MyCommute',
  position: 'top_left',
  config: {
    apikey: 'API_KEY_FROM_GOOGLE',
    origin: '65 Front St W, Toronto, ON M5J 1E6',
    destinations: [
      {
        destination: '14 Duncan St Toronto, ON M5H 3G8',
        label: 'Air Canada Centre',
        mode: 'walking',
        color: '#82E5AA'
      }
    ],
    // Additional config for calendar routes:
    maxCalendarEvents: 2,
    calendarOptions: [
      {
        mode: 'driving'
      },
      {
        mode: 'transit',
        transitMode: 'train'
      }
    ]
  }
}
```

## Dependencies

Installed during installation

- [request](https://www.npmjs.com/package/request)
- [moment](https://www.npmjs.com/package/moment)

## Status

Because it seems Jeff Clarke has abondoned MMM-MyCommute, no recent updates and not mering PR's, I've introduced this fork as an alternative. I have merged the interesting changes I've found in other forks and am willing to accept PR's for additional suggestions.

## Special Thanks

- [Jeff Clarke](https://github.com/jclarke000) for creating MMM-MyCommute, this has inspired all my additional changes.
- [Michael Teeuw](https://github.com/MichMich) for creating the awesome [MagicMirror2](https://github.com/MichMich/MagicMirror/tree/develop) project that made this module possible.
- [Dominic Marx](https://github.com/domsen123) for creating the original mrx-work-traffic that this module heavily borrows upon.
