# webview.js - Create simple (grid, tree, matrix ..) views for webapps

## Webview.js Features

webview.js can create views to display:
- Grid / Table views
- Matrix views (Matrix Grid with cell instances rendered in identical way, i.e. no grid heading,
  no differeing columns, each cell is an object entity, not a property of an object)
- Hierarchical Tree Views (Suitable for creating e.g. hierarchical navigation menus, OS Process views or
  Family trees)
- Simple (`ul / li`) lists

webview.js creates the view for the data and is very data driven.

## Server Side / Client side

Since webview.js does not rely on DOM API:s, it runs in both server side (Node.js) or client side (browser, SPAs app)
Javascript runtimes.
It has no mandatory dependencies (For the small testsuite we're using JQuery as devDependency).

## Recommended depencencies

 To load the data on client side you will likely need a HTTP clinet:
- If you are already depending on JQuery, you could use `$.getJSON()`
- Another good choice: axios.
- Any other utility library / toolkit that can do http (aka AJAX in old school terminology)

On server side you will likely get the data from
- JSON files
- Low level DB API like mysql, sqlite3
- Optional fancier ORM toolkit like Sequelize
- NoSQL database

webview.js does not really have a stance / opinion what you should be using here.

## Test/Demo

To run a simple demo on toolkit:
- Run `npm install` or `yarn install` to install dependencies
- Launch page `test/test.html` in your browser (Using file:///... URL)
  - Page can be also used under web server in case you *do* have a web server

## License

MIT, Copyright (c) Olli Hollmen 2014-2022
